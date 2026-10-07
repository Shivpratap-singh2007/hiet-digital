import { isSupabaseConfigured, supabase, apiService } from './supabase';
import { dataStore } from './mockData';
import { AttendanceRecord, StudentMaster } from '../types';

export const CLASSROOM_COORDINATES = {
  roomName: 'Classroom C-101 (Computer Science Dept)',
  latitude: 32.2190000,
  longitude: 76.2708000,
  geofenceRadiusMeters: 30.0,
  maxAccuracyMeters: 20.0,
  qrRefreshSeconds: 6,
};

export interface DynamicSessionState {
  sessionId: string;
  subjectName: string;
  subjectCode: string;
  semester: number;
  branch: string;
  section: string;
  facultyId: string;
  facultyName: string;
  roomName: string;
  geofenceLat: number;
  geofenceLng: number;
  geofenceRadius: number;
  maxAccuracyMeters: number;
  qrToken: string;
  issuedAt: number;
  expiresAt: number;
  isActive: boolean;
}

export interface LiveScanLogEntry {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  status: 'verified' | 'flagged' | 'invalid';
  distanceMeters: number;
  accuracyMeters: number;
  timestamp: string;
  reason?: string;
  manualOverride?: boolean;
}

export interface ScanVerificationResult {
  success: boolean;
  status: 'verified' | 'flagged' | 'invalid';
  message: string;
  distanceMeters: number;
  accuracyMeters: number;
  studentName: string;
  studentRoll: string;
  timestamp: string;
  record?: AttendanceRecord;
}

/**
 * Calculates Haversine distance in meters between two GPS coordinates
 */
export function computeHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// In-memory active session cache
let currentActiveSession: DynamicSessionState | null = null;
const sessionScanLogs: Record<string, LiveScanLogEntry[]> = {};

// Broadcast channel for multi-tab live sync
let attendanceBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    attendanceBroadcastChannel = new BroadcastChannel('hiet_attendance_channel');
  }
} catch {
  // Graceful fallback
}

