/**
 * 🔐 ROLE-BASED ACCESS CONTROL UTILITIES (Frontend)
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

import { GUJARAT_CITIES } from "../constants/gujaratConstants";
import { supabase } from "../supabaseClient";

/**
 * Get all talukas for a city
 * @param {string} city - City name
 * @returns {Array} List of talukas
 */
export function getTalukasForCity(city) {
  return GUJARAT_CITIES[city] || [];
}

/**
 * Check if a taluka belongs to a city
 * @param {string} city - City name
 * @param {string} taluka - Taluka name
 * @returns {boolean} True if taluka belongs to city
 */
export function talukaExistsInCity(city, taluka) {
  const cityTalukas = GUJARAT_CITIES[city] || [];
  return cityTalukas.includes(taluka);
}

/**
 * Find which city a taluka belongs to
 * @param {string} taluka - Taluka name
 * @returns {string|null} City name or null
 */
export function findCityForTaluka(taluka) {
  for (const [city, talukas] of Object.entries(GUJARAT_CITIES)) {
    if (talukas.includes(taluka)) {
      return city;
    }
  }
  return null;
}

/**
 * 🔐 Verify Sub-Admin can see talukas
 * Sub-Admin assigned to City can see ALL talukas under that city
 * 
 * @param {Array} assignedCities - Sub-Admin's assigned cities
 * @param {string} talukaToCheck - Taluka to verify
 * @returns {boolean} True if Sub-Admin has access
 */
export function subAdminCanAccessTaluka(assignedCities, talukaToCheck) {
  // Sub-Admin can access taluka if it belongs to any of their assigned cities
  for (const city of assignedCities) {
    const cityTalukas = getTalukasForCity(city);
    if (cityTalukas.includes(talukaToCheck)) {
      return true;
    }
  }
  return false;
}

/**
 * 🔐 Verify HR can see talukas
 * HR is assigned specific talukas only
 * 
 * @param {Array} assignedTalukas - HR's assigned talukas
 * @param {string} talukaToCheck - Taluka to verify
 * @returns {boolean} True if HR has access
 */
export function hrCanAccessTaluka(assignedTalukas, talukaToCheck) {
  return assignedTalukas.includes(talukaToCheck);
}

/**
 * 🔐 Validate Sub-Admin to HR assignment
 * Sub-Admin can only assign talukas that belong to their assigned cities
 * 
 * @param {Array} subAdminCities - Sub-Admin's assigned cities
 * @param {Array} talukasToAssign - Talukas to assign to HR
 * @returns {Object} {valid: boolean, invalidTalukas: Array}
 */
export function validateSubAdminToHRAssignment(subAdminCities, talukasToAssign) {
  const invalidTalukas = [];

  for (const taluka of talukasToAssign) {
    const belongsToCity = subAdminCities.some((city) =>
      talukaExistsInCity(city, taluka)
    );

    if (!belongsToCity) {
      invalidTalukas.push(taluka);
    }
  }

  return {
    valid: invalidTalukas.length === 0,
    invalidTalukas,
  };
}

/**
 * 🔐 Validate HR to Washer assignment
 * HR can only assign washers to wash areas in their assigned talukas
 * 
 * @param {Array} hrTalukas - HR's assigned talukas
 * @param {string} washAreaTaluka - Taluka of the wash area
 * @returns {Object} {valid: boolean, error?: string}
 */
export function validateHRToWasherAssignment(hrTalukas, washAreaTaluka) {
  if (!hrTalukas.includes(washAreaTaluka)) {
    return {
      valid: false,
      error: `Wash area must be in one of your assigned talukas: ${hrTalukas.join(
        ", "
      )}`,
    };
  }

  return { valid: true };
}

/**
 * Filter cities based on user role
 * @param {string} userRole - User's role
 * @param {Array} assignedCities - Assigned cities (for sub-admin)
 * @returns {Array} Filtered list of cities
 */
export function getAccessibleCities(userRole, assignedCities = []) {
  if (userRole === "admin") {
    return Object.keys(GUJARAT_CITIES);
  }

  if (userRole === "sub-admin") {
    return assignedCities || [];
  }

  // HR and Washer cannot access city-level data
  return [];
}

/**
 * Filter talukas based on user role
 * @param {string} userRole - User's role
 * @param {Array} assignedCities - Assigned cities (for sub-admin)
 * @param {Array} assignedTalukas - Assigned talukas (for hr/washer)
 * @returns {Array} Filtered list of talukas
 */
export function getAccessibleTalukas(userRole, assignedCities = [], assignedTalukas = []) {
  if (userRole === "admin") {
    // Admin can see all talukas
    return Object.values(GUJARAT_CITIES).flat();
  }

  if (userRole === "sub-admin") {
    // Sub-Admin can see all talukas under assigned cities
    const talukas = [];
    for (const city of assignedCities) {
      talukas.push(...getTalukasForCity(city));
    }
    return [...new Set(talukas)]; // Remove duplicates
  }

  if (userRole === "hr") {
    // HR can see only assigned talukas
    return assignedTalukas || [];
  }

  // Washer cannot access taluka-level data
  return [];
}

