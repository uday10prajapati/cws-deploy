import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// CREATE BOOKING - Must be before other GET routes
router.post("/create", async (req, res) => {
  try {
    const {
      customer_id,
      car_id,
      car_name,
      services,
      addons,
      amount,
      date,
      time,
      pickup,
      notes,
      status,
      location
    } = req.body;

    console.log("📝 Received booking request:", req.body);

    // Validate required fields
    if (!customer_id || !car_name || !services || !date || !time) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields. Please provide: customer_id, car_name, services, date, time" 
      });
    }

    // Ensure services and addons are stored as JSON
    const bookingData = {
      customer_id,
      car_id: car_id || null,
      car_name: String(car_name).trim(),
      services: Array.isArray(services) ? services : [services],
      addons: typeof addons === "object" ? addons : {},
      amount: parseFloat(amount) || 0,
      date: String(date).trim(),
      time: String(time).trim(),
      pickup: pickup === true || pickup === "true",
      notes: String(notes || "").trim(),
      status: String(status || "Pending").trim(),
      location: String(location || "Main Outlet").trim(),
      created_at: new Date().toISOString()
    };

    console.log("✅ Booking data prepared:", bookingData);

    const { data, error } = await supabase
      .from("bookings")
      .insert([bookingData])
      .select();

    if (error) {
      console.error("❌ Supabase Error:", error);
      return res.status(400).json({ 
        success: false, 
        error: `Database error: ${error.message}`,
        details: error
      });
    }

    console.log("✅ Booking created successfully:", data);
    return res.status(201).json({ 
      success: true, 
      booking: data[0],
      message: "Booking created successfully"
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({ 
      success: false, 
      error: "Server error: " + err.message,
      details: err.toString()
    });
  }
});

// GET ALL BOOKINGS (ADMIN) - Moved after POST
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      bookings: data || [] 
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ 
      success: false, 
      error: "Server error: " + err.message 
    });
  }
});

// GET ALL BOOKINGS FOR A CUSTOMER
router.get("/customer/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({ 
        success: false, 
        error: "Customer ID is required" 
      });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("customer_id", customer_id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      bookings: data || [] 
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ 
      success: false, 
      error: "Server error: " + err.message 
    });
  }
});

// GET BOOKING BY ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: "Booking ID is required" 
      });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ 
        success: false, 
        error: "Booking not found" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      booking: data 
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ 
      success: false, 
      error: "Server error: " + err.message 
    });
  }
});

// UPDATE BOOKING STATUS
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: "Booking ID is required" 
      });
    }

    const updateData = {};
    if (status) updateData.status = String(status).trim();
    if (notes !== undefined) updateData.notes = String(notes || "").trim();

    const { data, error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      booking: data[0],
      message: "Booking updated successfully"
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ 
      success: false, 
      error: "Server error: " + err.message 
    });
  }
});

// DELETE BOOKING
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: "Booking ID is required" 
      });
    }

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Booking deleted successfully"
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ 
      success: false, 
      error: "Server error: " + err.message 
    });
  }
});

export default router;
