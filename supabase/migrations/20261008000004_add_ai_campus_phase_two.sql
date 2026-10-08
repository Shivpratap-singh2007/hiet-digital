-- =============================================================================
-- Migration: 20261008000004_add_ai_campus_phase_two.sql
-- Description: HIET Digital Campus - AI Campus Phase 2 Architecture
--              1. Campus Buildings, Floors, Zones & Verification Tokens
--              2. BLE Beacon Pilot Registry & Calibration Metrics
--              3. Privacy-Preserving Presence Events (No Continuous Tracking)
--              4. Edge Occupancy Devices & Crowd Aggregation Events
--              5. Smart Waste Bin Integration-Ready Sensor Schema
--              6. AI Knowledge Documents & Vector Chunks (Strict Role Boundaries)
--              7. Row-Level Security (RLS) & Atomic Verification RPCs
-- =============================================================================

-- Enable pgvector extension if available
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pgvector extension not available; proceeding with vector fallback';
END $$;

-- -----------------------------------------------------------------------------
-- Helper Functions for Phase 2 Roles
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_security()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE (supabase_auth_id = auth.uid() OR id = auth.uid())
          AND role IN ('security', 'security_guard')
          AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_principal()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE (supabase_auth_id = auth.uid() OR id = auth.uid())
          AND role IN ('principal', 'managing_director')
          AND is_active = true
    );
$$;

