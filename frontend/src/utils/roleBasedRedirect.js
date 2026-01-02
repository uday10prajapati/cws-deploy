import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

/**
 * Custom hook for role-based redirect
 * @param {string|array} requiredRole - The role(s) required to access this page (admin, employee, or customer)
 * @returns {void}
 */
export const useRoleBasedRedirect = (requiredRole) => {
  const navigate = useNavigate();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only check once per component mount
    if (hasChecked.current) return;
    hasChecked.current = true;

    const userRole = localStorage.getItem("userRole");
    const userEmployeeType = localStorage.getItem("userEmployeeType");

    // If no role found, redirect to login
    if (!userRole) {
      navigate("/login", { replace: true });
      return;
    }

    // Convert requiredRole to array if it's a string
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    // If user has one of the required roles, allow access
    if (requiredRoles.includes(userRole)) {
      return;
    }

    // Special case: employee type role checking (for sales, washer, rider)
    if (userRole === "employee" && requiredRole === "sales" && userEmployeeType === "sales") {
      return; // Allow access for sales employees to sales dashboard
    }

    // If user has different role, redirect to their dashboard
    if (userRole === "admin" || userRole === "sub-admin" || userRole === "hr") {
      navigate("/admin-dashboard", { replace: true });
    } else if (userRole === "employee") {
      // Redirect based on employee type
      if (userEmployeeType === "sales") {
        navigate("/sales-dashboard", { replace: true });
      } else if (userEmployeeType === "washer") {
        navigate("/carwash", { replace: true });
      } else if (userEmployeeType === "rider") {
        navigate("/employee-dashboard", { replace: true });
      } else {
        navigate("/employee-dashboard", { replace: true });
      }
    } else if (userRole === "customer") {
      navigate("/customer-dashboard", { replace: true });
    } else {
      // Unknown role, redirect to login
      navigate("/login", { replace: true });
    }
  }, [navigate]);
};

/**
 * Function to get current user details from local storage
 * @returns {Object|null} User details object or null if not found
 */
export const getUserDetails = () => {
  try {
    const userDetailsStr = localStorage.getItem("userDetails");
    return userDetailsStr ? JSON.parse(userDetailsStr) : null;
  } catch (error) {
    console.error("Error parsing user details from localStorage:", error);
    return null;
  }
};

/**
 * Function to get current user role from local storage
 * @returns {string|null} User role or null if not found
 */
export const getUserRole = () => {
  return localStorage.getItem("userRole");
};

/**
 * Function to get current user ID from local storage
 * @returns {string|null} User ID or null if not found
 */
export const getUserId = () => {
  return localStorage.getItem("userId");
};

/**
 * Function to clear user data from local storage (logout)
 * @returns {void}
 */
export const clearUserData = () => {
  localStorage.removeItem("userDetails");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
};

/**
 * Function to check if user is authenticated
 * @returns {boolean} True if user is authenticated, false otherwise
 */
export const isUserAuthenticated = () => {
  return localStorage.getItem("userRole") !== null;
};
