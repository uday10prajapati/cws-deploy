-- =============================================
-- NOTIFICATIONS TABLE - Supabase Compatible
-- =============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb NULL DEFAULT '{}'::jsonb,
  read boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT notifications_message_check CHECK ((length(message) > 0)),
  CONSTRAINT notifications_title_check CHECK ((length(title) > 0)),
  CONSTRAINT notifications_type_check CHECK (
    (
      type = ANY (
        ARRAY[
          'payment'::text,
          'booking'::text,
          'pass'::text,
          'wallet'::text,
          'pickup'::text,
          'delivery'::text,
          'wash_status'::text,
          'daily_payment'::text,
          'pass_expiry'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications USING btree (user_id, read) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications USING btree (type) TABLESPACE pg_default;

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Backend can insert notifications" ON public.notifications;
CREATE POLICY "Backend can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Grant permissions to authenticated users
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Enable Real-time Notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
GRANT ALL ON notifications TO service_role;
