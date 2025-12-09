import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/* GET WASHER LOYALTY POINTS */
router.get("/loyalty/:washer_id", async (req, res) => {
  try {
    const { washer_id } = req.params;

    // Get washer loyalty data
    const { data: loyaltyData, error: loyaltyError } = await supabase
      .from("washer_loyalty_points")
      .select("*")
      .eq("washer_id", washer_id)
      .maybeSingle();

    if (loyaltyError && loyaltyError.code !== "PGRST116") {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch loyalty data: " + loyaltyError.message
      });
    }

    // Get washer profile info
    const { data: washerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", washer_id)
      .maybeSingle();

    if (profileError) {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch washer profile"
      });
    }

    return res.status(200).json({
      success: true,
      loyalty: loyaltyData || {
        washer_id,
        total_points: 0,
        cars_washed_today: 0,
        cars_washed_all_time: 0,
        last_wash_date: null,
        created_at: new Date().toISOString()
      },
      washer: washerProfile
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/* RECORD CAR WASH - ADD LOYALTY POINT */
router.post("/loyalty/record-wash", async (req, res) => {
  try {
    const { washer_id, car_id, booking_id } = req.body;

    if (!washer_id || !car_id) {
      return res.status(400).json({
        success: false,
        error: "washer_id and car_id are required"
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if washer loyalty record exists
    const { data: existingLoyalty, error: fetchError } = await supabase
      .from("washer_loyalty_points")
      .select("*")
      .eq("washer_id", washer_id)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch loyalty record"
      });
    }

    let updatedLoyalty;

    if (!existingLoyalty) {
      // Create new loyalty record
      const { data: newLoyalty, error: createError } = await supabase
        .from("washer_loyalty_points")
        .insert([
          {
            washer_id,
            total_points: 1,
            cars_washed_today: 1,
            cars_washed_all_time: 1,
            last_wash_date: today,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .maybeSingle();

      if (createError) {
        return res.status(400).json({
          success: false,
          error: "Failed to create loyalty record: " + createError.message
        });
      }

      updatedLoyalty = newLoyalty;
    } else {
      // Update existing loyalty record
      const lastWashDate = existingLoyalty.last_wash_date?.split('T')[0];
      const isSameDay = lastWashDate === today;

      let carsWashedToday = isSameDay ? existingLoyalty.cars_washed_today + 1 : 1;

      const { data: updated, error: updateError } = await supabase
        .from("washer_loyalty_points")
        .update({
          total_points: existingLoyalty.total_points + 1,
          cars_washed_today: carsWashedToday,
          cars_washed_all_time: existingLoyalty.cars_washed_all_time + 1,
          last_wash_date: today,
          updated_at: new Date().toISOString()
        })
        .eq("washer_id", washer_id)
        .select()
        .maybeSingle();

      if (updateError) {
        return res.status(400).json({
          success: false,
          error: "Failed to update loyalty record: " + updateError.message
        });
      }

      updatedLoyalty = updated;
    }

    // Record wash history for analytics
    const { error: historyError } = await supabase
      .from("wash_history")
      .insert([
        {
          washer_id,
          car_id,
          booking_id,
          wash_date: today,
          created_at: new Date().toISOString()
        }
      ]);

    if (historyError) {
      console.warn("Warning: Could not record wash history:", historyError);
    }

    // Get washer profile for notification data
    const { data: washerProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", washer_id)
      .maybeSingle();

    // Create notification for washer
    const { error: notifyError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: washer_id,
          type: "loyalty_point_earned",
          title: "Loyalty Point Earned! 🎉",
          message: `You earned 1 loyalty point! Total: ${updatedLoyalty.total_points} points | Today: ${updatedLoyalty.cars_washed_today} cars`,
          related_id: car_id,
          is_read: false,
          created_at: new Date().toISOString()
        }
      ]);

    if (notifyError) {
      console.warn("Warning: Could not create washer notification:", notifyError);
    }

    // Get all admins and notify them
    const { data: adminProfiles, error: adminError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (!adminError && adminProfiles && adminProfiles.length > 0) {
      const adminNotifications = adminProfiles.map(admin => ({
        user_id: admin.id,
        type: "washer_loyalty_update",
        title: "Washer Completed Wash",
        message: `${washerProfile?.full_name || "Washer"} washed a car. Total points today: ${updatedLoyalty.cars_washed_today} | All-time points: ${updatedLoyalty.total_points}`,
        related_id: washer_id,
        is_read: false,
        created_at: new Date().toISOString()
      }));

      const { error: adminNotifyError } = await supabase
        .from("notifications")
        .insert(adminNotifications);

      if (adminNotifyError) {
        console.warn("Warning: Could not create admin notifications:", adminNotifyError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Loyalty point recorded successfully",
      loyalty: updatedLoyalty,
      notification: {
        type: "loyalty_point_earned",
        points_earned: 1,
        total_points: updatedLoyalty.total_points,
        cars_washed_today: updatedLoyalty.cars_washed_today,
        cars_washed_all_time: updatedLoyalty.cars_washed_all_time
      }
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/* GET ALL WASHERS LOYALTY LEADERBOARD */
router.get("/loyalty/leaderboard", async (req, res) => {
  try {
    const { data: leaderboard, error } = await supabase
      .from("washer_loyalty_points")
      .select(`
        *,
        profiles:washer_id(id, full_name, email, phone)
      `)
      .order("total_points", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch leaderboard: " + error.message
      });
    }

    return res.status(200).json({
      success: true,
      leaderboard: leaderboard || [],
      count: leaderboard?.length || 0
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/* GET WASHER WASH HISTORY */
router.get("/history/:washer_id", async (req, res) => {
  try {
    const { washer_id } = req.params;
    const { days = 30 } = req.query;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));
    const fromDateStr = fromDate.toISOString().split('T')[0];

    const { data: history, error } = await supabase
      .from("wash_history")
      .select(`
        *,
        cars(id, brand, model, number_plate),
        bookings(id, booking_date, status)
      `)
      .eq("washer_id", washer_id)
      .gte("wash_date", fromDateStr)
      .order("wash_date", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch wash history: " + error.message
      });
    }

    return res.status(200).json({
      success: true,
      history: history || [],
      count: history?.length || 0,
      period_days: parseInt(days)
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/* GET DAILY WASH SUMMARY (FOR ADMIN) */
router.get("/admin/daily-summary", async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all washers who washed cars today
    const { data: todaysWashers, error: washersError } = await supabase
      .from("washer_loyalty_points")
      .select(`
        *,
        profiles:washer_id(id, full_name, email, phone)
      `)
      .eq("last_wash_date", today)
      .order("cars_washed_today", { ascending: false });

    if (washersError) {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch daily summary: " + washersError.message
      });
    }

    // Calculate stats
    const totalCarsWashedToday = todaysWashers?.reduce((sum, w) => sum + w.cars_washed_today, 0) || 0;
    const totalPointsEarnedToday = totalCarsWashedToday; // 1 point per car
    const activesWashersToday = todaysWashers?.length || 0;

    return res.status(200).json({
      success: true,
      date: today,
      summary: {
        active_washers: activesWashersToday,
        total_cars_washed: totalCarsWashedToday,
        total_points_earned: totalPointsEarnedToday,
        average_cars_per_washer: activesWashersToday > 0 ? (totalCarsWashedToday / activesWashersToday).toFixed(2) : 0
      },
      washers: todaysWashers || []
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/* RESET DAILY COUNT (FOR NEXT DAY - OPTIONAL) */
router.post("/loyalty/reset-daily", async (req, res) => {
  try {
    // This could be run as a scheduled task daily
    // It doesn't reset points, just ensures cars_washed_today is ready for next day
    const today = new Date().toISOString().split('T')[0];

    const { data: washers, error: fetchError } = await supabase
      .from("washer_loyalty_points")
      .select("washer_id, cars_washed_today, last_wash_date");

    if (fetchError) {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch washers"
      });
    }

    let resetCount = 0;
    for (const washer of washers || []) {
      const lastWashDate = washer.last_wash_date?.split('T')[0];
      if (lastWashDate !== today) {
        const { error: updateError } = await supabase
          .from("washer_loyalty_points")
          .update({ cars_washed_today: 0 })
          .eq("washer_id", washer.washer_id);

        if (!updateError) {
          resetCount++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Reset daily count for ${resetCount} washers`,
      resetCount
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
