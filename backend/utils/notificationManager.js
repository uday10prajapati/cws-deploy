import { supabase } from "../supabase.js";

/**
 * Create a notification for a user
 * @param {string} userId - User ID
 * @param {string} type - Notification type (payment, booking, pass, wallet, pickup, delivery)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data as JSON
 * @returns {Promise<object>} - Created notification or error
 */
export const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Notification created for user ${userId}: ${title}`);
    return { success: true, data: notification };
  } catch (err) {
    console.error("Error creating notification:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Create multiple notifications for multiple users
 * @param {array} notifications - Array of {userId, type, title, message, data}
 * @returns {Promise<object>} - Batch result
 */
export const createBulkNotifications = async (notifications) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert(
        notifications.map(notif => ({
          user_id: notif.userId,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          data: notif.data || {},
          read: false,
        }))
      )
      .select();

    if (error) {
      console.error("Error creating bulk notifications:", error);
      return { success: false, error: error.message, created: 0 };
    }

    console.log(`✅ Created ${data?.length || 0} notifications`);
    return { success: true, created: data?.length || 0, data };
  } catch (err) {
    console.error("Error creating bulk notifications:", err);
    return { success: false, error: err.message, created: 0 };
  }
};

/**
 * Notify user about payment
 */
export const notifyPayment = async (userId, amount, status, orderId) => {
  const title = status === "success" ? "Payment Successful" : "Payment Failed";
  const message = status === "success" 
    ? `₹${amount} payment received. Order #${orderId}`
    : `Payment of ₹${amount} failed. Please retry.`;

  return createNotification(userId, "payment", title, message, {
    amount,
    status,
    orderId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Notify user about booking
 */
export const notifyBooking = async (userId, bookingId, status, location) => {
  const statusText = {
    pending: "Booking Confirmed",
    accepted: "Booking Accepted by Washer",
    completed: "Booking Completed",
    cancelled: "Booking Cancelled",
  };

  const messageText = {
    pending: `Your booking #${bookingId} is confirmed. A washer will be assigned soon.`,
    accepted: `Your washer is on the way to ${location}`,
    completed: `Your car wash at ${location} is complete!`,
    cancelled: `Your booking #${bookingId} has been cancelled.`,
  };

  return createNotification(userId, "booking", statusText[status] || "Booking Update", messageText[status] || "Status updated", {
    bookingId,
    status,
    location,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Notify user about monthly pass
 */
export const notifyPass = async (userId, passType, message, data = {}) => {
  return createNotification(userId, "pass", `${passType} Pass`, message, {
    passType,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Notify user about wallet
 */
export const notifyWallet = async (userId, amount, type, message) => {
  const title = type === "credit" ? "Wallet Credited" : "Wallet Debited";
  return createNotification(userId, "wallet", title, message, {
    amount,
    type,
    balance: amount,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Notify user about pickup/delivery
 */
export const notifyDelivery = async (userId, type, title, message, data = {}) => {
  return createNotification(userId, type === "pickup" ? "pickup" : "delivery", title, message, {
    type,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get user unread count
 */
export const getUnreadCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error("Error getting unread count:", err);
    return 0;
  }
};

/**
 * Get recent notifications for user
 */
export const getRecentNotifications = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error getting recent notifications:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error getting recent notifications:", err);
    return [];
  }
};

/**
 * Delete old notifications (older than X days)
 */
export const deleteOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .lt("created_at", cutoffDate.toISOString())
      .select();

    if (error) {
      console.error("Error deleting old notifications:", error);
      return { success: false, deleted: 0 };
    }

    console.log(`✅ Deleted ${data?.length || 0} old notifications`);
    return { success: true, deleted: data?.length || 0 };
  } catch (err) {
    console.error("Error deleting old notifications:", err);
    return { success: false, deleted: 0 };
  }
};

/**
 * Notify all admins about an event
 * @param {string} type - Notification type (user_registered, document_verification, etc)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data as JSON
 * @returns {Promise<object>} - Batch result
 */
export const notifyAdmins = async (type, title, message, data = {}) => {
  try {
    // Fetch all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admin users:", adminError);
      return { success: false, error: adminError.message, notified: 0 };
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log("⚠️ No admin users found to notify");
      return { success: false, error: "No admin users found", notified: 0 };
    }

    // Create notifications for all admins
    const notifications = adminUsers.map((admin) => ({
      user_id: admin.id,
      type,
      title,
      message,
      data: data || {},
      read: false,
    }));

    const { data: createdNotifications, error } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (error) {
      console.error("Error creating admin notifications:", error);
      return { success: false, error: error.message, notified: 0 };
    }

    console.log(`✅ Notified ${createdNotifications?.length || 0} admin(s): ${title}`);
    return { success: true, notified: createdNotifications?.length || 0, data: createdNotifications };
  } catch (err) {
    console.error("Error in notifyAdmins:", err);
    return { success: false, error: err.message, notified: 0 };
  }
};

/**
 * Notify all admins about new user registration
 * @param {object} userData - User data {id, name, email, phone, role, employee_type}
 * @returns {Promise<object>} - Notification result
 */
export const notifyAdminNewUser = async (userData) => {
  const { id, name, email, phone, role, employee_type } = userData;
  const roleText = role === "employee" ? `Employee (${employee_type})` : "Customer";
  
  // Use "booking" type as a workaround since "user_registered" may not be allowed
  // This is a general notification type that most systems support
  return notifyAdmins(
    "booking",
    "New User Registration",
    `New ${roleText} registered: ${name} (${email})`,
    {
      userId: id,
      userName: name,
      userEmail: email,
      userPhone: phone,
      userRole: role,
      employeeType: employee_type,
      timestamp: new Date().toISOString(),
    }
  );
};

/**
 * Notify all admins about document submission for verification
 * @param {string} washerId - Washer user ID
 * @param {string} washerName - Washer name
 * @param {string} documentType - Type of document (aadhar, pancard, etc)
 * @param {string} documentUrl - URL to the document
 * @returns {Promise<object>} - Notification result
 */
export const notifyAdminDocumentSubmission = async (washerId, washerName, documentType, documentUrl) => {
  return notifyAdmins(
    "document_verification",
    "Document Submitted for Verification",
    `${washerName} submitted ${documentType} for verification`,
    {
      washerId,
      washerName,
      documentType,
      documentUrl,
      timestamp: new Date().toISOString(),
    }
  );
};

export default {
  createNotification,
  createBulkNotifications,
  notifyPayment,
  notifyBooking,
  notifyPass,
  notifyWallet,
  notifyDelivery,
  getUnreadCount,
  getRecentNotifications,
  deleteOldNotifications,
  notifyAdmins,
  notifyAdminNewUser,
  notifyAdminDocumentSubmission,
};