/**
 * 🔐 Filter users based on geographic access
 * @param {Array} users - List of users to filter
 * @param {string} userRole - Current user's role
 * @param {Array} assignedCities - Current user's assigned cities
 * @param {Array} assignedTalukas - Current user's assigned talukas
 * @returns {Array} Filtered users
 */
export function filterUsersByGeographicAccess(
  users,
  userRole,
  assignedCities = [],
  assignedTalukas = []
) {
  if (userRole === "admin") {
    return users; // Admin sees all users
  }

  if (userRole === "sub-admin") {
    // Sub-Admin sees users in their assigned cities
    return users.filter((user) => assignedCities.includes(user.city));
  }

  if (userRole === "hr") {
    // HR sees users in their assigned talukas
    return users.filter((user) => assignedTalukas.includes(user.taluko));
  }

  // Washer sees only relevant users
  return [];
}

/**
 * 🔐 Filter cars based on geographic access
 * @param {Array} cars - List of cars to filter
 * @param {Array} customers - List of customers (for location info)
 * @param {string} userRole - Current user's role
 * @param {Array} assignedCities - Current user's assigned cities
 * @param {Array} assignedTalukas - Current user's assigned talukas
 * @returns {Array} Filtered cars
 */
export function filterCarsByGeographicAccess(
  cars,
  customers,
  userRole,
  assignedCities = [],
  assignedTalukas = []
) {
  if (userRole === "admin") {
    return cars; // Admin sees all cars
  }

  if (userRole === "sub-admin") {
    // Sub-Admin sees cars of customers in their assigned cities
    const cityCustomerIds = customers
      .filter((c) => assignedCities.includes(c.city))
      .map((c) => c.id);

    return cars.filter((car) => cityCustomerIds.includes(car.customer_id));
  }

  if (userRole === "hr") {
    // HR sees cars of customers in their assigned talukas
    const talukaCustomerIds = customers
      .filter((c) => assignedTalukas.includes(c.taluko))
      .map((c) => c.id);

    return cars.filter((car) => talukaCustomerIds.includes(car.customer_id));
  }

  return [];
}

/**
 * Get dropdown options for role-based assignment
 * Returns formatted options for dropdown menus
 */
export function getAssignmentOptions(userRole, assignedCities = [], assignedTalukas = []) {
  return {
    // Options for assigning cities to Sub-Admin (Admin only)
    citiesForSubAdmin: () => Object.keys(GUATEMALA_CITIES),

    // Options for assigning talukas to HR (Sub-Admin only)
    talukasForHR: () => {
      const talukas = [];
      for (const city of assignedCities) {
        talukas.push(...getTalukasForCity(city));
      }
      return [...new Set(talukas)];
    },

    // Options for assigning washers to Wash Area (HR only)
    washersForWashArea: () => {
      // This would fetch washers from the database
      // filtered by assigned talukas
      return [];
    },
  };
}

/**
 * Get user's complete permission summary
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User permissions
 */
export async function getUserPermissions(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, assigned_cities, assigned_talukas, city, taluko")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return {
      role: data.role,
      assignedCities: data.assigned_cities || [],
      assignedTalukas: data.assigned_talukas || [],
      city: data.city,
      taluko: data.taluko,
      accessibleCities: getAccessibleCities(data.role, data.assigned_cities),
      accessibleTalukas: getAccessibleTalukas(
        data.role,
        data.assigned_cities,
        data.assigned_talukas
      ),
    };
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return null;
  }
}

/**
 * Debug helper: Log permission hierarchy
 */
export function logPermissionHierarchy(userRole, assignedCities = [], assignedTalukas = []) {
  console.group(`📊 Permission Hierarchy - ${userRole.toUpperCase()}`);

  if (userRole === "admin") {
    console.log("✅ Access Level: FULL");
    console.log("✅ Can see: All cities, all talukas, all wash areas");
  }

  if (userRole === "sub-admin") {
    console.log("✅ Access Level: CITY + TALUKA");
    console.log(`✅ Assigned Cities: ${assignedCities.join(", ")}`);

    const accessibleTalukas = getAccessibleTalukas(
      userRole,
      assignedCities,
      assignedTalukas
    );
    console.log(`✅ Accessible Talukas: ${accessibleTalukas.join(", ")}`);
    console.log("✅ Can assign: Talukas under assigned cities to HR");
  }

  if (userRole === "hr") {
    console.log("✅ Access Level: TALUKA ONLY");
    console.log(`✅ Assigned Talukas: ${assignedTalukas.join(", ")}`);
    console.log("✅ Can assign: Washers to wash areas under assigned talukas");
  }

  if (userRole === "washer") {
    console.log("✅ Access Level: WASH AREA ONLY");
    console.log("✅ Can see: Only assigned wash areas and cars");
  }

  console.groupEnd();
}
