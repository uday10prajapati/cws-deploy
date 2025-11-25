import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

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
   GET ALL TRANSACTIONS (ADMIN)
----------------------------------------- */
router.get("/", async (req, res) => {
  try {
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
   GET TRANSACTIONS BY CUSTOMER
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
   GET TRANSACTION BY ID
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

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      transaction: data,
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
   GET TRANSACTIONS BY STATUS
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
   GET TRANSACTIONS BY TYPE
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
