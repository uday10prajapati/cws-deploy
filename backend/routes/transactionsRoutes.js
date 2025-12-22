import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/* -----------------------------------------
   HELPER: Get user role from auth
----------------------------------------- */
const getUserRole = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }
    return data.role;
  } catch (err) {
    console.error("Error fetching user role:", err);
    return null;
  }
};

/* -----------------------------------------
   HELPER: Extract user ID from request
----------------------------------------- */
const getUserFromRequest = async (req) => {
  try {
    // Priority 1: Get from headers (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          console.log("✅ User extracted from Bearer token:", user.id);
          return user.id;
        }
      } catch (err) {
        console.log("⚠️ Bearer token validation failed:", err.message);
      }
    }

    // Priority 2: Get from request body
    if (req.body?.user_id) {
      return req.body.user_id;
    }

    // Priority 3: Get from query parameters
    if (req.query?.user_id) {
      return req.query.user_id;
    }

    return null;
  } catch (err) {
    console.error("Error extracting user from request:", err);
    return null;
  }
};

/* -----------------------------------------
   CREATE TRANSACTION
----------------------------------------- */
router.post("/create", async (req, res) => {
  try {
    const {
      customer_id,
      booking_id,
      pass_id,
      type,
      direction,
      status,
      amount,
      gst,
      total_amount,
      currency,
      payment_method,
      gateway_order_id,
      gateway_payment_id,
      invoice_url,
      gst_number,
      notes,
    } = req.body;

    // Validate required fields
    if (!customer_id || !type || !direction || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields. Please provide: customer_id, type, direction, amount",
      });
    }

    const transactionData = {
      customer_id,
      booking_id: booking_id || null,
      pass_id: pass_id || null,
      type: String(type).trim(),
      direction: String(direction).trim(),
      status: String(status || "pending").trim(),
      amount: parseFloat(amount),
      gst: parseFloat(gst) || 0,
      total_amount: parseFloat(total_amount) || parseFloat(amount),
      currency: String(currency || "INR").trim(),
      payment_method: String(payment_method || "other").trim(),
      gateway_order_id: gateway_order_id || null,
      gateway_payment_id: gateway_payment_id || null,
      invoice_url: invoice_url || null,
      gst_number: gst_number || null,
      notes: String(notes || "").trim(),
      created_at: new Date().toISOString(),
    };

    console.log("📝 Creating transaction:", transactionData);

    const { data, error } = await supabase
      .from("transactions")
      .insert([transactionData])
      .select();

    if (error) {
      console.error("❌ Supabase Error:", error);
      return res.status(400).json({
        success: false,
        error: `Database error: ${error.message}`,
        details: error,
      });
    }

    console.log("✅ Transaction created successfully:", data);
    return res.status(201).json({
      success: true,
      transaction: data[0],
      message: "Transaction created successfully",
    });
  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
      details: err.toString(),
    });
  }
});

/* -----------------------------------------
   GET ALL TRANSACTIONS (ADMIN ONLY)
----------------------------------------- */
router.get("/", async (req, res) => {
  try {
    // Extract user ID from request
    const userId = await getUserFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Please provide a valid token or user_id.",
      });
    }

    // Get user's role
    const userRole = await getUserRole(userId);

    // Only admins can view all transactions
    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Only administrators can view all transactions.",
        userRole: userRole,
      });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "All transactions retrieved (Admin view)",
      total: data?.length || 0,
      transactions: data || [],
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

