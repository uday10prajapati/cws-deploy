// Test ratings endpoint
import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRatings() {
  console.log("🧪 Testing ratings fetch from bookings table...\n");
  
  try {
    // Step 1: Check if ANY bookings with ratings exist
    console.log("📊 Step 1: Checking for any bookings with rating > 0...");
    const { data: allRatings, error: allError } = await supabase
      .from("bookings")
      .select("id, assigned_to, rating, rated_at")
      .gt("rating", 0)
      .limit(5);
    
    if (allError) {
      console.error("❌ Error fetching all ratings:", allError.message);
      return;
    }
    
    console.log(`✅ Found ${(allRatings || []).length} bookings with ratings`);
    if (allRatings && allRatings.length > 0) {
      console.log("Sample ratings found:");
      allRatings.forEach((r, i) => {
        console.log(`  ${i + 1}. Rating: ${r.rating}⭐ | Employee: ${r.assigned_to}`);
      });
    }
    
    // Step 2: Get employee IDs from rated bookings
    if (allRatings && allRatings.length > 0) {
      const employeeIds = [...new Set(allRatings.map(r => r.assigned_to).filter(Boolean))];
      console.log(`\n👥 Found ${employeeIds.length} employee(s) with ratings`);
      
      // Step 3: Test fetching ratings for first employee
      if (employeeIds.length > 0) {
        const testEmployeeId = employeeIds[0];
        console.log(`\n📈 Step 3: Fetching ratings for employee: ${testEmployeeId}`);
        
        const { data: employeeRatings, error: empError } = await supabase
          .from("bookings")
          .select("*")
          .eq("assigned_to", testEmployeeId)
          .gt("rating", 0)
          .order("rated_at", { ascending: false });
        
        if (empError) {
          console.error("❌ Error fetching employee ratings:", empError.message);
          return;
        }
        
        console.log(`✅ Found ${(employeeRatings || []).length} ratings for this employee`);
        
        // Calculate stats
        const totalRatings = (employeeRatings || []).length;
        const avgRating = totalRatings > 0 
          ? (employeeRatings.reduce((sum, b) => sum + (b.rating || 0), 0) / totalRatings).toFixed(1)
          : 0;
        
        console.log(`\n📊 Statistics:`);
        console.log(`   Total Ratings: ${totalRatings}`);
        console.log(`   Average Rating: ${avgRating}⭐`);
        
        if (employeeRatings && employeeRatings.length > 0) {
          console.log(`\n📝 Sample rating:`);
          const sample = employeeRatings[0];
          console.log(`   ID: ${sample.id}`);
          console.log(`   Rating: ${sample.rating}⭐`);
          console.log(`   Comment: ${sample.rating_comment || "No comment"}`);
          console.log(`   Date: ${sample.rated_at}`);
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testRatings();
