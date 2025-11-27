import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/* DELETE must come BEFORE GET */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { data: carData, error: fetchErr } = await supabase
    .from("cars")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchErr) return res.status(500).json({ success: false, error: fetchErr });

  const { error: deleteErr } = await supabase
    .from("cars")
    .delete()
    .eq("id", id);

  if (deleteErr) return res.status(500).json({ success: false, error: deleteErr });

  if (carData?.image_url) {
    const filePath = carData.image_url.split("/car-images/")[1];
    if (filePath) {
      await supabase.storage.from("car-images").remove([filePath]);
    }
  }

  res.json({ success: true, message: "Car & image deleted successfully" });
});

/* ADD CAR */
router.post("/add", async (req, res) => {
  const { customer_id, brand, model, number_plate, image_url } = req.body;

  if (!customer_id || !brand || !model || !number_plate) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  const { data, error } = await supabase
    .from("cars")
    .insert([{ customer_id, brand, model, number_plate, image_url }])
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, error });

  res.json({ success: true, data });
});

/* GET CARS */
router.get("/:customer_id", async (req, res) => {
  const { customer_id } = req.params;

  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("customer_id", customer_id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ success: false, error });

  res.json({ success: true, data });
});

/* GET ALL CARS SERVICED BY EMPLOYEE (with booking details) */
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
