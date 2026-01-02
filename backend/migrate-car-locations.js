/**
 * Migration Script: Backfill missing customer_city and customer_taluko
 * 
 * Usage: node migrate-car-locations.js
 * 
 * This script updates all sales_cars records that have NULL customer_city or 
 * customer_taluko by using the sales person's assigned city and taluko.
 */

import { supabase } from "./supabase.js";

async function backfillLocations() {
  try {
    console.log("🚀 Starting car location backfill migration...\n");

    // Fetch all cars with NULL customer_city or customer_taluko
    const { data: carsWithMissingLocation, error: fetchError } = await supabase
      .from("sales_cars")
      .select("id, sales_person_id, customer_name, customer_city, customer_taluko")
      .or("customer_city.is.null,customer_taluko.is.null");

    if (fetchError) {
      throw new Error(`Failed to fetch cars: ${fetchError.message}`);
    }

    console.log(`📊 Found ${carsWithMissingLocation?.length || 0} cars with missing location data\n`);

    if (!carsWithMissingLocation || carsWithMissingLocation.length === 0) {
      console.log("✅ No cars with missing location data. Migration complete!");
      process.exit(0);
    }

    let updated = 0;
    const errors = [];

    // For each car, fetch the sales person and populate location
    for (const car of carsWithMissingLocation) {
      try {
        console.log(`Processing car: ${car.customer_name} (ID: ${car.id})`);
        
        // Get sales person's city and taluko
        const { data: salesPerson, error: spError } = await supabase
          .from("profiles")
          .select("id, name, city, taluko")
          .eq("id", car.sales_person_id)
          .single();

        if (spError) {
          const msg = `Could not find sales person ${car.sales_person_id}`;
          console.log(`  ❌ ${msg}`);
          errors.push(`Car ${car.id} (${car.customer_name}): ${msg}`);
          continue;
        }

        if (!salesPerson?.city || !salesPerson?.taluko) {
          const msg = `Sales person "${salesPerson?.name}" has missing city or taluko`;
          console.log(`  ❌ ${msg}`);
          errors.push(`Car ${car.id} (${car.customer_name}): ${msg}`);
          continue;
        }

        // Update the car with sales person's city and taluko
        const { error: updateError } = await supabase
          .from("sales_cars")
          .update({
            customer_city: salesPerson.city,
            customer_taluko: salesPerson.taluko
          })
          .eq("id", car.id);

        if (updateError) {
          const msg = `Update failed: ${updateError.message}`;
          console.log(`  ❌ ${msg}`);
          errors.push(`Car ${car.id} (${car.customer_name}): ${msg}`);
        } else {
          updated++;
          console.log(`  ✓ Updated: city=${salesPerson.city}, taluko=${salesPerson.taluko}`);
        }
      } catch (err) {
        const msg = `Exception: ${err.message}`;
        console.log(`  ❌ ${msg}`);
        errors.push(`Car ${car.id}: ${msg}`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Migration Summary:`);
    console.log(`   Total cars processed: ${carsWithMissingLocation.length}`);
    console.log(`   Successfully updated: ${updated}`);
    console.log(`   Failed: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log(`${'='.repeat(60)}\n`);
    process.exit(errors.length > 0 ? 1 : 0);

  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

// Run the migration
backfillLocations();
