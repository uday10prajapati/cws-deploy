import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * GET /earnings/employee/:employee_id
 * Get all earnings data for an employee
 */
router.get("/employee/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Fetch all completed bookings for this employee
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("assigned_to", employee_id)
      .eq("status", "Completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch earnings error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch earnings",
      });
    }

    const earnings = bookings || [];

    // Calculate monthly total
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const monthlyBookings = earnings.filter(
      (b) => b.date >= monthStart && b.date <= monthEnd
    );
    const monthlyTotal = monthlyBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Calculate total earnings
    const totalEarnings = earnings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Calculate daily earnings for chart
    const dailyMap = {};
    earnings.forEach((booking) => {
      const date = booking.date || new Date().toISOString().split("T")[0];
      dailyMap[date] = (dailyMap[date] || 0) + (booking.amount || 0);
    });

    const dailyEarnings = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Last 30 days

    // Calculate earnings breakdown by service type
    const serviceBreakdown = {};
    earnings.forEach((booking) => {
      if (Array.isArray(booking.services)) {
        booking.services.forEach((service) => {
          serviceBreakdown[service] = (serviceBreakdown[service] || 0) + 1;
        });
      }
    });

    // Calculate weekly earnings
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weeklyEarnings = earnings
      .filter((e) => new Date(e.date) >= weekStart)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // Calculate average per job
    const averagePerJob = earnings.length > 0 ? Math.round(totalEarnings / earnings.length) : 0;

    return res.status(200).json({
      success: true,
      data: {
        earnings,
        statistics: {
          monthlyTotal,
          totalEarnings,
          weeklyEarnings,
          averagePerJob,
          totalJobs: earnings.length,
          monthlyJobs: monthlyBookings.length,
          serviceBreakdown,
          dailyEarnings,
        },
      },
    });
  } catch (error) {
    console.error("Earnings fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /earnings/stats/:employee_id
 * Get quick earnings statistics
 */
router.get("/stats/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Fetch completed bookings
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("amount, date")
      .eq("assigned_to", employee_id)
      .eq("status", "Completed");

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch statistics",
      });
    }

    const earnings = bookings || [];
    const totalEarnings = earnings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Calculate this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const monthlyBookings = earnings.filter(
      (b) => b.date >= monthStart && b.date <= monthEnd
    );
    const monthlyTotal = monthlyBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Calculate this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weeklyEarnings = earnings
      .filter((e) => new Date(e.date) >= weekStart)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        monthlyTotal,
        weeklyEarnings,
        totalJobs: earnings.length,
        averagePerJob: earnings.length > 0 ? Math.round(totalEarnings / earnings.length) : 0,
      },
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /earnings/daily/:employee_id
 * Get daily earnings for the last 30 days
 */
