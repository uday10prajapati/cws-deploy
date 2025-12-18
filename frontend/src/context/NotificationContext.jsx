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

  // Load notifications from database via API
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/notifications/user/${user.id}`);
        const result = await response.json();

        if (result.success) {
          setNotifications(result.data || []);
          const unread = (result.data || []).filter((n) => !n.read).length;
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

  // Add notification via API
  const addNotification = useCallback(
    async (type, title, message, data = {}) => {
      if (!user) return;

      try {
        const response = await fetch("http://localhost:5000/notifications/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            type,
            title,
            message,
            data,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Notification will be added via real-time subscription
          console.log("✅ Notification created:", title);
        } else {
          console.error("Failed to create notification:", result.error);
        }
      } catch (err) {
        console.error("Error adding notification:", err);
      }
    },
    [user]
  );

  // Mark as read via API
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/notifications/${notificationId}/read`,
        { method: "PUT" }
      );

      const result = await response.json();

      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, []);

  // Mark all as read via API
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:5000/notifications/user/${user.id}/read-all`,
        { method: "PUT" }
      );

      const result = await response.json();

      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [user]);

  // Delete notification via API
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/notifications/${notificationId}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (result.success) {
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
