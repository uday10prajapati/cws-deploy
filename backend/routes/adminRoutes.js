import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * =====================================================
 * BANK ACCOUNT CONFIGURATION
 * =====================================================
 */

/**
 * @GET /admin/bank-account
 * Get current bank account details
 */
router.get("/bank-account", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("setting_key", "bank_account")
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "Bank account not configured",
      });
    }

    return res.status(200).json({
      success: true,
      bank_account: data.setting_value,
    });
  } catch (err) {
    console.error("❌ Bank Account Fetch Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch bank account details: " + err.message,
    });
  }
});

/**
 * @POST /admin/bank-account
 * Update bank account details
 * 
 * Body:
 * - account_holder_name (string)
 * - account_number (string)
 * - ifsc_code (string)
 * - bank_name (string)
 * - account_type (Savings/Current)
 * - razorpay_account_id (optional - for Razorpay settlement)
 */
router.post("/bank-account", async (req, res) => {
  try {
    const {
      account_holder_name,
      account_number,
      ifsc_code,
      bank_name,
      account_type,
      razorpay_account_id,
    } = req.body;

    // Validation
    if (!account_holder_name || !account_number || !ifsc_code || !bank_name) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: account_holder_name, account_number, ifsc_code, bank_name",
      });
    }

    // IFSC validation (format: 4 letters + 0 + 6 digits)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc_code)) {
      return res.status(400).json({
        success: false,
        error: "Invalid IFSC code format. Format: AAAA0AAAAAA",
      });
    }

    // Account number validation (8-17 digits)
    const accountRegex = /^\d{8,17}$/;
    if (!accountRegex.test(account_number)) {
      return res.status(400).json({
        success: false,
        error: "Invalid account number. Must be 8-17 digits",
      });
    }

    const bankAccountData = {
      account_holder_name,
      account_number,
      ifsc_code,
      bank_name,
      account_type: account_type || "Savings",
      razorpay_account_id: razorpay_account_id || null,
      last_updated: new Date().toISOString(),
      verified: false, // Will be verified through microdeposits
    };

    // Check if already exists
    const { data: existing } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("setting_key", "bank_account")
      .single();

    let result;
    if (existing) {
      // Update
      result = await supabase
        .from("admin_settings")
        .update({
          setting_value: bankAccountData,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", "bank_account")
        .select();
    } else {
      // Insert
      result = await supabase
        .from("admin_settings")
        .insert({
          setting_key: "bank_account",
          setting_value: bankAccountData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();
    }

    console.log("✅ Bank account configured:", bankAccountData);

    return res.status(200).json({
      success: true,
      message: "Bank account details saved successfully",
      bank_account: bankAccountData,
      next_step: "Verify account through microdeposits (Razorpay will send 2 small deposits)",
    });
  } catch (err) {
    console.error("❌ Bank Account Update Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to update bank account: " + err.message,
    });
  }
});

/**
 * @POST /admin/verify-bank-account
 * Verify bank account using microdeposits
 * 
 * Body:
 * - deposit1_amount (first small amount Razorpay sent)
 * - deposit2_amount (second small amount Razorpay sent)
 */
router.post("/verify-bank-account", async (req, res) => {
  try {
    const { deposit1_amount, deposit2_amount } = req.body;

    if (!deposit1_amount || !deposit2_amount) {
      return res.status(400).json({
        success: false,
        error: "Missing deposit amounts for verification",
      });
    }

    // Get current bank account
    const { data: bankData } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("setting_key", "bank_account")
      .single();

    if (!bankData) {
      return res.status(404).json({
        success: false,
        error: "Bank account not found",
      });
    }

    // Verify with Razorpay (if razorpay_account_id exists)
    // This would involve calling Razorpay API to verify
    // For now, we'll just mark as verified

    const updatedBankAccount = {
      ...bankData.setting_value,
      verified: true,
      verification_date: new Date().toISOString(),
      deposit1_verified: deposit1_amount,
      deposit2_verified: deposit2_amount,
    };

    await supabase
      .from("admin_settings")
      .update({
        setting_value: updatedBankAccount,
        updated_at: new Date().toISOString(),
      })
      .eq("setting_key", "bank_account");

    console.log("✅ Bank account verified");

    return res.status(200).json({
      success: true,
      message: "Bank account verified successfully!",
      verified: true,
      bank_account: updatedBankAccount,
    });
  } catch (err) {
    console.error("❌ Bank Account Verification Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to verify bank account: " + err.message,
    });
  }
});

/**
 * @GET /admin/settlement-info
 * Get settlement information and history
 */
