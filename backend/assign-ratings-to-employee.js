import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function assignRatingsToEmployee() {
  console.log('🔄 Assigning bookings with ratings to employees...\n');
  
  try {
    // Get all users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found');
      return;
    }
    
    // Pick any user as employee (you can customize this logic)
    const employeeId = users[0].id;
    console.log(`👤 Using employee ID: ${employeeId}\n`);
    
    // Get all bookings with ratings but no assigned_to
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, rating, rating_comment')
      .gt('rating', 0)
      .is('assigned_to', null);
    
    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError.message);
      return;
    }
    
    if (!bookings || bookings.length === 0) {
      console.log('✅ No bookings need assignment (all already have assigned_to)');
      return;
    }
    
    console.log(`📝 Found ${bookings.length} bookings with ratings but no employee assigned\n`);
    
    // Update all these bookings to assign to employee
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ assigned_to: employeeId })
      .gt('rating', 0)
      .is('assigned_to', null);
    
    if (updateError) {
      console.error('❌ Error updating bookings:', updateError.message);
      return;
    }
    
    console.log(`✅ Successfully assigned ${bookings.length} bookings to employee!`);
    console.log(`\n📊 Assigned bookings:`);
    bookings.forEach((b, i) => {
      console.log(`  ${i + 1}. ID: ${b.id.substring(0, 8)}... | Rating: ${b.rating}⭐ | Comment: "${b.rating_comment}"`);
    });
    
    console.log('\n🎉 Done! Refresh the ratings page now to see the data.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

assignRatingsToEmployee();
