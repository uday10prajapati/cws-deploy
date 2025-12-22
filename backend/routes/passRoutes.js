import express from "express";
import { supabase } from "../supabase.js";
import QRCode from "qrcode";

const router = express.Router();

/* -----------------------------------------
   BUY MONTHLY PASS
----------------------------------------- */
router.post("/buy", async (req, res) => {
  const { customer_id, car_id, total_washes, remaining_washes, valid_till } = req.body;

  if (!customer_id) {
    return res.status(400).json({
      success: false,
      error: "customer_id is required",
    });
  }

  const { data, error } = await supabase
    .from("monthly_pass")
    .insert([
      {
        customer_id,
        car_id: car_id || null,
        total_washes: total_washes || 4,
        remaining_washes: remaining_washes || 4,
        valid_till,
        active: true,
      },
    ])
    .select()
    .single();

  if (error) {
    console.log("PASS INSERT ERROR:", error);
    return res.status(500).json({ success: false, error });
  }

  // Auto-create/update QR code if car_id is provided
  if (car_id && data?.id) {
    try {
      // Fetch car with customer details
      const { data: car } = await supabase
        .from("cars")
        .select("*, profiles!cars_customer_id_fkey(id, email, phone, full_name, address, taluko)")
        .eq("id", car_id)
        .single();

      if (car) {
        const customer = car.profiles;
        const monthlyPassActive = true;

        const qrData = {
          carId: car.id,
          customerId: customer.id,
          customerName: customer.full_name,
          customerEmail: customer.email,
          customerMobile: customer.phone,
          customerAddress: customer.address || car.number_plate,
          customerTaluko: customer.taluko,
          carBrand: car.brand,
          carModel: car.model,
          numberPlate: car.number_plate,
          monthlyPassActive,
          isActive: monthlyPassActive,
          monthlyPassExpiry: valid_till,
          generatedAt: new Date().toISOString(),
        };

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData));

        // Check if QR code exists for this car
        const { data: existingQR } = await supabase
          .from("qr_codes")
          .select("id")
          .eq("car_id", car_id)
          .single();

        if (existingQR) {
          // Update existing QR code
          await supabase
            .from("qr_codes")
            .update({
              qr_code_data: JSON.stringify(qrData),
              qr_code_image: qrCodeDataUrl,
              monthly_pass_id: data.id,
              is_active: monthlyPassActive,
              monthly_pass_active: monthlyPassActive,
              monthly_pass_expiry: valid_till,
              updated_at: new Date(),
            })
            .eq("id", existingQR.id);
        } else {
          // Create new QR code
          await supabase
            .from("qr_codes")
            .insert({
              car_id,
              customer_id,
              monthly_pass_id: data.id,
              qr_code_data: JSON.stringify(qrData),
              qr_code_image: qrCodeDataUrl,
              customer_name: customer.full_name,
              customer_email: customer.email,
              customer_mobile: customer.phone,
              customer_address: customer.address || car.number_plate,
              customer_taluko: customer.taluko,
              is_active: monthlyPassActive,
              monthly_pass_active: monthlyPassActive,
              monthly_pass_expiry: valid_till,
              car_brand: car.brand,
              car_model: car.model,
              car_number_plate: car.number_plate,
            });
        }
      }
    } catch (qrError) {
      console.log("QR Code auto-creation warning (non-fatal):", qrError.message);
      // Don't fail the pass purchase if QR creation fails
    }
  }

  res.json({
    success: true,
    message: "Pass purchased successfully" + (car_id ? " - QR code auto-created" : ""),
    data,
  });
});

