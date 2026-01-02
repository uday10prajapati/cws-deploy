import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * Assign a car to a washer
 * POST /admin/assign-car-to-washer
 * Body: {
 *   car_id: string,
 *   washer_id: string,
 *   assigned_by_role: string (admin|sub-admin|hr),
 *   assigned_by_name: string
 * }
 */
router.post("/assign-car-to-washer", async (req, res) => {
  try {
    const { car_id, washer_id, assigned_by_role, assigned_by_name } = req.body;

    if (!car_id || !washer_id || !assigned_by_role) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: car_id, washer_id, assigned_by_role",
      });
    }

    // Check if car exists
    const { data: carExists } = await supabase
      .from("cars")
      .select("id")
      .eq("id", car_id)
      .single();

    if (!carExists) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    // Check if washer exists
    const { data: washerExists } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", washer_id)
      .eq("role", "employee")
      .eq("employee_type", "washer")
      .single();

    if (!washerExists) {
      return res.status(404).json({
        success: false,
        message: "Washer not found",
      });
    }

    // Deactivate any existing active assignments for this car
    await supabase
      .from("car_assignments")
      .update({ status: "inactive" })
      .eq("car_id", car_id)
      .eq("status", "active");

    // Create new assignment
    const { data: assignment, error } = await supabase
      .from("car_assignments")
      .insert({
        car_id,
        assigned_to: washer_id,
        status: "active",
        assigned_by_role,
        assigned_by_name,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Assignment error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to assign car to washer",
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: "Car assigned to washer successfully",
      assignment,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * Unassign a car from a washer
 * POST /admin/unassign-car-from-washer
 * Body: {
 *   assignment_id: string
 * }
 */
router.post("/unassign-car-from-washer", async (req, res) => {
  try {
    const { assignment_id } = req.body;

    if (!assignment_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: assignment_id",
      });
    }

    const { data: assignment, error } = await supabase
      .from("car_assignments")
      .update({ status: "inactive" })
      .eq("id", assignment_id)
      .select()
      .single();

    if (error) {
      console.error("Unassignment error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to unassign car",
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: "Car unassigned from washer successfully",
      assignment,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * Get all car assignments for a washer
 * GET /admin/washer-car-assignments/:washerId
 */
router.get("/washer-car-assignments/:washerId", async (req, res) => {
  try {
    const { washerId } = req.params;

    const { data: assignments, error } = await supabase
      .from("car_assignments")
      .select(
        `
        id,
        car_id,
        status,
        assigned_by_role,
        assigned_by_name,
        assigned_at,
        cars (
          id,
          make,
          model,
          registration_number,
          owner:profiles (
            name,
            phone,
            city,
            taluko
          )
        )
      `
      )
      .eq("assigned_to", washerId)
      .eq("status", "active")
      .order("assigned_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch assignments",
        error: error.message,
      });
    }

    res.json({
      success: true,
      assignments: assignments || [],
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * Get all car assignments with filters
 * GET /admin/car-assignments?status=active&assigned_by_role=admin&taluko=Ahmedabad&city=Ahmedabad
 */
router.get("/car-assignments", async (req, res) => {
  try {
    const { status = "active", assigned_by_role, taluko, city } = req.query;

    let query = supabase.from("car_assignments").select(
      `
      id,
      car_id,
      assigned_to,
      status,
      assigned_by_role,
      assigned_by_name,
      assigned_at,
      cars (
        id,
        make,
        model,
        registration_number,
        owner:profiles (
          name,
          phone,
          city,
          taluko
        )
      ),
      washer:profiles!assigned_to (
        id,
        name,
        email,
        phone,
        city,
        taluko,
        account_status
      )
    `
    );

    if (status) {
      query = query.eq("status", status);
    }

    if (assigned_by_role) {
      query = query.eq("assigned_by_role", assigned_by_role);
    }

    const { data: assignments, error } = await query.order("assigned_at", {
      ascending: false,
    });

    if (error) {
      console.error("Fetch error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch assignments",
        error: error.message,
      });
    }

    // Filter by taluko and city if specified
    let filteredAssignments = assignments || [];

    if (taluko) {
      filteredAssignments = filteredAssignments.filter(
        (a) => a.washer?.taluko?.toLowerCase() === taluko.toLowerCase()
      );
    }

    if (city) {
      filteredAssignments = filteredAssignments.filter(
        (a) => a.washer?.city?.toLowerCase() === city.toLowerCase()
      );
    }

    res.json({
      success: true,
      assignments: filteredAssignments,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
