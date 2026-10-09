// ============================================================================
// Unit Tests: AI Campus Assistant Intent Classification & Query Resilience
// ============================================================================

import { describe, it, expect } from 'vitest';
import { detectAssistantIntent } from '../lib/assistantIntents';

describe('Assistant Intent Classification', () => {
  it('correctly classifies student attendance queries in English and Hindi', () => {
    const q1 = detectAssistantIntent('how is my attendance?');
    const q2 = detectAssistantIntent('meri attendance kitni hai?');
    const q3 = detectAssistantIntent('attendance percentage in math');

    expect(q1).toBe('my_attendance');
    expect(q2).toBe('my_attendance');
    expect(q3).toBe('my_attendance');
  });

  it('correctly classifies timetable and schedule queries', () => {
    const q1 = detectAssistantIntent('what classes do I have today?');
    const q2 = detectAssistantIntent('aaj ka timetable kya hai?');
    const q3 = detectAssistantIntent('which lecture is next?');

    expect(q1).toBe('my_timetable');
    expect(q2).toBe('my_timetable');
    expect(q3).toBe('my_timetable');
  });

  it('correctly classifies assignment submissions and homework inquiries', () => {
    const q1 = detectAssistantIntent('show my pending assignments');
    const q2 = detectAssistantIntent('mera homework kab submit karna hai?');
    const q3 = detectAssistantIntent('assignment deadlines for this week');

    expect(q1).toBe('my_assignments');
    expect(q2).toBe('my_assignments');
    expect(q3).toBe('my_assignments');
  });

  it('correctly classifies leave request inquiries without confusing with attendance', () => {
    const q1 = detectAssistantIntent('meri leave application approve hui kya?');
    const q2 = detectAssistantIntent('check my leave request status');

    expect(q1).toBe('my_leave_status');
    expect(q2).toBe('my_leave_status');
  });

  it('correctly classifies gate pass queries', () => {
    const q1 = detectAssistantIntent('is my gate pass approved for today?');
    const q2 = detectAssistantIntent('aaj ka gate pass status kya hai?');

    expect(q1).toBe('my_gate_pass_status');
    expect(q2).toBe('my_gate_pass_status');
  });

  it('maps unrelated inquiries to unsupported for fallback / RAG lookup', () => {
    const q1 = detectAssistantIntent('what is the admission fee for M.Tech?');
    const q2 = detectAssistantIntent('who is the founder of Himachal Pradesh?');

    expect(q1).toBe('unsupported');
    expect(q2).toBe('unsupported');
  });
});
