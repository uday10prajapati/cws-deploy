import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/* GET CAR-SPECIFIC QR DATA */
router.get("/car/:car_id", async (req, res) => {
  try {
    const { car_id } = req.params;

    if (!car_id) {
      return res.status(400).json({
        success: false,
        error: "Car ID is required"
      });
    }

    // Get car details
    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("*")
      .eq("id", car_id)
      .single();

    if (carError || !car) {
      return res.status(404).json({
        success: false,
        error: "Car not found"
      });
    }

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", car.customer_id)
      .single();

    if (customerError) {
      console.error("Error fetching customer:", customerError);
      // Continue even if profile not found
    }

    // Get monthly pass for this car
    const { data: pass, error: passError } = await supabase
      .from("monthly_pass")
      .select("*")
      .eq("customer_id", car.customer_id)
      .eq("car_id", car_id)
      .eq("active", true)
      .maybeSingle();

    // Get auth user details
    const authUser = await supabase.auth.admin.getUserById(car.customer_id);

    const qrData = {
      // Car Details
      carId: car.id,
      carBrand: car.brand,
      carModel: car.model,
      carNumberPlate: car.number_plate,
      carColor: car.color || "N/A",
      
      // Customer Details (from profiles table)
      customerId: car.customer_id,
      customerName: customer?.full_name || authUser.data?.user?.user_metadata?.name || "N/A",
      customerEmail: authUser.data?.user?.email || "N/A",
      customerMobile: customer?.phone || authUser.data?.user?.user_metadata?.phone || "N/A",
      customerAddress: customer?.address || "N/A",
      customerTaluko: customer?.taluko || "N/A",
      
      // Monthly Pass Details
      hasPass: !!pass,
      isActive: pass?.active || false,
      passTotalWashes: pass?.total_washes || 0,
      passRemainingWashes: pass?.remaining_washes || 0,
      passExpiryDate: pass?.valid_till || "N/A",
      
      // Timestamp
      generatedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      data: qrData
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/* DECODE AND VERIFY QR DATA (for employee scanning) */
router.post("/verify", async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        error: "QR data is required"
      });
    }

    // Parse the QR data
    let decodedData;
    try {
      decodedData = typeof qrData === "string" ? JSON.parse(qrData) : qrData;
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        error: "Invalid QR data format"
      });
    }

    // Verify car exists
    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("*")
      .eq("number_plate", decodedData.carNumberPlate)
      .single();

    if (carError || !car) {
      return res.status(404).json({
        success: false,
        error: "Car not found in database"
      });
    }

    // Get latest pass status
    const { data: pass } = await supabase
      .from("monthly_pass")
      .select("*")
      .eq("customer_id", car.customer_id)
      .eq("car_id", car.id)
      .eq("active", true)
      .maybeSingle();

    // Return verified data with latest pass info
    return res.status(200).json({
      success: true,
      data: {
        ...decodedData,
        // Update pass info from database
        hasPass: !!pass,
        isActive: pass?.active || false,
        passTotalWashes: pass?.total_washes || 0,
        passRemainingWashes: pass?.remaining_washes || 0,
        passExpiryDate: pass?.valid_till || "N/A",
        verifiedAt: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

export default router;
