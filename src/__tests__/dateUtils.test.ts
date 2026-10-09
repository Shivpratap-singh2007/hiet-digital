// ============================================================================
// Unit Tests: Indian Standard Time (IST) Date & Time Formatting
// ============================================================================

import { describe, it, expect } from 'vitest';
import { formatIndiaDateTime, formatIndiaDate, formatIndiaTime } from '../lib/dateTime';
import { calculateAttendanceStats } from '../lib/utils';

describe('Indian Standard Time (IST) Date & Time Utilities', () => {
  it('formats UTC ISO timestamp into Indian Standard Time date and time', () => {
    // 2026-10-08T06:09:00Z -> IST is UTC+5:30 -> 11:39 AM
    const formatted = formatIndiaDateTime('2026-10-08T06:09:00.000Z');
    expect(formatted).toContain('08 Oct 2026');
    expect(formatted).toContain('11:39 AM');
  });

  it('formats date-only ISO string', () => {
    const formatted = formatIndiaDate('2026-10-08');
    expect(formatted).toBe('08 Oct 2026');
  });

  it('formats time-only in IST', () => {
    const timeFormatted = formatIndiaTime('2026-10-08T04:00:00.000Z');
    // 04:00 UTC -> 09:30 AM IST
    expect(timeFormatted).toContain('09:30 AM');
  });

  it('handles null, undefined or empty values gracefully with dash placeholder', () => {
    expect(formatIndiaDateTime(null)).toBe('—');
    expect(formatIndiaDate(undefined)).toBe('—');
    expect(formatIndiaTime('')).toBe('—');
  });
});

describe('Attendance Aggregate Statistics Calculations', () => {
  it('computes 100% attendance when all classes are present', () => {
    const records = [
      { status: 'Present' },
      { status: 'Present' },
      { status: 'Present' }
    ];
    const stats = calculateAttendanceStats(records);
    expect(stats.percentage).toBe(100);
    expect(stats.isWarning).toBe(false);
  });

  it('weights late attendance as 0.5 present', () => {
    const records = [
      { status: 'Present' },
      { status: 'Late' }, // counts as 0.5
      { status: 'Absent' }
    ];
    // (1 + 0.5) / 3 = 1.5 / 3 = 50%
    const stats = calculateAttendanceStats(records);
    expect(stats.percentage).toBe(50);
    expect(stats.isWarning).toBe(true);
  });
});
