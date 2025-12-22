import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * @GET /washers/by-location
 * Get washers available in a specific location/area
 * 
 * Query params:
 * - latitude: number
 * - longitude: number
 * - radius: number (in km, default 5)
 */
router.get("/by-location", async (req, res) => {
  try {
    const { area } = req.query;

    if (!area) {
      return res.status(400).json({
        success: false,
        error: "Area parameter is required",
      });
    }

    // Get profiles with washer role and their service areas
    let query = supabase
      .from("profiles")
      .select(`
        id,
        name,
        phone,
        address,
        area,
        city,
        latitude,
        longitude
      `)
      .eq("employee_type", "washer")
      .eq("account_status", true);

    // If area is provided, filter by area
    if (area) {
      query = query.ilike("area", `%${area}%`);
    }

    const { data: washers, error } = await query;

    if (error) {
      console.error("Error fetching washers:", error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Filter washers and get their ratings
    const filteredWashers = [];
    
    for (const washer of washers || []) {
      // Get washer's rating
      const { data: rating } = await supabase
        .from("ratings")
        .select("rating")
        .eq("washer_id", washer.id)
        .limit(1);

      filteredWashers.push({
        id: washer.id,
        user_id: washer.id,
        name: washer.name || "Unknown Washer",
        phone: washer.phone,
        address: washer.address,
        area: washer.area,
        city: washer.city,
        latitude: washer.latitude,
        longitude: washer.longitude,
        rating: rating?.[0]?.rating || 4.5,
      });
    }

    return res.status(200).json({
      success: true,
      data: filteredWashers,
      count: filteredWashers.length,
    });
  } catch (err) {
    console.error("Washer location error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * @GET /washers/by-area/:area
 * Get washers in a specific area/city
 */
router.get("/by-area/:area", async (req, res) => {
  try {
    const { area } = req.query;

    if (!area) {
      return res.status(400).json({
        success: false,
        error: "Area parameter is required",
      });
    }

    // Query profiles table (correct table) for washers
    const { data: washers, error } = await supabase
      .from("profiles")
      .select(`
        id,
        name,
        phone,
        address,
        area,
        city,
        latitude,
        longitude
      `)
      .eq("employee_type", "washer")
      .eq("account_status", true)
      .ilike("area", `%${area}%`);

    if (error) {
      console.error("Error fetching washers by area:", error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Get ratings for each washer
    const washersWithRatings = [];
    for (const washer of washers || []) {
      const { data: rating } = await supabase
        .from("ratings")
        .select("rating")
        .eq("washer_id", washer.id)
        .limit(1);

      washersWithRatings.push({
        id: washer.id,
        user_id: washer.id,
        name: washer.name || "Unknown Washer",
        phone: washer.phone,
        address: washer.address,
        area: washer.area,
        city: washer.city,
        latitude: washer.latitude,
        longitude: washer.longitude,
        rating: rating?.[0]?.rating || 4.5,
      });
    }

    return res.status(200).json(washersWithRatings);
  } catch (err) {
    console.error("Washer area error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * @GET /washers/match-customer-city/:customerCity
 * Get washers where washer.area matches customer.city
 * Used by admin to assign washers to requests based on customer location
 */
router.get("/match-customer-city/:customerCity", async (req, res) => {
  try {
    const { customerCity } = req.query;

    if (!customerCity) {
      return res.status(400).json({
        success: false,
        error: "Customer city parameter is required",
      });
    }

    // Query profiles table for washers whose area matches customer's city
    const { data: washers, error } = await supabase
      .from("profiles")
      .select(`
        id,
        name,
        phone,
        address,
        area,
        city,
        latitude,
        longitude
      `)
      .eq("employee_type", "washer")
      .eq("account_status", true)
      .ilike("area", `%${customerCity}%`);

    if (error) {
      console.error("Error fetching washers by customer city:", error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Get ratings for each washer
    const washersWithRatings = [];
    for (const washer of washers || []) {
      const { data: rating } = await supabase
        .from("ratings")
        .select("rating")
        .eq("washer_id", washer.id)
        .limit(1);

      washersWithRatings.push({
        id: washer.id,
        user_id: washer.id,
        name: washer.name || "Unknown Washer",
        phone: washer.phone,
        address: washer.address,
        area: washer.area,
        city: washer.city,
        latitude: washer.latitude,
        longitude: washer.longitude,
        rating: rating?.[0]?.rating || 4.5,
      });
    }

    return res.status(200).json(washersWithRatings);
  } catch (err) {
    console.error("Washer customer city match error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * Haversine formula to calculate distance between two points
 * (Kept for future use if needed)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;