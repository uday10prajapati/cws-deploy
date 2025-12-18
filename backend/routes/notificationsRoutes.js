import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * GET /notifications/user/:user_id
 * Fetch all notifications for a user from database
 */
router.get("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Fetch notifications from database
    const { data, error, count } = await supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error("Fetch notifications error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch notifications",
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
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
 * GET /notifications/user/:user_id/unread
 * Get count of unread notifications
 */
router.get("/user/:user_id/unread", async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("user_id", user_id)
      .eq("read", false);

    if (error) {
      console.error("Unread count error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch unread count",
      });
    }

    return res.status(200).json({
      success: true,
      unreadCount: data?.length || 0,
    });
  } catch (error) {
    console.error("Unread count error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /notifications/create
 * Create a new notification in database
 */
router.post("/create", async (req, res) => {
  try {
    const { user_id, type, title, message, data: notifData } = req.body;

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: user_id, type, title, message",
      });
    }

    // Valid notification types
    const validTypes = ["payment", "booking", "pass", "wallet", "pickup", "delivery", "wash_status", "daily_payment", "pass_expiry"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid notification type. Must be one of: ${validTypes.join(", ")}`,
      });
    }

    // Insert notification into database
    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id,
          type,
          title,
          message,
          data: notifData || {},
          read: false,
        },
      ])
      .select();

    if (error) {
      console.error("Create notification error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to create notification",
        details: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: data?.[0] || {},
    });
  } catch (error) {
    console.error("Create notification error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * PUT /notifications/:notification_id/read
 * Mark a notification as read
 */
router.put("/:notification_id/read", async (req, res) => {
  try {
    const { notification_id } = req.params;

    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notification_id)
      .select();

    if (error) {
      console.error("Mark as read error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to mark notification as read",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: data?.[0] || {},
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * PUT /notifications/user/:user_id/read-all
 * Mark all notifications as read for a user
 */
router.put("/user/:user_id/read-all", async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user_id)
      .eq("read", false)
      .select();

    if (error) {
      console.error("Mark all as read error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to mark all notifications as read",
      });
    }

    return res.status(200).json({
      success: true,
      message: `${data?.length || 0} notifications marked as read`,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * DELETE /notifications/:notification_id
 * Delete a specific notification
 */
router.delete("/:notification_id", async (req, res) => {
  try {
    const { notification_id } = req.params;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notification_id);

    if (error) {
      console.error("Delete notification error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete notification",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * DELETE /notifications/user/:user_id
 * Delete all notifications for a user
 */
router.delete("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user_id)
      .select();

    if (error) {
      console.error("Delete all notifications error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete notifications",
      });
    }

    return res.status(200).json({
      success: true,
      message: `${data?.length || 0} notifications deleted`,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Delete all notifications error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /notifications/dashboard
 * Get admin dashboard notifications (all users)
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

    return res.status(200).json({
      success: true,
      data: notifications.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
    });
  } catch (error) {
    console.error("Dashboard notifications error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