/* -----------------------------------------
   GET TRANSACTIONS BY CUSTOMER (Customer or Admin only)
----------------------------------------- */
router.get("/customer/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required",
      });
    }

    // Extract user ID from request
    const userId = await getUserFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Please provide a valid token or user_id.",
      });
    }

    // Get user's role
    const userRole = await getUserRole(userId);

    // Check access permission:
    // 1. Customer can only view their own transactions
    // 2. Admin can view any customer's transactions
    // 3. Employee cannot view any customer transactions
    if (userRole === "employee") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Employees cannot view customer transaction receipts.",
        userRole: userRole,
      });
    }

    if (userRole === "customer" && userId !== customer_id) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only view your own transaction receipts.",
        userRole: userRole,
        requestedCustomerId: customer_id,
        yourId: userId,
      });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("customer_id", customer_id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: userRole === "admin" ? "Customer transactions retrieved (Admin view)" : "Your transactions retrieved",
      customer_id,
      total: data?.length || 0,
      transactions: data || [],
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

/* -----------------------------------------
   GET TRANSACTION BY ID (Invoice/Receipt - Access Control)
----------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Transaction ID is required",
      });
    }

    // First fetch the transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction/Receipt not found",
      });
    }

    // Extract user ID from request
    const userId = await getUserFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required to view receipts.",
      });
    }

    // Get user's role
    const userRole = await getUserRole(userId);

    // Access control logic:
    // 1. Customer can only view their own receipt/invoice
    // 2. Admin can view any receipt/invoice
    // 3. Employee CANNOT view any receipt/invoice
    if (userRole === "employee") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Employees cannot view customer receipts or invoices.",
        userRole: "employee",
        transactionId: id,
      });
    }

    if (userRole === "customer" && userId !== transaction.customer_id) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only view your own receipt.",
        userRole: "customer",
        yourId: userId,
        receiptBelongsTo: transaction.customer_id,
      });
    }

    return res.status(200).json({
      success: true,
      message: userRole === "admin" ? "Receipt retrieved (Admin view)" : "Your receipt",
      userRole: userRole,
      transaction: {
        id: transaction.id,
        customer_id: transaction.customer_id,
        booking_id: transaction.booking_id,
        pass_id: transaction.pass_id,
        type: transaction.type,
        direction: transaction.direction,
        status: transaction.status,
        amount: transaction.amount,
        gst: transaction.gst,
        total_amount: transaction.total_amount,
        currency: transaction.currency,
        payment_method: transaction.payment_method,
        gateway_order_id: transaction.gateway_order_id,
        gateway_payment_id: transaction.gateway_payment_id,
        invoice_url: transaction.invoice_url,
        gst_number: transaction.gst_number,
        notes: transaction.notes,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
      },
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

/* -----------------------------------------
   GET TRANSACTIONS BY STATUS (Admin only)
----------------------------------------- */
router.get("/status/:status", async (req, res) => {
  try {
    const { status } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    // Extract user ID from request
    const userId = await getUserFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    // Get user's role
    const userRole = await getUserRole(userId);

    // Only admins can filter by status across all transactions
    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Only administrators can filter transactions by status.",
        userRole: userRole,
      });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transactions filtered by status (Admin view)",
      status,
      total: data?.length || 0,
      transactions: data || [],
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

/* -----------------------------------------
   GET TRANSACTIONS BY TYPE (Admin only)
----------------------------------------- */
router.get("/type/:type", async (req, res) => {
  try {
    const { type } = req.params;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: "Type is required",
      });
    }

    // Extract user ID from request
    const userId = await getUserFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    // Get user's role
    const userRole = await getUserRole(userId);

    // Only admins can filter by type across all transactions
    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Only administrators can filter transactions by type.",
        userRole: userRole,
      });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transactions filtered by type (Admin view)",
      type,
      total: data?.length || 0,
      transactions: data || [],
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

/* -----------------------------------------
   GET TRANSACTION SUMMARY (For Dashboard)
----------------------------------------- */
router.get("/summary/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required",
      });
    }

    // Get all transactions for the customer
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("customer_id", customer_id);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Calculate summary
    const summary = {
      total_transactions: transactions.length,
      total_spent: 0,
      total_refunded: 0,
      successful_transactions: 0,
      failed_transactions: 0,
      by_type: {},
      by_payment_method: {},
    };

    transactions.forEach((tx) => {
      // Total spent
      if (tx.direction === "debit" && tx.status === "success") {
        summary.total_spent += tx.total_amount || tx.amount;
      }

      // Total refunded
      if (tx.type === "refund" && tx.status === "success") {
        summary.total_refunded += tx.amount;
      }

      // By status
      if (tx.status === "success") {
        summary.successful_transactions++;
      } else if (tx.status === "failed") {
        summary.failed_transactions++;
      }

      // By type
      if (!summary.by_type[tx.type]) {
        summary.by_type[tx.type] = 0;
      }
      summary.by_type[tx.type]++;

      // By payment method
      if (!summary.by_payment_method[tx.payment_method]) {
        summary.by_payment_method[tx.payment_method] = 0;
      }
      summary.by_payment_method[tx.payment_method]++;
    });

    return res.status(200).json({
      success: true,
      summary,
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

/* -----------------------------------------
   UPDATE TRANSACTION STATUS
----------------------------------------- */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, gateway_payment_id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Transaction ID is required",
      });
    }

    const updateData = {};
    if (status) updateData.status = String(status).trim();
    if (notes !== undefined) updateData.notes = String(notes || "").trim();
    if (gateway_payment_id) updateData.gateway_payment_id = gateway_payment_id;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      transaction: data[0],
      message: "Transaction updated successfully",
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

/* -----------------------------------------
   PROCESS REFUND
----------------------------------------- */
router.post("/refund/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, refund_amount } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Transaction ID is required",
      });
    }

    // Get the original transaction
    const { data: originalTx, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    // Update original transaction status to refunded
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: updateError.message,
      });
    }

    // Create a new refund transaction
    const refundTx = {
      customer_id: originalTx.customer_id,
      booking_id: originalTx.booking_id,
      pass_id: originalTx.pass_id,
      type: "refund",
      direction: "credit",
      status: "success",
      amount: refund_amount || originalTx.amount,
      gst: originalTx.gst || 0,
      total_amount: (refund_amount || originalTx.amount) + (originalTx.gst || 0),
      currency: originalTx.currency,
      payment_method: originalTx.payment_method,
      gst_number: originalTx.gst_number,
      notes: `Refund for transaction ${id}. Reason: ${reason || "No reason provided"}`,
      created_at: new Date().toISOString(),
    };

    const { data: newRefund, error: refundError } = await supabase
      .from("transactions")
      .insert([refundTx])
      .select();

    if (refundError) {
      return res.status(400).json({
        success: false,
        error: refundError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Refund processed successfully",
      refund_transaction: newRefund[0],
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

/* -----------------------------------------
   DELETE TRANSACTION
----------------------------------------- */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Transaction ID is required",
      });
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

export default router;
