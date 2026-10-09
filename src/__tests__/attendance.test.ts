// ============================================================================
// Unit Tests: Attendance Hardening, Geofence & QR Lifecycle
// ============================================================================

import { describe, it, expect } from 'vitest';
import { 
  computeHaversineDistance, 
  CLASSROOM_COORDINATES 
} from '../lib/attendanceService';
import { calculateAttendanceRisk } from '../lib/attendanceRisk';

describe('Attendance Geofencing & Haversine Distance Calculations', () => {
  const roomLat = CLASSROOM_COORDINATES.latitude; // 32.2190000
  const roomLng = CLASSROOM_COORDINATES.longitude; // 76.2708000

  it('calculates zero distance when student is at exact classroom center', () => {
    const distance = computeHaversineDistance(roomLat, roomLng, roomLat, roomLng);
    expect(distance).toBe(0);
  });

  it('verifies student within allowed 30-meter classroom boundary', () => {
    // Offset by approximately 18 meters north (~0.00016 degrees latitude)
    const nearbyLat = roomLat + 0.00016;
    const distance = computeHaversineDistance(roomLat, roomLng, nearbyLat, roomLng);
    
    expect(distance).toBeGreaterThan(15);
    expect(distance).toBeLessThanOrEqual(CLASSROOM_COORDINATES.geofenceRadiusMeters);
  });

  it('rejects student outside the 30-meter perimeter', () => {
    // Offset by approximately 60 meters east (~0.00064 degrees longitude)
    const farLng = roomLng + 0.00064;
    const distance = computeHaversineDistance(roomLat, roomLng, roomLat, farLng);

    expect(distance).toBeGreaterThan(CLASSROOM_COORDINATES.geofenceRadiusMeters);
  });

  it('validates GPS accuracy threshold (<= 20 meters)', () => {
    const validAccuracy = 8.5;
    const marginalAccuracy = 20.0;
    const invalidAccuracy = 35.0;

    expect(validAccuracy <= CLASSROOM_COORDINATES.maxAccuracyMeters).toBe(true);
    expect(marginalAccuracy <= CLASSROOM_COORDINATES.maxAccuracyMeters).toBe(true);
    expect(invalidAccuracy <= CLASSROOM_COORDINATES.maxAccuracyMeters).toBe(false);
  });
});

describe('Dynamic QR Token Expiry & Refresh Cycle', () => {
  it('confirms 6-second dynamic QR refresh cycle', () => {
    expect(CLASSROOM_COORDINATES.qrRefreshSeconds).toBe(6);
  });

  it('evaluates dynamic token validity window', () => {
    const issuedAt = Date.now();
    const refreshWindowMs = CLASSROOM_COORDINATES.qrRefreshSeconds * 1000;
    const expiresAt = issuedAt + refreshWindowMs;

    const currentValidTime = issuedAt + 2000;
    const expiredTime = issuedAt + 7000;

    expect(currentValidTime < expiresAt).toBe(true);
    expect(expiredTime < expiresAt).toBe(false);
  });
});

describe('Attendance Risk Intelligence Calculations', () => {
  it('identifies safe standing when attendance is >= 75%', () => {
    const risk = calculateAttendanceRisk(18, 20, 75);
    expect(risk.percentage).toBe(90);
    expect(risk.riskLevel).toBe('low');
    expect(risk.classesNeededForTarget).toBe(0);
  });

  it('identifies shortage warning and computes classes needed when below 75%', () => {
    // 14 attended out of 20 conducted = 70%
    const risk = calculateAttendanceRisk(14, 20, 75);
    expect(risk.percentage).toBe(70);
    expect(risk.riskLevel).toBe('medium');
    // To reach 75%: (14 + x) / (20 + x) >= 0.75 => 14 + x >= 15 + 0.75x => 0.25x >= 1 => x = 4
    expect(risk.classesNeededForTarget).toBe(4);
  });

  it('flags critical risk when attendance drops below 60%', () => {
    const risk = calculateAttendanceRisk(8, 20, 75);
    expect(risk.percentage).toBe(40);
    expect(risk.riskLevel).toBe('critical');
    expect(risk.classesNeededForTarget).toBeGreaterThan(10);
  });
});
