import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// GET ALL ACTIVE BOOKINGS WITH LOCATIONS FOR EMPLOYEE
router.get("/active/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required"
      });
    }

    // Get all active/pending bookings assigned to employee
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("assigned_to", employee_id)
      .in("status", ["Confirmed", "In Progress", "Pending"])
      .order("date", { ascending: true });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Enrich bookings with customer info
    const enrichedBookings = await Promise.all(
      (bookings || []).map(async (booking) => {
        let customerInfo = null;
        if (booking.customer_id) {
          const { data: customer } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", booking.customer_id)
            .single();
          customerInfo = customer;
        }

        let carInfo = null;
        if (booking.car_id) {
          const { data: car } = await supabase
            .from("cars")
            .select("*")
            .eq("id", booking.car_id)
            .single();
          carInfo = car;
        }

        return {
          ...booking,
          customer: customerInfo,
          car: carInfo,
          pickup_location: booking.pickup ? "Requires Pickup" : "Self Delivery",
          service_location: booking.location || "Main Outlet",
          delivery_status: booking.status === "Completed" ? "Delivered" : "In Progress"
        };
      })
    );

    // Separate by status
    const activeBookings = enrichedBookings.filter(b => b.status === "In Progress");
    const pendingBookings = enrichedBookings.filter(b => b.status === "Pending" || b.status === "Confirmed");

    res.json({
      success: true,
      active: activeBookings,
      pending: pendingBookings,
      total: enrichedBookings.length,
      data: enrichedBookings
    });
  } catch (err) {
    console.error("❌ Error fetching active locations:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET BOOKING LOCATION DETAILS
router.get("/booking/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        error: "Booking ID is required"
      });
    }

    // Get booking details
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: "Booking not found" });
    }

    // Get customer info
    let customerInfo = null;
    if (booking.customer_id) {
      const { data: customer } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email")
        .eq("id", booking.customer_id)
        .single();
      customerInfo = customer;
    }

    // Get car info
    let carInfo = null;
    if (booking.car_id) {
      const { data: car } = await supabase
        .from("cars")
        .select("*")
        .eq("id", booking.car_id)
        .single();
      carInfo = car;
    }

    const locationData = {
      id: booking.id,
      car_name: booking.car_name,
      services: booking.services,
      date: booking.date,
      time: booking.time,
      pickup_required: booking.pickup || false,
      service_location: booking.location || "Main Outlet",
      status: booking.status,
      amount: booking.amount,
      customer: customerInfo,
      car: carInfo,
      notes: booking.notes || "",
      created_at: booking.created_at
    };

    res.json({
      success: true,
      location: locationData
    });
  } catch (err) {
    console.error("❌ Error fetching booking location:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE BOOKING STATUS (Pickup Status, Delivery Status)
router.put("/update-status/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { status, pickup_status, delivery_status } = req.body;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        error: "Booking ID is required"
      });
    }

    const updateData = {};

    if (status) {
      updateData.status = status;
    }

    if (pickup_status) {
      updateData.pickup_status = pickup_status;
    }

    if (delivery_status) {
      updateData.delivery_status = delivery_status;
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", booking_id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: "Booking status updated",
      booking: data
    });
  } catch (err) {
    console.error("❌ Error updating booking status:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET LOCATION STATISTICS FOR TODAY
router.get("/stats/today/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required"
      });
    }

    const today = new Date().toISOString().split("T")[0];

    // Get today's bookings
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("assigned_to", employee_id)
      .eq("date", today);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const stats = {
      total_today: bookings?.length || 0,
      pending: bookings?.filter(b => b.status === "Pending" || b.status === "Confirmed").length || 0,
      in_progress: bookings?.filter(b => b.status === "In Progress").length || 0,
      completed: bookings?.filter(b => b.status === "Completed").length || 0,
      pickup_required: bookings?.filter(b => b.pickup).length || 0,
      self_delivery: bookings?.filter(b => !b.pickup).length || 0
    };

    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error("❌ Error fetching location stats:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET LOCATION ROUTES (Optimized pickup/delivery order)
router.get("/route/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required"
      });
    }

    const today = new Date().toISOString().split("T")[0];

    // Get today's bookings ordered by time
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("assigned_to", employee_id)
      .eq("date", today)
      .in("status", ["Confirmed", "In Progress", "Pending"])
      .order("time", { ascending: true });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Organize by location
    const locationGroups = {};
    
    (bookings || []).forEach(booking => {
      const location = booking.location || "Main Outlet";
      if (!locationGroups[location]) {
        locationGroups[location] = [];
      }
      locationGroups[location].push(booking);
    });

    // Create route with optimized stops
    const route = [];
    Object.entries(locationGroups).forEach(([location, jobs]) => {
      route.push({
        location,
        bookings: jobs,
        total_jobs: jobs.length,
        pickup_count: jobs.filter(b => b.pickup).length,
        estimated_duration: jobs.length * 30 // 30 mins per job estimate
      });
    });

    res.json({
      success: true,
      total_locations: route.length,
      total_bookings: bookings?.length || 0,
      route,
      bookings
    });
  } catch (err) {
    console.error("❌ Error fetching route:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET LOCATION HISTORY (Past deliveries)
router.get("/history/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { days = 7 } = req.query;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required"
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get completed bookings in date range
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("assigned_to", employee_id)
      .eq("status", "Completed")
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Group by date
    const historyByDate = {};
    (bookings || []).forEach(booking => {
      const date = booking.date;
      if (!historyByDate[date]) {
        historyByDate[date] = [];
      }
      historyByDate[date].push(booking);
    });

    res.json({
      success: true,
      days: parseInt(days),
      total_bookings: bookings?.length || 0,
      history: historyByDate
    });
  } catch (err) {
    console.error("❌ Error fetching delivery history:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
