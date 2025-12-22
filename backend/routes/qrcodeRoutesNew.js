import express from "express";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /qrcode/generate/:carId
 * Generate QR code for a specific car with customer details
 */
router.get("/generate/:carId", async (req, res) => {
  try {
    const { carId } = req.params;

    // Fetch car with customer details
    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("*, profiles!cars_customer_id_fkey(id, email, phone, full_name, address, taluko)")
      .eq("id", carId)
      .single();

    if (carError || !car) {
      return res.status(404).json({ success: false, error: "Car not found" });
    }

    // Fetch monthly pass status
    const { data: monthlyPass } = await supabase
      .from("monthly_pass")
      .select("id, valid_till, active")
      .eq("car_id", carId)
      .eq("active", true)
      .single();

    const customer = car.profiles;
    const qrData = {
      carId: car.id,
      customerId: customer.id,
      customerName: customer.full_name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address || car.number_plate,
      customerTaluko: customer.taluko,
      carBrand: car.brand,
      carModel: car.model,
      numberPlate: car.number_plate,
      monthlyPassActive: !!monthlyPass && new Date(monthlyPass.valid_till) > new Date(),
      generatedAt: new Date().toISOString(),
    };

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));

    // Check if QR code exists for this car
    const { data: existingQR } = await supabase
      .from("qr_codes")
      .select("id")
      .eq("car_id", carId)
      .single();

    if (existingQR) {
      // Update existing QR code
      const { error: updateError } = await supabase
        .from("qr_codes")
        .update({
          qr_code_data: JSON.stringify(qrData),
          qr_code_image: qrCodeDataUrl,
          customer_name: customer.full_name,
          customer_email: customer.email,
          customer_mobile: customer.phone,
          customer_address: customer.address || car.number_plate,
          customer_taluko: customer.taluko,
          car_brand: car.brand,
          car_model: car.model,
          car_number_plate: car.number_plate,
          updated_at: new Date(),
        })
        .eq("id", existingQR.id);

      if (updateError) throw updateError;

      return res.json({
        success: true,
        qrCode: {
          id: existingQR.id,
          qrCodeImage: qrCodeDataUrl,
          qrData,
        },
      });
    }

    // Create new QR code record
    const { data: newQR, error: insertError } = await supabase
      .from("qr_codes")
      .insert({
        car_id: carId,
        customer_id: customer.id,
        qr_code_data: JSON.stringify(qrData),
        qr_code_image: qrCodeDataUrl,
        customer_name: customer.full_name,
        customer_email: customer.email,
        customer_mobile: customer.phone,
        customer_address: customer.address || car.number_plate,
        customer_taluko: customer.taluko,
        car_brand: car.brand,
        car_model: car.model,
        car_number_plate: car.number_plate,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.json({
      success: true,
      qrCode: {
        id: newQR.id,
        qrCodeImage: qrCodeDataUrl,
        qrData,
      },
    });
  } catch (error) {
    console.error("QR code generation error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /qrcode/decode/:qrId
 * Get QR code details by ID
 */
router.get("/decode/:qrId", async (req, res) => {
  try {
    const { qrId } = req.params;

    const { data: qrCode, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("id", qrId)
      .single();

    if (error || !qrCode) {
      return res.status(404).json({ success: false, error: "QR code not found" });
    }

    // Log the scan
    const { data: auth } = await supabase.auth.getUser();
    if (auth?.user?.id) {
      await supabase.from("qr_code_scans").insert({
        qr_code_id: qrId,
        washer_id: auth.user.id,
      });
    }

    return res.json({
      success: true,
      qrCode: {
        id: qrCode.id,
        customerName: qrCode.customer_name,
        customerEmail: qrCode.customer_email,
        customerMobile: qrCode.customer_mobile,
        customerAddress: qrCode.customer_address,
        qrData: JSON.parse(qrCode.qr_code_data),
      },
    });
  } catch (error) {
    console.error("QR decode error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /qrcode/start-wash-session
 * Start a wash session when QR is scanned
 */
router.post("/start-wash-session", async (req, res) => {
  try {
    const { qrCodeId, washerId } = req.body;

    if (!qrCodeId || !washerId) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    // Get QR code details
    const { data: qrCode, error: qrError } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("id", qrCodeId)
      .single();

    if (qrError || !qrCode) {
      return res.status(404).json({ success: false, error: "QR code not found" });
    }

    // Check monthly pass status
    const { data: monthlyPass } = await supabase
      .from("monthly_passes")
      .select("id, expiry_date")
      .eq("car_id", qrCode.car_id)
      .eq("status", "active")
      .single();

    const monthlyPassActive = !!monthlyPass && new Date(monthlyPass.expiry_date) > new Date();

    // Create wash session
    const { data: washSession, error: sessionError } = await supabase
      .from("wash_sessions")
      .insert({
        qr_code_id: qrCodeId,
        car_id: qrCode.car_id,
        customer_id: qrCode.customer_id,
        washer_id: washerId,
        monthly_pass_active: monthlyPassActive,
        status: "in_progress",
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    return res.json({
      success: true,
      washSession: {
        id: washSession.id,
        monthlyPassActive,
        customerName: qrCode.customer_name,
        customerMobile: qrCode.customer_mobile,
      },
    });
  } catch (error) {
    console.error("Wash session start error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /qrcode/upload-wash-images
 * Upload before/after wash images
 */
router.post("/upload-wash-images", async (req, res) => {
  try {
    const { washSessionId, images } = req.body;

    if (!washSessionId || !images || !Array.isArray(images)) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }

    const insertedImages = [];

    for (const image of images) {
      const { data: insertedImage, error: insertError } = await supabase
        .from("wash_session_images")
        .insert({
          wash_session_id: washSessionId,
          image_url: image.url,
          image_type: image.type, // 'before' or 'after'
          image_position: image.position, // 1-4
        })
        .select()
        .single();

      if (insertError) throw insertError;
      insertedImages.push(insertedImage);
    }

    return res.json({
      success: true,
      images: insertedImages,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /qrcode/complete-wash
 * Mark wash as completed and award loyalty points
 */
router.post("/complete-wash", async (req, res) => {
  try {
    const { washSessionId } = req.body;

    if (!washSessionId) {
      return res.status(400).json({ success: false, error: "Wash session ID required" });
    }

    // Get wash session details
    const { data: washSession, error: sessionError } = await supabase
      .from("wash_sessions")
      .select("*")
      .eq("id", washSessionId)
      .single();

    if (sessionError || !washSession) {
      return res.status(404).json({ success: false, error: "Wash session not found" });
    }

    // Update wash session status
    const { error: updateError } = await supabase
      .from("wash_sessions")
      .update({
        status: "completed",
        is_completed: true,
        session_end: new Date(),
      })
      .eq("id", washSessionId);

    if (updateError) throw updateError;

    // Create wash completion record
    const { data: completion, error: completionError } = await supabase
      .from("wash_completions")
      .insert({
        wash_session_id: washSessionId,
        qr_code_id: washSession.qr_code_id,
        customer_id: washSession.customer_id,
        washer_id: washSession.washer_id,
        loyalty_points_awarded: 1,
      })
      .select()
      .single();

    if (completionError) throw completionError;

    // Award loyalty points to customer
    const { data: currentPoints } = await supabase
      .from("loyalty_points")
      .select("points")
      .eq("customer_id", washSession.customer_id)
      .single();

    const newPoints = (currentPoints?.points || 0) + 1;

    await supabase
      .from("loyalty_points")
      .upsert({
        customer_id: washSession.customer_id,
        points: newPoints,
      }, { onConflict: "customer_id" });

    return res.json({
      success: true,
      completion: {
        id: completion.id,
        loyaltyPointsAwarded: 1,
        totalPoints: newPoints,
      },
    });
  } catch (error) {
    console.error("Wash completion error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /qrcode/list/:customerId
 * Get all QR codes for a customer's cars
 */
router.get("/list/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data: qrCodes, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("customer_id", customerId);

    if (error) throw error;

    return res.json({
      success: true,
      qrCodes,
    });
  } catch (error) {
    console.error("QR codes list error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /qrcode/wash-history/:customerId
 * Get wash history for a customer
 */
router.get("/wash-history/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data: washHistory, error } = await supabase
      .from("wash_completions")
      .select("*, wash_sessions(*, qr_codes(customer_name))")
      .eq("customer_id", customerId)
      .order("completion_timestamp", { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      washHistory,
    });
  } catch (error) {
    console.error("Wash history error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /qrcode/auto-create-on-monthly-pass
 * Automatically create/update QR code when monthly pass is purchased
 * Called when customer buys monthly pass for a car
 */
router.post("/auto-create-on-monthly-pass", async (req, res) => {
  try {
    const { carId, monthlyPassId, customerId } = req.body;

    if (!carId || !monthlyPassId || !customerId) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: carId, monthlyPassId, customerId" 
      });
    }

    // Fetch car with customer details
    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("*, profiles!cars_customer_id_fkey(id, email, phone, full_name, address, taluko)")
      .eq("id", carId)
      .single();

    if (carError || !car) {
      return res.status(404).json({ success: false, error: "Car not found" });
    }

    // Fetch monthly pass details
    const { data: monthlyPass, error: passError } = await supabase
      .from("monthly_passes")
      .select("id, expiry_date, status")
      .eq("id", monthlyPassId)
      .single();

    if (passError || !monthlyPass) {
      return res.status(404).json({ success: false, error: "Monthly pass not found" });
    }

    const customer = car.profiles;
    const monthlyPassActive = monthlyPass.status === "active" && 
      new Date(monthlyPass.expiry_date) > new Date();

    const qrData = {
      carId: car.id,
      customerId: customer.id,
      customerName: customer.full_name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address || car.number_plate,
      customerTaluko: customer.taluko,
      carBrand: car.brand,
      carModel: car.model,
      numberPlate: car.number_plate,
      monthlyPassActive,
      monthlyPassExpiry: monthlyPass.expiry_date,
      generatedAt: new Date().toISOString(),
    };

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));

    // Check if QR code exists for this car
    const { data: existingQR } = await supabase
      .from("qr_codes")
      .select("id")
      .eq("car_id", carId)
      .single();

    if (existingQR) {
      // Update existing QR code with new monthly pass data
      const { data: updatedQR, error: updateError } = await supabase
        .from("qr_codes")
        .update({
          qr_code_data: JSON.stringify(qrData),
          qr_code_image: qrCodeDataUrl,
          customer_name: customer.full_name,
          customer_email: customer.email,
          customer_mobile: customer.phone,
          customer_address: customer.address || car.number_plate,
          customer_taluko: customer.taluko,
          monthly_pass_id: monthlyPassId,
          monthly_pass_active: monthlyPassActive,
          monthly_pass_expiry: monthlyPass.expiry_date,
          car_brand: car.brand,
          car_model: car.model,
          car_number_plate: car.number_plate,
          updated_at: new Date(),
        })
        .eq("id", existingQR.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.json({
        success: true,
        message: "QR code updated with new monthly pass data",
        qrCode: {
          id: updatedQR.id,
          carId,
          monthlyPassActive,
          monthlyPassExpiry: monthlyPass.expiry_date,
          qrData,
        },
      });
    }

    // Create new QR code record
    const { data: newQR, error: insertError } = await supabase
      .from("qr_codes")
      .insert({
        car_id: carId,
        customer_id: customerId,
        monthly_pass_id: monthlyPassId,
        qr_code_data: JSON.stringify(qrData),
        qr_code_image: qrCodeDataUrl,
        customer_name: customer.full_name,
        customer_email: customer.email,
        customer_mobile: customer.phone,
        customer_address: customer.address || car.number_plate,
        customer_taluko: customer.taluko,
        monthly_pass_active: monthlyPassActive,
        monthly_pass_expiry: monthlyPass.expiry_date,
        car_brand: car.brand,
        car_model: car.model,
        car_number_plate: car.number_plate,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.json({
      success: true,
      message: "QR code automatically created for monthly pass",
      qrCode: {
        id: newQR.id,
        carId,
        monthlyPassActive,
        monthlyPassExpiry: monthlyPass.expiry_date,
        qrData,
      },
    });
  } catch (error) {
    console.error("Auto QR code creation error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /qrcode/sync-monthly-pass/:carId
 * Sync QR code data when monthly pass status changes
 * Keep monthly pass info up-to-date in QR code
 */
router.post("/sync-monthly-pass/:carId", async (req, res) => {
  try {
    const { carId } = req.params;

    // Fetch car with customer details
    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("*, profiles!cars_customer_id_fkey(id, email, phone, full_name, address, taluko)")
      .eq("id", carId)
      .single();

    if (carError || !car) {
      return res.status(404).json({ success: false, error: "Car not found" });
    }

    // Fetch active monthly pass
    const { data: monthlyPass } = await supabase
      .from("monthly_passes")
      .select("id, expiry_date, status")
      .eq("car_id", carId)
      .eq("status", "active")
      .single();

    const monthlyPassActive = !!monthlyPass && 
      new Date(monthlyPass.expiry_date) > new Date();

    // Get existing QR code
    const { data: existingQR } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("car_id", carId)
      .single();

    if (!existingQR) {
      return res.status(404).json({ success: false, error: "QR code not found for this car" });
    }

    const customer = car.profiles;
    const qrData = {
      carId: car.id,
      customerId: customer.id,
      customerName: customer.full_name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address || car.number_plate,
      customerTaluko: customer.taluko,
      carBrand: car.brand,
      carModel: car.model,
      numberPlate: car.number_plate,
      monthlyPassActive,
      monthlyPassExpiry: monthlyPass?.expiry_date,
      generatedAt: new Date().toISOString(),
    };

    // Regenerate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));

    // Update QR code
    const { data: updatedQR, error: updateError } = await supabase
      .from("qr_codes")
      .update({
        qr_code_data: JSON.stringify(qrData),
        qr_code_image: qrCodeDataUrl,
        monthly_pass_id: monthlyPass?.id || null,
        monthly_pass_active: monthlyPassActive,
        monthly_pass_expiry: monthlyPass?.expiry_date || null,
        updated_at: new Date(),
      })
      .eq("id", existingQR.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({
      success: true,
      message: "QR code synced with current monthly pass status",
      qrCode: {
        id: updatedQR.id,
        carId,
        monthlyPassActive,
        monthlyPassExpiry: monthlyPass?.expiry_date,
        qrData,
      },
    });
  } catch (error) {
    console.error("Sync monthly pass error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
