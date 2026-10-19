-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION: HOSTEL OUTPASS ALLOCATION & GENDER INTEGRITY
-- Enforces data integrity checks so female students are never allocated to boys hostels,
-- male students are never allocated to girls hostels, and day scholars cannot hold overnight passes.
-- =============================================================================

-- 1. Function to validate hostel outpass allocation integrity
CREATE OR REPLACE FUNCTION public.fn_validate_hostel_outpass_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_gender VARCHAR(20);
    v_hostel_name VARCHAR(100);
    v_hostel_code VARCHAR(100);
BEGIN
    -- Retrieve authoritative student record
    SELECT gender, hostel_name, hostel_code
    INTO v_gender, v_hostel_name, v_hostel_code
    FROM public.students_master
    WHERE id = NEW.student_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student record % does not exist in students_master directory.', NEW.student_id;
    END IF;

    -- Block Day Scholars from residential hostel outpasses
    IF LOWER(COALESCE(v_hostel_name, '')) = 'day scholar' OR LOWER(COALESCE(v_hostel_code, '')) = 'day scholar' THEN
        RAISE EXCEPTION 'Student % is enrolled as a Day Scholar and is ineligible for residential hostel outpasses.', NEW.student_id;
    END IF;

    -- Check Female Gender vs Boys Hostel
    IF LOWER(COALESCE(v_gender, '')) = 'female' AND (
        LOWER(NEW.hostel_block) LIKE '%boy%' OR 
        LOWER(NEW.hostel_block) LIKE '%boys%' OR
        NEW.hostel_block = 'BOYS-HOSTEL-B'
    ) THEN
        RAISE EXCEPTION 'Data Integrity Violation: Female student % cannot be assigned to Boys Hostel block %.', NEW.student_id, NEW.hostel_block;
    END IF;

    -- Check Male Gender vs Girls Hostel
    IF LOWER(COALESCE(v_gender, '')) = 'male' AND (
        LOWER(NEW.hostel_block) LIKE '%girl%' OR 
        LOWER(NEW.hostel_block) LIKE '%girls%' OR
        NEW.hostel_block = 'GIRLS-HOSTEL-A'
    ) THEN
        RAISE EXCEPTION 'Data Integrity Violation: Male student % cannot be assigned to Girls Hostel block %.', NEW.student_id, NEW.hostel_block;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind trigger to public.hostel_outpasses
DROP TRIGGER IF EXISTS trg_validate_hostel_outpass_integrity ON public.hostel_outpasses;
CREATE TRIGGER trg_validate_hostel_outpass_integrity
    BEFORE INSERT OR UPDATE ON public.hostel_outpasses
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_validate_hostel_outpass_integrity();

-- 3. Data reconciliation: Ensure existing hostel outpasses reflect verified student hostels
DO $$
DECLARE
    r RECORD;
    v_std_hostel VARCHAR(100);
    v_std_room VARCHAR(50);
BEGIN
    FOR r IN SELECT ho.id, ho.student_id, sm.hostel_name, sm.hostel_code, sm.room_no
             FROM public.hostel_outpasses ho
             JOIN public.students_master sm ON ho.student_id = sm.id
    LOOP
        v_std_hostel := COALESCE(r.hostel_name, r.hostel_code);
        v_std_room := r.room_no;

        IF v_std_hostel IS NOT NULL AND LOWER(v_std_hostel) != 'day scholar' THEN
            UPDATE public.hostel_outpasses
            SET hostel_block = v_std_hostel,
                room_number = COALESCE(v_std_room, room_number)
            WHERE id = r.id;
        END IF;
    END LOOP;
END $$;