-- -----------------------------------------------------------------------------
-- 1. CAMPUS BUILDINGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campus_buildings (
    building_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_code TEXT NOT NULL UNIQUE,
    building_name TEXT NOT NULL,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. CAMPUS FLOORS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campus_floors (
    floor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.campus_buildings(building_id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    floor_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(building_id, floor_number)
);

-- -----------------------------------------------------------------------------
-- 3. CAMPUS ZONES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campus_zones (
    zone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES public.campus_buildings(building_id) ON DELETE SET NULL,
    floor_id UUID REFERENCES public.campus_floors(floor_id) ON DELETE SET NULL,
    zone_code TEXT NOT NULL UNIQUE,
    zone_name TEXT NOT NULL,
    zone_type TEXT NOT NULL CHECK (
        zone_type IN (
            'gate',
            'building',
            'floor',
            'classroom',
            'lab',
            'library',
            'canteen',
            'hostel',
            'sports',
            'parking',
            'other'
        )
    ),
    room_code TEXT,
    capacity INTEGER,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campus_zones_type ON public.campus_zones(zone_type);
CREATE INDEX IF NOT EXISTS idx_campus_zones_building ON public.campus_zones(building_id);

-- -----------------------------------------------------------------------------
-- 4. ZONE QR TOKENS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zone_qr_tokens (
    zone_qr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.campus_zones(zone_id) ON DELETE CASCADE,
    public_token TEXT NOT NULL UNIQUE,
    is_dynamic BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zone_qr_tokens_token ON public.zone_qr_tokens(public_token);
CREATE INDEX IF NOT EXISTS idx_zone_qr_tokens_zone ON public.zone_qr_tokens(zone_id);

-- -----------------------------------------------------------------------------
-- 5. BLE BEACONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ble_beacons (
    beacon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.campus_zones(zone_id) ON DELETE CASCADE,
    beacon_code TEXT NOT NULL UNIQUE,
    uuid_value TEXT,
    major_value INTEGER,
    minor_value INTEGER,
    tx_power INTEGER,
    installed_at TIMESTAMPTZ,
    battery_status TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    calibration_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ble_beacons_code ON public.ble_beacons(beacon_code);
CREATE INDEX IF NOT EXISTS idx_ble_beacons_zone ON public.ble_beacons(zone_id);

-- -----------------------------------------------------------------------------
-- 6. PRESENCE EVENTS (Strictly Voluntary, Consent-Required, Non-Continuous)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.presence_events (
    presence_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students_master(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES public.campus_zones(zone_id) ON DELETE SET NULL,
    beacon_id UUID REFERENCES public.ble_beacons(beacon_id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'zone_checkin',
            'zone_checkout',
            'qr_scan',
            'ble_detected',
            'manual_correction'
        )
    ),
    detection_method TEXT NOT NULL CHECK (
        detection_method IN (
            'dynamic_qr',
            'static_zone_qr',
            'ble',
            'gps',
            'wifi',
            'wifi_rtt',
            'uwb',
            'manual'
        )
    ),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    location_accuracy_meters NUMERIC(8,2),
    rssi INTEGER,
    confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    privacy_consent BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presence_events_user_detected
    ON public.presence_events(user_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_presence_events_zone_detected
    ON public.presence_events(zone_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_presence_events_student
    ON public.presence_events(student_id, detected_at DESC);

-- -----------------------------------------------------------------------------
-- 7. OCCUPANCY DEVICES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.occupancy_devices (
    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_code TEXT NOT NULL UNIQUE,
    zone_id UUID NOT NULL REFERENCES public.campus_zones(zone_id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (
        device_type IN ('raspberry_pi', 'mini_pc', 'jetson', 'camera_gateway')
    ),
    api_key_hash TEXT NOT NULL,
    model_name TEXT,
    capacity INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_heartbeat_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_occupancy_devices_zone ON public.occupancy_devices(zone_id);

-- -----------------------------------------------------------------------------
-- 8. OCCUPANCY EVENTS (Aggregate Counts Only - Zero Face/Identity Data)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.occupancy_events (
    occupancy_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.occupancy_devices(device_id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES public.campus_zones(zone_id) ON DELETE CASCADE,
    person_count INTEGER NOT NULL CHECK (person_count >= 0),
    capacity INTEGER,
    occupancy_percentage NUMERIC(5,2),
    crowd_level TEXT NOT NULL CHECK (
        crowd_level IN ('low', 'medium', 'high', 'critical')
    ),
    model_confidence NUMERIC(5,2),
    model_version TEXT,
    event_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_occupancy_events_zone_time
    ON public.occupancy_events(zone_id, event_timestamp DESC);

-- -----------------------------------------------------------------------------
-- 9. WASTE BIN DEVICES & EVENTS (Integration-Ready Schema)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.waste_bin_devices (
    waste_device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_code TEXT NOT NULL UNIQUE,
    zone_id UUID REFERENCES public.campus_zones(zone_id) ON DELETE SET NULL,
    device_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.waste_bin_events (
    waste_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waste_device_id UUID NOT NULL REFERENCES public.waste_bin_devices(waste_device_id) ON DELETE CASCADE,
    waste_category TEXT CHECK (
        waste_category IN ('plastic', 'paper', 'metal', 'organic', 'e_waste', 'mixed', 'unknown')
    ),
    fill_level_percentage NUMERIC(5,2),
    model_confidence NUMERIC(5,2),
    event_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waste_bin_events_device_time
    ON public.waste_bin_events(waste_device_id, event_timestamp DESC);

-- -----------------------------------------------------------------------------
-- 10. AI KNOWLEDGE DOCUMENTS & CHUNKS (Strictly Published/Curated Academic Only)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (
        source_type IN (
            'syllabus',
            'pyq',
            'notice',
            'policy',
            'calendar',
            'handbook',
            'faq'
        )
    ),
    source_id UUID,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    visibility_scope TEXT NOT NULL DEFAULT 'institution' CHECK (
        visibility_scope IN ('public', 'institution', 'department', 'subject')
    ),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    file_path TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_docs_scope
    ON public.knowledge_documents(visibility_scope, is_published);

-- Create knowledge_chunks with vector(384) if extension exists, or numeric array fallback
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
        CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
            chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id UUID NOT NULL REFERENCES public.knowledge_documents(document_id) ON DELETE CASCADE,
            chunk_index INTEGER NOT NULL,
            content TEXT NOT NULL,
            embedding vector(384),
            token_count INTEGER,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE(document_id, chunk_index)
        );
    ELSE
        CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
            chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id UUID NOT NULL REFERENCES public.knowledge_documents(document_id) ON DELETE CASCADE,
            chunk_index INTEGER NOT NULL,
            content TEXT NOT NULL,
            embedding NUMERIC[],
            token_count INTEGER,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE(document_id, chunk_index)
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_doc
    ON public.knowledge_chunks(document_id);

-- -----------------------------------------------------------------------------
-- 11. ROW-LEVEL SECURITY POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.campus_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ble_beacons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_bin_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_bin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- 11.1 Campus Buildings, Floors, Zones
DROP POLICY IF EXISTS "anyone_authenticated_read_buildings" ON public.campus_buildings;
CREATE POLICY "anyone_authenticated_read_buildings"
ON public.campus_buildings FOR SELECT TO authenticated
USING (is_active = true OR public.is_admin_or_principal());

DROP POLICY IF EXISTS "admins_manage_buildings" ON public.campus_buildings;
CREATE POLICY "admins_manage_buildings"
ON public.campus_buildings FOR ALL TO authenticated
USING (public.is_admin_or_principal())
WITH CHECK (public.is_admin_or_principal());

DROP POLICY IF EXISTS "anyone_authenticated_read_floors" ON public.campus_floors;
CREATE POLICY "anyone_authenticated_read_floors"
ON public.campus_floors FOR SELECT TO authenticated
USING (is_active = true OR public.is_admin_or_principal());

DROP POLICY IF EXISTS "admins_manage_floors" ON public.campus_floors;
CREATE POLICY "admins_manage_floors"
ON public.campus_floors FOR ALL TO authenticated
USING (public.is_admin_or_principal())
WITH CHECK (public.is_admin_or_principal());

DROP POLICY IF EXISTS "anyone_authenticated_read_zones" ON public.campus_zones;
CREATE POLICY "anyone_authenticated_read_zones"
ON public.campus_zones FOR SELECT TO authenticated
USING (is_active = true OR public.is_admin_or_principal());

DROP POLICY IF EXISTS "admins_manage_zones" ON public.campus_zones;
CREATE POLICY "admins_manage_zones"
ON public.campus_zones FOR ALL TO authenticated
USING (public.is_admin_or_principal())
WITH CHECK (public.is_admin_or_principal());

-- 11.2 Zone QR Tokens & BLE Beacons
DROP POLICY IF EXISTS "anyone_read_active_zone_qr_tokens" ON public.zone_qr_tokens;
CREATE POLICY "anyone_read_active_zone_qr_tokens"
ON public.zone_qr_tokens FOR SELECT TO authenticated
USING (is_active = true OR public.is_admin_or_principal());

DROP POLICY IF EXISTS "admins_manage_zone_qr_tokens" ON public.zone_qr_tokens;
CREATE POLICY "admins_manage_zone_qr_tokens"
ON public.zone_qr_tokens FOR ALL TO authenticated
USING (public.is_admin_or_principal())
WITH CHECK (public.is_admin_or_principal());

DROP POLICY IF EXISTS "anyone_read_active_ble_beacons" ON public.ble_beacons;
CREATE POLICY "anyone_read_active_ble_beacons"
ON public.ble_beacons FOR SELECT TO authenticated
USING (is_active = true OR public.is_admin_or_principal());

DROP POLICY IF EXISTS "admins_manage_ble_beacons" ON public.ble_beacons;
CREATE POLICY "admins_manage_ble_beacons"
ON public.ble_beacons FOR ALL TO authenticated
USING (public.is_admin_or_principal())
WITH CHECK (public.is_admin_or_principal());

-- 11.3 Presence Events (Privacy Strict)
DROP POLICY IF EXISTS "student_read_own_presence_events" ON public.presence_events;
CREATE POLICY "student_read_own_presence_events"
ON public.presence_events FOR SELECT TO authenticated
USING (
    user_id = public.current_app_user_id()
    OR (student_id IS NOT NULL AND student_id = public.current_student_id())
    OR public.is_admin_or_principal()
    OR (public.is_security() AND EXISTS (
        SELECT 1 FROM public.campus_zones z
        WHERE z.zone_id = presence_events.zone_id
          AND z.zone_type IN ('gate', 'hostel')
    ))
);

DROP POLICY IF EXISTS "student_insert_own_presence_events" ON public.presence_events;
CREATE POLICY "student_insert_own_presence_events"
ON public.presence_events FOR INSERT TO authenticated
WITH CHECK (
    user_id = public.current_app_user_id()
    AND privacy_consent = true
);

-- 11.4 Occupancy Devices & Events
DROP POLICY IF EXISTS "authorized_staff_view_occupancy_devices" ON public.occupancy_devices;
CREATE POLICY "authorized_staff_view_occupancy_devices"
ON public.occupancy_devices FOR SELECT TO authenticated
USING (
    public.is_admin_or_principal()
    OR public.is_hod()
    OR public.is_security()
);

DROP POLICY IF EXISTS "admins_manage_occupancy_devices" ON public.occupancy_devices;
CREATE POLICY "admins_manage_occupancy_devices"
ON public.occupancy_devices FOR ALL TO authenticated
USING (public.is_admin_or_principal())
WITH CHECK (public.is_admin_or_principal());

DROP POLICY IF EXISTS "authorized_staff_view_occupancy_events" ON public.occupancy_events;
CREATE POLICY "authorized_staff_view_occupancy_events"
ON public.occupancy_events FOR SELECT TO authenticated
USING (
    public.is_admin_or_principal()
    OR public.is_hod()
    OR (public.is_security() AND EXISTS (
        SELECT 1 FROM public.campus_zones z
        WHERE z.zone_id = occupancy_events.zone_id
          AND z.zone_type IN ('gate', 'hostel', 'parking')
    ))
);

-- 11.5 Waste Bin Devices & Events
DROP POLICY IF EXISTS "authorized_staff_view_waste_devices" ON public.waste_bin_devices;
CREATE POLICY "authorized_staff_view_waste_devices"
ON public.waste_bin_devices FOR SELECT TO authenticated
USING (public.is_admin_or_principal() OR public.is_security());

DROP POLICY IF EXISTS "authorized_staff_view_waste_events" ON public.waste_bin_events;
CREATE POLICY "authorized_staff_view_waste_events"
ON public.waste_bin_events FOR SELECT TO authenticated
USING (public.is_admin_or_principal() OR public.is_security());

-- 11.6 Knowledge Documents & Chunks (Strict Role Boundaries)
DROP POLICY IF EXISTS "users_read_permitted_knowledge_documents" ON public.knowledge_documents;
CREATE POLICY "users_read_permitted_knowledge_documents"
ON public.knowledge_documents FOR SELECT TO authenticated
USING (
    (
        is_published = true AND (
            visibility_scope = 'public'
            OR visibility_scope = 'institution'
            OR (visibility_scope = 'department' AND department_id = public.current_department_id())
            OR (visibility_scope = 'subject' AND subject_id IS NOT NULL)
        )
    )
    OR public.is_admin_or_principal()
    OR (public.is_hod() AND department_id = public.current_department_id())
);

DROP POLICY IF EXISTS "admins_manage_knowledge_documents" ON public.knowledge_documents;
CREATE POLICY "admins_manage_knowledge_documents"
ON public.knowledge_documents FOR ALL TO authenticated
USING (public.is_admin_or_principal() OR public.is_hod())
WITH CHECK (public.is_admin_or_principal() OR public.is_hod());

DROP POLICY IF EXISTS "users_read_permitted_knowledge_chunks" ON public.knowledge_chunks;
CREATE POLICY "users_read_permitted_knowledge_chunks"
ON public.knowledge_chunks FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.knowledge_documents kd
        WHERE kd.document_id = knowledge_chunks.document_id
          AND (
            (kd.is_published = true AND (
                kd.visibility_scope = 'public'
                OR kd.visibility_scope = 'institution'
                OR (kd.visibility_scope = 'department' AND kd.department_id = public.current_department_id())
                OR (kd.visibility_scope = 'subject')
            ))
            OR public.is_admin_or_principal()
          )
    )
);

DROP POLICY IF EXISTS "admins_manage_knowledge_chunks" ON public.knowledge_chunks;
CREATE POLICY "admins_manage_knowledge_chunks"
ON public.knowledge_chunks FOR ALL TO authenticated
USING (public.is_admin_or_principal() OR public.is_hod())
WITH CHECK (public.is_admin_or_principal() OR public.is_hod());

-- -----------------------------------------------------------------------------
-- 12. SECURE RPCS
-- -----------------------------------------------------------------------------

-- 12.1 Atomic Zone QR Verification RPC
CREATE OR REPLACE FUNCTION public.verify_zone_presence_rpc(
    p_token TEXT,
    p_consent BOOLEAN,
    p_latitude NUMERIC DEFAULT NULL,
    p_longitude NUMERIC DEFAULT NULL,
    p_accuracy NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_student_id UUID;
    v_token_rec RECORD;
    v_zone_rec RECORD;
    v_building_rec RECORD;
    v_floor_rec RECORD;
    v_presence_id UUID;
    v_confidence NUMERIC := 95.00;
BEGIN
    -- 1. Validate explicit consent
    IF p_consent IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Explicit privacy consent is required to verify campus zone presence.'
        );
    END IF;

    -- 2. Authenticate user
    v_user_id := public.current_app_user_id();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: User session not found.');
    END IF;
    v_student_id := public.current_student_id();

    -- 3. Look up token
    SELECT * INTO v_token_rec
    FROM public.zone_qr_tokens
    WHERE public_token = p_token
      AND is_active = true
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid or deactivated Zone QR token.');
    END IF;

    -- 4. Check dynamic token expiry
    IF v_token_rec.is_dynamic AND v_token_rec.expires_at IS NOT NULL AND v_token_rec.expires_at < now() THEN
        RETURN jsonb_build_object('success', false, 'message', 'This dynamic Zone QR token has expired.');
    END IF;

    -- 5. Look up zone
    SELECT * INTO v_zone_rec
    FROM public.campus_zones
    WHERE zone_id = v_token_rec.zone_id
      AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'The associated campus zone is currently inactive.');
    END IF;

    -- 6. Fetch building and floor info
    SELECT * INTO v_building_rec FROM public.campus_buildings WHERE building_id = v_zone_rec.building_id;
    SELECT * INTO v_floor_rec FROM public.campus_floors WHERE floor_id = v_zone_rec.floor_id;

    -- 7. Insert presence event
    INSERT INTO public.presence_events (
        student_id,
        user_id,
        zone_id,
        event_type,
        detection_method,
        latitude,
        longitude,
        location_accuracy_meters,
        confidence_score,
        privacy_consent,
        metadata,
        detected_at
    ) VALUES (
        v_student_id,
        v_user_id,
        v_zone_rec.zone_id,
        'zone_checkin',
        CASE WHEN v_token_rec.is_dynamic THEN 'dynamic_qr' ELSE 'static_zone_qr' END,
        p_latitude,
        p_longitude,
        p_accuracy,
        v_confidence,
        true,
        jsonb_build_object(
            'zone_code', v_zone_rec.zone_code,
            'zone_name', v_zone_rec.zone_name,
            'building_name', COALESCE(v_building_rec.building_name, 'Academic Complex'),
            'floor_name', COALESCE(v_floor_rec.floor_name, 'Campus Level')
        ),
        now()
    )
    RETURNING presence_event_id INTO v_presence_id;

    RETURN jsonb_build_object(
        'success', true,
        'presence_event_id', v_presence_id,
        'zone_id', v_zone_rec.zone_id,
        'zone_code', v_zone_rec.zone_code,
        'zone_name', v_zone_rec.zone_name,
        'building_name', COALESCE(v_building_rec.building_name, 'Academic Complex'),
        'floor_name', COALESCE(v_floor_rec.floor_name, 'Campus Level'),
        'room_code', v_zone_rec.room_code,
        'confidence_score', v_confidence,
        'detected_at', now()
    );
END;
$$;

-- 12.2 Occupancy Ingestion RPC with Device Credential Validation
CREATE OR REPLACE FUNCTION public.ingest_occupancy_event_rpc(
    p_device_code TEXT,
    p_device_secret TEXT,
    p_zone_code TEXT,
    p_person_count INTEGER,
    p_capacity INTEGER DEFAULT NULL,
    p_model_confidence NUMERIC DEFAULT 85.00,
    p_model_version TEXT DEFAULT 'yolo-occupancy-v1',
    p_event_timestamp TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_device_rec RECORD;
    v_zone_rec RECORD;
    v_capacity INTEGER;
    v_percentage NUMERIC;
    v_crowd_level TEXT;
    v_event_id UUID;
BEGIN
    -- 1. Validate device
    SELECT * INTO v_device_rec
    FROM public.occupancy_devices
    WHERE device_code = p_device_code
      AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Occupancy device not found or deactivated.');
    END IF;

    -- Validate secret hash (comparing MD5/SHA256 or direct match)
    IF v_device_rec.api_key_hash <> encode(digest(p_device_secret, 'sha256'), 'hex')
       AND v_device_rec.api_key_hash <> p_device_secret THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid device credentials.');
    END IF;

    -- 2. Validate zone match
    SELECT * INTO v_zone_rec
    FROM public.campus_zones
    WHERE zone_id = v_device_rec.zone_id
      AND zone_code = p_zone_code;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Zone mismatch for this device.');
    END IF;

    -- 3. Calculate capacity and crowd level
    v_capacity := COALESCE(p_capacity, v_device_rec.capacity, v_zone_rec.capacity, 50);
    IF v_capacity <= 0 THEN v_capacity := 50; END IF;

    v_percentage := ROUND((p_person_count::numeric / v_capacity::numeric) * 100.0, 2);

    IF v_percentage < 40.0 THEN
        v_crowd_level := 'low';
    ELSIF v_percentage < 70.0 THEN
        v_crowd_level := 'medium';
    ELSIF v_percentage < 90.0 THEN
        v_crowd_level := 'high';
    ELSE
        v_crowd_level := 'critical';
    END IF;

    -- 4. Insert occupancy event
    INSERT INTO public.occupancy_events (
        device_id,
        zone_id,
        person_count,
        capacity,
        occupancy_percentage,
        crowd_level,
        model_confidence,
        model_version,
        event_timestamp
    ) VALUES (
        v_device_rec.device_id,
        v_zone_rec.zone_id,
        p_person_count,
        v_capacity,
        v_percentage,
        v_crowd_level,
        p_model_confidence,
        p_model_version,
        COALESCE(p_event_timestamp, now())
    )
    RETURNING occupancy_event_id INTO v_event_id;

    -- 5. Update device heartbeat
    UPDATE public.occupancy_devices
    SET last_heartbeat_at = now(),
        updated_at = now()
    WHERE device_id = v_device_rec.device_id;

    RETURN jsonb_build_object(
        'success', true,
        'occupancy_event_id', v_event_id,
        'zone_code', p_zone_code,
        'person_count', p_person_count,
        'capacity', v_capacity,
        'occupancy_percentage', v_percentage,
        'crowd_level', v_crowd_level
    );
END;
$$;
