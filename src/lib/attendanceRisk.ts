/**
 * HIET Digital Campus — Attendance Risk Intelligence Engine
 * Himachal Institute of Engineering & Technology, Shahpur
 * 
 * Deterministic, rule-based, and explainable attendance guidance.
 * Formula for required continuous classes to reach target (default 75%):
 * n = Math.ceil((target * conducted - attended) / (1 - target))
 */

export type AttendanceRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AttendanceRiskResult {
  percentage: number;
  riskLevel: AttendanceRiskLevel;
  classesNeededForTarget: number;
  recommendation: string;
}

export interface SubjectAttendanceRiskSummary {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  conductedClasses: number;
  attendedClasses: number;
  percentage: number;
  riskLevel: AttendanceRiskLevel;
  classesNeededForTarget: number;
  recommendation: string;
}

/**
 * Calculates deterministic attendance risk metrics and actionable targets.
 *
 * @param attendedClasses Number of lectures student was present
 * @param conductedClasses Total lectures conducted in semester
 * @param targetPercentage Minimum required percentage threshold (default: 75)
 */
export function calculateAttendanceRisk(
  attendedClasses: number,
  conductedClasses: number,
  targetPercentage = 75
): AttendanceRiskResult {
  const targetRatio = targetPercentage / 100;

  // Case 1: No classes conducted yet
  if (conductedClasses <= 0) {
    return {
      percentage: 100,
      riskLevel: 'low',
      classesNeededForTarget: 0,
      recommendation: 'No classes have been conducted yet.'
    };
  }

  // Safe percentage calculation rounded to 2 decimal places
  const rawPct = (attendedClasses / conductedClasses) * 100;
  const percentage = Math.round(rawPct * 100) / 100;

  // Case 2: On track (>= 75%)
  if (percentage >= targetPercentage) {
    return {
      percentage,
      riskLevel: 'low',
      classesNeededForTarget: 0,
      recommendation: 'Attendance is on track.'
    };
  }

  // Formula: n = ceil((target * conducted - attended) / (1 - target))
  const rawNeeded = Math.ceil((targetRatio * conductedClasses - attendedClasses) / (1 - targetRatio));
  const classesNeededForTarget = Math.max(0, rawNeeded);

  // Case 3: Medium Risk (70.00% to 74.99%)
  if (percentage >= 70.0) {
    return {
      percentage,
      riskLevel: 'medium',
      classesNeededForTarget,
      recommendation: `You are below the ${targetPercentage}% attendance requirement. Attend the next ${classesNeededForTarget} classes continuously to reach ${targetPercentage}%.`
    };
  }

  // Case 4: High Risk (60.00% to 69.99%)
  if (percentage >= 60.0) {
    return {
      percentage,
      riskLevel: 'high',
      classesNeededForTarget,
      recommendation: `Serious attendance risk (${percentage}%). Attend the next ${classesNeededForTarget} classes continuously or contact your faculty/class in-charge.`
    };
  }

  // Case 5: Critical Risk (< 60.00%)
  return {
    percentage,
    riskLevel: 'critical',
    classesNeededForTarget,
    recommendation: `Critical attendance shortage (${percentage}%). Please schedule an urgent meeting with your faculty or class in-charge.`
  };
}

/**
 * Evaluates whether an in-app attendance alert should be sent based on 7-day cooldown.
 */
export function shouldSendAttendanceRiskNotification(
  lastNotificationTimestamp: string | null | undefined,
  cooldownDays = 7
): boolean {
  if (!lastNotificationTimestamp) return true;
  const lastTime = new Date(lastNotificationTimestamp).getTime();
  const now = Date.now();
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  return now - lastTime >= cooldownMs;
}
