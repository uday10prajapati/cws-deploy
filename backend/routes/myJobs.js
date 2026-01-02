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

/*
  GET /employee/profile/:id
  Fetch employee profile data
*/
router.get("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/*
  GET /employee/assigned-areas/:id
  Fetch areas assigned to employee (salesperson)
*/
router.get("/assigned-areas/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("employee_assigned_areas")
      .select("*")
      .eq("employee_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Parse talukas from comma-separated string
    const formattedData = (data || []).map(area => ({
      ...area,
      talukas: area.talukas ? area.talukas.split(',').map(t => t.trim()) : []
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/*
  POST /employee/assign-areas
  Assign areas to salesperson (employee_type = 'sales')
  Only admins or general employees can assign areas
*/
router.post("/assign-areas", async (req, res) => {
  try {
    const { employee_id, city, talukas, assigned_by } = req.body;

    if (!employee_id || !city || !talukas || talukas.length === 0) {
      return res.status(400).json({
        success: false,
        error: "employee_id, city, and talukas are required"
      });
    }

    // Verify that target employee is a salesperson
    const { data: targetEmployee, error: employeeError } = await supabase
      .from("profiles")
      .select("employee_type")
      .eq("id", employee_id)
      .single();

    if (employeeError || targetEmployee?.employee_type !== "sales") {
      return res.status(400).json({
        success: false,
        error: "Can only assign areas to salespeople (employee_type = 'sales')"
      });
    }

    const talukaString = talukas.join(", ");

    const { data, error } = await supabase
      .from("employee_assigned_areas")
      .insert([
        {
          employee_id,
          city,
          talukas: talukaString,
          assigned_by,
          created_at: new Date()
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const formattedData = {
      ...data[0],
      talukas: data[0].talukas.split(',').map(t => t.trim())
    };

    res.json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/*
  DELETE /employee/assigned-areas/:id
  Remove area assignment
*/
router.delete("/assigned-areas/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("employee_assigned_areas")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: "Area assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
