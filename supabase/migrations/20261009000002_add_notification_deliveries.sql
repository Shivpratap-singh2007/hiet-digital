-- ============================================================================
-- Migration: 20261009000002_add_notification_deliveries.sql
-- Description: Creates notification delivery queue, audit table, and web push
-- readiness schema without disrupting existing in-app notifications.
-- ============================================================================

-- Notification Deliveries Table
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
    delivery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (
        channel IN ('in_app', 'email', 'web_push', 'whatsapp', 'sms')
    ),
    recipient_address TEXT,
    delivery_status TEXT NOT NULL DEFAULT 'queued' CHECK (
        delivery_status IN ('queued', 'sending', 'sent', 'failed', 'skipped')
    ),
    provider TEXT,
    provider_message_id TEXT,
    error_message TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Targeted Indexes for high-throughput polling and reporting
CREATE INDEX IF NOT EXISTS idx_notif_deliveries_queued 
    ON public.notification_deliveries(delivery_status, created_at) 
    WHERE delivery_status = 'queued';

CREATE INDEX IF NOT EXISTS idx_notif_deliveries_notification 
    ON public.notification_deliveries(notification_id);

CREATE INDEX IF NOT EXISTS idx_notif_deliveries_channel_status 
    ON public.notification_deliveries(channel, delivery_status);

-- Web Push Subscriptions Table (Readiness Schema)
CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_push_user 
    ON public.web_push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Notification Deliveries
DROP POLICY IF EXISTS p_notif_deliveries_select ON public.notification_deliveries;
CREATE POLICY p_notif_deliveries_select ON public.notification_deliveries
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.notifications n
            WHERE n.id = notification_deliveries.notification_id
            AND (n.user_id = auth.uid() OR public.is_admin_or_principal())
        )
    );

DROP POLICY IF EXISTS p_notif_deliveries_manage ON public.notification_deliveries;
CREATE POLICY p_notif_deliveries_manage ON public.notification_deliveries
    FOR ALL TO authenticated
    USING (public.is_admin_or_principal());

-- RLS Policies: Web Push Subscriptions
DROP POLICY IF EXISTS p_web_push_user_manage ON public.web_push_subscriptions;
CREATE POLICY p_web_push_user_manage ON public.web_push_subscriptions
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_principal())
    WITH CHECK (user_id = auth.uid() OR public.is_admin_or_principal());

-- Trigger: Automatically enqueue external delivery for high/urgent notifications
CREATE OR REPLACE FUNCTION public.trg_enqueue_notification_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_email TEXT;
BEGIN
    -- Determine recipient email from users table
    SELECT email INTO v_user_email
    FROM public.users
    WHERE id = NEW.user_id;

    -- Enqueue in-app delivery log immediately
    INSERT INTO public.notification_deliveries (
        notification_id,
        channel,
        recipient_address,
        delivery_status,
        provider,
        sent_at
    ) VALUES (
        NEW.id,
        'in_app',
        COALESCE(v_user_email, 'internal'),
        'sent',
        'supabase_db',
        now()
    );

    -- For high or urgent notifications, enqueue an email job
    IF NEW.priority IN ('high', 'urgent') AND v_user_email IS NOT NULL AND v_user_email <> '' THEN
        INSERT INTO public.notification_deliveries (
            notification_id,
            channel,
            recipient_address,
            delivery_status,
            provider,
            attempts
        ) VALUES (
            NEW.id,
            'email',
            v_user_email,
            'queued',
            'resend_smtp',
            0
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_notification_insert_enqueue ON public.notifications;
CREATE TRIGGER trg_after_notification_insert_enqueue
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_enqueue_notification_delivery();
