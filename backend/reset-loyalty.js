import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://cjaufvqninknntiukxka.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYXVmdnFuaW5rbm50aXVreGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MDA1MjcsImV4cCI6MjA0NjI3NjUyN30.xjB4eqAWGGOVqkHs9IJ_3xeFYaWZkAF8uJBx7bw-5Mw"
);

const customerId = "9f6c74f6-f581-475a-aa6f-22c7df0363ad"; // Your customer ID

async function resetLoyaltyPoints() {
  try {
    // Reset customer loyalty points to 0
    const { data, error } = await supabase
      .from("customer_loyalty_points")
      .update({
        total_points: 0,
        cars_washed: 0,
      })
      .eq("customer_id", customerId);

    if (error) {
      console.error("❌ Error resetting loyalty points:", error);
    } else {
      console.log("✅ Loyalty points reset to 0:", data);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

resetLoyaltyPoints();
