import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * =====================================================
 * ADMIN DASHBOARD STATS - EMPLOYEES AND LIVE TRACKING
 * =====================================================
 */

/**
 * @GET /admin-stats/employee-count
 * Get total count of washers and riders
 */
router.get("/employee-count", async (req, res) => {
  try {
    // Get washer count
    const { data: washers, error: washerError } = await supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("role", "employee")
      .eq("employee_type", "washer")
      .eq("approval_status", "approved");

    // Get rider count
    const { data: riders, error: riderError } = await supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("role", "employee")
      .eq("employee_type", "rider")
      .eq("approval_status", "approved");

    if (washerError || riderError) {
      throw washerError || riderError;
    }

    return res.status(200).json({
      success: true,
      stats: {
        total_washers: washers?.length || 0,
        total_riders: riders?.length || 0,
        total_employees: (washers?.length || 0) + (riders?.length || 0),
      },
    });
  } catch (err) {
    console.error("❌ Employee Count Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch employee count: " + err.message,
    });
  }
});

/**
 * @GET /admin-stats/all-riders
 * Get all riders with their current status and recent bookings
 */
router.get("/all-riders", async (req, res) => {
  try {
    // Get all approved riders
    const { data: riders, error: ridersError } = await supabase
      .from("profiles")
      .select("id, name, email, phone, created_at, approval_status")
      .eq("role", "employee")
      .eq("employee_type", "rider")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });

    if (ridersError) throw ridersError;

    // Get active tracking for each rider (current location)
    const ridersWithStatus = await Promise.all(
      (riders || []).map(async (rider) => {
        // Get latest live tracking data
        const { data: tracking, error: trackingError } = await supabase
          .from("live_tracking")
          .select("id, latitude, longitude, status, created_at")
          .eq("employee_id", rider.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Get today's bookings count
        const today = new Date().toISOString().split("T")[0];
        const { data: todaysBookings, error: bookingsError } = await supabase
          .from("bookings")
          .select("id", { count: "exact" })
          .eq("rider_id", rider.id)
          .gte("created_at", `${today}T00:00:00`)
          .lt("created_at", `${today}T23:59:59`);

        return {
          ...rider,
          current_location: tracking ? {
            latitude: tracking.latitude,
            longitude: tracking.longitude,
            status: tracking.status,
            last_updated: tracking.created_at,
          } : null,
          todays_bookings_count: todaysBookings?.length || 0,
          is_online: tracking && tracking.created_at > new Date(Date.now() - 5 * 60 * 1000).toISOString() ? true : false,
        };
      })
    );

    return res.status(200).json({
      success: true,
      total: ridersWithStatus.length,
      riders: ridersWithStatus,
    });
  } catch (err) {
    console.error("❌ All Riders Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch riders: " + err.message,
    });
  }
});

/**
 * @GET /admin-stats/all-washers
 * Get all washers with their current status and today's wash count
 */
router.get("/all-washers", async (req, res) => {
  try {
    // Get all approved washers
    const { data: washers, error: washersError } = await supabase
      .from("profiles")
      .select("id, name, email, phone, created_at, approval_status")
      .eq("role", "employee")
      .eq("employee_type", "washer")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });

    if (washersError) throw washersError;

    // Get today's wash statistics for each washer
    const washersWithStats = await Promise.all(
      (washers || []).map(async (washer) => {
        const today = new Date().toISOString().split("T")[0];

        // Get car wash tracking data for today
        const { data: todaysWashes, error: washesError } = await supabase
          .from("car_wash_tracking")
          .select("id, status")
          .eq("employee_id", washer.id)
          .gte("created_at", `${today}T00:00:00`)
          .lt("created_at", `${today}T23:59:59`);

        if (washesError) throw washesError;

        const completed = (todaysWashes || []).filter(w => w.status === "washed").length;
        const pending = (todaysWashes || []).filter(w => w.status === "pending").length;

        return {
          ...washer,
          todays_washes: todaysWashes?.length || 0,
          washes_completed: completed,
          washes_pending: pending,
        };
      })
    );

    return res.status(200).json({
      success: true,
      total: washersWithStats.length,
      washers: washersWithStats,
    });
  } catch (err) {
    console.error("❌ All Washers Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch washers: " + err.message,
    });
  }
});

/**
 * @GET /admin-stats/rider/:riderId/location
 * Get specific rider's current location and tracking history
 */
