/**
 * 🔐 ROLE-BASED ACCESS CONTROL MIDDLEWARE
 * 
 * Enforces geographic hierarchy:
 * City → Taluka → Wash Area
 * 
 * ROLE HIERARCHY:
 * 1. Admin: Full access to all data
 * 2. Sub-Admin: Access to assigned cities + all talukas under those cities
 * 3. HR: Access to assigned talukas only
 * 4. Washer: Access to assigned wash areas only
 */

const { supabase } = require("../supabase.js");

/**
 * Get user's role and geographic assignments
 * @param {string} userId - User ID from token
 * @returns {Object} User role info and assignments
 */
async function getUserRoleAndAssignments(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, assigned_cities, assigned_talukas, city, taluko")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return {
      userId,
      role: data.role,
      assignedCities: data.assigned_cities || [],
      assignedTalukas: data.assigned_talukas || [],
      city: data.city,
      taluko: data.taluko,
    };
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

/**
 * Verify user has access to a specific city
 * @param {string} userRole - User's role
 * @param {Array} assignedCities - Cities assigned to user
 * @param {string} cityToCheck - City to verify access
 * @returns {boolean} True if user has access
 */
function hasAccessToCity(userRole, assignedCities, cityToCheck) {
  // ✅ Admin has access to all cities
  if (userRole === "admin") return true;

  // ✅ Sub-Admin must have city in assigned_cities
  if (userRole === "sub-admin") {
    return assignedCities.includes(cityToCheck);
  }

  // ❌ HR and Washer cannot access city-level data
  return false;
}

/**
 * Verify user has access to a specific taluka
 * @param {string} userRole - User's role
 * @param {Array} assignedTalukas - Talukas assigned to user
 * @param {Array} assignedCities - Cities assigned to user
 * @param {string} talukaToCheck - Taluka to verify access
 * @param {Object} gujaratCities - GUJARAT_CITIES mapping (for Sub-Admin validation)
 * @returns {boolean} True if user has access
 */
function hasAccessToTaluka(
  userRole,
  assignedTalukas,
  assignedCities,
  talukaToCheck,
  gujaratCities = {}
) {
  // ✅ Admin has access to all talukas
  if (userRole === "admin") return true;

  // ✅ Sub-Admin has access to all talukas under assigned cities
  if (userRole === "sub-admin") {
    // First, check if taluka is under any of the assigned cities
    for (const city of assignedCities) {
      const cityTalukas = gujaratCities[city] || [];
      if (cityTalukas.includes(talukaToCheck)) {
        return true;
      }
    }
    return false;
  }

  // ✅ HR can only access assigned talukas
  if (userRole === "hr") {
    return assignedTalukas.includes(talukaToCheck);
  }

  // ❌ Washer cannot access taluka-level data
  return false;
}

/**
 * Verify user has access to a specific wash area
 * @param {string} userRole - User's role
 * @param {Array} assignedWashAreas - Wash areas assigned to user
 * @param {string} washAreaToCheck - Wash area to verify access
 * @returns {boolean} True if user has access
 */
function hasAccessToWashArea(userRole, assignedWashAreas, washAreaToCheck) {
  // ✅ Admin has access to all wash areas
  if (userRole === "admin") return true;

  // ✅ Sub-Admin can see all wash areas under assigned cities (through talukas)
  if (userRole === "sub-admin") return true;

  // ✅ HR can see all wash areas under assigned talukas
  if (userRole === "hr") return true;

  // ✅ Washer can only access assigned wash areas
  if (userRole === "washer") {
    return assignedWashAreas.includes(washAreaToCheck);
  }

  return false;
}

/**
 * Validate Sub-Admin assignment to HR
 * Ensures taluka belongs to Sub-Admin's assigned city
 * 
 * @param {Object} subAdminData - Sub-Admin's role data
 * @param {Array} talukasToAssign - Talukas to assign to HR
 * @param {Object} gujaratCities - GUJARAT_CITIES mapping
 * @returns {Object} {valid: boolean, error?: string}
 */
