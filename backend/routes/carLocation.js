import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// GET LOCATION FOR PARTICULAR CUSTOMER
router.get("/customer/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required"
      });
    }

    // Get latest active booking for customer
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("customer_id", customer_id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !booking) {
      return res.status(404).json({
        success: false,
        error: "No active booking found"
      });
    }

    // Get driver info if assigned
    let driver = null;
    if (booking.assigned_to) {
      const { data: driverInfo } = await supabase
        .from("profiles")
        .select("id, email, name")
        .eq("id", booking.assigned_to)
        .single();
      driver = driverInfo;
    }

    // Get customer info
    const { data: customer } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("id", customer_id)
      .single();

    res.json({
      success: true,
      data: {
        booking_id: booking.id,
        customer_id: booking.customer_id,
        customer_name: customer?.name || "N/A",
        customer_email: customer?.email || "N/A",
        service_location: booking.location || "Main Outlet",
        booking_date: booking.date,
        booking_time: booking.time,
        status: booking.status,
        car_name: booking.car_name,
        amount: booking.amount,
        pickup_required: booking.pickup || false,
        driver: driver || null
      }
    });
  } catch (err) {
    console.error("❌ Error fetching customer location:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET ALL CUSTOMER LOCATIONS (For Admin/Employee)
router.get("/all-customers/locations", async (req, res) => {
  try {
    // Get all active bookings
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .neq("status", "cancelled")
      .neq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Enrich with customer and driver info
    const enrichedData = await Promise.all(
      (bookings || []).map(async (booking) => {
        let customer = null;
        if (booking.customer_id) {
          const { data: customerInfo } = await supabase
            .from("profiles")
            .select("id, email, name")
            .eq("id", booking.customer_id)
            .single();
          customer = customerInfo;
        }

        let driver = null;
        if (booking.assigned_to) {
          const { data: driverInfo } = await supabase
            .from("profiles")
            .select("id, email, name")
            .eq("id", booking.assigned_to)
            .single();
          driver = driverInfo;
        }

        return {
          booking_id: booking.id,
          customer: customer,
          service_location: booking.location || "Main Outlet",
          booking_date: booking.date,
          booking_time: booking.time,
          status: booking.status,
          car_name: booking.car_name,
          amount: booking.amount,
          driver: driver,
          pickup_required: booking.pickup
        };
      })
    );

    res.json({
      success: true,
      total: enrichedData.length,
      data: enrichedData
    });
  } catch (err) {
    console.error("❌ Error fetching all customer locations:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// TEST: Check if live_tracking table has any data
router.get("/test/tracking-data", async (req, res) => {
  try {
    const { data: allTracking, error } = await supabase
      .from("live_tracking")
      .select("*", { count: "exact" });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        details: "Error querying live_tracking table"
      });
    }

    res.json({
      success: true,
      message: "Live tracking table status",
      total_records: allTracking?.length || 0,
      data: allTracking || [],
      table_status: allTracking && allTracking.length > 0 ? "✅ Data exists" : "⚠️ No data in table"
    });
  } catch (err) {
    console.error("❌ Error checking tracking data:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET TRACKING DATA BY DATE FOR BOOKING (With fallback)
router.get("/tracking-history/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { date } = req.query;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        error: "Booking ID is required"
      });
    }

    // First check if table has any data for this booking
    const { data: checkData, error: checkError } = await supabase
      .from("live_tracking")
      .select("*", { count: "exact" })
      .eq("booking_id", booking_id);

    if (checkError) {
      return res.status(400).json({
        success: false,
        error: checkError.message,
        booking_id,
        table_check: "Error querying table"
      });
    }

    let query = supabase
      .from("live_tracking")
      .select("*")
      .eq("booking_id", booking_id)
      .order("updated_at", { ascending: true });

    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query = query
        .gte("updated_at", startDate.toISOString())
        .lt("updated_at", endDate.toISOString());

    }

    const { data: trackingData, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        booking_id,
        query_info: "Error fetching filtered data"
      });
    }

    // Group by status
    const pickupData = trackingData?.filter(t => t.status === "pickup_in_progress") || [];
    const deliveryData = trackingData?.filter(t => t.status === "delivery_in_progress") || [];
    const washData = trackingData?.filter(t => t.status === "in_wash") || [];
    const completedData = trackingData?.filter(t => t.status === "completed") || [];

    res.json({
      success: true,
      data: {
        booking_id,
        date: date || new Date().toISOString().split("T")[0],
        summary: {
          total_points: trackingData?.length || 0,
          pickup_points: pickupData.length,
          wash_points: washData.length,
          delivery_points: deliveryData.length,
          completed_points: completedData.length
        },
        all_tracking: trackingData || [],
        grouped: {
          pickup: pickupData,
          wash: washData,
          delivery: deliveryData,
          completed: completedData
        },
        date_range: {
          from: trackingData && trackingData.length > 0 ? trackingData[0].updated_at : null,
          to: trackingData && trackingData.length > 0 ? trackingData[trackingData.length - 1].updated_at : null
        }
      }
    });
  } catch (err) {
    console.error("❌ Error fetching tracking history:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// SAVE LIVE TRACKING DATA (Called by employee app)
router.post("/tracking/save", async (req, res) => {
  try {
    const { booking_id, employee_id, latitude, longitude, status } = req.body;

    if (!booking_id || !employee_id || latitude === undefined || longitude === undefined || !status) {
      return res.status(400).json({
        success: false,
        error: "booking_id, employee_id, latitude, longitude, and status are required"
      });
    }

    // Insert tracking data
    const { data, error } = await supabase
      .from("live_tracking")
      .insert([
        {
          booking_id,
          employee_id,
          latitude,
          longitude,
          status,
          tracking_type: "live"
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      message: "Tracking data saved",
      data: data[0]
    });
  } catch (err) {
    console.error("❌ Error saving tracking data:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET LATEST LIVE LOCATION FOR BOOKING
router.get("/live/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        error: "Booking ID is required"
      });
    }

    // Get latest tracking point
    const { data: latestTracking, error } = await supabase
      .from("live_tracking")
      .select("*")
      .eq("booking_id", booking_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !latestTracking) {
      return res.status(404).json({
        success: false,
        error: "No tracking data found"
      });
    }

    // Get booking and employee details
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    const { data: employee } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("id", latestTracking.employee_id)
      .single();

    res.json({
      success: true,
      data: {
        location: {
          latitude: latestTracking.latitude,
          longitude: latestTracking.longitude
        },
        status: latestTracking.status,
        tracking_type: latestTracking.tracking_type,
        employee: employee,
        booking: {
          id: booking?.id,
          car_name: booking?.car_name,
          customer_id: booking?.customer_id
        },
        timestamp: latestTracking.updated_at
      }
    });
  } catch (err) {
    console.error("❌ Error fetching live location:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


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

// GET TRACKING DATA BY DATE FOR BOOKING
router.get("/tracking-history/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { date } = req.query;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        error: "Booking ID is required"
      });
    }

    let query = supabase
      .from("live_tracking")
      .select("*")
      .eq("booking_id", booking_id)
      .order("updated_at", { ascending: true });

    // Filter by date if provided (use updated_at instead of created_at)
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query = query
        .gte("updated_at", startDate.toISOString())
        .lt("updated_at", endDate.toISOString());
    }

    const { data: trackingData, error } = await query;

    if (error) {
      console.error("❌ Query error:", error);
      console.error("❌ Error details:", error.message);
      return res.status(400).json({ 
        success: false, 
        error: error.message,
        details: "Could not query live_tracking table"
      });
    }

    // Group by status
    const pickupData = trackingData?.filter(t => 
      t.status === "pickup_in_progress" || t.status === "pickup_movement" || t.status === "pickup_started"
    ) || [];
    const deliveryData = trackingData?.filter(t => 
      t.status === "delivery_in_progress" || t.status === "delivery_movement"
    ) || [];
    const washData = trackingData?.filter(t => t.status === "in_wash" || t.status === "car_washing") || [];
    const completedData = trackingData?.filter(t => t.status === "completed") || [];

    res.json({
      success: true,
      data: {
        booking_id,
        date: date || new Date().toISOString().split("T")[0],
        summary: {
          total_points: trackingData?.length || 0,
          pickup_points: pickupData.length,
          wash_points: washData.length,
          delivery_points: deliveryData.length,
          completed_points: completedData.length
        },
        all_tracking: trackingData || [],
        grouped: {
          pickup: pickupData,
          wash: washData,
          delivery: deliveryData,
          completed: completedData
        }
      }
    });
  } catch (err) {
    console.error("❌ Error fetching tracking history:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET LIVE LOCATION FOR BOOKING
router.get("/live/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;

    const { data: latestTracking, error } = await supabase
      .from("live_tracking")
      .select("*")
      .eq("booking_id", booking_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }

    res.json({
      success: true,
      data: {
        latest_coordinate: latestTracking
      }
    });
  } catch (err) {
    console.error("❌ Error fetching live location:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
