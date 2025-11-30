import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  console.log('📊 Checking bookings in database...\n');
  
  const { data: bookings, error } = await supabase.from('bookings').select('id, rating, assigned_to, status').limit(10);
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`Total bookings found: ${bookings ? bookings.length : 0}`);
  
  if (bookings && bookings.length > 0) {
    console.log('\n✅ Sample bookings:');
    bookings.forEach(b => {
      const id = b.id.substring(0, 8);
      const emp = b.assigned_to ? b.assigned_to.substring(0, 8) : 'NULL';
      console.log(`  ID: ${id}... | Rating: ${b.rating} | Employee: ${emp}... | Status: ${b.status}`);
    });
    
    const withRatings = bookings.filter(b => b.rating && b.rating > 0);
    console.log(`\n📈 Bookings with rating > 0: ${withRatings.length}`);
    
    if (withRatings.length > 0) {
      console.log('Details:');
      withRatings.forEach(b => {
        console.log(`  - Rating: ${b.rating}⭐ | Employee: ${b.assigned_to}`);
      });
    }
  } else {
    console.log('  ❌ No bookings found');
  }
}

check();