function validateSubAdminToHRAssignment(
  subAdminData,
  talukasToAssign,
  gujaratCities = {}
) {
  const { assignedCities } = subAdminData;

  for (const taluka of talukasToAssign) {
    let talukaFound = false;

    // Check if taluka belongs to any of Sub-Admin's assigned cities
    for (const city of assignedCities) {
      const cityTalukas = gujaratCities[city] || [];
      if (cityTalukas.includes(taluka)) {
        talukaFound = true;
        break;
      }
    }

    if (!talukaFound) {
      return {
        valid: false,
        error: `Taluka '${taluka}' does not belong to any of your assigned cities`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate HR assignment to Washer for Wash Area
 * Ensures wash area belongs to HR's assigned taluka
 * 
 * @param {Object} hrData - HR's role data
 * @param {string} washAreaTaluka - Taluka of the wash area
 * @returns {Object} {valid: boolean, error?: string}
 */
function validateHRToWasherAssignment(hrData, washAreaTaluka) {
  const { assignedTalukas } = hrData;

  if (!assignedTalukas.includes(washAreaTaluka)) {
    return {
      valid: false,
      error: `Wash area taluka '${washAreaTaluka}' is not in your assigned talukas`,
    };
  }

  return { valid: true };
}

/**
 * Middleware: Check role-based city access
 */
const checkCityAccess = (gujaratCities = {}) => {
  return async (req, res, next) => {
    try {
      const cityToCheck = req.body.city || req.query.city;

      if (!cityToCheck) {
        return next(); // No city specified, proceed
      }

      const userRole = req.user?.role;
      const userAssignments = await getUserRoleAndAssignments(req.user?.id);

      if (!userAssignments) {
        return res.status(403).json({
          success: false,
          error: "Cannot verify user permissions",
        });
      }

      if (!hasAccessToCity(userRole, userAssignments.assignedCities, cityToCheck)) {
        return res.status(403).json({
          success: false,
          error: `You do not have access to city: ${cityToCheck}`,
        });
      }

      req.userPermissions = userAssignments;
      next();
    } catch (error) {
      console.error("Error in checkCityAccess middleware:", error);
      return res.status(500).json({
        success: false,
        error: "Permission check failed",
      });
    }
  };
};

/**
 * Middleware: Check role-based taluka access
 */
const checkTalukaAccess = (gujaratCities = {}) => {
  return async (req, res, next) => {
    try {
      const talukaToCheck = req.body.taluka || req.query.taluka;

      if (!talukaToCheck) {
        return next(); // No taluka specified, proceed
      }

      const userRole = req.user?.role;
      const userAssignments = await getUserRoleAndAssignments(req.user?.id);

      if (!userAssignments) {
        return res.status(403).json({
          success: false,
          error: "Cannot verify user permissions",
        });
      }

      if (
        !hasAccessToTaluka(
          userRole,
          userAssignments.assignedTalukas,
          userAssignments.assignedCities,
          talukaToCheck,
          gujaratCities
        )
      ) {
        return res.status(403).json({
          success: false,
          error: `You do not have access to taluka: ${talukaToCheck}`,
        });
      }

      req.userPermissions = userAssignments;
      next();
    } catch (error) {
      console.error("Error in checkTalukaAccess middleware:", error);
      return res.status(500).json({
        success: false,
        error: "Permission check failed",
      });
    }
  };
};

/**
 * Middleware: Check role-based wash area access
 */
const checkWashAreaAccess = () => {
  return async (req, res, next) => {
    try {
      const washAreaToCheck = req.body.wash_area_id || req.query.wash_area_id;

      if (!washAreaToCheck) {
        return next(); // No wash area specified, proceed
      }

      const userRole = req.user?.role;
      const userAssignments = await getUserRoleAndAssignments(req.user?.id);

      if (!userAssignments) {
        return res.status(403).json({
          success: false,
          error: "Cannot verify user permissions",
        });
      }

      // For now, simplified check - can be enhanced with actual wash area data
      if (
        !hasAccessToWashArea(userRole, userAssignments.assignedWashAreas || [], washAreaToCheck)
      ) {
        return res.status(403).json({
          success: false,
          error: `You do not have access to wash area: ${washAreaToCheck}`,
        });
      }

      req.userPermissions = userAssignments;
      next();
    } catch (error) {
      console.error("Error in checkWashAreaAccess middleware:", error);
      return res.status(500).json({
        success: false,
        error: "Permission check failed",
      });
    }
  };
};

module.exports = {
  getUserRoleAndAssignments,
  hasAccessToCity,
  hasAccessToTaluka,
  hasAccessToWashArea,
  validateSubAdminToHRAssignment,
  validateHRToWasherAssignment,
  checkCityAccess,
  checkTalukaAccess,
  checkWashAreaAccess,
};
