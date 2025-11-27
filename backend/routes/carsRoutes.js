import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// GET ALL CARS FOR A CUSTOMER
router.get("/customer/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required",
      });
    }

    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("customer_id", customer_id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      cars: data || [],
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// GET SINGLE CAR
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Car ID is required",
      });
    }

    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    return res.status(200).json({
      success: true,
      car: data,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// CREATE NEW CAR
router.post("/", async (req, res) => {
  try {
    const { customer_id, brand, model, number_plate, image_url } = req.body;

    if (!customer_id || !brand || !model) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: customer_id, brand, model",
      });
    }

    const carData = {
      customer_id,
      brand: String(brand).trim(),
      model: String(model).trim(),
      number_plate: number_plate ? String(number_plate).trim() : null,
      image_url: image_url || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("cars")
      .insert([carData])
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        error: `Database error: ${error.message}`,
      });
    }

    return res.status(201).json({
      success: true,
      car: data[0],
      message: "Car added successfully",
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// UPDATE CAR
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { brand, model, number_plate, image_url } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Car ID is required",
      });
    }

    const updateData = {};
    if (brand) updateData.brand = String(brand).trim();
    if (model) updateData.model = String(model).trim();
    if (number_plate !== undefined)
      updateData.number_plate = number_plate ? String(number_plate).trim() : null;
    if (image_url !== undefined) updateData.image_url = image_url || null;

    const { data, error } = await supabase
      .from("cars")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      car: data[0],
      message: "Car updated successfully",
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// DELETE CAR
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Car ID is required",
      });
    }

    const { error } = await supabase.from("cars").delete().eq("id", id);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Car deleted successfully",
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// GET ALL CARS SERVICED BY EMPLOYEE (with booking details)
router.get("/employee/serviced/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required",
      });
    }

    // Get all bookings for this employee
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .eq("assigned_to", employee_id);

    if (bookingsError) {
      return res.status(400).json({
        success: false,
        error: bookingsError.message,
      });
    }

    // Get unique car IDs from bookings
    const carIds = [...new Set(bookings?.map(b => b.car_id).filter(Boolean) || [])];

    if (carIds.length === 0) {
      return res.status(200).json({
        success: true,
        cars: [],
      });
    }

    // Fetch car details
    const { data: cars, error: carsError } = await supabase
      .from("cars")
      .select("*")
      .in("id", carIds);

    if (carsError) {
      return res.status(400).json({
        success: false,
        error: carsError.message,
      });
    }

    // Enrich with booking data
    const enrichedCars = cars.map(car => {
      const carBookings = bookings.filter(b => b.car_id === car.id);
      return {
        ...car,
        total_services: carBookings.length,
        completed_services: carBookings.filter(b => b.status === "Completed").length,
        last_service: carBookings[0]?.date,
        services: [...new Set(carBookings.flatMap(b => Array.isArray(b.services) ? b.services : []))],
        total_amount: carBookings.reduce((sum, b) => sum + (b.amount || 0), 0),
        locations: [...new Set(carBookings.map(b => b.location).filter(Boolean))],
      };
    });

    return res.status(200).json({
      success: true,
      cars: enrichedCars,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

export default router;
