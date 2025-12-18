import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/* GET CUSTOMER LOYALTY POINTS */
router.get("/loyalty/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;

    // Get customer loyalty data
    const { data: loyaltyData, error: loyaltyError } = await supabase
      .from("customer_loyalty_points")
      .select("*")
      .eq("customer_id", customer_id)
      .maybeSingle();

    if (loyaltyError && loyaltyError.code !== "PGRST116") {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch loyalty data: " + loyaltyError.message
      });
    }

    // Get available offers
    const { data: offers, error: offersError } = await supabase
      .from("loyalty_offers")
      .select("*")
      .eq("is_active", true)
      .order("points_required", { ascending: true });

    if (offersError) {
      console.warn("Warning: Could not fetch offers:", offersError);
    }

    // Check which offers customer can redeem
    const currentPoints = loyaltyData?.total_points || 0;
    const availableOffers = offers?.filter(offer => 
      currentPoints >= offer.points_required && !offer.is_redeemed
    ) || [];

    return res.status(200).json({
      success: true,
      loyalty: loyaltyData || {
        customer_id,
        total_points: 0,
        cars_washed: 0,
        last_wash_date: null,
        created_at: new Date().toISOString()
      },
      offers: {
        available: availableOffers,
        all: offers || []
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

/* RECORD CAR WASH - ADD CUSTOMER LOYALTY POINT */
router.post("/loyalty/record-wash", async (req, res) => {
  try {
    const { customer_id, car_id, booking_id, washer_id } = req.body;

    if (!customer_id || !car_id) {
      return res.status(400).json({
        success: false,
        error: "customer_id and car_id are required"
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if customer loyalty record exists
    const { data: existingLoyalty, error: fetchError } = await supabase
      .from("customer_loyalty_points")
      .select("*")
      .eq("customer_id", customer_id)
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
        .from("customer_loyalty_points")
        .insert([
          {
            customer_id,
            total_points: 1,
            cars_washed: 1,
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
      const { data: updated, error: updateError } = await supabase
        .from("customer_loyalty_points")
        .update({
          total_points: existingLoyalty.total_points + 1,
          cars_washed: existingLoyalty.cars_washed + 1,
          last_wash_date: today,
          updated_at: new Date().toISOString()
        })
        .eq("customer_id", customer_id)
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

    // Record wash history
    const { error: historyError } = await supabase
      .from("customer_wash_history")
      .insert([
        {
          customer_id,
          car_id,
          booking_id,
          washer_id,
          wash_date: today,
          created_at: new Date().toISOString()
        }
      ]);

    if (historyError) {
      console.warn("Warning: Could not record wash history:", historyError);
    }

    // Get customer profile for notification
    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", customer_id)
      .maybeSingle();

    // Create notification for customer
    const { error: notifyError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: customer_id,
          type: "customer_loyalty_point_earned",
          title: "Loyalty Point Earned! 🎉",
          message: `Your car was washed! You earned 1 loyalty point. Total: ${updatedLoyalty.total_points} points`,
          related_id: car_id,
          is_read: false,
          created_at: new Date().toISOString()
        }
      ]);

    if (notifyError) {
      console.warn("Warning: Could not create notification:", notifyError);
    }

    // Check if customer qualifies for new offers
    const { data: newOffers } = await supabase
      .from("loyalty_offers")
      .select("*")
      .eq("is_active", true)
      .lte("points_required", updatedLoyalty.total_points);

    const unredeemedOffers = newOffers?.filter(offer => {
      // Check if customer has redeemed this offer
      return !offer.is_redeemed;
    }) || [];

    // If customer unlocked new offers, send notification
    if (unredeemedOffers.length > 0) {
      const { error: offerNotifyError } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: customer_id,
            type: "loyalty_offer_unlocked",
            title: "New Offers Available! 🎁",
            message: `You've unlocked ${unredeemedOffers.length} offer(s)! Check your loyalty rewards.`,
            related_id: customer_id,
            is_read: false,
            created_at: new Date().toISOString()
          }
        ]);

      if (offerNotifyError) {
        console.warn("Warning: Could not create offer notification:", offerNotifyError);
      }
    }

    // Notify admin
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (adminProfiles && adminProfiles.length > 0) {
      const adminNotifications = adminProfiles.map(admin => ({
        user_id: admin.id,
        type: "customer_loyalty_update",
        title: "Customer Car Washed",
        message: `${customerProfile?.full_name || "Customer"} car was washed. Customer loyalty points: ${updatedLoyalty.total_points}`,
        related_id: customer_id,
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
      unlockedOffers: unredeemedOffers.length > 0 ? unredeemedOffers : null,
      notification: {
        type: "customer_loyalty_point_earned",
        points_earned: 1,
        total_points: updatedLoyalty.total_points,
        cars_washed: updatedLoyalty.cars_washed
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

/* GET ALL LOYALTY OFFERS */
router.get("/offers", async (req, res) => {
  try {
    const { data: offers, error } = await supabase
      .from("loyalty_offers")
      .select("*")
      .eq("is_active", true)
      .order("points_required", { ascending: true });

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch offers: " + error.message
      });
    }

    return res.status(200).json({
      success: true,
      offers: offers || [],
      count: offers?.length || 0
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/* REDEEM AN OFFER */
router.post("/loyalty/redeem-offer", async (req, res) => {
  try {
    const { customer_id, offer_id } = req.body;

    if (!customer_id || !offer_id) {
      return res.status(400).json({
        success: false,
        error: "customer_id and offer_id are required"
      });
    }

    // Get offer details
    const { data: offer, error: offerError } = await supabase
      .from("loyalty_offers")
      .select("*")
      .eq("id", offer_id)
      .maybeSingle();

    if (offerError || !offer) {
      return res.status(400).json({
        success: false,
        error: "Offer not found"
      });
    }

    // Get customer loyalty data
    const { data: loyalty, error: loyaltyError } = await supabase
      .from("customer_loyalty_points")
      .select("*")
      .eq("customer_id", customer_id)
      .maybeSingle();

    if (loyaltyError || !loyalty) {
      return res.status(400).json({
        success: false,
        error: "Customer loyalty record not found"
      });
    }

    // Check if customer has enough points
    if (loyalty.total_points < offer.points_required) {
      return res.status(400).json({
        success: false,
        error: `Not enough points. Required: ${offer.points_required}, You have: ${loyalty.total_points}`
      });
    }

    // Record redemption
    const { data: redemption, error: redemptionError } = await supabase
      .from("loyalty_redemptions")
      .insert([
        {
          customer_id,
          offer_id,
          points_spent: offer.points_required,
          redeemed_at: new Date().toISOString()
        }
      ])
      .select()
      .maybeSingle();

    if (redemptionError) {
      return res.status(400).json({
        success: false,
        error: "Failed to redeem offer: " + redemptionError.message
      });
    }

    // Deduct points
    const newPoints = loyalty.total_points - offer.points_required;
    const { data: updated, error: updateError } = await supabase
      .from("customer_loyalty_points")
      .update({
        total_points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq("customer_id", customer_id)
      .select()
      .maybeSingle();

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: "Failed to update points: " + updateError.message
      });
    }

    // Get customer profile
    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", customer_id)
      .maybeSingle();

    // Create notification
    const { error: notifyError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: customer_id,
          type: "loyalty_offer_redeemed",
          title: "Offer Redeemed! ✅",
          message: `You've redeemed: "${offer.offer_title}". Remaining points: ${newPoints}`,
          related_id: offer_id,
          is_read: false,
          created_at: new Date().toISOString()
        }
      ]);

    if (notifyError) {
      console.warn("Warning: Could not create notification:", notifyError);
    }

    // Notify admin
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (adminProfiles && adminProfiles.length > 0) {
      const adminNotifications = adminProfiles.map(admin => ({
        user_id: admin.id,
        type: "loyalty_offer_redeemed",
        title: "Customer Redeemed Offer",
        message: `${customerProfile?.full_name || "Customer"} redeemed "${offer.offer_title}" (-${offer.points_required} points)`,
        related_id: customer_id,
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
      message: "Offer redeemed successfully",
      redemption: {
        offer_title: offer.offer_title,
        offer_description: offer.offer_description,
        points_spent: offer.points_required,
        coupon_code: offer.coupon_code,
        discount_percentage: offer.discount_percentage,
        valid_until: offer.valid_until
      },
      loyalty: updated
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/* GET CUSTOMER WASH HISTORY */
router.get("/history/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { days = "90" } = req.query;

    // Validate customer_id format
    if (!customer_id || customer_id.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required"
      });
    }

    // Validate and parse days
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 0) {
      return res.status(400).json({
        success: false,
        error: "Days must be a valid positive number"
      });
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysNum);
    const fromDateStr = fromDate.toISOString().split('T')[0];

    const { data: history, error } = await supabase
      .from("customer_wash_history")
      .select(`
        *,
        cars(id, brand, model, number_plate),
        profiles:washer_id(id, full_name)
      `)
      .eq("customer_id", customer_id)
      .gte("wash_date", fromDateStr)
      .order("wash_date", { ascending: false });

    if (error) {
      console.error("❌ Supabase error fetching wash history:", error);
      return res.status(400).json({
        success: false,
        error: "Failed to fetch wash history: " + error.message
      });
    }

    return res.status(200).json({
      success: true,
      history: history || [],
      count: history?.length || 0,
      period_days: daysNum
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/* GET CUSTOMER REDEMPTION HISTORY */
router.get("/redemptions/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;

    const { data: redemptions, error } = await supabase
      .from("loyalty_redemptions")
      .select(`
        *,
        loyalty_offers(id, offer_title, offer_description, discount_percentage)
      `)
      .eq("customer_id", customer_id)
      .order("redeemed_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Failed to fetch redemptions: " + error.message
      });
    }

    return res.status(200).json({
      success: true,
      redemptions: redemptions || [],
      count: redemptions?.length || 0
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message
    });
  }
});

/* GET ADMIN CUSTOMER LOYALTY LEADERBOARD */
router.get("/admin/leaderboard", async (req, res) => {
  try {
    const { data: leaderboard, error } = await supabase
      .from("customer_loyalty_points")
      .select(`
        *,
        profiles:customer_id(id, full_name, email, phone)
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

/* CREATE/UPDATE LOYALTY OFFER (ADMIN ONLY) */
router.post("/offers/create", async (req, res) => {
  try {
    const {
      offer_title,
      offer_description,
      points_required,
      discount_percentage,
      coupon_code,
      valid_until,
      is_active
    } = req.body;

    if (!offer_title || !points_required) {
      return res.status(400).json({
        success: false,
        error: "offer_title and points_required are required"
      });
    }

    const { data: offer, error } = await supabase
      .from("loyalty_offers")
      .insert([
        {
          offer_title,
          offer_description,
          points_required,
          discount_percentage: discount_percentage || 0,
          coupon_code: coupon_code || `LOYALTY${Date.now()}`,
          valid_until: valid_until || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: is_active !== false,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Failed to create offer: " + error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: "Offer created successfully",
      offer
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