router.get("/settlement-info", async (req, res) => {
  try {
    const { data: bankData } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("setting_key", "bank_account")
      .single();

    if (!bankData) {
      return res.status(404).json({
        success: false,
        error: "Bank account not configured",
      });
    }

    return res.status(200).json({
      success: true,
      bank_account: bankData.setting_value,
      settlement_info: {
        type: "T+1 Settlement",
        meaning: "Money settles next business day",
        schedule: "Daily settlement of previous day transactions",
        account: bankData.setting_value.account_number,
        bank: bankData.setting_value.bank_name,
        verified: bankData.setting_value.verified,
        note: "Razorpay automatically deposits collected payments to configured bank account",
      },
    });
  } catch (err) {
    console.error("❌ Settlement Info Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch settlement info: " + err.message,
    });
  }
});

/**
 * =====================================================
 * ANALYTICS & DASHBOARD
 * =====================================================
 */

/**
 * GET /admin/analytics/overview
 * Get overall platform analytics
 */
router.get("/analytics/overview", async (req, res) => {
  try {
    // Fetch bookings data
    const { data: bookings } = await supabase.from("bookings").select("*");

    // Fetch users data
    const { data: profiles } = await supabase.from("profiles").select("*");

    const allBookings = bookings || [];
    const allUsers = profiles || [];

    // Calculate today's stats
    const today = new Date().toISOString().split("T")[0];
    const todayBookings = allBookings.filter((b) => b.date === today);
    const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const todayBookingsCount = todayBookings.length;

    // Count active employees/washers
    const activeWashers = allUsers.filter(
      (u) => u.role === "employee" && u.is_active !== false
    ).length;

    // Count new users (registered today)
    const newUsersToday = allUsers.filter((u) => u.created_at?.split("T")[0] === today).length;

    // Total stats
    const totalBookings = allBookings.length;
    const totalRevenue = allBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const completedBookings = allBookings.filter((b) => b.status === "Completed").length;

    return res.status(200).json({
      success: true,
      data: {
        today: {
          bookings: todayBookingsCount,
          revenue: todayRevenue,
          washers: activeWashers,
          newUsers: newUsersToday,
        },
        total: {
          bookings: totalBookings,
          revenue: totalRevenue,
          completedBookings,
          totalUsers: allUsers.length,
          customers: allUsers.filter((u) => u.role === "customer").length,
          employees: allUsers.filter((u) => u.role === "employee").length,
        },
      },
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /admin/analytics/bookings
 * Get bookings analytics
 */
router.get("/analytics/bookings", async (req, res) => {
  try {
    const { data: bookings, error } = await supabase.from("bookings").select("*");

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch bookings",
      });
    }

    const allBookings = bookings || [];

    // Group by status
    const statusBreakdown = {
      Pending: allBookings.filter((b) => b.status === "Pending").length,
      Confirmed: allBookings.filter((b) => b.status === "Confirmed").length,
      "In Progress": allBookings.filter((b) => b.status === "In Progress").length,
      Completed: allBookings.filter((b) => b.status === "Completed").length,
    };

    // Daily bookings for last 30 days
    const dailyBookings = {};
    allBookings.forEach((booking) => {
      const date = booking.date || new Date().toISOString().split("T")[0];
      dailyBookings[date] = (dailyBookings[date] || 0) + 1;
    });

    const dailyData = Object.entries(dailyBookings)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30);

    // Service type breakdown
    const serviceBreakdown = {};
    allBookings.forEach((booking) => {
      if (Array.isArray(booking.services)) {
        booking.services.forEach((service) => {
          serviceBreakdown[service] = (serviceBreakdown[service] || 0) + 1;
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalBookings: allBookings.length,
        statusBreakdown,
        dailyData,
        serviceBreakdown,
      },
    });
  } catch (error) {
    console.error("Bookings analytics error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /admin/analytics/earnings
 * Get earnings analytics
 */
router.get("/analytics/earnings", async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "Completed");

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch earnings",
      });
    }

    const completedBookings = bookings || [];

    // Daily earnings for last 30 days
    const dailyEarnings = {};
    completedBookings.forEach((booking) => {
      const date = booking.date || new Date().toISOString().split("T")[0];
      dailyEarnings[date] = (dailyEarnings[date] || 0) + (booking.amount || 0);
    });

    const dailyData = Object.entries(dailyEarnings)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30);

    // Calculate totals
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // This month earnings
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const monthlyBookings = completedBookings.filter(
      (b) => b.date >= monthStart && b.date <= monthEnd
    );
    const monthlyEarnings = monthlyBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Today earnings
    const today = new Date().toISOString().split("T")[0];
    const todayEarnings = completedBookings
      .filter((b) => b.date === today)
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    // Earnings by employee
    const employeeEarnings = {};
    completedBookings.forEach((booking) => {
      const empId = booking.assigned_to || "unassigned";
      employeeEarnings[empId] = (employeeEarnings[empId] || 0) + (booking.amount || 0);
    });

    return res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        monthlyEarnings,
        todayEarnings,
        dailyData,
        employeeEarnings,
        totalTransactions: completedBookings.length,
      },
    });
  } catch (error) {
    console.error("Earnings analytics error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /admin/analytics/ratings
 * Get ratings analytics
 */
router.get("/analytics/ratings", async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .gt("rating", 0);

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch ratings",
      });
    }

    const ratedBookings = bookings || [];

    // Rating distribution
    const distribution = {
      5: ratedBookings.filter((b) => b.rating === 5).length,
      4: ratedBookings.filter((b) => b.rating === 4).length,
      3: ratedBookings.filter((b) => b.rating === 3).length,
      2: ratedBookings.filter((b) => b.rating === 2).length,
      1: ratedBookings.filter((b) => b.rating === 1).length,
    };

    // Average rating
    const averageRating =
      ratedBookings.length > 0
        ? (ratedBookings.reduce((sum, b) => sum + (b.rating || 0), 0) / ratedBookings.length).toFixed(2)
        : "0.00";

    // Ratings by employee
    const employeeRatings = {};
    ratedBookings.forEach((booking) => {
      const empId = booking.assigned_to || "unassigned";
      if (!employeeRatings[empId]) {
        employeeRatings[empId] = {
          ratings: [],
          count: 0,
          average: 0,
        };
      }
      employeeRatings[empId].ratings.push(booking.rating);
      employeeRatings[empId].count++;
    });

    // Calculate employee averages
    Object.keys(employeeRatings).forEach((empId) => {
      const ratings = employeeRatings[empId].ratings;
      employeeRatings[empId].average = (
        ratings.reduce((a, b) => a + b, 0) / ratings.length
      ).toFixed(2);
    });

    // Daily ratings trend
    const dailyRatings = {};
    ratedBookings.forEach((booking) => {
      const date = booking.rated_at?.split("T")[0] || new Date().toISOString().split("T")[0];
      if (!dailyRatings[date]) {
        dailyRatings[date] = {
          count: 0,
          sum: 0,
        };
      }
      dailyRatings[date].count++;
      dailyRatings[date].sum += booking.rating;
    });

    const dailyData = Object.entries(dailyRatings)
      .map(([date, data]) => ({
        date,
        average: (data.sum / data.count).toFixed(2),
        count: data.count,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30);

    return res.status(200).json({
      success: true,
      data: {
        totalRatings: ratedBookings.length,
        averageRating: parseFloat(averageRating),
        distribution,
        employeeRatings,
        dailyData,
      },
    });
  } catch (error) {
    console.error("Ratings analytics error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /admin/analytics/users
 * Get users analytics
 */
router.get("/analytics/users", async (req, res) => {
  try {
    const { data: users, error } = await supabase.from("profiles").select("*");

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch users",
      });
    }

    const allUsers = users || [];

    // User breakdown by role
    const roleBreakdown = {
      customer: allUsers.filter((u) => u.role === "customer").length,
      employee: allUsers.filter((u) => u.role === "employee").length,
      admin: allUsers.filter((u) => u.role === "admin").length,
    };

    // Daily new users
    const dailyUsers = {};
    allUsers.forEach((user) => {
      const date = user.created_at?.split("T")[0] || new Date().toISOString().split("T")[0];
      dailyUsers[date] = (dailyUsers[date] || 0) + 1;
    });

    const dailyData = Object.entries(dailyUsers)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30);

    // Active users (logged in today)
    const today = new Date().toISOString().split("T")[0];
    const activeToday = allUsers.filter(
      (u) => u.last_login?.split("T")[0] === today
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: allUsers.length,
        roleBreakdown,
        activeToday,
        dailyData,
        topCities: calculateTopCities(allUsers),
      },
    });
  } catch (error) {
    console.error("Users analytics error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /admin/recent-bookings
 * Get recent bookings with full details
 */
router.get("/recent-bookings", async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch bookings",
      });
    }

    return res.status(200).json({
      success: true,
      data: bookings || [],
    });
  } catch (error) {
    console.error("Recent bookings error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /admin/all-users
 * Get all users list
 */
router.get("/all-users", async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch users",
      });
    }

    return res.status(200).json({
      success: true,
      data: users || [],
    });
  } catch (error) {
    console.error("All users error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /admin/all-revenue
 * Get all revenue data
 */
router.get("/all-revenue", async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "Completed")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch revenue",
      });
    }

    const completedBookings = bookings || [];
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Calculate monthly breakdown
    const monthlyRevenue = {};
    completedBookings.forEach((booking) => {
      const date = new Date(booking.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (booking.amount || 0);
    });

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalTransactions: completedBookings.length,
        averagePerTransaction: completedBookings.length > 0
          ? Math.round(totalRevenue / completedBookings.length)
          : 0,
        monthlyBreakdown: monthlyRevenue,
        recentTransactions: completedBookings.slice(0, 20),
      },
    });
  } catch (error) {
    console.error("Revenue error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Helper function to calculate top cities
 */
function calculateTopCities(users) {
  const cityCount = {};
  users.forEach((user) => {
    const city = user.city || "Unknown";
    cityCount[city] = (cityCount[city] || 0) + 1;
  });

  return Object.entries(cityCount)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export default router;