/* -----------------------------------------
   GET CURRENT ACTIVE PASS BY CUSTOMER ID
----------------------------------------- */
router.get("/current/:id", async (req, res) => {
  const customerId = req.params.id;

  const { data, error } = await supabase
    .from("monthly_pass")
    .select("*")
    .eq("customer_id", customerId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.log("PASS FETCH ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }

  if (!data) {
    return res.status(200).json({
      success: true,
      data: null,
      message: "No active pass found",
    });
  }

  res.status(200).json({
    success: true,
    data,
  });
});

/* -----------------------------------------
   GET CURRENT ACTIVE PASS BY CAR ID
----------------------------------------- */
router.get("/car/:carId", async (req, res) => {
  const carId = req.params.carId;

  const { data, error } = await supabase
    .from("monthly_pass")
    .select("*")
    .eq("car_id", carId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.log("PASS FETCH BY CAR ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }

  if (!data) {
    return res.status(200).json({
      success: true,
      data: null,
      message: "No active pass found for this car",
    });
  }

  res.status(200).json({
    success: true,
    data,
  });
});

/* -----------------------------------------
   GET ALL PASSES OF USER
----------------------------------------- */
router.get("/user/:id", async (req, res) => {
  const customerId = req.params.id;

  const { data, error } = await supabase
    .from("monthly_pass")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("PASS FETCH ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }

  res.status(200).json({
    success: true,
    data: data || [],
  });
});

/* -----------------------------------------
   UPDATE PASS (Upgrade or change plan)
----------------------------------------- */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { total_washes, remaining_washes, valid_till, active } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Pass ID is required",
    });
  }

  const updateData = {};
  if (total_washes !== undefined) updateData.total_washes = total_washes;
  if (remaining_washes !== undefined) updateData.remaining_washes = remaining_washes;
  if (valid_till !== undefined) updateData.valid_till = valid_till;
  if (active !== undefined) updateData.active = active;

  const { data, error } = await supabase
    .from("monthly_pass")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.log("PASS UPDATE ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }

  res.status(200).json({
    success: true,
    message: "Pass updated successfully",
    data,
  });
});

/* -----------------------------------------
   RENEW PASS (Reset washes and extend date)
----------------------------------------- */
router.post("/renew/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Pass ID is required",
    });
  }

  // First, get the current pass to know total washes
  const { data: passData, error: fetchError } = await supabase
    .from("monthly_pass")
    .select("total_washes")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.log("PASS FETCH ERROR:", fetchError);
    return res.status(500).json({ success: false, error: fetchError.message });
  }

  // Calculate new valid_till date (30 days from now)
  const newValidTill = new Date();
  newValidTill.setDate(newValidTill.getDate() + 30);

  const { data, error } = await supabase
    .from("monthly_pass")
    .update({
      remaining_washes: passData.total_washes,
      valid_till: newValidTill.toISOString().split("T")[0],
      active: true,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.log("PASS RENEW ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }

  res.status(200).json({
    success: true,
    message: "Pass renewed successfully",
    data,
  });
});

/* -----------------------------------------
   DEACTIVATE PASS
----------------------------------------- */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Pass ID is required",
    });
  }

  const { error } = await supabase
    .from("monthly_pass")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    console.log("PASS DELETE ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }

  res.status(200).json({
    success: true,
    message: "Pass deactivated successfully",
  });
});

/* -----------------------------------------
   GET ACTIVE PASS FOR SPECIFIC CAR
----------------------------------------- */
router.get("/car/:customer_id/:car_id", async (req, res) => {
  const { customer_id, car_id } = req.params;

  const { data, error } = await supabase
    .from("monthly_pass")
    .select("*")
    .eq("customer_id", customer_id)
    .eq("car_id", car_id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.log("PASS FETCH ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }

  res.status(200).json({
    success: true,
    data,
  });
});

/* -----------------------------------------
   GET ALL PASSES FOR A CAR
----------------------------------------- */
router.get("/car-all/:customer_id/:car_id", async (req, res) => {
  const { customer_id, car_id } = req.params;

  const { data, error } = await supabase
    .from("monthly_pass")
    .select("*")
    .eq("customer_id", customer_id)
    .eq("car_id", car_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("PASS FETCH ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }

  res.status(200).json({
    success: true,
    data: data || [],
  });
});

export default router;
