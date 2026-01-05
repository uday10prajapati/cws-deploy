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
        taluko
      `)
      .eq("employee_type", "washer")
      .eq("account_status", "active");

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
        taluko: washer.taluko,
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
    const { area } = req.params;

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
        taluko
      `)
      .eq("employee_type", "washer")
      .eq("account_status", "active")
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
        taluko: washer.taluko,
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
 * Get washers where washer.area/city/taluko matches customer's taluko
 * Used by admin to assign washers to requests based on customer location
 */
router.get("/match-customer-city/:customerCity", async (req, res) => {
  try {
    const { customerCity } = req.params;

    if (!customerCity) {
      return res.status(400).json({
        success: false,
        error: "Customer city parameter is required",
      });
    }

    console.log(`🔍 Searching for washers matching: "${customerCity}"`);

    // Query profiles table for washers whose area/city/taluko matches customer's city
    const { data: washers, error } = await supabase
      .from("profiles")
      .select(`
        id,
        name,
        phone,
        address,
        area,
        city,
        taluko,
        employee_type,
        account_status
      `)
      .eq("employee_type", "washer")
      .eq("account_status", "active")
      .or(`area.ilike.%${customerCity}%,city.ilike.%${customerCity}%,taluko.ilike.%${customerCity}%`);

    if (error) {
      console.error("❌ Error fetching washers by customer city:", error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    console.log(`✅ Found ${washers?.length || 0} washers for "${customerCity}"`);
    
    // If no washers found, log all available washers for debugging
    if (!washers || washers.length === 0) {
      const { data: allWashers } = await supabase
        .from("profiles")
        .select("id, name, area, city, taluko, employee_type, account_status")
        .eq("employee_type", "washer")
        .eq("account_status", "active");
      
      console.warn(`⚠️ No washers found. Available washers in system:`, allWashers?.map(w => ({
        name: w.name,
        area: w.area,
        city: w.city,
        taluko: w.taluko
      })));
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
        taluko: washer.taluko,
        rating: rating?.[0]?.rating || 4.5,
      });
    }

    return res.status(200).json(washersWithRatings);
  } catch (err) {
    console.error("❌ Washer customer city match error:", err);
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

/**
 * @GET /washers/emergency-requests/:taluko
 * Get emergency wash requests for a specific taluko
 * Used by HR and sub-admin to see requests in their assigned area
 */
router.get("/emergency-requests/:taluko", async (req, res) => {
  try {
    const { taluko } = req.params;

    if (!taluko) {
      return res.status(400).json({
        success: false,
        error: "Taluko parameter is required",
      });
    }

    // Query emergency_wash_requests table for requests in this taluko
    const { data: requests, error } = await supabase
      .from("emergency_wash_requests")
      .select("*")
      .ilike("taluko", `%${taluko}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching emergency requests by taluko:", error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: requests || [],
      count: (requests || []).length,
    });
  } catch (err) {
    console.error("Emergency requests by taluko error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * @GET /washers/emergency-requests/status/:status
 * Get emergency wash requests by status
 * Used by admin to view pending/assigned/completed requests
 */
router.get("/emergency-requests-by-status/:status", async (req, res) => {
  try {
    const { status } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status parameter is required",
      });
    }

    // Query emergency_wash_requests table for requests with this status
    const { data: requests, error } = await supabase
      .from("emergency_wash_requests")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching emergency requests by status:", error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: requests || [],
      count: (requests || []).length,
    });
  } catch (err) {
    console.error("Emergency requests by status error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;