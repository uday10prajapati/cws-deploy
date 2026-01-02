import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * =====================================================
 * CUSTOMER ACCOUNT STATUS MANAGEMENT
 * =====================================================
 */

/**
 * @GET /account-status/customers
 * Get all customers with their account status
 */
router.get("/customers", async (req, res) => {
  try {
    const { status, search, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from("profiles")
      .select(
        `
        id,
        name,
        email,
        phone,
        role,
        account_status,
        created_at
      `,
        { count: "exact" }
      )
      .eq("role", "customer")
      .order("created_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Filter by status if provided
    if (status) {
      query = query.eq("account_status", status);
    }

    // Search by name or email
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: customers, error, count } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      customers: customers || [],
    });
  } catch (err) {
    console.error("❌ Get Customers Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch customers: " + err.message,
    });
  }
});

/**
 * @GET /account-status/customer/:customerId
 * Get specific customer account status details
 */
router.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data: customer, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        name,
        email,
        phone,
        role,
        account_status,
        created_at
      `
      )
      .eq("id", customerId)
      .eq("role", "customer")
      .maybeSingle();

    if (error) throw error;

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Get customer's activity (bookings count)
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (bookingsError) throw bookingsError;

    const totalBookings = bookingsData?.length || 0;
    const completedBookings = (bookingsData || []).filter(
      (b) => b.status === "completed"
    ).length;
    const lastBookingDate =
      bookingsData && bookingsData.length > 0
        ? bookingsData[0].created_at
        : null;

    return res.status(200).json({
      success: true,
      customer: {
        ...customer,
        activity: {
          total_bookings: totalBookings,
          completed_bookings: completedBookings,
          last_booking_date: lastBookingDate,
        },
      },
    });
  } catch (err) {
    console.error("❌ Get Customer Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch customer: " + err.message,
    });
  }
});

/**
 * @PUT /account-status/customer/:customerId/request-deactivate
 * Customer requests to deactivate their own account
 * Sets status to 'deactivate_requested'
 */
router.put("/customer/:customerId/request-deactivate", async (req, res) => {
  try {
    const { customerId } = req.params;

    // Update to deactivate_requested (waiting for admin approval)
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        account_status: "deactivate_requested",
      })
      .eq("id", customerId)
      .eq("role", "customer")
      .select();

    if (error) throw error;

    if (!updated || updated.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Deactivation request submitted. Waiting for admin approval.",
      customer: updated[0],
    });
  } catch (err) {
    console.error("❌ Request Deactivate Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to request deactivation: " + err.message,
    });
  }
});

/**
 * @PUT /account-status/customer/:customerId/cancel-deactivate
 * Customer cancels their deactivation request
 */
router.put("/customer/:customerId/cancel-deactivate", async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        account_status: "active",
      })
      .eq("id", customerId)
      .eq("role", "customer")
      .select();

    if (error) throw error;

    if (!updated || updated.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Deactivation request cancelled.",
      customer: updated[0],
    });
  } catch (err) {
    console.error("❌ Cancel Deactivate Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to cancel deactivation: " + err.message,
    });
  }
});

/**
 * @PUT /account-status/admin/activate/:customerId
 * Admin activates a customer account
 */
router.put("/admin/activate/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        account_status: "active",
      })
      .eq("id", customerId)
      .eq("role", "customer")
      .select();

    if (error) throw error;

    if (!updated || updated.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Customer ${updated[0].name} has been activated.`,
      customer: updated[0],
    });
  } catch (err) {
    console.error("❌ Activate Customer Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to activate customer: " + err.message,
    });
  }
});

/**
 * @PUT /account-status/admin/deactivate/:customerId
 * Admin deactivates a customer account
 */
