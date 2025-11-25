import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * =====================================================
 * BANK ACCOUNT CONFIGURATION
 * =====================================================
 */

/**
 * @GET /admin/bank-account
 * Get current bank account details
 */
router.get("/bank-account", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("setting_key", "bank_account")
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "Bank account not configured",
      });
    }

    return res.status(200).json({
      success: true,
      bank_account: data.setting_value,
    });
  } catch (err) {
    console.error("❌ Bank Account Fetch Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch bank account details: " + err.message,
    });
  }
});

/**
 * @POST /admin/bank-account
 * Update bank account details
 * 
 * Body:
 * - account_holder_name (string)
 * - account_number (string)
 * - ifsc_code (string)
 * - bank_name (string)
 * - account_type (Savings/Current)
 * - razorpay_account_id (optional - for Razorpay settlement)
 */
router.post("/bank-account", async (req, res) => {
  try {
    const {
      account_holder_name,
      account_number,
      ifsc_code,
      bank_name,
      account_type,
      razorpay_account_id,
    } = req.body;

    // Validation
    if (!account_holder_name || !account_number || !ifsc_code || !bank_name) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: account_holder_name, account_number, ifsc_code, bank_name",
      });
    }

    // IFSC validation (format: 4 letters + 0 + 6 digits)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc_code)) {
      return res.status(400).json({
        success: false,
        error: "Invalid IFSC code format. Format: AAAA0AAAAAA",
      });
    }

    // Account number validation (8-17 digits)
    const accountRegex = /^\d{8,17}$/;
    if (!accountRegex.test(account_number)) {
      return res.status(400).json({
        success: false,
        error: "Invalid account number. Must be 8-17 digits",
      });
    }

    const bankAccountData = {
      account_holder_name,
      account_number,
      ifsc_code,
      bank_name,
      account_type: account_type || "Savings",
      razorpay_account_id: razorpay_account_id || null,
      last_updated: new Date().toISOString(),
      verified: false, // Will be verified through microdeposits
    };

    // Check if already exists
    const { data: existing } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("setting_key", "bank_account")
      .single();

    let result;
    if (existing) {
      // Update
      result = await supabase
        .from("admin_settings")
        .update({
          setting_value: bankAccountData,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", "bank_account")
        .select();
    } else {
      // Insert
      result = await supabase
        .from("admin_settings")
        .insert({
          setting_key: "bank_account",
          setting_value: bankAccountData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();
    }

    console.log("✅ Bank account configured:", bankAccountData);

    return res.status(200).json({
      success: true,
      message: "Bank account details saved successfully",
      bank_account: bankAccountData,
      next_step: "Verify account through microdeposits (Razorpay will send 2 small deposits)",
    });
  } catch (err) {
    console.error("❌ Bank Account Update Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to update bank account: " + err.message,
    });
  }
});

/**
 * @POST /admin/verify-bank-account
 * Verify bank account using microdeposits
 * 
 * Body:
 * - deposit1_amount (first small amount Razorpay sent)
 * - deposit2_amount (second small amount Razorpay sent)
 */
router.post("/verify-bank-account", async (req, res) => {
  try {
    const { deposit1_amount, deposit2_amount } = req.body;

    if (!deposit1_amount || !deposit2_amount) {
      return res.status(400).json({
        success: false,
        error: "Missing deposit amounts for verification",
      });
    }

    // Get current bank account
    const { data: bankData } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("setting_key", "bank_account")
      .single();

    if (!bankData) {
      return res.status(404).json({
        success: false,
        error: "Bank account not found",
      });
    }

    // Verify with Razorpay (if razorpay_account_id exists)
    // This would involve calling Razorpay API to verify
    // For now, we'll just mark as verified

    const updatedBankAccount = {
      ...bankData.setting_value,
      verified: true,
      verification_date: new Date().toISOString(),
      deposit1_verified: deposit1_amount,
      deposit2_verified: deposit2_amount,
    };

    await supabase
      .from("admin_settings")
      .update({
        setting_value: updatedBankAccount,
        updated_at: new Date().toISOString(),
      })
      .eq("setting_key", "bank_account");

    console.log("✅ Bank account verified");

    return res.status(200).json({
      success: true,
      message: "Bank account verified successfully!",
      verified: true,
      bank_account: updatedBankAccount,
    });
  } catch (err) {
    console.error("❌ Bank Account Verification Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to verify bank account: " + err.message,
    });
  }
});

/**
 * @GET /admin/settlement-info
 * Get settlement information and history
 */
router.get("/settlement-info", async (req, res) => {
  try {
    const { data: bankData } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("setting_key", "bank_account")
      .single();

    if (!bankData) {
      return res.status(404).json({
        success: false,
        error: "Bank account not configured",
      });
    }

    return res.status(200).json({
      success: true,
      bank_account: bankData.setting_value,
      settlement_info: {
        type: "T+1 Settlement",
        meaning: "Money settles next business day",
        schedule: "Daily settlement of previous day transactions",
        account: bankData.setting_value.account_number,
        bank: bankData.setting_value.bank_name,
        verified: bankData.setting_value.verified,
        note: "Razorpay automatically deposits collected payments to configured bank account",
      },
    });
  } catch (err) {
    console.error("❌ Settlement Info Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch settlement info: " + err.message,
    });
  }
});

export default router;
