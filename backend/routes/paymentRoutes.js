import express from "express";
import razorpay from "../config/razorpay.js";
import { supabase } from "../supabase.js";
import crypto from "crypto";

const router = express.Router();

/**
 * =====================================================
 * PAYMENT GATEWAY INTEGRATION - RAZORPAY
 * =====================================================
 */

/**
 * @POST /payment/create-order
 * Create a Razorpay order for payment
 * 
 * Body:
 * - amount (in paise, e.g., 50000 for ₹500)
 * - customer_id
 * - customer_email
 * - customer_name
 * - type (wallet_topup, booking_payment, monthly_pass)
 * - notes (optional)
 */
router.post("/create-order", async (req, res) => {
  try {
    const {
      amount,
      customer_id,
      customer_email,
      customer_name,
      type,
      booking_id,
      pass_id,
      notes,
    } = req.body;

    // Validate required fields
    if (!amount || !customer_id || !customer_email || !customer_name || !type) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: amount, customer_id, customer_email, customer_name, type",
      });
    }

    // Amount must be in paise (multiply by 100)
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${customer_id}_${Date.now()}`,
      customer_notify: 1,
      notes: {
        customer_id,
        customer_email,
        customer_name,
        type,
        booking_id: booking_id || "N/A",
        pass_id: pass_id || "N/A",
        custom_notes: notes || "",
      },
    };

    console.log("📝 Creating Razorpay order:", options);

    const order = await razorpay.orders.create(options);

    console.log("✅ Razorpay order created:", order);

    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        receipt: order.receipt,
      },
      razorpay_key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Razorpay Order Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to create payment order: " + err.message,
    });
  }
});

/**
 * @POST /payment/verify
 * Verify Razorpay payment signature
 * 
 * Body:
 * - razorpay_order_id
 * - razorpay_payment_id
 * - razorpay_signature
 * - customer_id
 * - amount
 * - gst
 * - type
 * - payment_method
 */
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer_id,
      amount,
      gst,
      total_amount,
      type,
      payment_method,
      booking_id,
      pass_id,
      notes,
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing payment verification fields",
      });
    }

    // Create signature string
    const signatureData = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signatureData)
      .digest("hex");

    console.log("🔐 Verifying payment signature...");
    console.log("Expected:", expectedSignature);
    console.log("Received:", razorpay_signature);

    // Verify signature
    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Signature verification failed!");
      return res.status(400).json({
        success: false,
        error: "Payment verification failed! Invalid signature.",
      });
    }

    console.log("✅ Signature verified successfully!");

    // Fetch payment details from Razorpay to confirm status
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    console.log("📦 Payment status from Razorpay:", payment.status);

    if (payment.status !== "captured") {
      console.error("❌ Payment not captured!");
      return res.status(400).json({
        success: false,
        error: `Payment status is ${payment.status}, expected 'captured'`,
      });
    }

    // ✅ Payment verified! Now create transaction in database
    console.log("💰 Payment verified! Creating transaction in database...");

    const transactionData = {
      customer_id,
      booking_id: booking_id || null,
      pass_id: pass_id || null,
      type: String(type).trim(),
      direction: payment_method === "wallet" ? "debit" : "credit", // For wallet topup, it's credit
      status: "success",
      amount: parseFloat(amount),
      gst: parseFloat(gst) || 0,
      total_amount: parseFloat(total_amount) || parseFloat(amount),
      currency: "INR",
      payment_method: String(payment_method).trim(),
      gateway_order_id: razorpay_order_id,
      gateway_payment_id: razorpay_payment_id,
      gst_number: "18AABCT1234H1Z0",
      notes: `${notes || ""} | Payment verified via Razorpay`,
      created_at: new Date().toISOString(),
    };

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert([transactionData])
      .select();

    if (txError) {
      console.error("❌ Database Error:", txError);
      return res.status(400).json({
        success: false,
        error: `Database error: ${txError.message}`,
      });
    }

    console.log("✅ Transaction created successfully:", transaction[0].id);

    // ✅ If wallet topup, update user's wallet balance in custom table (if you have one)
    // You can add this logic here to update a wallet balance table

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully!",
      transaction: transaction[0],
      payment_details: {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: payment.amount / 100, // Convert from paise to rupees
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        captured: payment.captured,
      },
    });
  } catch (err) {
    console.error("❌ Verification Error:", err);
    return res.status(500).json({
      success: false,
      error: "Payment verification failed: " + err.message,
    });
  }
});

/**
 * @GET /payment/status/:order_id
 * Check payment status
 */
router.get("/status/:order_id", async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    // Fetch order from Razorpay
    const order = await razorpay.orders.fetch(order_id);

    console.log("📦 Order status:", order.status);

    // Get all payments for this order
    const payments = await razorpay.orders.fetchPayments(order_id);

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount / 100, // Convert to rupees
        currency: order.currency,
        status: order.status,
        receipt: order.receipt,
        created_at: new Date(order.created_at * 1000).toISOString(),
      },
      payments: payments.items.map((p) => ({
        id: p.id,
        status: p.status,
        method: p.method,
        amount: p.amount / 100,
        captured: p.captured,
        created_at: new Date(p.created_at * 1000).toISOString(),
      })),
    });
  } catch (err) {
    console.error("❌ Status Check Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to check payment status: " + err.message,
    });
  }
});

/**
 * @POST /payment/webhook
 * Razorpay webhook to handle real-time payment updates
 * 
 * This endpoint should be configured in Razorpay dashboard:
 * Settings → Webhooks → Add Webhook
 * URL: https://yourdomain.com/payment/webhook
 * Events: payment.authorized, payment.failed, payment.captured
 */
router.post("/webhook", async (req, res) => {
  try {
    const { event, payload } = req.body;

    console.log("🔔 Webhook received:", event);

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    // Verify webhook signature
    const signatureBody = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signatureBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ Webhook signature verification failed!");
      return res.status(400).json({
        success: false,
        error: "Webhook verification failed",
      });
    }

    console.log("✅ Webhook signature verified!");

    // Handle different payment events
    switch (event) {
      case "payment.captured":
        console.log("💚 Payment captured!");
        // Payment already created when verified
        break;

      case "payment.failed":
        console.log("❌ Payment failed!");
        const failedPayment = payload.payment.entity;
        // You can update transaction status here if needed
        break;

      case "payment.authorized":
        console.log("⏳ Payment authorized!");
        // Payment authorized but not captured yet
        break;

      default:
        console.log("📋 Other event:", event);
    }

    // Always return 200 to acknowledge webhook
    return res.status(200).json({
      success: true,
      message: "Webhook processed",
    });
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    // Still return 200 to prevent Razorpay from retrying
    return res.status(200).json({
      success: false,
      message: "Webhook received but error occurred",
    });
  }
});

/**
 * @POST /payment/refund
 * Initiate refund through Razorpay
 */
router.post("/refund", async (req, res) => {
  try {
    const { payment_id, amount, notes } = req.body;

    if (!payment_id) {
      return res.status(400).json({
        success: false,
        error: "Payment ID is required",
      });
    }

    const refundOptions = {
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount provided
      notes: {
        reason: notes || "Customer refund request",
      },
    };

    // Remove amount if not provided (full refund)
    if (!amount) {
      delete refundOptions.amount;
    }

    console.log("💸 Processing refund for payment:", payment_id);

    const refund = await razorpay.payments.refund(payment_id, refundOptions);

    console.log("✅ Refund processed:", refund.id);

    return res.status(200).json({
      success: true,
      refund: {
        id: refund.id,
        payment_id: refund.payment_id,
        amount: refund.amount / 100, // Convert to rupees
        status: refund.status,
        created_at: new Date(refund.created_at * 1000).toISOString(),
      },
    });
  } catch (err) {
    console.error("❌ Refund Error:", err);
    return res.status(500).json({
      success: false,
      error: "Refund processing failed: " + err.message,
    });
  }
});

export default router;