export const attendanceService = {
  /**
   * Initializes or refreshes an active dynamic QR session
   */
  startOrRefreshSession(params: {
    sessionId?: string;
    subjectName: string;
    subjectCode: string;
    semester: number;
    branch: string;
    section: string;
    facultyId: string;
    facultyName: string;
    roomName?: string;
    lat?: number;
    lng?: number;
  }): DynamicSessionState {
    const sessionId = params.sessionId || `session-${params.branch.toLowerCase()}-${params.semester}-${params.section}-${new Date().toISOString().split('T')[0]}`;
    const now = Date.now();
    const token = `HIET-${params.subjectCode}-${now}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const session: DynamicSessionState = {
      sessionId,
      subjectName: params.subjectName,
      subjectCode: params.subjectCode,
      semester: params.semester,
      branch: params.branch,
      section: params.section,
      facultyId: params.facultyId,
      facultyName: params.facultyName,
      roomName: params.roomName || CLASSROOM_COORDINATES.roomName,
      geofenceLat: params.lat ?? CLASSROOM_COORDINATES.latitude,
      geofenceLng: params.lng ?? CLASSROOM_COORDINATES.longitude,
      geofenceRadius: CLASSROOM_COORDINATES.geofenceRadiusMeters,
      maxAccuracyMeters: CLASSROOM_COORDINATES.maxAccuracyMeters,
      qrToken: token,
      issuedAt: now,
      expiresAt: now + 15000, // Valid for 15s to allow for network transit
      isActive: true,
    };

    currentActiveSession = session;
    try {
      localStorage.setItem('hiet_active_qr_session', JSON.stringify(session));
    } catch {
      // ignore
    }

    // Broadcast session update
    if (attendanceBroadcastChannel) {
      attendanceBroadcastChannel.postMessage({
        type: 'SESSION_UPDATED',
        session
      });
    }

    return session;
  },

  /**
   * Retrieves the current active session
   */
  getActiveSession(): DynamicSessionState | null {
    if (currentActiveSession && currentActiveSession.isActive) {
      return currentActiveSession;
    }
    try {
      const stored = localStorage.getItem('hiet_active_qr_session');
      if (stored) {
        const parsed = JSON.parse(stored) as DynamicSessionState;
        if (parsed && parsed.isActive) {
          currentActiveSession = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  },

  /**
   * Closes an active dynamic QR session
   */
  closeSession(sessionId: string): void {
    if (currentActiveSession && currentActiveSession.sessionId === sessionId) {
      currentActiveSession.isActive = false;
    }
    try {
      localStorage.removeItem('hiet_active_qr_session');
    } catch {
      // ignore
    }
    if (attendanceBroadcastChannel) {
      attendanceBroadcastChannel.postMessage({
        type: 'SESSION_CLOSED',
        sessionId
      });
    }
  },

  /**
   * Retrieves live scans for a session
   */
  getSessionLogs(sessionId: string): LiveScanLogEntry[] {
    return sessionScanLogs[sessionId] || [];
  },

  /**
   * Verifies an attendance scan against 30m geofence, accuracy, and token
   */
  async verifyAttendanceScan(params: {
    sessionId: string;
    qrToken: string;
    studentId: string;
    studentName?: string;
    studentRoll?: string;
    scannedLat: number;
    scannedLng: number;
    accuracyMeters: number;
    forceExpiredToken?: boolean;
    forceDuplicate?: boolean;
  }): Promise<ScanVerificationResult> {
    const session = this.getActiveSession();
    const studentMaster: StudentMaster | undefined = dataStore.getStudentsMaster().find(
      s => s.id === params.studentId || s.roll_no === params.studentRoll
    );

    const sName = params.studentName || studentMaster?.name || 'CSE Student';
    const sRoll = params.studentRoll || studentMaster?.roll_no || 'HIET-CSE-001';
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Target coordinates (Session or Classroom default)
    const targetLat = session?.geofenceLat ?? CLASSROOM_COORDINATES.latitude;
    const targetLng = session?.geofenceLng ?? CLASSROOM_COORDINATES.longitude;
    const distanceMeters = computeHaversineDistance(
      targetLat,
      targetLng,
      params.scannedLat,
      params.scannedLng
    );

    // 1. Simulation duplicate override check
    if (params.forceDuplicate) {
      return {
        success: false,
        status: 'invalid',
        message: 'Already marked for this class session.',
        distanceMeters,
        accuracyMeters: params.accuracyMeters,
        studentName: sName,
        studentRoll: sRoll,
        timestamp,
      };
    }

    // 2. Token expiration check
    const isTokenExpired = params.forceExpiredToken || (session && Date.now() > session.expiresAt + 5000);
    if (isTokenExpired) {
      return {
        success: false,
        status: 'invalid',
        message: 'QR code has expired. Please scan fresh dynamic QR from classroom board.',
        distanceMeters,
        accuracyMeters: params.accuracyMeters,
        studentName: sName,
        studentRoll: sRoll,
        timestamp,
      };
    }

    // 3. Accuracy check (> 20m)
    if (params.accuracyMeters > CLASSROOM_COORDINATES.maxAccuracyMeters) {
      const logEntry: LiveScanLogEntry = {
        id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentId: params.studentId,
        studentName: sName,
        studentRoll: sRoll,
        status: 'flagged',
        distanceMeters,
        accuracyMeters: params.accuracyMeters,
        timestamp,
        reason: `Poor GPS accuracy (${params.accuracyMeters.toFixed(1)}m > 20m threshold). Try near window.`,
      };

      this.recordScanLog(params.sessionId, logEntry);

      return {
        success: false,
        status: 'flagged',
        message: `Location accuracy is too low (${params.accuracyMeters.toFixed(1)}m > 20m). Attendance flagged for teacher manual approval.`,
        distanceMeters,
        accuracyMeters: params.accuracyMeters,
        studentName: sName,
        studentRoll: sRoll,
        timestamp,
      };
    }

    // 4. Strict 30-meter Geofence check
    if (distanceMeters > CLASSROOM_COORDINATES.geofenceRadiusMeters) {
      const logEntry: LiveScanLogEntry = {
        id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        studentId: params.studentId,
        studentName: sName,
        studentRoll: sRoll,
        status: 'invalid',
        distanceMeters,
        accuracyMeters: params.accuracyMeters,
        timestamp,
        reason: `Outside 30m classroom geofence (${distanceMeters.toFixed(1)}m away).`,
      };

      this.recordScanLog(params.sessionId, logEntry);

      return {
        success: false,
        status: 'invalid',
        message: `You are outside the 30-meter classroom boundary (${distanceMeters.toFixed(1)}m away). Scan rejected.`,
        distanceMeters,
        accuracyMeters: params.accuracyMeters,
        studentName: sName,
        studentRoll: sRoll,
        timestamp,
      };
    }

    // 5. Check if already marked in local logs or store
    const existingLogs = sessionScanLogs[params.sessionId] || [];
    const alreadyLogged = existingLogs.find(l => l.studentId === params.studentId && l.status === 'verified');
    if (alreadyLogged) {
      return {
        success: false,
        status: 'invalid',
        message: 'Already marked for this class session.',
        distanceMeters,
        accuracyMeters: params.accuracyMeters,
        studentName: sName,
        studentRoll: sRoll,
        timestamp,
      };
    }

    // Try Supabase RPC if connected
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('verify_attendance_scan', {
          p_session_id: params.sessionId,
          p_scanned_lat: params.scannedLat,
          p_scanned_long: params.scannedLng,
          p_location_accuracy: params.accuracyMeters,
          p_qr_token: params.qrToken,
          p_device_hash: navigator.userAgent
        });

        if (!rpcError && rpcData && typeof rpcData === 'object') {
          const rpcRes = rpcData as { success?: boolean; error?: string; status?: string };
          if (rpcRes.success === false) {
            return {
              success: false,
              status: (rpcRes.status as 'verified' | 'flagged' | 'invalid') || 'invalid',
              message: rpcRes.error || 'Attendance verification failed',
              distanceMeters,
              accuracyMeters: params.accuracyMeters,
              studentName: sName,
              studentRoll: sRoll,
              timestamp,
            };
          }
        }
      } catch (err) {
        console.warn('verify_attendance_scan RPC fallback:', err);
      }
    }

    // 6. Save verified record
    const today = new Date().toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      id: `att-qr-${Date.now()}`,
      student_id: params.studentId,
      student_roll: sRoll,
      subject_id: session ? `sub-${session.branch.toLowerCase()}-${session.semester}` : 'sub-cse-6',
      subject_name: session?.subjectName || 'Mathematics',
      subject_code: session?.subjectCode || 'CS-601',
      date: today,
      status: 'Present',
      marked_by: session?.facultyId || 'tch-01'
    };

    await apiService.saveAttendance([newRecord]);

    const logEntry: LiveScanLogEntry = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: params.studentId,
      studentName: sName,
      studentRoll: sRoll,
      status: 'verified',
      distanceMeters,
      accuracyMeters: params.accuracyMeters,
      timestamp,
    };

    this.recordScanLog(params.sessionId, logEntry);

    return {
      success: true,
      status: 'verified',
      message: `Attendance marked successfully! (${distanceMeters.toFixed(1)}m from podium, accuracy ${params.accuracyMeters.toFixed(1)}m)`,
      distanceMeters,
      accuracyMeters: params.accuracyMeters,
      studentName: sName,
      studentRoll: sRoll,
      timestamp,
      record: newRecord,
    };
  },

  /**
   * Internal recorder for scan logs with broadcast sync
   */
  recordScanLog(sessionId: string, entry: LiveScanLogEntry): void {
    if (!sessionScanLogs[sessionId]) {
      sessionScanLogs[sessionId] = [];
    }
    // Prepend latest scan
    sessionScanLogs[sessionId] = [entry, ...sessionScanLogs[sessionId]];

    // Broadcast to other tabs (e.g. Teacher Dashboard)
    if (attendanceBroadcastChannel) {
      attendanceBroadcastChannel.postMessage({
        type: 'SCAN_RECEIVED',
        sessionId,
        entry
      });
    }
  },

  /**
   * Manual override: Faculty approves a flagged student
   */
  async approveFlaggedStudent(sessionId: string, studentId: string): Promise<boolean> {
    const logs = sessionScanLogs[sessionId] || [];
    const entry = logs.find(l => l.studentId === studentId);
    if (entry) {
      entry.status = 'verified';
      entry.manualOverride = true;

      // Save to official records
      const today = new Date().toISOString().split('T')[0];
      const session = this.getActiveSession();
      const newRecord: AttendanceRecord = {
        id: `att-manual-${Date.now()}`,
        student_id: studentId,
        student_roll: entry.studentRoll,
        subject_id: session ? `sub-${session.branch.toLowerCase()}-${session.semester}` : 'sub-cse-6',
        subject_name: session?.subjectName || 'Mathematics',
        subject_code: session?.subjectCode || 'CS-601',
        date: today,
        status: 'Present',
        marked_by: session?.facultyId || 'tch-01'
      };

      await apiService.saveAttendance([newRecord]);

      if (attendanceBroadcastChannel) {
        attendanceBroadcastChannel.postMessage({
          type: 'OVERRIDE_APPROVED',
          sessionId,
          studentId
        });
      }
      return true;
    }
    return false;
  },

  /**
   * Subscribes to attendance events (scans, overrides, sessions)
   */
  subscribe(callback: (event: { type: string; [key: string]: unknown }) => void): () => void {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && typeof e.data === 'object') {
        callback(e.data);
      }
    };

    if (attendanceBroadcastChannel) {
      attendanceBroadcastChannel.addEventListener('message', handleMessage);
    }

    return () => {
      if (attendanceBroadcastChannel) {
        attendanceBroadcastChannel.removeEventListener('message', handleMessage);
      }
    };
  }
};
