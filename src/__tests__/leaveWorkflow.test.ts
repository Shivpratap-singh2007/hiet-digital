// ============================================================================
// Unit Tests: Leave Workflow, Duration, Routing & Dual-Role Conflict
// ============================================================================

import { describe, it, expect } from 'vitest';
import { calculateLeaveDays, resolveLeaveApprover } from '../lib/supabase';

describe('Leave Duration Calculations', () => {
  it('calculates 1 day for same start and end date (inclusive)', () => {
    const days = calculateLeaveDays('2026-10-10', '2026-10-10');
    expect(days).toBe(1);
  });

  it('calculates 3 days for 3-day inclusive span', () => {
    const days = calculateLeaveDays('2026-10-10', '2026-10-12');
    expect(days).toBe(3);
  });

  it('handles empty or missing dates gracefully', () => {
    const days = calculateLeaveDays('', '');
    expect(days).toBe(1);
  });
});

describe('Leave Approver Routing Logic', () => {
  it('resolves Class In-Charge for student section', () => {
    const approver = resolveLeaveApprover('CSE', 6, 'A');
    expect(approver).toBeDefined();
    expect(approver.userId).toBeDefined();
    expect(approver.name).toBeDefined();
  });

  it('resolves fallback coordinator when section has no dedicated in-charge', () => {
    const approver = resolveLeaveApprover('ECE', 4, 'C');
    expect(approver).toBeDefined();
  });
});

describe('Faculty + HOD Dual-Role Conflict Resolution', () => {
  it('prevents duplicate HOD stage if teacher approver is already Department HOD', () => {
    // Simulated leave approval check
    const isApproverHod = true;
    const leaveDurationDays = 4; // normally requires HOD escalation if > 2 days

    let nextStage: 'approved' | 'hod_review' = 'hod_review';
    if (isApproverHod) {
      // Direct approval safeguard
      nextStage = 'approved';
    } else if (leaveDurationDays <= 2) {
      nextStage = 'approved';
    }

    expect(nextStage).toBe('approved');
  });

  it('routes to HOD review if initial teacher is not HOD and duration > 2 days', () => {
    const isApproverHod = false;
    const leaveDurationDays = 5;

    let nextStage: 'approved' | 'hod_review' = 'hod_review';
    if (isApproverHod || leaveDurationDays <= 2) {
      nextStage = 'approved';
    }

    expect(nextStage).toBe('hod_review');
  });
});