router.put("/admin/deactivate/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { reason } = req.body;

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        account_status: "inactive",
      })
      .eq("id", customerId)
      .eq("role", "customer")
      .select();

    if (error) throw error;

    if (!updated || updated.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Customer ${updated[0].name} has been deactivated.`,
      customer: updated[0],
      reason: reason || null,
    });
  } catch (err) {
    console.error("❌ Deactivate Customer Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to deactivate customer: " + err.message,
    });
  }
});

/**
 * @PUT /account-status/admin/approve-deactivate/:customerId
 * Admin approves a customer's deactivation request
 */
router.put("/admin/approve-deactivate/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        account_status: "inactive",
      })
      .eq("id", customerId)
      .eq("role", "customer")
      .select();

    if (error) throw error;

    if (!updated || updated.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Customer ${updated[0].name}'s deactivation request has been approved.`,
      customer: updated[0],
    });
  } catch (err) {
    console.error("❌ Approve Deactivate Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to approve deactivation: " + err.message,
    });
  }
});

/**
 * @PUT /account-status/admin/reject-deactivate/:customerId
 * Admin rejects a customer's deactivation request
 */
router.put("/admin/reject-deactivate/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { reason } = req.body;

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        account_status: "active",
      })
      .eq("id", customerId)
      .eq("role", "customer")
      .select();

    if (error) throw error;

    if (!updated || updated.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Customer ${updated[0].name}'s deactivation request has been rejected.`,
      customer: updated[0],
      reason: reason || null,
    });
  } catch (err) {
    console.error("❌ Reject Deactivate Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to reject deactivation: " + err.message,
    });
  }
});

/**
 * @GET /account-status/pending-requests
 * Get all pending deactivation requests
 */
router.get("/pending-requests", async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const { data: requests, error, count } = await supabase
      .from("profiles")
      .select(
        `
        id,
        name,
        email,
        phone,
        account_status,
        created_at
      `,
        { count: "exact" }
      )
      .eq("role", "customer")
      .eq("account_status", "deactivate_requested")
      .order("created_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pending_requests: requests || [],
    });
  } catch (err) {
    console.error("❌ Get Pending Requests Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch pending requests: " + err.message,
    });
  }
});

/**
 * @GET /account-status/summary
 * Get account status summary (active, inactive, pending)
 */
router.get("/summary", async (req, res) => {
  try {
    // Get all customer statuses
    const { data: allCustomers, error } = await supabase
      .from("profiles")
      .select("id, account_status")
      .eq("role", "customer");

    if (error) throw error;

    const customers = allCustomers || [];
    const active = customers.filter((c) => c.account_status === "active").length;
    const inactive = customers.filter(
      (c) => c.account_status === "inactive"
    ).length;
    const pending = customers.filter(
      (c) => c.account_status === "deactivate_requested"
    ).length;
    const total = customers.length;

    return res.status(200).json({
      success: true,
      summary: {
        total_customers: total,
        active: active,
        inactive: inactive,
        pending_deactivation: pending,
        active_percentage:
          total > 0 ? ((active / total) * 100).toFixed(2) + "%" : "0%",
      },
    });
  } catch (err) {
    console.error("❌ Get Summary Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch summary: " + err.message,
    });
  }
});

/**
 * @PUT /account-status/customer/:customerId/request-reactivate
 * Customer requests reactivation of their inactive account
 */
router.put("/customer/:customerId/request-reactivate", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { reason } = req.body;

    // Get current account status
    const { data: customer, error: fetchError } = await supabase
      .from("profiles")
      .select("account_status")
      .eq("id", customerId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // Can only request reactivation if inactive
    if (customer.account_status !== "inactive") {
      return res.status(400).json({
        success: false,
        error: "Account must be inactive to request reactivation",
      });
    }

    // Update account status to reactivate_requested
    const { data, error } = await supabase
      .from("profiles")
      .update({
        account_status: "reactivate_requested",
      })
      .eq("id", customerId)
      .select();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Reactivation request submitted successfully",
      data: data[0],
    });
  } catch (err) {
    console.error("❌ Request Reactivation Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to request reactivation: " + err.message,
    });
  }
});

export default router;
