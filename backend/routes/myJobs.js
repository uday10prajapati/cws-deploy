import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Supabase Server Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/*  
  ------------------------------
  GET /employee/jobs
  Fetch jobs assigned to employee
  ------------------------------
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
  ------------------------------
  POST /employee/jobs/update
  Update job status
  ------------------------------
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
