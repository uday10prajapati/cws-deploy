import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/* =========================================
   CAR WASH TRACKING TABLE SCHEMA (SQL to run)
   =========================================
   
   CREATE TABLE IF NOT EXISTS public.car_wash_tracking (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     
     -- Employee Reference
     employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     
     -- Car Details
     car_owner_name VARCHAR(255) NOT NULL,
     car_model VARCHAR(100),
     car_number VARCHAR(20) UNIQUE NOT NULL,
     car_color VARCHAR(50),
     
     -- Wash Status
     status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'washed', 'cancelled')),
     
     -- Timestamps
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
     wash_completed_at TIMESTAMP WITH TIME ZONE,
     
     -- Additional Info
     notes TEXT,
     
     CONSTRAINT valid_car_number CHECK (car_number ~ '^[A-Z]{2}[A-Z0-9]{2}[A-Z]{2}[0-9]{4}$' OR car_number ~ '^[0-9]{10}$')
   );
   
   CREATE INDEX idx_car_wash_employee_id ON car_wash_tracking(employee_id);
   CREATE INDEX idx_car_wash_status ON car_wash_tracking(status);
   CREATE INDEX idx_car_wash_created_at ON car_wash_tracking(created_at);
   CREATE INDEX idx_car_wash_date ON car_wash_tracking(DATE(created_at));
   
   ALTER TABLE car_wash_tracking ENABLE ROW LEVEL SECURITY;
   
   GRANT SELECT, INSERT, UPDATE ON car_wash_tracking TO authenticated;
   GRANT ALL ON car_wash_tracking TO service_role;
*/

/* -----------------------------------------
   ADD CAR WASH RECORD
----------------------------------------- */
router.post("/add-wash", async (req, res) => {
  try {
    const { employeeId, carOwnerName, carModel, carNumber, carColor, notes } = req.body;

    if (!employeeId || !carOwnerName || !carNumber) {
      return res.status(400).json({ 
        error: "Employee ID, Car Owner Name, and Car Number are required" 
      });
    }

    // Validate car number format (Indian format or simple format)
    const carNumberRegex = /^[A-Z]{2}[A-Z0-9]{2}[A-Z]{2}[0-9]{4}$|^[0-9]{10}$/;
    if (!carNumberRegex.test(carNumber)) {
      return res.status(400).json({ 
        error: "Invalid car number format. Use Indian format (e.g., GJ01AB1234)" 
      });
    }

    const { data, error } = await supabase
      .from("car_wash_tracking")
      .insert([
        {
          employee_id: employeeId,
          car_owner_name: carOwnerName,
          car_model: carModel || null,
          car_number: carNumber.toUpperCase(),
          car_color: carColor || null,
          status: "pending",
          notes: notes || null,
        },
      ])
      .select();

    if (error) {
      console.log("Supabase Insert Error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({
      success: true,
      message: "Car wash record added",
      data: data[0],
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to add car wash record" });
  }
});

/* -----------------------------------------
   UPDATE CAR WASH STATUS
----------------------------------------- */
router.put("/update-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "washed", "cancelled"].includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status. Use 'pending', 'washed', or 'cancelled'" 
      });
    }

    const updateData = {
      status,
      ...(status === "washed" && { wash_completed_at: new Date() }),
    };

    const { data, error } = await supabase
      .from("car_wash_tracking")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Car wash record not found" });
    }

    return res.json({
      success: true,
      message: `Car wash status updated to '${status}'`,
      data: data[0],
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to update car wash status" });
  }
});

/* -----------------------------------------
   GET TODAY'S CAR WASHES (by employee)
----------------------------------------- */
router.get("/today/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from("car_wash_tracking")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const totalWashes = data.length;
    const completedWashes = data.filter((w) => w.status === "washed").length;
    const pendingWashes = data.filter((w) => w.status === "pending").length;
    const cancelledWashes = data.filter((w) => w.status === "cancelled").length;

    return res.json({
      success: true,
      date: today.toISOString().split("T")[0],
      total: totalWashes,
      completed: completedWashes,
      pending: pendingWashes,
      cancelled: cancelledWashes,
      washes: data,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to fetch today's washes" });
  }
});

/* -----------------------------------------
   GET MONTHLY CAR WASHES (by employee)
----------------------------------------- */
router.get("/monthly/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    // Get current month/year if not provided
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    // Validate month
    if (targetMonth < 1 || targetMonth > 12) {
      return res.status(400).json({ error: "Month must be between 1 and 12" });
    }

    // Get start and end of month
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(targetYear, targetMonth, 1);

    const { data, error } = await supabase
      .from("car_wash_tracking")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", monthEnd.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const totalWashes = data.length;
    const completedWashes = data.filter((w) => w.status === "washed").length;
    const pendingWashes = data.filter((w) => w.status === "pending").length;
    const cancelledWashes = data.filter((w) => w.status === "cancelled").length;

    // Group by day for daily breakdown
    const byDay = {};
    data.forEach((wash) => {
      const date = new Date(wash.created_at).toISOString().split("T")[0];
      if (!byDay[date]) {
        byDay[date] = { total: 0, completed: 0, pending: 0, cancelled: 0 };
      }
      byDay[date].total++;
      byDay[date][wash.status]++;
    });

    return res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      monthName: new Date(targetYear, targetMonth - 1).toLocaleDateString("en-US", {
        month: "long",
      }),
      total: totalWashes,
      completed: completedWashes,
      pending: pendingWashes,
      cancelled: cancelledWashes,
      byDay,
      washes: data,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to fetch monthly washes" });
  }
});

