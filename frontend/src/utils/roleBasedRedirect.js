import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

/**
 * Custom hook for role-based redirect
 * @param {string} requiredRole - The role required to access this page (admin, employee, or customer)
 * @returns {void}
 */
export const useRoleBasedRedirect = (requiredRole) => {
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");

    // If no role found, redirect to login
    if (!userRole) {
      navigate("/login");
      return;
    }

    // If user has the required role, allow access
    if (userRole === requiredRole) {
      return;
    }

    // If user has different role, redirect to their dashboard
    if (userRole === "admin") {
      navigate("/admin-dashboard");
    } else if (userRole === "employee") {
      navigate("/employee-dashboard");
    } else if (userRole === "customer") {
      navigate("/customer-dashboard");
    } else {
      // Unknown role, redirect to login
      navigate("/login");
    }
  }, [requiredRole, navigate]);
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
