import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Supabase Server Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/*  
  GET /employee/bookings/:userId
  Fetch all bookings assigned to employee (by user ID)
  Since assigned_to column may not exist, we fetch all bookings
*/
router.get("/bookings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    // First, try to fetch with assigned_to column (if it exists)
    let data, error;
    
    // Try primary query with assigned_to
    const { data: assignedBookings, error: assignedError } = await supabase
      .from("bookings")
      .select("*")
      .eq("assigned_to", userId)
      .order("created_at", { ascending: false });

    if (!assignedError) {
      data = assignedBookings;
    } else if (assignedError.code === '42703') {
      // Column doesn't exist, fallback to fetching all bookings (admin view) or customer bookings
      console.log("assigned_to column not found, fetching all bookings for admin view");
      
      const { data: allBookings, error: allError } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (allError) {
        throw allError;
      }
      data = allBookings || [];
    } else {
      throw assignedError;
    }

    return res.json({ success: true, bookings: data || [] });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/*  
  GET /employee/jobs
  Fetch jobs assigned to employee (legacy - requires middleware)
*/
router.get("/jobs", async (req, res) => {
  try {
    const userId = req.user?.id; // middleware must set req.user

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("assigned_to", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({ jobs: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/*  
  POST /employee/jobs/update
  Update job status
*/
router.post("/jobs/update", async (req, res) => {
  try {
    const { jobId, status } = req.body;

    if (!jobId || !status) {
      return res.status(400).json({ error: "jobId and status required" });
    }

    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", jobId);

    if (error) throw error;

    return res.json({ success: true, message: "Job status updated" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
