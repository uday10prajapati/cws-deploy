import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
    };
    getUser();
  }, []);

  // Load notifications from database
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        setLoading(true);
        // Fetch directly from Supabase
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading notifications:", error);
          setNotifications([]);
          setUnreadCount(0);
        } else {
          setNotifications(data || []);
          const unread = (data || []).filter((n) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new, ...prev]);
            if (!payload.new.read) {
              setUnreadCount((prev) => prev + 1);
            }
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? payload.new : n))
            );
            if (payload.old.read === false && payload.new.read === true) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
            if (!payload.old.read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // Add notification directly to Supabase
  const addNotification = useCallback(
    async (type, title, message, data = {}) => {
      if (!user) return;

      try {
        const { data: newNotif, error } = await supabase
          .from("notifications")
          .insert({
            user_id: user.id,
            type,
            title,
            message,
            data: data || {},
            read: false,
          })
          .select();

        if (error) {
          console.error("Failed to create notification:", error);
        } else {
          console.log("✅ Notification created:", title);
        }
      } catch (err) {
        console.error("Error adding notification:", err);
      }
    },
    [user]
  );

  // Mark as read directly in Supabase
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, []);

  // Mark all as read directly in Supabase
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [user]);

  // Delete notification directly from Supabase
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        console.error("Error deleting notification:", error);
      } else {
        const notification = notifications.find((n) => n.id === notificationId);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
