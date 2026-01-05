import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

/**
 * START LIVE TRACKING
 * POST /api/live-tracking/start
 * Washer clicks "I am starting to reach you"
 */
router.post('/start', async (req, res) => {
  try {
    const { requestId, customerId } = req.body;
    const washerId = req.user.id; // From auth middleware

    if (!requestId || !customerId) {
      return res.status(400).json({ error: 'requestId and customerId required' });
    }

    // Get washer's current location
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Current location required' });
    }

    // Create live tracking record
    const { data: trackingData, error: trackingError } = await supabase
      .from('live_tracking')
      .insert([
        {
          request_id: requestId,
          washer_id: washerId,
          customer_id: customerId,
          latitude,
          longitude,
          status: 'on_the_way',
          accuracy: req.body.accuracy || null,
          heading: req.body.heading || null,
          speed: req.body.speed || null,
        },
      ])
      .select()
      .single();

    if (trackingError) throw trackingError;

    // Update emergency_wash_requests to link tracking
    const { error: updateError } = await supabase
      .from('emergency_wash_requests')
      .update({
        tracking_id: trackingData.id,
        tracking_status: 'on_the_way',
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    console.log('✅ Live tracking started:', {
      trackingId: trackingData.id,
      washerId,
      customerId,
      location: { latitude, longitude },
    });

    res.json({
      success: true,
      trackingId: trackingData.id,
      message: 'Live tracking started',
    });
  } catch (error) {
    console.error('❌ Error starting live tracking:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * UPDATE WASHER LOCATION
 * POST /api/live-tracking/update-location
 * Continuously sends washer GPS location
 */
router.post('/update-location', async (req, res) => {
  try {
    const { trackingId, latitude, longitude, accuracy, heading, speed } = req.body;
    const washerId = req.user.id;

    if (!trackingId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'trackingId, latitude, and longitude required',
      });
    }

    // Verify this tracking record belongs to the washer
    const { data: existingTracking } = await supabase
      .from('live_tracking')
      .select('id')
      .eq('id', trackingId)
      .eq('washer_id', washerId)
      .single();

    if (!existingTracking) {
      return res.status(403).json({ error: 'Tracking record not found or unauthorized' });
    }

    // Update location
    const { data: updatedTracking, error: updateError } = await supabase
      .from('live_tracking')
      .update({
        latitude,
        longitude,
        accuracy: accuracy || null,
        heading: heading || null,
        speed: speed || null,
        updated_at: new Date(),
      })
      .eq('id', trackingId)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log('📍 Location updated:', {
      trackingId,
      location: { latitude, longitude },
      accuracy,
    });

    res.json({
      success: true,
      message: 'Location updated',
      updatedAt: updatedTracking.updated_at,
    });
  } catch (error) {
    console.error('❌ Error updating location:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * WASHER REACHED LOCATION
 * POST /api/live-tracking/reached
 * Washer clicks "I have reached"
 */
router.post('/reached', async (req, res) => {
  try {
    const { trackingId } = req.body;
    const washerId = req.user.id;

    if (!trackingId) {
      return res.status(400).json({ error: 'trackingId required' });
    }

    // Update tracking status to 'reached'
    const { data: updatedTracking, error: updateError } = await supabase
      .from('live_tracking')
      .update({
        status: 'reached',
        reached_at: new Date(),
        updated_at: new Date(),
      })
      .eq('id', trackingId)
      .eq('washer_id', washerId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update emergency_wash_requests tracking status
    const { error: requestError } = await supabase
      .from('emergency_wash_requests')
      .update({
        tracking_status: 'reached',
      })
      .eq('tracking_id', trackingId);

    if (requestError) throw requestError;

    console.log('✅ Washer reached destination:', {
      trackingId,
      washerId,
      reachedAt: updatedTracking.reached_at,
    });

    res.json({
      success: true,
      message: 'Status updated to reached',
      reachedAt: updatedTracking.reached_at,
    });
  } catch (error) {
    console.error('❌ Error marking as reached:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET LIVE TRACKING DATA
 * GET /api/live-tracking/:trackingId
 * Get current tracking status and location
 */
router.get('/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const userId = req.user.id;

    const { data: tracking, error } = await supabase
      .from('live_tracking')
      .select('*')
      .eq('id', trackingId)
      .single();

    if (error) throw error;

    // Verify user is either the washer or customer
    if (tracking.washer_id !== userId && tracking.customer_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      success: true,
      tracking,
    });
  } catch (error) {
    console.error('❌ Error fetching tracking:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * STOP TRACKING
 * POST /api/live-tracking/stop
 * Stop the live tracking session
 */
router.post('/stop', async (req, res) => {
  try {
    const { trackingId } = req.body;
    const washerId = req.user.id;

    if (!trackingId) {
      return res.status(400).json({ error: 'trackingId required' });
    }

    const { data: updatedTracking, error: updateError } = await supabase
      .from('live_tracking')
      .update({
        status: 'stopped',
        updated_at: new Date(),
      })
      .eq('id', trackingId)
      .eq('washer_id', washerId)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log('🛑 Tracking stopped:', { trackingId, washerId });

    res.json({
      success: true,
      message: 'Tracking stopped',
    });
  } catch (error) {
    console.error('❌ Error stopping tracking:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET TRACKING HISTORY
 * GET /api/live-tracking/request/:requestId
 * Get all tracking updates for a request
 */
router.get('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // Verify user is part of this request (either customer or washer)
    const { data: request, error: reqError } = await supabase
      .from('emergency_wash_requests')
      .select('user_id, assigned_to')
      .eq('id', requestId)
      .single();

    if (reqError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.user_id !== userId && request.assigned_to !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data: trackingData, error } = await supabase
      .from('live_tracking')
      .select('*')
      .eq('request_id', requestId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      tracking: trackingData,
    });
  } catch (error) {
    console.error('❌ Error fetching tracking history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
