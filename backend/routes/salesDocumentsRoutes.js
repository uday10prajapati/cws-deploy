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
  const prefix = "SD";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Helper function to update profile code status
const updateProfileCodeStatus = async (sales_id) => {
  try {
    // Get all documents for this sales person
    const { data: documents } = await supabase
      .from("sales_documents")
      .select("document_type, verified")
      .eq("sales_id", sales_id);

    // Check verification status for each required document
    const aadhar_verified = documents?.some(
      (d) => d.document_type === "aadhar" && d.verified
    ) || false;
    const identity_verified = documents?.some(
      (d) => d.document_type === "identity" && d.verified
    ) || false;
    const bank_verified = documents?.some(
      (d) => d.document_type === "bank_passbook" && d.verified
    ) || false;
    const selfie_verified = documents?.some(
      (d) => d.document_type === "selfie" && d.verified
    ) || false;
    const educational_verified = documents?.some(
      (d) => d.document_type === "educational_certificate" && d.verified
    ) || false;

    const documents_complete =
      aadhar_verified &&
      identity_verified &&
      bank_verified &&
      selfie_verified &&
      educational_verified;

    // Update or insert profile code record
    const { data: existingCode } = await supabase
      .from("sales_profile_codes")
      .select("id")
      .eq("sales_id", sales_id)
      .single();

    if (existingCode) {
      await supabase
        .from("sales_profile_codes")
        .update({
          aadhar_verified,
          identity_verified,
          bank_verified,
          selfie_verified,
          educational_verified,
          documents_complete,
          updated_at: new Date(),
        })
        .eq("sales_id", sales_id);
    }
  } catch (error) {
    console.error("Error updating profile code status:", error);
  }
};

