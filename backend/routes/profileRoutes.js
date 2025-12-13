import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

// GET user profile with address
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      profile: data,
    });
  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// UPDATE user address
router.put("/address/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { village, address, city, state, postal_code, country, address_type } = req.body;

    console.log("📝 Updating address for user:", userId);
    console.log("📝 Village data:", village);

    const { data, error } = await supabase
      .from("profiles")
      .update({
        village,
        address,
        city,
        state,
        postal_code,
        country,
        address_type,
      })
      .eq("id", userId)
      .select();

    if (error) {
      console.error("❌ Supabase Error:", error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    console.log("✅ Address updated successfully:", data);
    return res.status(200).json({
      success: true,
      profile: data[0],
      message: "Address updated successfully",
    });
  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// GET user address only
router.get("/address/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("profiles")
      .select("village, address, city, state, postal_code, country, address_type")
      .eq("id", userId)
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      address: data,
    });
  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

export default router;
