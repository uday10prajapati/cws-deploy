import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createSampleData() {
  console.log('🚀 Creating sample bookings with ratings...\n');
  
  try {
    // First, get a test employee and customer from auth.users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError || !users || users.length < 2) {
      console.error('❌ Need at least 2 users in database (employee + customer)');
      console.log('Current users:', users?.length || 0);
      return;
    }
    
    const employee = users[0];
    const customer = users[1];
    
    console.log(`👥 Using:`);
    console.log(`   Employee: ${employee.id}`);
    console.log(`   Customer: ${customer.id}\n`);
    
    // Get a car for the customer
    const { data: cars } = await supabase
      .from('cars')
      .select('id, car_name')
      .eq('customer_id', customer.id)
      .limit(1);
    
    let carId = null;
    if (cars && cars.length > 0) {
      carId = cars[0].id;
      console.log(`🚗 Using car: ${cars[0].car_name}\n`);
    } else {
      console.log('⚠️ No cars found for customer, creating sample booking without car\n');
    }
    
    // Create 5 sample bookings with ratings
    const sampleBookings = [
      {
        customer_id: customer.id,
        car_id: carId,
        assigned_to: employee.id,
        date: '2025-12-01',
        time: '10:00 AM',
        location: 'Home',
        amount: 500,
        status: 'Completed',
        services: ['wash', 'interior'],
        rating: 5,
        rating_comment: 'Excellent service! Very professional and thorough.',
        rated_at: new Date().toISOString(),
      },
      {
        customer_id: customer.id,
        car_id: carId,
        assigned_to: employee.id,
        date: '2025-11-28',
        time: '2:00 PM',
        location: 'Office',
        amount: 450,
        status: 'Completed',
        services: ['wash'],
        rating: 4,
        rating_comment: 'Good job, finished on time.',
        rated_at: new Date().toISOString(),
      },
      {
        customer_id: customer.id,
        car_id: carId,
        assigned_to: employee.id,
        date: '2025-11-25',
        time: '11:00 AM',
        location: 'Home',
        amount: 600,
        status: 'Completed',
        services: ['wash', 'interior', 'detailing'],
        rating: 5,
        rating_comment: 'Amazing! My car looks brand new.',
        rated_at: new Date().toISOString(),
      },
      {
        customer_id: customer.id,
        car_id: carId,
        assigned_to: employee.id,
        date: '2025-11-20',
        time: '3:00 PM',
        location: 'Home',
        amount: 400,
        status: 'Completed',
        services: ['wash'],
        rating: 3,
        rating_comment: 'Average service, could be better.',
        rated_at: new Date().toISOString(),
      },
      {
        customer_id: customer.id,
        car_id: carId,
        assigned_to: employee.id,
        date: '2025-11-15',
        time: '9:00 AM',
        location: 'Mall',
        amount: 550,
        status: 'Completed',
        services: ['wash', 'interior'],
        rating: 4,
        rating_comment: 'Good cleaning, reasonable price.',
        rated_at: new Date().toISOString(),
      },
    ];
    
    console.log(`📝 Inserting ${sampleBookings.length} sample bookings...\n`);
    
    for (let i = 0; i < sampleBookings.length; i++) {
      const booking = sampleBookings[i];
      const { data: inserted, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select();
      
      if (error) {
        console.error(`❌ Error creating booking ${i + 1}:`, error.message);
      } else {
        console.log(`✅ Booking ${i + 1}: ${booking.rating}⭐ - "${booking.rating_comment.substring(0, 30)}..."`);
      }
    }
    
    console.log('\n🎉 Sample data created! Refresh the ratings page now.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createSampleData();