/* -----------------------------------------
   GET ALL CAR WASHES (with filters)
----------------------------------------- */
router.get("/all/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from("car_wash_tracking")
      .select("*")
      .eq("employee_id", employeeId);

    // Add status filter if provided
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({
      success: true,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      washes: data,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to fetch car washes" });
  }
});

/* -----------------------------------------
   GET CAR WASH STATISTICS (Dashboard)
----------------------------------------- */
router.get("/stats/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Get all washes for this employee
    const { data: allWashes, error } = await supabase
      .from("car_wash_tracking")
      .select("*")
      .eq("employee_id", employeeId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's stats
    const todayWashes = allWashes.filter((w) => {
      const washDate = new Date(w.created_at);
      washDate.setHours(0, 0, 0, 0);
      return washDate.getTime() === today.getTime();
    });

    const todayStats = {
      total: todayWashes.length,
      completed: todayWashes.filter((w) => w.status === "washed").length,
      pending: todayWashes.filter((w) => w.status === "pending").length,
      cancelled: todayWashes.filter((w) => w.status === "cancelled").length,
    };

    // Month's stats
    const monthWashes = allWashes.filter(
      (w) => new Date(w.created_at) >= monthStart
    );

    const monthStats = {
      total: monthWashes.length,
      completed: monthWashes.filter((w) => w.status === "washed").length,
      pending: monthWashes.filter((w) => w.status === "pending").length,
      cancelled: monthWashes.filter((w) => w.status === "cancelled").length,
    };

    // Overall stats
    const overallStats = {
      total: allWashes.length,
      completed: allWashes.filter((w) => w.status === "washed").length,
      pending: allWashes.filter((w) => w.status === "pending").length,
      cancelled: allWashes.filter((w) => w.status === "cancelled").length,
    };

    return res.json({
      success: true,
      today: todayStats,
      month: monthStats,
      overall: overallStats,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

/* -----------------------------------------
   DELETE CAR WASH RECORD
----------------------------------------- */
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("car_wash_tracking")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({
      success: true,
      message: "Car wash record deleted",
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Failed to delete car wash record" });
  }
});

/* -----------------------------------------
   FETCH CARS FROM BOOKINGS TABLE
----------------------------------------- */
router.get("/cars/from-bookings", async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    
    let query = supabase
      .from("bookings")
      .select("id, car_id, car_name, customer_id, status, created_at, location")
      .order("created_at", { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status);
    }

    // Apply pagination
    const pageLimit = limit ? parseInt(limit) : 50;
    const pageOffset = offset ? parseInt(offset) : 0;
    query = query.range(pageOffset, pageOffset + pageLimit - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }

    return res.json({
      success: true,
      message: "Cars fetched from bookings",
      total: count,
      limit: pageLimit,
      offset: pageOffset,
      cars: data
    });
  } catch (err) {
    console.error("Error fetching cars from bookings:", err);
    return res.status(500).json({ 
      success: false,
      error: "Failed to fetch cars from bookings" 
    });
  }
});

/* -----------------------------------------
   FETCH CAR DETAILS FROM BOOKINGS BY ID
----------------------------------------- */
router.get("/cars/booking/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ 
        success: false,
        error: "Booking ID is required" 
      });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (error) {
      return res.status(404).json({ 
        success: false,
        error: "Booking not found" 
      });
    }

    return res.json({
      success: true,
      message: "Car details fetched from booking",
      car: {
        id: data.id,
        car_id: data.car_id,
        car_name: data.car_name,
        customer_id: data.customer_id,
        status: data.status,
        services: data.services,
        addons: data.addons,
        amount: data.amount,
        date: data.date,
        time: data.time,
        location: data.location,
        pickup: data.pickup,
        notes: data.notes,
        created_at: data.created_at
      }
    });
  } catch (err) {
    console.error("Error fetching car from booking:", err);
    return res.status(500).json({ 
      success: false,
      error: "Failed to fetch car details from booking" 
    });
  }
});

/* -----------------------------------------
   FETCH CARS FROM BOOKINGS BY CUSTOMER ID
----------------------------------------- */
router.get("/cars/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, limit, offset } = req.query;

    if (!customerId) {
      return res.status(400).json({ 
        success: false,
        error: "Customer ID is required" 
      });
    }

    let query = supabase
      .from("bookings")
      .select("id, car_id, car_name, status, date, time, amount, location, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status);
    }

    // Apply pagination
    const pageLimit = limit ? parseInt(limit) : 50;
    const pageOffset = offset ? parseInt(offset) : 0;
    query = query.range(pageOffset, pageOffset + pageLimit - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }

    return res.json({
      success: true,
      message: "Cars fetched for customer from bookings",
      customer_id: customerId,
      total: count,
      limit: pageLimit,
      offset: pageOffset,
      cars: data
    });
  } catch (err) {
    console.error("Error fetching customer cars:", err);
    return res.status(500).json({ 
      success: false,
      error: "Failed to fetch customer cars from bookings" 
    });
  }
});

export default router;
