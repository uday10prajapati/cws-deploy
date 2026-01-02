import { supabase } from "../supabaseClient";

/**
 * RBAC Utility Functions for Hierarchical Geographic Permissions
 * Hierarchy: General → Sub-General → HR-General → Salesman
 */

// Constants
export const ROLES = {
  GENERAL: "general",
  SUB_GENERAL: "sub-general",
  HR_GENERAL: "hr-general",
  SALESMAN: "salesman",
};

export const ROLE_HIERARCHY = {
  general: 4,
  "sub-general": 3,
  "hr-general": 2,
  salesman: 1,
};

/**
 * Get current user's role and geographic permissions
 */
export const getUserRoleAndPermissions = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `id, email, role, employee_type, 
        assigned_cities, assigned_talukas, 
        user_role_assignments(id, role, assigned_cities, assigned_talukas)`
      )
      .eq("id", userId)
      .single();

    if (error) throw error;

    return {
      user: data,
      role: data.employee_type || data.role,
      assignedCities: data.assigned_cities || [],
      assignedTalukas: data.assigned_talukas || [],
    };
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
};

/**
 * Check if user has access to a specific city
 */
export const hasAccessToCity = (userRole, assignedCities, cityToCheck) => {
  if (userRole === ROLES.GENERAL) return true;
  if (userRole === ROLES.SUB_GENERAL || userRole === ROLES.HR_GENERAL) {
    return assignedCities.includes(cityToCheck);
  }
  return false;
};

/**
 * Check if user has access to a specific taluka
 */
export const hasAccessToTaluka = (userRole, assignedTalukas, talukaToCheck) => {
  if (userRole === ROLES.GENERAL) return true;
  if (userRole === ROLES.SUB_GENERAL || userRole === ROLES.HR_GENERAL) {
    return assignedTalukas.includes(talukaToCheck);
  }
  if (userRole === ROLES.SALESMAN) {
    return assignedTalukas.length === 1 && assignedTalukas[0] === talukaToCheck;
  }
  return false;
};

/**
 * Assign cities to Sub-General (General only)
 */
export const assignCitiesToSubGeneral = async (subGeneralId, cities) => {
  try {
    // Use upsert with ON CONFLICT to handle existing records
    const { data, error } = await supabase
      .from("user_role_assignments")
      .upsert(
        {
          user_id: subGeneralId,
          role: ROLES.SUB_GENERAL,
          assigned_cities: cities,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error assigning cities:", error);
    return { success: false, error };
  }
};

/**
 * Assign talukas to HR-General (Sub-General only)
 */
export const assignTalukasToHRGeneral = async (hrGeneralId, talukas, cityContext) => {
  try {
    // Use upsert with ON CONFLICT to handle existing records
    const { data, error } = await supabase
      .from("user_role_assignments")
      .upsert(
        {
          user_id: hrGeneralId,
          role: ROLES.HR_GENERAL,
          assigned_talukas: talukas,
          assigned_cities: [cityContext],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error assigning talukas:", error);
    return { success: false, error };
  }
};

/**
 * Assign taluka to Salesman (HR-General only)
 */
export const assignTalukaToSalesman = async (salesmanId, taluka) => {
  try {
    const { error } = await supabase
      .from("user_role_assignments")
      .upsert({
        user_id: salesmanId,
        role: ROLES.SALESMAN,
        assigned_talukas: [taluka],
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error assigning taluka to salesman:", error);
    return { success: false, error };
  }
};

/**
 * Get all users with a specific role
 */
export const getUsersByRole = async (role) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name, employee_type, created_at")
      .eq("employee_type", role);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching users by role:", error);
    return [];
  }
};

/**
 * Get role assignments for a user
 */
export const getRoleAssignments = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("user_role_assignments")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching role assignments:", error);
    return null;
  }
};

/**
 * Filter data based on user's geographic permissions
 */
export const filterDataByUserPermissions = (data, userRole, assignedCities, assignedTalukas) => {
  if (userRole === ROLES.GENERAL) return data;

  if (userRole === ROLES.SUB_GENERAL) {
    return data.filter((item) => assignedCities.includes(item.city));
  }

  if (userRole === ROLES.HR_GENERAL) {
    return data.filter((item) => assignedTalukas.includes(item.taluka));
  }

  if (userRole === ROLES.SALESMAN) {
    return data.filter(
      (item) => assignedTalukas.length === 1 && item.taluka === assignedTalukas[0]
    );
  }

  return [];
};

/**
 * Get talukas for a specific city
 */
export const getTalukasForCity = (gujaratCities, city) => {
  return gujaratCities[city] || [];
};

/**
 * Check hierarchical access (can user X assign to user Y)
 */
export const canAssignRole = (userRole, targetRole) => {
  const userHierarchy = ROLE_HIERARCHY[userRole];
  const targetHierarchy = ROLE_HIERARCHY[targetRole];

  if (!userHierarchy || !targetHierarchy) return false;

  // User can assign roles to lower hierarchy levels
  return userHierarchy > targetHierarchy;
};

/**
 * Validate geographic assignment (ensure talukas belong to city)
 */
export const validateTalukasBelongToCity = (gujaratCities, city, talukas) => {
  const cityTalukas = gujaratCities[city] || [];
  return talukas.every((taluka) => cityTalukas.includes(taluka));
};

/**
 * Get all Sub-Generals under a General
 */
export const getSubGeneralsUnderGeneral = async () => {
  try {
    const { data, error } = await supabase
      .from("user_role_assignments")
      .select(
        `user_id, assigned_cities, 
        profiles!inner(id, email, name, created_at)`
      )
      .eq("role", ROLES.SUB_GENERAL);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching sub-generals:", error);
    return [];
  }
};

/**
 * Get all HR-Generals under a Sub-General
 */
export const getHRGeneralsUnderSubGeneral = async (subGeneralId, assignedCities) => {
  try {
    const { data, error } = await supabase
      .from("user_role_assignments")
      .select(
        `user_id, assigned_talukas, assigned_cities,
        profiles!inner(id, email, name, created_at)`
      )
      .eq("role", ROLES.HR_GENERAL)
      .in("assigned_cities", assignedCities);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching HR-generals:", error);
    return [];
  }
};

/**
 * Get all Salesmen under an HR-General
 */
export const getSalesmenUnderHRGeneral = async (assignedTalukas) => {
  try {
    const { data, error } = await supabase
      .from("user_role_assignments")
      .select(
        `user_id, assigned_talukas,
        profiles!inner(id, email, name, created_at)`
      )
      .eq("role", ROLES.SALESMAN)
      .in("assigned_talukas", assignedTalukas);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching salesmen:", error);
    return [];
  }
};
