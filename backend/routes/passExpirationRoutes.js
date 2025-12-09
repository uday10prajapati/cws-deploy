import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/* CHECK FOR EXPIRED PASSES AND SEND NOTIFICATIONS */
router.post("/check-expired-passes", async (req, res) => {
  try {
    // Get all passes that have expired
    const { data: expiredPasses, error: fetchError } = await supabase
      .from("monthly_pass")
      .select("*, cars(brand, model, number_plate), auth.users(email)")
      .lt("valid_till", new Date().toISOString())
      .eq("notified", false); // Only notify once per pass

    if (fetchError) {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch expired passes: " + fetchError.message
      });
    }

    if (!expiredPasses || expiredPasses.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No expired passes found",
        count: 0
      });
    }

    // Get all admins
    const { data: adminProfiles, error: adminError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admins:", adminError);
      return res.status(400).json({
        success: false,
        error: "Failed to fetch admins"
      });
    }

    let notificationCount = 0;

    // Create notifications for each admin for each expired pass
    for (const pass of expiredPasses) {
      const notificationMessage = `Monthly Pass Expired: ${pass.cars[0]?.brand} ${pass.cars[0]?.model} (${pass.cars[0]?.number_plate}) - Customer: ${pass.auth.users[0]?.email || "Unknown"}`;

      for (const admin of adminProfiles) {
        const { error: notifyError } = await supabase
          .from("notifications")
          .insert([
            {
              user_id: admin.id,
              type: "pass_expired",
              title: "Monthly Pass Expired",
              message: notificationMessage,
              related_id: pass.id,
              is_read: false,
              created_at: new Date().toISOString()
            }
          ]);

        if (!notifyError) {
          notificationCount++;
        }
      }

      // Mark pass as notified
      await supabase
        .from("monthly_pass")
        .update({ notified: true })
        .eq("id", pass.id);
    }

    return res.status(200).json({
      success: true,
      message: `Notifications sent for ${expiredPasses.length} expired passes`,
      notificationsSent: notificationCount,
      expiredPasses: expiredPasses.length
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/* GET EXPIRED PASSES FOR ADMIN DASHBOARD */
router.get("/expired-passes", async (req, res) => {
  try {
    const { data: expiredPasses, error } = await supabase
      .from("monthly_pass")
      .select(`
        id,
        customer_id,
        car_id,
        total_washes,
        remaining_washes,
        valid_till,
        created_at,
        cars(id, brand, model, number_plate, customer_id),
        profiles:customer_id(id, full_name, email)
      `)
      .lt("valid_till", new Date().toISOString())
      .order("valid_till", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch expired passes: " + error.message
      });
    }

    return res.status(200).json({
      success: true,
      expiredPasses: expiredPasses || [],
      count: expiredPasses?.length || 0
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/* GET EXPIRING SOON PASSES (within 7 days) */
router.get("/expiring-soon", async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiringPasses, error } = await supabase
      .from("monthly_pass")
      .select(`
        id,
        customer_id,
        car_id,
        total_washes,
        remaining_washes,
        valid_till,
        created_at,
        cars(id, brand, model, number_plate, customer_id),
        profiles:customer_id(id, full_name, email)
      `)
      .gt("valid_till", today.toISOString())
      .lte("valid_till", sevenDaysFromNow)
      .order("valid_till", { ascending: true });

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch expiring passes: " + error.message
      });
    }

    return res.status(200).json({
      success: true,
      expiringPasses: expiringPasses || [],
      count: expiringPasses?.length || 0
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

export default router;
