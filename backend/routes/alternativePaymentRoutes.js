import express from "express";
import { supabase } from "../supabase.js";
import crypto from "crypto";

const router = express.Router();

/**
 * =====================================================
 * ALTERNATIVE PAYMENT GATEWAY - MULTIPLE OPTIONS
 * Supports: UPI, Bank Transfer, Net Banking, Cards
 * =====================================================
 */

/**
 * @POST /alt-payment/initiate
 * Initiate payment with multiple payment methods
 * 
 * Body:
 * - amount (in rupees)
 * - customer_id
 * - customer_email
 * - customer_name
 * - customer_phone
 * - type (wallet_topup, booking_payment, monthly_pass)
 * - payment_method (upi, bank_transfer, net_banking, card)
 * - booking_id (optional)
 * - pass_id (optional)
 */
router.post("/initiate", async (req, res) => {
  try {
    const {
      amount,
      customer_id,
      customer_email,
      customer_name,
      customer_phone,
      type,
      payment_method,
      booking_id,
      pass_id,
      notes,
    } = req.body;

    // Validate required fields
    if (!amount || !customer_id || !customer_email || !customer_name || !payment_method) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: amount, customer_id, customer_email, customer_name, payment_method",
      });
    }

    // Validate payment method
    const validMethods = ["upi", "bank_transfer", "net_banking", "card"];
    if (!validMethods.includes(payment_method.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid payment method. Allowed: ${validMethods.join(", ")}`,
      });
    }

    // Generate unique transaction ID
    const transaction_id = `TXN_${customer_id}_${Date.now()}`;

    // Create pending transaction in database
    const transactionData = {
      customer_id,
      booking_id: booking_id || null,
      pass_id: pass_id || null,
      type: String(type || "booking_payment").trim(),
      direction: "debit",
      status: "pending",
      amount: parseFloat(amount),
      gst: 0,
      total_amount: parseFloat(amount),
      currency: "INR",
      payment_method: String(payment_method).toLowerCase().trim(),
      gateway_order_id: transaction_id,
      gateway_payment_id: null,
      notes: `${notes || ""} | Initiated via alternative payment`,
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

    console.log("✅ Payment initiated:", transaction_id);

    // Return payment method specific information
    let paymentDetails = {};

    switch (payment_method.toLowerCase()) {
      case "upi":
        paymentDetails = generateUPIPayment(
          amount,
          customer_name,
          transaction_id,
          customer_email
        );
        break;

      case "bank_transfer":
        paymentDetails = generateBankTransferDetails(
          amount,
          transaction_id,
          customer_name
        );
        break;

      case "net_banking":
        paymentDetails = generateNetBankingOptions();
        break;

      case "card":
        paymentDetails = generateCardPaymentOptions(transaction_id, amount);
        break;

      default:
        paymentDetails = {};
    }

    return res.status(201).json({
      success: true,
      transaction_id,
      transaction: transaction[0],
      payment_method: payment_method.toLowerCase(),
      amount,
      paymentDetails,
      message: `Payment initiated. Instructions sent to ${customer_email}`,
    });
  } catch (err) {
    console.error("❌ Initiation Error:", err);
    return res.status(500).json({
      success: false,
      error: "Payment initiation failed: " + err.message,
    });
  }
});

/**
 * @POST /alt-payment/verify-upi
 * Verify UPI payment (manual or automated)
 * 
 * Body:
 * - transaction_id
 * - upi_ref_id (UTR from bank)
 * - payment_timestamp
 */
router.post("/verify-upi", async (req, res) => {
  try {
    const { transaction_id, upi_ref_id, payment_timestamp } = req.body;

    if (!transaction_id || !upi_ref_id) {
      return res.status(400).json({
        success: false,
        error: "Missing transaction_id or upi_ref_id",
      });
    }

    // Fetch transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("gateway_order_id", transaction_id)
      .single();

    if (fetchError || !transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    // Update transaction to success
    const { data: updated, error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "success",
        gateway_payment_id: upi_ref_id,
        notes: `${transaction.notes} | UPI verified - UTR: ${upi_ref_id}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)
      .select();

    if (updateError) {
      console.error("❌ Update Error:", updateError);
      return res.status(400).json({
        success: false,
        error: `Update failed: ${updateError.message}`,
      });
    }

    console.log("✅ UPI payment verified:", transaction_id);

    return res.status(200).json({
      success: true,
      message: "UPI payment verified successfully!",
      transaction: updated[0],
      upi_details: {
        utr: upi_ref_id,
        timestamp: payment_timestamp,
        amount: transaction.amount,
      },
    });
  } catch (err) {
    console.error("❌ Verification Error:", err);
    return res.status(500).json({
      success: false,
      error: "UPI verification failed: " + err.message,
    });
  }
});