router.get("/daily/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Fetch completed bookings
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("amount, date")
      .eq("assigned_to", employee_id)
      .eq("status", "Completed")
      .order("date", { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch daily earnings",
      });
    }

    // Group by date
    const dailyMap = {};
    (bookings || []).forEach((booking) => {
      const date = booking.date || new Date().toISOString().split("T")[0];
      dailyMap[date] = (dailyMap[date] || 0) + (booking.amount || 0);
    });

    // Convert to array and get last 30 days
    const dailyEarnings = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30);

    return res.status(200).json({
      success: true,
      data: dailyEarnings,
    });
  } catch (error) {
    console.error("Daily earnings fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /earnings/breakdown/:employee_id
 * Get earnings breakdown by service type
 */
router.get("/breakdown/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Fetch completed bookings
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("services, amount")
      .eq("assigned_to", employee_id)
      .eq("status", "Completed");

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch breakdown",
      });
    }

    const earnings = bookings || [];

    // Calculate by service type
    const serviceBreakdown = {};
    const serviceAmount = {};

    earnings.forEach((booking) => {
      if (Array.isArray(booking.services)) {
        booking.services.forEach((service) => {
          serviceBreakdown[service] = (serviceBreakdown[service] || 0) + 1;
          serviceAmount[service] = (serviceAmount[service] || 0) + (booking.amount || 0);
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        byCount: serviceBreakdown,
        byAmount: serviceAmount,
      },
    });
  } catch (error) {
    console.error("Breakdown fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /earnings/transactions/:customer_id
 * Fetch all successful transactions from transactions table
 * All employees and admins can see all system transactions
 */
router.get("/transactions/:customer_id", async (req, res) => {
  try {
    // Fetch ALL successful transactions (visible to all employees/admins)
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "success")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch transactions",
      });
    }

    // Transactions fetched successfully

    // Calculate total earnings from all transactions
    const totalEarnings = (transactions || []).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    // Calculate this month's earnings
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const thisMonthTransactions = (transactions || []).filter(t => {
      const tDate = new Date(t.created_at);
      return tDate >= monthStart && tDate <= monthEnd;
    });

    const thisMonthEarnings = thisMonthTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        totalEarnings: parseFloat(totalEarnings).toFixed(2),
        thisMonthEarnings: parseFloat(thisMonthEarnings).toFixed(2),
        totalTransactions: (transactions || []).length,
        thisMonthTransactions: thisMonthTransactions.length,
        transactions: transactions || [],
        userType: "admin"  // All can see as admin level view
      }
    });
  } catch (error) {
    console.error("Transactions fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /earnings/dashboard-summary/:customer_id
 * Quick dashboard summary for earnings
 * Shows all system transactions (visible to all employees/admins)
 */
router.get("/dashboard-summary/:customer_id", async (req, res) => {
  try {
    // Fetch ALL successful transactions (visible to all employees/admins)
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", "success")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch transactions",
      });
    }

    // Dashboard transactions fetched

    // Calculate this month's earnings
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const thisMonthTransactions = (transactions || []).filter(t => {
      const tDate = new Date(t.created_at);
      return tDate >= monthStart && tDate <= monthEnd;
    });

    const thisMonthEarnings = thisMonthTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const totalEarnings = (transactions || []).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        thisMonthEarnings: parseFloat(thisMonthEarnings).toFixed(2),
        thisMonthTransactionCount: thisMonthTransactions.length,
        totalEarnings: parseFloat(totalEarnings).toFixed(2),
        userType: "admin"  // All can see as admin level view
      }
    });
  } catch (error) {
    console.error("Dashboard summary fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /earnings/record-transaction
 * Record a new transaction after successful payment
 */
router.post("/record-transaction", async (req, res) => {
  try {
    const {
      customer_id,
      booking_id,
      pass_id,
      type,
      direction,
      amount,
      gst,
      payment_method,
      gateway_order_id,
      gateway_payment_id,
      invoice_url,
      notes
    } = req.body;

    // Validate required fields
    if (!customer_id || !type || !direction || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: customer_id, type, direction, amount"
      });
    }

    const total_amount = gst ? (parseFloat(amount) + parseFloat(gst)).toFixed(2) : parseFloat(amount).toFixed(2);

    const transactionData = {
      customer_id,
      booking_id: booking_id || null,
      pass_id: pass_id || null,
      type,
      direction,
      status: "success",
      amount: parseFloat(amount),
      gst: gst ? parseFloat(gst) : null,
      total_amount: parseFloat(total_amount),
      currency: "INR",
      payment_method: payment_method || null,
      gateway_order_id: gateway_order_id || null,
      gateway_payment_id: gateway_payment_id || null,
      invoice_url: invoice_url || null,
      notes: notes || null
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert([transactionData])
      .select();

    if (error) {
      console.error("Error recording transaction:", error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      transaction: data[0],
      message: "Transaction recorded successfully"
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/**
 * POST /earnings/create-sample-transaction
 * Create sample transaction for testing (DEVELOPMENT ONLY)
 */
router.post("/create-sample-transaction", async (req, res) => {
  try {
    const { employee_id, booking_id, amount = 500 } = req.body;

    if (!employee_id || !booking_id) {
      return res.status(400).json({
        success: false,
        error: "Missing employee_id or booking_id"
      });
    }

    // Create a sample transaction linked to the booking
    const transactionData = {
      customer_id: employee_id, // For employee earnings tracking
      booking_id: booking_id,
      type: "booking",
      direction: "credit",
      status: "success",
      amount: parseFloat(amount),
      gst: parseFloat((amount * 0.18).toFixed(2)),
      total_amount: parseFloat((amount * 1.18).toFixed(2)),
      currency: "INR",
      payment_method: "upi",
      gateway_order_id: `order_${Date.now()}`,
      gateway_payment_id: `pay_${Date.now()}`,
      notes: `Sample transaction for testing`
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert([transactionData])
      .select();

    if (error) {
      console.error("Error creating sample transaction:", error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      transaction: data[0],
      message: "Sample transaction created successfully"
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
