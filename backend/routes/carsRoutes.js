import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// GET ALL CARS (ADMIN VIEW)
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("cars")
      .select("*")
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
      count: data?.length || 0,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

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
    const { customer_id,  model, number_plate, image_url } = req.body;

    if (!customer_id  || !model) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: customer_id,  model",
      });
    }

    const carData = {
      customer_id,     
      model: String(model).trim(),
      number_plate: number_plate ? String(number_plate).trim() : null,
      image_url: car_photo_url || null,
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
    const { model, number_plate, image_url } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Car ID is required",
      });
    }

    const updateData = {};
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

/**
 * SECURE: Get All Cars with Role-Based & Geographic Filtering
 * 
 * FILTERING RULES:
 * - General: All cars across all cities/talukas
 * - Sub-General: Only cars where customer_city is in assigned cities (all talukas within those cities)
 * - HR-General: Only cars where customer_taluko is in assigned talukas
 * 
 * This filtering is ENFORCED at the backend level to prevent data leakage
 */
router.get("/all-cars/secure", async (req, res) => {
  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: "No authentication token" });
    }

    // Decode JWT to get user ID
    let userId;
    try {
      const parts = token.split(".");
      const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString());
      userId = decoded.sub;
    } catch (e) {
      return res.status(401).json({ success: false, error: "Invalid token format" });
    }

    // Step 1: Get user profile and role
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("id, email, name, employee_type")
      .eq("id", userId)
      .single();

    if (userError || !userProfile) {
      return res.status(403).json({ success: false, error: "User profile not found" });
    }

    const userRole = userProfile.employee_type;

    // Step 2: Fetch all sales_cars with customer geographic data
    const { data: cars, error: carsError } = await supabase
      .from("sales_cars")
      .select("id, sales_person_id, model, number_plate, color, car_photo_url, customer_name, customer_phone, customer_city, customer_taluko, created_at")
      .order("created_at", { ascending: false });

    if (carsError) {
      console.error("❌ Error fetching cars:", carsError);
      return res.status(400).json({ success: false, error: carsError.message });
    }

    // Step 3: Get user's geographic assignments based on role
    let userCities = [];
    let userTalukas = [];

    if (userRole === "sub-general") {
      const { data: assignments } = await supabase
        .from("user_role_assignments")
        .select("assigned_cities")
        .eq("user_id", userId)
        .eq("role", "sub-general")
        .maybeSingle();
      userCities = assignments?.assigned_cities || [];
    } 
    else if (userRole === "hr-general") {
      const { data: assignments } = await supabase
        .from("user_role_assignments")
        .select("assigned_talukas")
        .eq("user_id", userId)
        .eq("role", "hr-general")
        .maybeSingle();
      userTalukas = assignments?.assigned_talukas || [];
    }

    // Step 4: Get all sales person profiles with their geographic info
    const { data: allSalesPersons, error: salesPersonError } = await supabase
      .from("profiles")
      .select("id, name, email, employee_type, city, taluko")
      .eq("employee_type", "sales");

    if (salesPersonError) {
      console.error("❌ Error fetching sales persons:", salesPersonError);
    }

    console.log(`📋 Fetched ${allSalesPersons?.length || 0} sales persons from profiles table`);

    const salesPersonMap = {};
    allSalesPersons?.forEach(sp => {
      salesPersonMap[sp.id] = sp;
      console.log(`  ✓ Added sales person: ${sp.id} -> ${sp.name}`);
    });

    console.log(`🗺️ Sales Person Map created with ${Object.keys(salesPersonMap).length} entries`);

    // Step 5: Fetch booking stats for each car
    const carIds = cars?.map(c => c.id) || [];
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("id, car_id, status, amount, date, location")
      .in("car_id", carIds);

    const bookingStats = {};
    bookingsData?.forEach(booking => {
      if (!bookingStats[booking.car_id]) {
        bookingStats[booking.car_id] = {
          total: 0,
          completed: 0,
          in_progress: 0,
          pending: 0,
          locations: new Set(),
          last_service: null
        };
      }
      bookingStats[booking.car_id].total++;
      if (booking.status === "Completed") bookingStats[booking.car_id].completed++;
      if (booking.status === "In Progress") bookingStats[booking.car_id].in_progress++;
      if (booking.status === "Pending") bookingStats[booking.car_id].pending++;
      if (booking.location) bookingStats[booking.car_id].locations.add(booking.location);
      bookingStats[booking.car_id].last_service = booking.date;
    });

    // Step 6: Enrich cars data and apply role-based geographic filtering
    let enrichedCars = cars
      ?.map(car => {
        const stats = bookingStats[car.id] || {};
        return {
          id: car.id,
          customer_name: car.customer_name,
          customer_phone: car.customer_phone,
          customer_city: car.customer_city,
          customer_taluko: car.customer_taluko,
          car_model: car.model,
          car_number_plate: car.number_plate,
          car_color: car.color,
          car_photo_url: car.car_photo_url,
          created_at: car.created_at,
          added_by_sales_person: {
            id: salesPersonMap[car.sales_person_id]?.id,
            name: salesPersonMap[car.sales_person_id]?.name || "Unknown",
            email: salesPersonMap[car.sales_person_id]?.email || "N/A",
            type: salesPersonMap[car.sales_person_id]?.employee_type,
            city: salesPersonMap[car.sales_person_id]?.city,
            taluko: salesPersonMap[car.sales_person_id]?.taluko
          },
          booking_stats: {
            total_bookings: stats.total || 0,
            completed: stats.completed || 0,
            in_progress: stats.in_progress || 0,
            pending: stats.pending || 0,
            locations: Array.from(stats.locations || []),
            last_service: stats.last_service
          }
        };
      }) || [];

    // Debug: Log which cars matched which sales persons
    cars?.forEach((car, idx) => {
      const found = salesPersonMap[car.sales_person_id];
      if (found) {
        console.log(`✓ Car ${idx + 1} (${car.customer_name}): sales_person_id=${car.sales_person_id} -> ${found.name}`);
      } else {
        console.log(`⛔ Car ${idx + 1} (${car.customer_name}): sales_person_id=${car.sales_person_id} NOT FOUND in map`);
      }
    });

    // Apply geographic filtering
    enrichedCars = enrichedCars.filter(car => {
      // Apply role-based geographic filtering based on CUSTOMER'S location
      if (userRole === "general") {
        return true; // Show all
      }
      else if (userRole === "sub-general") {
        // Show only cars from assigned cities (case-insensitive)
        const customerCity = car.customer_city?.toLowerCase();
        const citiesLower = userCities.map(c => c.toLowerCase());
        const matches = citiesLower.includes(customerCity);
        if (!matches) {
          console.log(`⛔ Car (${car.customer_name}) in city "${car.customer_city}" not in assigned cities [${userCities.join(", ")}]`);
        }
        return matches;
      }
      else if (userRole === "hr-general") {
        // Show only cars from assigned talukas (case-insensitive)
        const customerTaluko = car.customer_taluko?.toLowerCase();
        const talukasLower = userTalukas.map(t => t.toLowerCase());
        const matches = talukasLower.includes(customerTaluko);
        if (matches) {
          console.log(`✓ Car (${car.customer_name}) in taluka "${car.customer_taluko}" matches assigned talukas [${userTalukas.join(", ")}]`);
        } else {
          console.log(`⛔ Car (${car.customer_name}) in taluka "${car.customer_taluko}" not in assigned talukas [${userTalukas.join(", ")}]`);
        }
        return matches;
      }
      return false;
    });

    // Log filtering details
    if (userRole === "general") {
      console.log(`✅ [General] Access to ALL cars (${enrichedCars.length} records)`);
    } else if (userRole === "sub-general") {
      console.log(`✅ [Sub-General] Access to cars in cities: ${userCities.join(", ")} (${enrichedCars.length} records)`);
    } else if (userRole === "hr-general") {
      console.log(`✅ [HR-General] Access to cars in talukas: ${userTalukas.join(", ")} (${enrichedCars.length} records)`);
    } else {
      return res.status(403).json({ 
        success: false, 
        error: "Only General, Sub-General, and HR-General roles can access all cars" 
      });
    }

    const filteredCars = enrichedCars;

    return res.json({ 
      success: true, 
      data: filteredCars,
      metadata: {
        user_role: userRole,
        total_count: filteredCars.length,
        filtering_applied: userRole !== "general"
      }
    });

  } catch (error) {
    console.error("❌ Error in /all-cars/secure:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
