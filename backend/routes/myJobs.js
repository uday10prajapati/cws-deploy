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
  Fetch all bookings assigned to employee (by user ID) - both pending and completed
  Falls back to unassigned pending bookings if none are assigned
*/
router.get("/bookings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    // First, try to fetch all bookings assigned to this employee (both pending and completed)
    const { data: assignedBookings, error: assignedError } = await supabase
      .from("bookings")
      .select("*, cars(brand, model, number_plate)")
      .eq("assigned_to", userId)
      .order("created_at", { ascending: false });

    if (!assignedError && assignedBookings && assignedBookings.length > 0) {
      return res.json({ success: true, bookings: assignedBookings });
    }

    // If no assigned bookings, fallback to fetching unassigned pending bookings
    // This allows employees to see available work
    
    const { data: unassignedBookings, error: unassignedError } = await supabase
      .from("bookings")
      .select("*, cars(brand, model, number_plate)")
      .is("assigned_to", null)
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (unassignedError) {
      console.error("Error fetching unassigned bookings:", unassignedError);
      return res.json({ success: true, bookings: [] });
    }

    return res.json({ success: true, bookings: unassignedBookings || [] });
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
      .select("*, cars(brand, model, number_plate)")
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