/**
 * @POST /alt-payment/verify-bank-transfer
 * Verify bank transfer payment
 * 
 * Body:
 * - transaction_id
 * - reference_number (cheque/receipt number)
 * - transfer_date
 */
router.post("/verify-bank-transfer", async (req, res) => {
  try {
    const { transaction_id, reference_number, transfer_date } = req.body;

    if (!transaction_id || !reference_number) {
      return res.status(400).json({
        success: false,
        error: "Missing transaction_id or reference_number",
      });
    }

    // Fetch transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("gateway_order_id", transaction_id)
      .single();

    if (fetchError || !transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    // Update transaction to success
    const { data: updated, error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "success",
        gateway_payment_id: reference_number,
        notes: `${transaction.notes} | Bank transfer verified - Ref: ${reference_number} on ${transfer_date}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)
      .select();

    if (updateError) {
      console.error("❌ Update Error:", updateError);
      return res.status(400).json({
        success: false,
        error: `Update failed: ${updateError.message}`,
      });
    }

    console.log("✅ Bank transfer verified:", transaction_id);

    return res.status(200).json({
      success: true,
      message: "Bank transfer verified successfully!",
      transaction: updated[0],
      bank_details: {
        reference_number,
        transfer_date,
        amount: transaction.amount,
      },
    });
  } catch (err) {
    console.error("❌ Verification Error:", err);
    return res.status(500).json({
      success: false,
      error: "Bank transfer verification failed: " + err.message,
    });
  }
});

/**
 * @POST /alt-payment/verify-net-banking
 * Verify net banking payment
 * 
 * Body:
 * - transaction_id
 * - bank_name
 * - confirmation_number
 * - payment_timestamp
 */
router.post("/verify-net-banking", async (req, res) => {
  try {
    const { transaction_id, bank_name, confirmation_number, payment_timestamp } = req.body;

    if (!transaction_id || !bank_name || !confirmation_number) {
      return res.status(400).json({
        success: false,
        error: "Missing transaction_id, bank_name, or confirmation_number",
      });
    }

    // Fetch transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("gateway_order_id", transaction_id)
      .single();

    if (fetchError || !transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    // Update transaction to success
    const { data: updated, error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "success",
        gateway_payment_id: confirmation_number,
        notes: `${transaction.notes} | Net Banking verified via ${bank_name} - Conf: ${confirmation_number}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)
      .select();

    if (updateError) {
      console.error("❌ Update Error:", updateError);
      return res.status(400).json({
        success: false,
        error: `Update failed: ${updateError.message}`,
      });
    }

    console.log("✅ Net banking payment verified:", transaction_id);

    return res.status(200).json({
      success: true,
      message: "Net banking payment verified successfully!",
      transaction: updated[0],
      netbanking_details: {
        bank: bank_name,
        confirmation_number,
        timestamp: payment_timestamp,
        amount: transaction.amount,
      },
    });
  } catch (err) {
    console.error("❌ Verification Error:", err);
    return res.status(500).json({
      success: false,
      error: "Net banking verification failed: " + err.message,
    });
  }
});

/**
 * @POST /alt-payment/verify-card
 * Verify card payment
 * 
 * Body:
 * - transaction_id
 * - card_last4
 * - card_network (Visa, Mastercard, Amex)
 * - authorization_code
 */
router.post("/verify-card", async (req, res) => {
  try {
    const { transaction_id, card_last4, card_network, authorization_code } = req.body;

    if (!transaction_id || !card_last4 || !card_network || !authorization_code) {
      return res.status(400).json({
        success: false,
        error: "Missing required card details",
      });
    }

    // Fetch transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("gateway_order_id", transaction_id)
      .single();

    if (fetchError || !transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    // Update transaction to success
    const { data: updated, error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "success",
        gateway_payment_id: authorization_code,
        notes: `${transaction.notes} | Card payment verified - ${card_network} ****${card_last4} - Auth: ${authorization_code}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)
      .select();

    if (updateError) {
      console.error("❌ Update Error:", updateError);
      return res.status(400).json({
        success: false,
        error: `Update failed: ${updateError.message}`,
      });
    }

    console.log("✅ Card payment verified:", transaction_id);

    return res.status(200).json({
      success: true,
      message: "Card payment verified successfully!",
      transaction: updated[0],
      card_details: {
        network: card_network,
        last4: card_last4,
        authorization_code,
        amount: transaction.amount,
      },
    });
  } catch (err) {
    console.error("❌ Verification Error:", err);
    return res.status(500).json({
      success: false,
      error: "Card verification failed: " + err.message,
    });
  }
});

/**
 * @GET /alt-payment/status/:transaction_id
 * Check payment status
 */
router.get("/status/:transaction_id", async (req, res) => {
  try {
    const { transaction_id } = req.params;

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        error: "Transaction ID is required",
      });
    }

    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("gateway_order_id", transaction_id)
      .single();

    if (error || !transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      transaction,
      status: transaction.status,
      payment_method: transaction.payment_method,
      amount: transaction.amount,
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
 * @GET /alt-payment/methods
 * Get all available payment methods with details
 */
router.get("/methods", async (req, res) => {
  try {
    const methods = {
      upi: {
        name: "UPI (Instant)",
        icon: "📱",
        description: "Google Pay, PhonePe, BHIM, PayTM",
        pros: ["Instant", "No fees", "Direct to account"],
        cons: ["Manual verification sometimes"],
        fees: "0%",
        settlement: "Instant",
        enabled: true,
      },
      bank_transfer: {
        name: "Bank Transfer",
        icon: "🏦",
        description: "Direct bank account transfer",
        pros: ["No fees", "Full control", "Safe"],
        cons: ["Manual verification", "Slower"],
        fees: "0%",
        settlement: "1-2 business days",
        enabled: true,
      },
      net_banking: {
        name: "Net Banking",
        icon: "💻",
        description: "HDFC, ICICI, Axis, SBI, Yes Bank",
        pros: ["Secure", "Direct from bank", "Confirmation"],
        cons: ["Need bank login", "Slightly slower"],
        fees: "1-2%",
        settlement: "T+1 business day",
        enabled: true,
      },
      card: {
        name: "Debit/Credit Card",
        icon: "💳",
        description: "Visa, Mastercard, Amex",
        pros: ["Convenient", "Rewards points possible"],
        cons: ["2% processing fee", "Manual entry"],
        fees: "2%",
        settlement: "T+2 business days",
        enabled: true,
      },
    };

    return res.status(200).json({
      success: true,
      payment_methods: methods,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch payment methods: " + err.message,
    });
  }
});

/* =====================================================
   HELPER FUNCTIONS
===================================================== */

function generateUPIPayment(amount, customerName, transactionId, email) {
  // Generate UPI string for QR code
  // Format: upi://pay?pa=UPIID&pn=NAME&am=AMOUNT&tn=DESC&tr=REF
  
  // Note: Replace with your actual UPI ID
  const upiId = process.env.UPI_ID || "admin@bankname";
  
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(customerName)}&am=${amount}&tn=Car%20Wash%20Payment&tr=${transactionId}`;
  
  return {
    upi_id: upiId,
    upi_link: upiString,
    qr_instruction: "Scan QR code with any UPI app or use the link above",
    reference_id: transactionId,
    amount,
    note: `Payment for car wash service. Reference: ${transactionId}. Confirmation will be sent to ${email}`,
    apps: ["Google Pay", "PhonePe", "BHIM", "PayTM", "WhatsApp Pay"],
  };
}

function generateBankTransferDetails(amount, transactionId, customerName) {
  return {
    bank_name: process.env.BANK_NAME || "Your Bank Name",
    account_holder: process.env.BANK_ACCOUNT_HOLDER || "Car Wash Service",
    account_number: process.env.BANK_ACCOUNT_NUMBER || "XXXX XXXX XXXX 1234",
    ifsc_code: process.env.BANK_IFSC_CODE || "BANK0001234",
    amount,
    reference_number: transactionId,
    description: `Payment for car wash service. Reference: ${transactionId}`,
    instructions: [
      "Transfer the exact amount using your bank's mobile app or branch",
      `Use reference number: ${transactionId} in the description`,
      "Confirmation will be sent once payment is received",
      "Do not add any extra amount",
    ],
    note: "Settlement to account within 1-2 business days after confirmation",
  };
}

function generateNetBankingOptions() {
  return {
    supported_banks: [
      {
        name: "HDFC Bank",
        link: "https://netbanking.hdfcbank.com",
        code: "HDFC0000001",
      },
      {
        name: "ICICI Bank",
        link: "https://infinity.icicibank.com",
        code: "ICIC0000001",
      },
      {
        name: "Axis Bank",
        link: "https://www.axisbank.co.in",
        code: "UTIB0000001",
      },
      {
        name: "SBI",
        link: "https://www.onlinesbi.com",
        code: "SBIN0000001",
      },
      {
        name: "YES Bank",
        link: "https://netbanking.yesbank.in",
        code: "YESB0000001",
      },
    ],
    instruction:
      "Log in to your bank's net banking portal and transfer amount to our account",
    processing_fee: "1-2% of amount",
    settlement: "T+1 business day",
  };
}

function generateCardPaymentOptions(transactionId, amount) {
  return {
    supported_cards: ["Visa", "Mastercard", "American Express"],
    amount,
    transaction_id: transactionId,
    instructions: [
      "Enter your card details (16-digit number, expiry, CVV)",
      "Complete OTP verification from your bank",
      "Payment will be processed securely",
    ],
    processing_fee: "2% + ₹5 (Approximate)",
    settlement: "T+2 business days",
    security: "3D Secure (OTP verified)",
  };
}

export default router;
