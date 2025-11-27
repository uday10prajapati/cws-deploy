import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * POST /ratings/add
 * Add a rating to a completed booking
 * Required: booking_id, customer_id, rating, rating_comment (optional)
 */
router.post("/add", async (req, res) => {
  try {
    const { booking_id, customer_id, rating, rating_comment } = req.body;

    // Validate required fields
    if (!booking_id || !customer_id || !rating) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: booking_id, customer_id, rating",
      });
    }

    // Validate rating is between 1-5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      });
    }

    // Check if booking exists and is completed
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    if (booking.status !== "Completed") {
      return res.status(400).json({
        success: false,
        error: "Can only rate completed bookings",
      });
    }

    // Check if already rated
    if (booking.rating && booking.rating > 0) {
      return res.status(400).json({
        success: false,
        error: "Booking already rated",
      });
    }

    // Get customer profile for name
    const { data: customer } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", customer_id)
      .single();

    // Update booking with rating
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        rating: parseInt(rating),
        rating_comment: rating_comment || "",
        rated_at: new Date().toISOString(),
        customer_name: customer?.full_name || "Customer",
      })
      .eq("id", booking_id)
      .select();

    if (updateError) {
      console.error("Rating update error:", updateError);
      return res.status(500).json({
        success: false,
        error: "Failed to save rating",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rating added successfully",
      data: updatedBooking[0],
    });
  } catch (error) {
    console.error("Rating error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /ratings/employee/:employee_id
 * Get all ratings for a specific employee
 */
router.get("/employee/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Fetch all bookings for this employee with ratings
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("assigned_to", employee_id)
      .gt("rating", 0)
      .order("rated_at", { ascending: false });

    if (error) {
      console.error("Fetch ratings error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch ratings",
      });
    }

    // Calculate statistics
    const ratings = bookings || [];
    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? (ratings.reduce((sum, b) => sum + (b.rating || 0), 0) / totalRatings).toFixed(1)
        : 0;

    // Count ratings by star
    const ratingCounts = {
      5: ratings.filter((r) => r.rating === 5).length,
      4: ratings.filter((r) => r.rating === 4).length,
      3: ratings.filter((r) => r.rating === 3).length,
      2: ratings.filter((r) => r.rating === 2).length,
      1: ratings.filter((r) => r.rating === 1).length,
    };

    return res.status(200).json({
      success: true,
      data: {
        ratings,
        statistics: {
          totalRatings,
          averageRating: parseFloat(averageRating),
          ratingCounts,
        },
      },
    });
  } catch (error) {
    console.error("Ratings fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /ratings/booking/:booking_id
 * Get rating for a specific booking
 */
router.get("/booking/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (error || !booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        rating: booking.rating || 0,
        rating_comment: booking.rating_comment || "",
        rated_at: booking.rated_at,
      },
    });
  } catch (error) {
    console.error("Booking rating fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /ratings/stats/:employee_id
 * Get quick stats for an employee's ratings
 */
router.get("/stats/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Fetch ratings for this employee
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("rating")
      .eq("assigned_to", employee_id)
      .gt("rating", 0);

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch statistics",
      });
    }

    const ratings = bookings || [];
    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? (ratings.reduce((sum, b) => sum + (b.rating || 0), 0) / totalRatings).toFixed(2)
        : "0.00";

    const fiveStarCount = ratings.filter((r) => r.rating === 5).length;
    const fourStarCount = ratings.filter((r) => r.rating === 4).length;
    const threeStarCount = ratings.filter((r) => r.rating === 3).length;
    const twoStarCount = ratings.filter((r) => r.rating === 2).length;
    const oneStarCount = ratings.filter((r) => r.rating === 1).length;

    return res.status(200).json({
      success: true,
      data: {
        averageRating: parseFloat(averageRating),
        totalRatings,
        distribution: {
          5: fiveStarCount,
          4: fourStarCount,
          3: threeStarCount,
          2: twoStarCount,
          1: oneStarCount,
        },
      },
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * PUT /ratings/update/:booking_id
 * Update a rating for a booking
 */
router.put("/update/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { rating, rating_comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        error: "Rating is required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      });
    }

    // Check if booking exists
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Update the rating
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        rating: parseInt(rating),
        rating_comment: rating_comment || booking.rating_comment || "",
        rated_at: new Date().toISOString(),
      })
      .eq("id", booking_id)
      .select();

    if (updateError) {
      console.error("Rating update error:", updateError);
      return res.status(500).json({
        success: false,
        error: "Failed to update rating",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rating updated successfully",
      data: updatedBooking[0],
    });
  } catch (error) {
    console.error("Rating update error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * DELETE /ratings/delete/:booking_id
 * Delete a rating from a booking (admin only)
 */
router.delete("/delete/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;

    // Check if booking exists
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Remove rating from booking
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        rating: null,
        rating_comment: null,
        rated_at: null,
      })
      .eq("id", booking_id);

    if (updateError) {
      console.error("Rating delete error:", updateError);
      return res.status(500).json({
        success: false,
        error: "Failed to delete rating",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rating deleted successfully",
    });
  } catch (error) {
    console.error("Rating delete error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
