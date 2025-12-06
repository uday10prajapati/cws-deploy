import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/* =========================================
   BOOKING-CAR WASH INTEGRATION
   ========================================= */

/* -----------------------------------------
   GET BOOKING WITH WASH STATUS (Customer View)
----------------------------------------- */
router.get("/with-status/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Get associated wash records using car number/name
    const { data: washes, error: washError } = await supabase
      .from("car_wash_tracking")
      .select("*")
      .or(
        `car_owner_name.eq.${booking.customer_id},` +
        `car_number.ilike.%${booking.car_name}%`
      )
      .order("created_at", { ascending: false })
      .limit(5);

    if (washError) {
      console.log("Wash fetch warning:", washError);
    }

    // Determine wash status from most recent wash
    let washStatus = "not_started";
    let washDetails = null;

    if (washes && washes.length > 0) {
      const latestWash = washes[0];
      washStatus = latestWash.status; // "pending", "washed", "cancelled"
      washDetails = {
        id: latestWash.id,
        status: latestWash.status,
        created_at: latestWash.created_at,
        wash_completed_at: latestWash.wash_completed_at,
        employee_name: latestWash.employee_id, // Can be enhanced with join
        notes: latestWash.notes,
      };
    }

    return res.json({
      success: true,
      booking: {
        ...booking,
        wash_status: washStatus,
        wash_details: washDetails,
      },
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to fetch booking with status" });
  }
});

/* -----------------------------------------
   GET ALL CUSTOMER BOOKINGS WITH WASH STATUS
----------------------------------------- */
router.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    // Get all customer bookings
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (bookingError) {
      return res.status(400).json({ error: bookingError.message });
    }

    // Enhance each booking with wash status
    const bookingsWithStatus = await Promise.all(
      bookings.map(async (booking) => {
        const { data: washes } = await supabase
          .from("car_wash_tracking")
          .select("*")
          .or(
            `car_number.ilike.%${booking.car_name}%,` +
            `car_owner_name.eq.${customerId}`
          )
          .order("created_at", { ascending: false })
          .limit(1);

        const latestWash = washes && washes.length > 0 ? washes[0] : null;

        return {
          ...booking,
          wash_status: latestWash?.status || "not_started",
          wash_details: latestWash
            ? {
                id: latestWash.id,
                status: latestWash.status,
                created_at: latestWash.created_at,
                wash_completed_at: latestWash.wash_completed_at,
                notes: latestWash.notes,
              }
            : null,
        };
      })
    );

    return res.json({
      success: true,
      total: bookingsWithStatus.length,
      bookings: bookingsWithStatus,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to fetch customer bookings" });
  }
});

/* -----------------------------------------
   GET EMPLOYEE ASSIGNED BOOKINGS WITH WASH STATUS
----------------------------------------- */
router.get("/employee/assigned/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Get bookings with assignment
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select("*, assigned_employees(employee_id)")
      .eq("assigned_employees.employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (bookingError) {
      return res.status(400).json({ error: bookingError.message });
    }

    // Get washes created by this employee
    const { data: washes } = await supabase
      .from("car_wash_tracking")
      .select("*")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    // Match bookings with washes
    const bookingsWithWashes = bookings.map((booking) => {
      const matchingWash = washes?.find(
        (w) =>
          w.car_number.toLowerCase() === booking.car_name.toLowerCase() ||
          w.car_owner_name === booking.customer_id
      );

      return {
        ...booking,
        wash_status: matchingWash?.status || "pending",
        wash_details: matchingWash
          ? {
              id: matchingWash.id,
              status: matchingWash.status,
              created_at: matchingWash.created_at,
              wash_completed_at: matchingWash.wash_completed_at,
              notes: matchingWash.notes,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      total: bookingsWithWashes.length,
      bookings: bookingsWithWashes,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to fetch employee bookings" });
  }
});

/* -----------------------------------------
   GET ALL BOOKINGS WITH WASH STATUS (ADMIN)
----------------------------------------- */
router.get("/admin/all-with-status", async (req, res) => {
  try {
    const { status, date } = req.query;

    let query = supabase.from("bookings").select("*");

    if (status) {
      query = query.eq("status", status);
    }

    if (date) {
      query = query.eq("date", date);
    }

    const { data: bookings, error: bookingError } = await query.order(
      "created_at",
      { ascending: false }
    );

    if (bookingError) {
      return res.status(400).json({ error: bookingError.message });
    }

    // Get all washes
    const { data: allWashes } = await supabase
      .from("car_wash_tracking")
      .select("*");

    // Enhance bookings with wash status
    const bookingsWithStatus = bookings.map((booking) => {
      const matchingWash = allWashes?.find(
        (w) =>
          w.car_number.toLowerCase() === booking.car_name.toLowerCase() ||
          w.car_owner_name === booking.customer_id
      );

      return {
        ...booking,
        wash_status: matchingWash?.status || "not_started",
        wash_details: matchingWash
          ? {
              id: matchingWash.id,
              status: matchingWash.status,
              employee_id: matchingWash.employee_id,
              created_at: matchingWash.created_at,
              wash_completed_at: matchingWash.wash_completed_at,
              notes: matchingWash.notes,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      total: bookingsWithStatus.length,
      bookings: bookingsWithStatus,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to fetch admin bookings" });
  }
});

/* -----------------------------------------
   GET WASH STATUS SUMMARY (DASHBOARD)
----------------------------------------- */
router.get("/stats/wash-summary", async (req, res) => {
  try {
    // Get wash statistics
    const { data: washes } = await supabase
      .from("car_wash_tracking")
      .select("*");

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*");

    const washed = washes?.filter((w) => w.status === "washed").length || 0;
    const pending = washes?.filter((w) => w.status === "pending").length || 0;
    const cancelled = washes?.filter((w) => w.status === "cancelled").length || 0;

    const bookingsCount = bookings?.length || 0;
    const bookedButNotWashed = bookings?.filter(
      (b) =>
        !washes?.find(
          (w) =>
            w.car_number === b.car_name ||
            w.car_owner_name === b.customer_id
        )
    ).length || 0;

    return res.json({
      success: true,
      stats: {
        total_washes: washes?.length || 0,
        washed: washed,
        pending: pending,
        cancelled: cancelled,
        total_bookings: bookingsCount,
        booked_but_not_washed: bookedButNotWashed,
        wash_completion_rate: ((washed / (washes?.length || 1)) * 100).toFixed(2),
      },
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to fetch wash summary" });
  }
});

/* -----------------------------------------
   LINK BOOKING TO WASH (Create wash for booking)
----------------------------------------- */
router.post("/booking/:bookingId/create-wash", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { employeeId } = req.body;

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Create wash record
    const { data: wash, error: washError } = await supabase
      .from("car_wash_tracking")
      .insert([
        {
          employee_id: employeeId,
          car_owner_name: booking.customer_id,
          car_number: booking.car_name,
          car_model: booking.car_name,
          status: "pending",
          notes: `Booking ID: ${bookingId}, Services: ${booking.services?.join(", ")}`,
        },
      ])
      .select();

    if (washError) {
      return res.status(500).json({ error: washError.message });
    }

    return res.json({
      success: true,
      message: "Wash record created for booking",
      wash: wash[0],
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to create wash record" });
  }
});

export default router;
