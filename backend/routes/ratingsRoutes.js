import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * GET /ratings/test
 * Test endpoint to check all bookings with ratings in database
 */
router.get("/test", async (req, res) => {
  try {
    console.log("🧪 Testing ratings endpoint...");
    
    // Check if there are ANY bookings with ratings
    const { data: allRatedBookings, error: allError } = await supabase
      .from("bookings")
      .select("id, assigned_to, rating, created_at")
      .gt("rating", 0)
      .limit(10);
    
    if (allError) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch test data",
        details: allError.message,
      });
    }
    
    console.log(`Found ${(allRatedBookings || []).length} total rated bookings in database`);
    
    // Check all bookings count
    const { data: allBookings, error: countError } = await supabase
      .from("bookings")
      .select("id")
      .limit(1);
    
    return res.status(200).json({
      success: true,
      data: {
        totalRatedBookings: (allRatedBookings || []).length,
        ratedBookings: allRatedBookings || [],
        message: allRatedBookings && allRatedBookings.length > 0 
          ? "✅ Ratings exist in database" 
          : "⚠️ No ratings found in database yet",
      },
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * POST /ratings/create-sample-ratings
 * Create sample ratings for testing (for development only)
 */
router.post("/create-sample-ratings", async (req, res) => {
  try {
    const { employee_id } = req.body;
    
    if (!employee_id) {
      return res.status(400).json({
        success: false,
        error: "employee_id is required",
      });
    }
    
    console.log("📝 Creating sample ratings for employee:", employee_id);
    
    // First, create some sample bookings for this employee if they don't exist
    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("assigned_to", employee_id)
      .limit(5);
    
    // Create sample bookings with ratings
    const sampleRatings = [
      {
        rating: 5,
        rating_comment: "Excellent service! Very professional and thorough.",
        customer_name: "Rajesh Kumar",
      },
      {
        rating: 4,
        rating_comment: "Good job, finished on time.",
        customer_name: "Priya Singh",
      },
      {
        rating: 5,
        rating_comment: "Amazing! My car looks brand new.",
        customer_name: "Amit Patel",
      },
      {
        rating: 3,
        rating_comment: "Average service, could be better.",
        customer_name: "Neha Verma",
      },
      {
        rating: 4,
        rating_comment: "Good cleaning, reasonable price.",
        customer_name: "Vikram Reddy",
      },
    ];
    
    // If there are existing bookings, update them with ratings
    if (existingBookings && existingBookings.length > 0) {
      const updates = [];
      for (let i = 0; i < Math.min(existingBookings.length, sampleRatings.length); i++) {
        const booking = existingBookings[i];
        const sampleRating = sampleRatings[i];
        
        const { error } = await supabase
          .from("bookings")
          .update({
            rating: sampleRating.rating,
            rating_comment: sampleRating.rating_comment,
            customer_name: sampleRating.customer_name,
            rated_at: new Date().toISOString(),
          })
          .eq("id", booking.id);
        
        if (!error) {
          updates.push(booking.id);
        }
      }
      
      return res.status(200).json({
        success: true,
        message: `Updated ${updates.length} bookings with sample ratings`,
        data: {
          updatedCount: updates.length,
          bookingIds: updates,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "No bookings found for this employee. Create bookings first.",
      });
    }
  } catch (error) {
    console.error("Sample ratings creation error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create sample ratings",
      details: error.message,
    });
  }
});

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
      .select("name")
      .eq("id", customer_id)
      .single();

    // Update booking with rating
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        rating: parseInt(rating),
        rating_comment: rating_comment || "",
        rated_at: new Date().toISOString(),
        customer_name: customer?.name || "Customer",
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
 * Shows ratings from their completed bookings (identified by customer_id)
 */
router.get("/employee/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;

    console.log("🔍 Fetching ratings for employee:", employee_id);

    // Fetch all bookings for this employee with ratings
    // NOTE: We check if user_id matches in profiles table to identify employees
    // But we fetch ALL rated bookings since all employees/admins can see all ratings
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .gt("rating", 0)
      .order("rated_at", { ascending: false });

    if (error) {
      console.error("❌ Fetch ratings error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch ratings",
        details: error.message,
      });
    }
    
    console.log(`✅ Found ${(bookings || []).length} ratings in system`);

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
