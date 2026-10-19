-- =============================================================================
-- Migration: 20261019000001_prevent_student_password_change.sql
-- Description: Institutional Security Enforcement - Prohibit Student Password Changes
-- College Policy: Student passwords are professionally provisioned & managed by 
-- College IT Administration and the Office of the Registrar.
-- =============================================================================

-- 1. Function to enforce password change restrictions at database/auth level
CREATE OR REPLACE FUNCTION public.enforce_student_password_restriction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user updating password belongs to the student role in public.profiles
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = NEW.id
      AND role = 'student'
  ) THEN
    -- If the password hash or encrypted_password is being changed, fail the operation
    IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
      RAISE EXCEPTION 'Institutional Security Policy: Student passwords are professionally managed by College IT Administration. Self-service password modifications are prohibited.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Attach trigger to auth.users (if privileges allow on deployment)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    DROP TRIGGER IF EXISTS trg_prevent_student_password_change ON auth.users;
    CREATE TRIGGER trg_prevent_student_password_change
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_student_password_restriction();
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- In environments where direct DDL on auth schema is restricted,
    -- client and RPC guards provide layer-1 enforcement.
    NULL;
END;
$$;

-- 3. Reset must_change_password to false for all student profiles so no mandatory prompt blocks student dashboards
UPDATE public.profiles
SET must_change_password = false
WHERE role = 'student';