router.get("/rider/:riderId/location", async (req, res) => {
  try {
    const { riderId } = req.params;

    // Get rider details
    const { data: rider, error: riderError } = await supabase
      .from("profiles")
      .select("id, name, email, phone")
      .eq("id", riderId)
      .single();

    if (riderError) throw riderError;

    // Get current location (latest tracking)
    const { data: currentLocation, error: currentError } = await supabase
      .from("live_tracking")
      .select("id, latitude, longitude, status, created_at, booking_id")
      .eq("employee_id", riderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get location history (last 10 records)
    const { data: locationHistory, error: historyError } = await supabase
      .from("live_tracking")
      .select("id, latitude, longitude, status, created_at, booking_id")
      .eq("employee_id", riderId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (currentError && currentError.code !== "PGRST116") throw currentError;
    if (historyError) throw historyError;

    // Get current booking (if any)
    const { data: currentBooking } = await supabase
      .from("bookings")
      .select("id, car_name, pickup_location, dropoff_location, status, created_at")
      .eq("rider_id", riderId)
      .neq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return res.status(200).json({
      success: true,
      rider,
      current_location: currentLocation ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        status: currentLocation.status,
        timestamp: currentLocation.created_at,
        booking_id: currentLocation.booking_id,
      } : null,
      current_booking: currentBooking || null,
      location_history: locationHistory || [],
      is_online: currentLocation && new Date(currentLocation.created_at) > new Date(Date.now() - 5 * 60 * 1000) ? true : false,
    });
  } catch (err) {
    console.error("❌ Rider Location Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch rider location: " + err.message,
    });
  }
});

/**
 * @GET /admin-stats/rider/:riderId/bookings
 * Get specific rider's bookings with live tracking
 */
router.get("/rider/:riderId/bookings", async (req, res) => {
  try {
    const { riderId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from("bookings")
      .select(`
        id,
        car_name,
        pickup_location,
        dropoff_location,
        status,
        created_at,
        booking_date,
        customer_id,
        customer:profiles!customer_id(name, phone, email)
      `)
      .eq("rider_id", riderId)
      .order("created_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: bookings, error: bookingsError, count } = await query;

    if (bookingsError) throw bookingsError;

    // Get tracking data for each booking
    const bookingsWithTracking = await Promise.all(
      (bookings || []).map(async (booking) => {
        const { data: tracking } = await supabase
          .from("live_tracking")
          .select("latitude, longitude, status, created_at")
          .eq("booking_id", booking.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          ...booking,
          current_location: tracking ? {
            latitude: tracking.latitude,
            longitude: tracking.longitude,
            status: tracking.status,
            timestamp: tracking.created_at,
          } : null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      bookings: bookingsWithTracking,
    });
  } catch (err) {
    console.error("❌ Rider Bookings Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch rider bookings: " + err.message,
    });
  }
});

/**
 * @GET /admin-stats/washer/:washerId/details
 * Get specific washer's details and today's wash summary
 */
router.get("/washer/:washerId/details", async (req, res) => {
  try {
    const { washerId } = req.params;

    // Get washer details
    const { data: washer, error: washerError } = await supabase
      .from("profiles")
      .select("id, name, email, phone, created_at")
      .eq("id", washerId)
      .single();

    if (washerError) throw washerError;

    const today = new Date().toISOString().split("T")[0];

    // Get today's washes
    const { data: todaysWashes, error: washesError } = await supabase
      .from("car_wash_tracking")
      .select("id, car_number, status, notes, created_at, wash_completed_at")
      .eq("employee_id", washerId)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`)
      .order("created_at", { ascending: false });

    if (washesError) throw washesError;

    const completed = (todaysWashes || []).filter(w => w.status === "washed").length;
    const pending = (todaysWashes || []).filter(w => w.status === "pending").length;
    const cancelled = (todaysWashes || []).filter(w => w.status === "cancelled").length;

    // Get all-time statistics
    const { data: allWashes, error: allWashesError } = await supabase
      .from("car_wash_tracking")
      .select("status")
      .eq("employee_id", washerId);

    if (allWashesError) throw allWashesError;

    const totalCompleted = (allWashes || []).filter(w => w.status === "washed").length;
    const totalWashes = allWashes?.length || 0;

    return res.status(200).json({
      success: true,
      washer,
      today_summary: {
        total_washes: todaysWashes?.length || 0,
        completed,
        pending,
        cancelled,
        washes: todaysWashes,
      },
      overall_stats: {
        total_washes_all_time: totalWashes,
        total_completed: totalCompleted,
        completion_rate: totalWashes > 0 ? ((totalCompleted / totalWashes) * 100).toFixed(2) + "%" : "0%",
      },
    });
  } catch (err) {
    console.error("❌ Washer Details Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch washer details: " + err.message,
    });
  }
});

export default router;
