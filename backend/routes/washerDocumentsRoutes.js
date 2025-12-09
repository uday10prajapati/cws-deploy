import express from "express";
import multer from "multer";
import { supabase } from "../supabase.js";

const router = express.Router();

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 52428800 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Helper function to generate profile code
const generateProfileCode = () => {
  const prefix = "WD";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// ✅ GET washer's own documents
router.get("/documents/:washer_id", async (req, res) => {
  try {
    const { washer_id } = req.params;

    const { data, error } = await supabase
      .from("washer_documents")
      .select("*")
      .eq("washer_id", washer_id);

    if (error) throw error;

    res.json({
      success: true,
      documents: data || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ GET washer's profile code
router.get("/profile-code/:washer_id", async (req, res) => {
  try {
    const { washer_id } = req.params;

    // Check if profile code exists
    let { data: profileCode, error } = await supabase
      .from("washer_profile_codes")
      .select("*")
      .eq("washer_id", washer_id)
      .single();

    // If not exists, create new one
    if (!profileCode) {
      const newCode = generateProfileCode();
      const { data: newProfileCode, error: insertError } = await supabase
        .from("washer_profile_codes")
        .insert({
          washer_id,
          profile_code: newCode,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      profileCode = newProfileCode;
    }

    res.json({
      success: true,
      profileCode,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ UPLOAD document with document URL (assuming file uploaded to Supabase storage separately)
router.post("/documents/upload", async (req, res) => {
  try {
    const { washer_id, document_type, document_url } = req.body;

    // Validate required fields
    if (!washer_id || !document_type || !document_url) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: washer_id, document_type, document_url",
      });
    }

    // Validate document type
    const validTypes = [
      "aadhar",
      "pancard",
      "votercard",
      "bankpassbook",
      "profile_pic",
    ];
    if (!validTypes.includes(document_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid document type. Allowed: ${validTypes.join(", ")}`,
      });
    }

    // Insert or update document
    const { data, error } = await supabase
      .from("washer_documents")
      .upsert(
        {
          washer_id,
          document_type,
          document_url,
          uploaded_at: new Date(),
        },
        { onConflict: "washer_id,document_type" }
      )
      .select()
      .single();

    if (error) throw error;

    // Update profile code completion status
    await updateProfileCodeStatus(washer_id);

    // Create notification for admin
    const { data: adminUsers } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (adminUsers) {
      const notifications = adminUsers.map((admin) => ({
        user_id: admin.id,
        type: "document_uploaded",
        title: "New Document Upload",
        message: `Washer has uploaded ${document_type} document`,
        reference_id: data.id,
      }));

      await supabase.from("notifications").insert(notifications);
    }

    res.json({
      success: true,
      message: "Document uploaded successfully",
      document: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ UPDATE profile code completion status
const updateProfileCodeStatus = async (washer_id) => {
  try {
    const { data: documents } = await supabase
      .from("washer_documents")
      .select("document_type, verified")
      .eq("washer_id", washer_id);

    if (!documents) return;

    const hasAadhar = documents.some(
      (d) => d.document_type === "aadhar" && d.verified
    );
    const hasIdentity = documents.some(
      (d) =>
        (d.document_type === "pancard" || d.document_type === "votercard") &&
        d.verified
    );
    const hasBank = documents.some(
      (d) => d.document_type === "bankpassbook" && d.verified
    );
    const hasProfilePic = documents.some(
      (d) => d.document_type === "profile_pic"
    );

    const documentsComplete =
      hasAadhar && (hasIdentity || hasBank) && hasProfilePic;

    await supabase
      .from("washer_profile_codes")
      .update({
        aadhar_verified: hasAadhar,
        identity_verified: hasIdentity,
        bank_verified: hasBank,
        profile_pic_uploaded: hasProfilePic,
        documents_complete: documentsComplete,
        updated_at: new Date(),
      })
      .eq("washer_id", washer_id);
  } catch (error) {
    console.error("Error updating profile code status:", error);
  }
};

// ✅ DELETE document
router.delete("/documents/:document_id", async (req, res) => {
  try {
    const { document_id } = req.params;

    const { data, error } = await supabase
      .from("washer_documents")
      .delete()
      .eq("id", document_id)
      .select()
      .single();

    if (error) throw error;

    // Update profile code status
    if (data) {
      await updateProfileCodeStatus(data.washer_id);
    }

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ ADMIN: GET all washer documents
router.get("/admin/all-documents", async (req, res) => {
  try {
    const { data: documents, error } = await supabase
      .from("washer_documents")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) throw error;

    // Enrich each document with washer profile info
    const enrichedDocs = await Promise.all(
      documents.map(async (doc) => {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("id", doc.washer_id)
          .single();

        return {
          ...doc,
          profile: profileData, // Keep key as 'profile' for frontend compatibility
        };
      })
    );

    res.json({
      success: true,
      documents: enrichedDocs || [],
    });
  } catch (error) {
    console.error("Error fetching all documents:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ ADMIN: GET washer documents by washer_id
router.get("/admin/documents/:washer_id", async (req, res) => {
  try {
    const { washer_id } = req.params;

    const { data: documents, error: docError } = await supabase
      .from("washer_documents")
      .select("*")
      .eq("washer_id", washer_id);

    if (docError) throw docError;

    const { data: profileCode, error: codeError } = await supabase
      .from("washer_profile_codes")
      .select("*")
      .eq("washer_id", washer_id)
      .single();

    if (codeError && codeError.code !== "PGRST116")
      throw codeError;

    const { data: washerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", washer_id)
      .single();

    if (profileError) throw profileError;

    res.json({
      success: true,
      documents: documents || [],
      profileCode: profileCode || null,
      washerProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ ADMIN: VERIFY document
router.post("/admin/verify-document", async (req, res) => {
  try {
    const { document_id, verified, notes, admin_id } = req.body;

    if (!document_id || verified === undefined || !admin_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const { data, error } = await supabase
      .from("washer_documents")
      .update({
        verified,
        verified_by: admin_id,
        verified_at: new Date(),
        notes,
      })
      .eq("id", document_id)
      .select()
      .single();

    if (error) throw error;

    // Update profile code status
    await updateProfileCodeStatus(data.washer_id);

    // Create notification for washer
    const status = verified ? "approved" : "rejected";
    await supabase.from("notifications").insert({
      user_id: data.washer_id,
      type: "document_verified",
      title: `Document ${status}`,
      message: `Your ${data.document_type} has been ${status}${notes ? ": " + notes : ""}`,
      reference_id: document_id,
    });

    res.json({
      success: true,
      message: "Document verification updated",
      document: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ ADMIN: GET all washer profile codes (verification status)
router.get("/admin/profile-codes", async (req, res) => {
  try {
    // Get all washer profile codes with their verification status
    const { data: profileCodes, error: codesError } = await supabase
      .from("washer_profile_codes")
      .select("*")
      .order("documents_complete", { ascending: false })
      .order("updated_at", { ascending: false });

    if (codesError) throw codesError;

    // Enrich with washer profile info
    const enrichedCodes = await Promise.all(
      profileCodes.map(async (code) => {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, phone")
          .eq("id", code.washer_id)
          .single();

        return {
          ...code,
          profile: profileData, // Keep key as 'profile' for frontend compatibility
        };
      })
    );

    res.json({
      success: true,
      profileCodes: enrichedCodes || [],
    });
  } catch (error) {
    console.error("Error fetching profile codes:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ Initialize storage bucket (from backend with service role)
router.post("/initialize-storage", async (req, res) => {
  try {
    console.log("🔄 Initializing storage bucket...");

    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.warn("Could not list buckets:", listError.message);
      return res.status(500).json({ success: false, error: listError.message });
    }

    const bucketExists = buckets?.some((b) => b.name === "washer_documents");

    if (bucketExists) {
      console.log("✅ Storage bucket already exists");
      return res.json({ success: true, created: false, message: "Bucket already exists" });
    }

    // Create bucket with service role
    const { data, error } = await supabase.storage.createBucket(
      "washer_documents",
      {
        public: true,
        allowedMimeTypes: ["image/*", "application/pdf"],
        fileSizeLimit: 52428800, // 50MB
      }
    );

    if (error) {
      console.error("❌ Error creating bucket:", error);
      
      // If it says already exists, that's still ok
      if (error.message?.includes("already exists")) {
        return res.json({ success: true, created: false, message: "Bucket already exists" });
      }
      
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log("✅ Storage bucket created successfully!");
    res.json({ success: true, created: true, message: "Bucket created" });
  } catch (error) {
    console.error("Fatal error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Upload document file via backend (bypasses frontend RLS with service role)
router.post(
  "/upload-file",
  upload.single("file"),
  async (req, res) => {
    try {
      const { washer_id, document_type } = req.body;
      const file = req.file;

      // Validate required fields
      if (!washer_id || !document_type || !file) {
        return res.status(400).json({
          success: false,
          error: "Missing required: washer_id, document_type, file",
        });
      }

      // Validate document type
      const validTypes = [
        "aadhar",
        "pancard",
        "votercard",
        "bankpassbook",
        "profile_pic",
      ];
      if (!validTypes.includes(document_type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid document type. Allowed: ${validTypes.join(", ")}`,
        });
      }

      // Upload file to storage with service role
      const fileName = `${washer_id}/${document_type}/${Date.now()}_${file.originalname}`;
      console.log(`📤 Uploading file: ${fileName}`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("washer_documents")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return res.status(500).json({
          success: false,
          error: `Storage upload failed: ${uploadError.message}`,
        });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("washer_documents")
        .getPublicUrl(uploadData.path);

      // Save document record to database
      const { data: docData, error: dbError } = await supabase
        .from("washer_documents")
        .upsert(
          {
            washer_id,
            document_type,
            document_url: urlData.publicUrl,
            uploaded_at: new Date(),
          },
          { onConflict: "washer_id,document_type" }
        )
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({
          success: false,
          error: `Database save failed: ${dbError.message}`,
        });
      }

      // Update profile code completion status
      await updateProfileCodeStatus(washer_id);

      // Create notification for admin
      const { data: adminUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (adminUsers && adminUsers.length > 0) {
        const notifications = adminUsers.map((admin) => ({
          user_id: admin.id,
          type: "document_uploaded",
          title: "New Document Upload",
          message: `Washer has uploaded ${document_type} document`,
          reference_id: docData.id,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      res.json({
        success: true,
        document: docData,
        url: urlData.publicUrl,
      });
    } catch (error) {
      console.error("Fatal error in file upload:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
