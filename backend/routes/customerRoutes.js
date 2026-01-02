import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * SECURE: Get All Customers with Role-Based & Geographic Filtering
 * 
 * FILTERING RULES:
 * - General: All customers across all cities/talukas
 * - Sub-General: Only customers in assigned cities
 * - HR-General: Only customers in assigned talukas
 * 
 * This filtering is ENFORCED at the backend level to prevent data leakage
 */
router.get("/all-customers", async (req, res) => {
  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: "No authentication token" });
    }

    // Decode JWT to get user ID
    let userId;
    try {
      const parts = token.split(".");
      const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString());
      userId = decoded.sub;
    } catch (e) {
      return res.status(401).json({ success: false, error: "Invalid token format" });
    }

    // Step 1: Get user profile and role
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("id, email, name, employee_type")
      .eq("id", userId)
      .single();

    if (userError || !userProfile) {
      return res.status(403).json({ success: false, error: "User profile not found" });
    }

    const userRole = userProfile.employee_type;

    // Step 2: Fetch all sales_cars without join (to avoid schema cache errors)
    // Step 2: Fetch all sales_cars with customer geographic data
    const { data: cars, error: carsError } = await supabase
      .from("sales_cars")
      .select("id, sales_person_id, model, number_plate, color, image_url_1, image_url_2, customer_name, customer_phone, customer_city, customer_taluko, created_at")
      .order("created_at", { ascending: false });

    if (carsError) {
      console.error("❌ Error fetching cars:", carsError);
      return res.status(400).json({ success: false, error: carsError.message });
    }

    // Step 3: Get user's geographic assignments based on role
    let userCities = [];
    let userTalukas = [];

    if (userRole === "sub-general") {
      const { data: assignments } = await supabase
        .from("user_role_assignments")
        .select("assigned_cities")
        .eq("user_id", userId)
        .eq("role", "sub-general")
        .maybeSingle();
      userCities = assignments?.assigned_cities || [];
    } 
    else if (userRole === "hr-general") {
      const { data: assignments } = await supabase
        .from("user_role_assignments")
        .select("assigned_talukas")
        .eq("user_id", userId)
        .eq("role", "hr-general")
        .maybeSingle();
      userTalukas = assignments?.assigned_talukas || [];
    }

    // Step 4: Get all sales person profiles with their geographic info
    const { data: allSalesPersons, error: salesPersonError } = await supabase
      .from("profiles")
      .select("id, name, email, employee_type, city, taluko")
      .eq("employee_type", "sales");

    if (salesPersonError) {
      console.error("❌ Error fetching sales persons:", salesPersonError);
    }

    console.log(`📋 Fetched ${allSalesPersons?.length || 0} sales persons from profiles table`);

    const salesPersonMap = {};
    allSalesPersons?.forEach(sp => {
      salesPersonMap[sp.id] = sp;
      console.log(`  ✓ Added sales person: ${sp.id} -> ${sp.name}`);
    });

    console.log(`🗺️ Sales Person Map created with ${Object.keys(salesPersonMap).length} entries`);

    // Step 5: Enrich cars data and apply role-based geographic filtering
    let enrichedCars = cars
      ?.map(car => ({
        id: car.id,
        customer_name: car.customer_name,
        customer_phone: car.customer_phone,
        customer_city: car.customer_city,
        customer_taluko: car.customer_taluko,
        car_model: car.model,
        car_number_plate: car.number_plate,
        car_color: car.color,
        image_url_1: car.image_url_1,
        image_url_2: car.image_url_2,
        created_at: car.created_at,
        added_by_sales_person: {
          id: salesPersonMap[car.sales_person_id]?.id,
          name: salesPersonMap[car.sales_person_id]?.name || "Unknown",
          email: salesPersonMap[car.sales_person_id]?.email || "N/A",
          type: salesPersonMap[car.sales_person_id]?.employee_type,
          city: salesPersonMap[car.sales_person_id]?.city,
          taluko: salesPersonMap[car.sales_person_id]?.taluko
        }
      })) || [];

    // Debug: Log which customers matched which sales persons
    cars?.forEach((car, idx) => {
      const found = salesPersonMap[car.sales_person_id];
      if (found) {
        console.log(`✓ Car ${idx + 1} (${car.customer_name}): sales_person_id=${car.sales_person_id} -> ${found.name}`);
      } else {
        console.log(`⛔ Car ${idx + 1} (${car.customer_name}): sales_person_id=${car.sales_person_id} NOT FOUND in map`);
      }
    });

    // Apply geographic filtering
    enrichedCars = enrichedCars.filter(car => {
      // Apply role-based geographic filtering based on CUSTOMER'S location
      if (userRole === "general") {
        return true; // Show all
      }
      else if (userRole === "sub-general") {
        // Show only customers from assigned cities (case-insensitive, normalized)
        // Normalize city names by removing "(City)" suffix for comparison
        const normalizeCityName = (city) => {
          return city?.toLowerCase().replace(/\s*\(city\)\s*/gi, '').trim() || '';
        };
        
        const normalizedCustomerCity = normalizeCityName(car.customer_city);
        const normalizedAssignedCities = userCities.map(c => normalizeCityName(c));
        const matches = normalizedAssignedCities.includes(normalizedCustomerCity);
        
        if (!matches) {
          console.log(`⛔ Customer ${car.customer_name} in city "${car.customer_city}" (normalized: "${normalizedCustomerCity}") not in assigned cities [${userCities.join(", ")}] (normalized: [${normalizedAssignedCities.join(", ")}])`);
        } else {
          console.log(`✓ Customer ${car.customer_name} in city "${car.customer_city}" matches assigned cities [${userCities.join(", ")}]`);
        }
        return matches;
      }
      else if (userRole === "hr-general") {
        // Show only customers from assigned talukas (case-insensitive)
        const customerTaluko = car.customer_taluko?.toLowerCase();
        const talukasLower = userTalukas.map(t => t.toLowerCase());
        const matches = talukasLower.includes(customerTaluko);
        if (matches) {
          console.log(`✓ Customer ${car.customer_name} in taluka "${car.customer_taluko}" matches assigned talukas [${userTalukas.join(", ")}]`);
        } else {
          console.log(`⛔ Customer ${car.customer_name} in taluka "${car.customer_taluko}" not in assigned talukas [${userTalukas.join(", ")}]`);
        }
        return matches;
      }
      return false;
    });

    // Log filtering details
    if (userRole === "general") {
      console.log(`✅ [General] Access to ALL customers (${enrichedCars.length} records)`);
    } else if (userRole === "sub-general") {
      console.log(`✅ [Sub-General] Access to customers in cities: ${userCities.join(", ")} (${enrichedCars.length} records)`);
    } else if (userRole === "hr-general") {
      console.log(`✅ [HR-General] Access to customers in talukas: ${userTalukas.join(", ")} (${enrichedCars.length} records)`);
    } else {
      return res.status(403).json({ 
        success: false, 
        error: "Only General, Sub-General, and HR-General roles can access all customers" 
      });
    }

    const filteredCars = enrichedCars;

    return res.json({ 
      success: true, 
      data: filteredCars,
      metadata: {
        user_role: userRole,
        total_count: filteredCars.length,
        filtering_applied: userRole !== "general"
      }
    });

  } catch (error) {
    console.error("❌ Error in /all-customers:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all salespeople (employees with employee_type = 'sales')
// Now includes role assignments to get taluko information
router.get("/salespeople", async (req, res) => {
  try {
    // Step 1: Get all salespeople profiles
    const { data: salespeople, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, name, phone, role, employee_type, city")
      .eq("role", "employee")
      .eq("employee_type", "sales")
      .order("created_at", { ascending: false });

    if (profileError) {
      console.error("❌ Error fetching salespeople from profiles:", profileError);
      return res.status(400).json({ success: false, error: profileError.message });
    }

    // Step 2: For each salesperson, fetch their role assignment data (which includes taluka)
    const enrichedSalespeople = await Promise.all(
      (salespeople || []).map(async (sp) => {
        const { data: roleAssignment } = await supabase
          .from("user_role_assignments")
          .select("assigned_talukas")
          .eq("user_id", sp.id)
          .maybeSingle();

        return {
          id: sp.id,
          email: sp.email,
          name: sp.name,
          phone: sp.phone,
          role: sp.role,
          employee_type: sp.employee_type,
          city: sp.city,
          // Extract taluka from assigned_talukas array (if available)
          taluka: roleAssignment?.assigned_talukas?.[0] || null,
          assigned_talukas: roleAssignment?.assigned_talukas || []
        };
      })
    );

    console.log(`✅ Fetched ${enrichedSalespeople.length} salespeople with role assignments:`, enrichedSalespeople);
    
    res.json({ success: true, data: enrichedSalespeople });
  } catch (error) {
    console.error("❌ Error in /salespeople:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get salesperson by ID
router.get("/salespeople/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("employee_type", "sales")
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update salesperson info
router.put("/salespeople/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, city, taluka } = req.body;

    const { data, error } = await supabase
      .from("profiles")
      .update({
        name,
        phone,
        city,
        taluka
      })
      .eq("id", id)
      .eq("employee_type", "sales")
      .select();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