// ✅ GET sales person's own documents
router.get("/sales/:sales_id", async (req, res) => {
  try {
    const { sales_id } = req.params;

    const { data, error } = await supabase
      .from("sales_documents")
      .select("*")
      .eq("sales_id", sales_id);

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

// ✅ GET sales person's profile code
router.get("/sales/profile-code/:sales_id", async (req, res) => {
  try {
    const { sales_id } = req.params;

    // Check if profile code exists
    let { data: profileCode, error } = await supabase
      .from("sales_profile_codes")
      .select("*")
      .eq("sales_id", sales_id)
      .single();

    // If not exists, create new one
    if (!profileCode) {
      const newCode = generateProfileCode();
      const { data: newProfileCode, error: insertError } = await supabase
        .from("sales_profile_codes")
        .insert({
          sales_id,
          profile_code: newCode,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      profileCode = newProfileCode;
    }

    res.json({
      success: true,
      profileCode: profileCode.profile_code,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ Upload sales document file via backend (bypasses frontend RLS with service role)
router.post(
  "/sales/upload-file",
  upload.single("file"),
  async (req, res) => {
    try {
      const { sales_id, document_type } = req.body;
      const file = req.file;

      // Validate required fields
      if (!sales_id || !document_type || !file) {
        return res.status(400).json({
          success: false,
          error: "Missing required: sales_id, document_type, file",
        });
      }

      // Validate document type
      const validTypes = [
        "aadhar",
        "identity",
        "bank_passbook",
        "selfie",
        "educational_certificate",
      ];
      if (!validTypes.includes(document_type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid document type. Allowed: ${validTypes.join(", ")}`,
        });
      }

      // Upload file to storage with service role
      const fileName = `${sales_id}/${document_type}/${Date.now()}_${file.originalname}`;
      console.log(`📤 Uploading file: ${fileName}`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("sales_documents")
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
        .from("sales_documents")
        .getPublicUrl(uploadData.path);

      // Save document record to database
      const { data: docData, error: dbError } = await supabase
        .from("sales_documents")
        .upsert(
          {
            sales_id,
            document_type,
            document_url: urlData.publicUrl,
            uploaded_at: new Date(),
          },
          { onConflict: "sales_id,document_type" }
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
      await updateProfileCodeStatus(sales_id);

      // Create notification for admin
      const { data: adminUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (adminUsers && adminUsers.length > 0) {
        const notifications = adminUsers.map((admin) => ({
          user_id: admin.id,
          type: "sales_document_uploaded",
          title: "New Sales Document Upload",
          message: `Sales person has uploaded ${document_type} document`,
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

// ✅ ADMIN: GET all sales documents
router.get("/admin/sales-all-documents", async (req, res) => {
  try {
    const { data: documents, error } = await supabase
      .from("sales_documents")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) throw error;

    // Enrich each document with sales person profile info
    const enrichedDocs = await Promise.all(
      documents.map(async (doc) => {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("id", doc.sales_id)
          .single();

        return {
          ...doc,
          profile: profileData,
        };
      })
    );

    res.json({
      success: true,
      documents: enrichedDocs || [],
    });
  } catch (error) {
    console.error("Error fetching all sales documents:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ ADMIN: GET sales documents by sales_id
router.get("/admin/sales-documents/:sales_id", async (req, res) => {
  try {
    const { sales_id } = req.params;

    const { data: documents, error: docError } = await supabase
      .from("sales_documents")
      .select("*")
      .eq("sales_id", sales_id);

    if (docError) throw docError;

    const { data: profileCode, error: codeError } = await supabase
      .from("sales_profile_codes")
      .select("*")
      .eq("sales_id", sales_id)
      .single();

    if (codeError && codeError.code !== "PGRST116") throw codeError;

    const { data: salesProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sales_id)
      .single();

    if (profileError) throw profileError;

    res.json({
      success: true,
      documents,
      profileCode: profileCode || null,
      salesProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ ADMIN: Verify/Reject document
router.post("/admin/sales/verify-document", async (req, res) => {
  try {
    const { document_id, verified, notes, admin_id } = req.body;

    const { data, error } = await supabase
      .from("sales_documents")
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
    await updateProfileCodeStatus(data.sales_id);

    // Create notification for sales person
    await supabase.from("notifications").insert({
      user_id: data.sales_id,
      type: "document_verified",
      title: verified ? "Document Verified ✓" : "Document Rejected ✗",
      message: verified
        ? `Your ${data.document_type} has been verified`
        : `Your ${data.document_type} was rejected. ${notes || ""}`,
      reference_id: document_id,
    });

    res.json({
      success: true,
      document: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ ADMIN: GET all sales profile codes
router.get("/admin/sales-profile-codes", async (req, res) => {
  try {
    // Get all sales profile codes with their verification status
    const { data: profileCodes, error: codesError } = await supabase
      .from("sales_profile_codes")
      .select("*")
      .order("documents_complete", { ascending: false })
      .order("updated_at", { ascending: false });

    if (codesError) throw codesError;

    // Enrich with sales person profile info
    const enrichedCodes = await Promise.all(
      profileCodes.map(async (code) => {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, phone")
          .eq("id", code.sales_id)
          .single();

        return {
          ...code,
          profile: profileData,
        };
      })
    );

    res.json({
      success: true,
      profileCodes: enrichedCodes || [],
    });
  } catch (error) {
    console.error("Error fetching sales profile codes:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ GET customers by area (for sales to find customers to link)
router.get("/sales/find-customers", async (req, res) => {
  try {
    const { area } = req.query;
    const { user } = req;

    if (!area) {
      return res.status(400).json({
        success: false,
        error: "Area is required",
      });
    }

    // Get all customers in this area who have signed up
    const { data: customers, error } = await supabase
      .from("profiles")
      .select("id, name, email, phone, area, car_image_url, car_model, car_number, created_at")
      .eq("role", "customer")
      .eq("area", area)
      .is("added_by_sales_id", null) // Not yet linked to any sales person
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      customers: customers || [],
      count: customers?.length || 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ SALES: Record/Link a customer as referred by this sales person
router.post("/sales/record-customer", async (req, res) => {
  try {
    const { customer_id, notes } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token || !customer_id) {
      return res.status(400).json({
        success: false,
        error: "Missing authorization or customer_id",
      });
    }

    // Get sales person from token
    const { data: salesData } = await supabase.auth.getUser(token);
    if (!salesData?.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const sales_id = salesData.user.id;

    // Check if customer exists and is not already linked
    const { data: customer, error: customerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", customer_id)
      .eq("role", "customer")
      .single();

    if (customerError || !customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    if (customer.added_by_sales_id) {
      return res.status(400).json({
        success: false,
        error: "This customer is already linked to another sales person",
      });
    }

    // Update customer profile to link to sales person
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({
        added_by_sales_id: sales_id,
      })
      .eq("id", customer_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Also create entry in sales_customer_link table for tracking
    const { error: linkError } = await supabase
      .from("sales_customer_link")
      .insert({
        sales_id,
        customer_id,
      });

    if (linkError) throw linkError;

    // Create notification for sales person
    await supabase.from("notifications").insert({
      user_id: sales_id,
      type: "customer_recorded",
      title: "Customer Recorded ✓",
      message: `You have successfully recorded ${customer.name} as your customer`,
      reference_id: customer_id,
    });

    res.json({
      success: true,
      message: `Customer ${customer.name} recorded successfully!`,
      customer: updated,
    });
  } catch (error) {
    console.error("Error recording customer:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ GET customers recorded by this sales person
router.get("/sales/my-customers", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Get sales person from token
    const { data: salesData } = await supabase.auth.getUser(token);
    if (!salesData?.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const sales_id = salesData.user.id;

    // Get all customers linked to this sales person
    const { data: customers, error } = await supabase
      .from("profiles")
      .select("id, name, email, phone, area, car_image_url, car_model, car_number, created_at")
      .eq("added_by_sales_id", sales_id)
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Calculate stats
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisMonthCount = customers?.filter(
      (c) => new Date(c.created_at) >= thisMonth
    ).length || 0;

    const thisWeekCount = customers?.filter(
      (c) => new Date(c.created_at) >= thisWeek
    ).length || 0;

    const withCarImage = customers?.filter((c) => c.car_image_url).length || 0;

    res.json({
      success: true,
      customers: customers || [],
      stats: {
        total: customers?.length || 0,
        thisMonth: thisMonthCount,
        thisWeek: thisWeekCount,
        withCarImage,
      },
    });
  } catch (error) {
    console.error("Error fetching my customers:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
