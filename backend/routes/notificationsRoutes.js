import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * GET /notifications/dashboard
 * Get dashboard notifications
 */
router.get("/dashboard", async (req, res) => {
  try {
    // Fetch today's bookings
    const today = new Date().toISOString().split("T")[0];
    const { data: todayBookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("date", today);

    // Fetch recent completed bookings
    const { data: completedBookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "Completed")
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch new users today
    const { data: newUsers } = await supabase
      .from("profiles")
      .select("*")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    // Get pending bookings
    const { data: pendingBookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "Pending")
      .limit(3);

    const notifications = [];

    // Booking notifications
    if (todayBookings && todayBookings.length > 0) {
      notifications.push({
        id: "booking-" + Date.now(),
        type: "booking",
        title: `${todayBookings.length} Bookings Today`,
        message: `Total revenue: ₹${todayBookings.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()}`,
        time: "Just now",
        icon: "📅",
        priority: "high",
      });
    }

    // New users notification
    if (newUsers && newUsers.length > 0) {
      notifications.push({
        id: "users-" + Date.now(),
        type: "user",
        title: `${newUsers.length} New Users Registered`,
        message: "Welcome new members to CarWash+",
        time: "Few minutes ago",
        icon: "👤",
        priority: "medium",
      });
    }

    // Pending bookings notification
    if (pendingBookings && pendingBookings.length > 0) {
      notifications.push({
        id: "pending-" + Date.now(),
        type: "pending",
        title: `${pendingBookings.length} Pending Bookings`,
        message: "Awaiting confirmation from employees",
        time: "Recent",
        icon: "⏳",
        priority: "medium",
      });
    }

    // Completed bookings notification
    if (completedBookings && completedBookings.length > 0) {
      const completeCount = completedBookings.length;
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
      notifications.push({
        id: "completed-" + Date.now(),
        type: "completed",
        title: `${completeCount} Bookings Completed`,
        message: `Revenue: ₹${totalRevenue.toLocaleString()}`,
        time: "Today",
        icon: "✅",
        priority: "low",
      });
    }

    return res.status(200).json({
      success: true,
      data: notifications.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
    });
  } catch (error) {
    console.error("Notifications error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /notifications/user/:user_id
 * Get user-specific notifications
 */
router.get("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    // Fetch user's bookings
    const { data: userBookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("customer_id", user_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const notifications = [];

    // Check for completed bookings that can be rated
    const completedNotRated = (userBookings || []).filter(
      (b) => b.status === "Completed" && (!b.rating || b.rating === 0)
    );

    if (completedNotRated.length > 0) {
      notifications.push({
        id: "rate-" + Date.now(),
        type: "rate",
        title: "Rate Your Service",
        message: `You have ${completedNotRated.length} service(s) to rate`,
        time: "Recent",
        icon: "⭐",
      });
    }

    // Check for upcoming bookings
    const upcomingBookings = (userBookings || []).filter(
      (b) => b.status === "Confirmed" || b.status === "In Progress"
    );

    if (upcomingBookings.length > 0) {
      notifications.push({
        id: "upcoming-" + Date.now(),
        type: "booking",
        title: "Upcoming Services",
        message: `${upcomingBookings.length} service(s) scheduled`,
        time: "Live",
        icon: "🚗",
      });
    }

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("User notifications error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /notifications/create
 * Create a new notification (for system use)
 */
router.post("/create", async (req, res) => {
  try {
    const { user_id, type, title, message, data: notifData } = req.body;

    if (!user_id || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Store notification in database if table exists
    // For now, return success
    return res.status(201).json({
      success: true,
      message: "Notification created",
      data: {
        user_id,
        type,
        title,
        message,
        data: notifData,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Create notification error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
