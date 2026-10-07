-- ============================================================================
-- Migration: 20261007000017_create_maintenance.sql
-- Description: Creates maintenance grievance tickets and SLA updates
-- ============================================================================

-- Maintenance Tickets table
CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Classroom issue', 'Lab issue', 'Infrastructure issue', 'Academic issue', 'Hostel issue', 'IT issue', 'Other')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location_details VARCHAR(255),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status public.maintenance_status NOT NULL DEFAULT 'open',
    reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_escalated BOOLEAN NOT NULL DEFAULT false,
    escalated_at TIMESTAMPTZ,
    escalation_reason TEXT,
    sla_due_at TIMESTAMPTZ NOT NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_maint_category ON public.maintenance_tickets(category);
CREATE INDEX IF NOT EXISTS idx_maint_status ON public.maintenance_tickets(status);
CREATE INDEX IF NOT EXISTS idx_maint_priority ON public.maintenance_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_maint_reported_by ON public.maintenance_tickets(reported_by);
CREATE INDEX IF NOT EXISTS idx_maint_assigned_to ON public.maintenance_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maint_sla_due ON public.maintenance_tickets(sla_due_at);
CREATE INDEX IF NOT EXISTS idx_maint_escalated ON public.maintenance_tickets(is_escalated);

-- Maintenance Ticket Updates table
CREATE TABLE IF NOT EXISTS public.maintenance_ticket_updates (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE,
    update_type VARCHAR(50) NOT NULL CHECK (update_type IN ('status_change', 'escalation', 'assignment', 'comment', 'resolution')),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    message TEXT NOT NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_maint_updates_ticket ON public.maintenance_ticket_updates(ticket_id);
CREATE INDEX IF NOT EXISTS idx_maint_updates_created ON public.maintenance_ticket_updates(created_at DESC);
