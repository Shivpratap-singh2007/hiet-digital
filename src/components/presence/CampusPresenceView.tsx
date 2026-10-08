import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Shield,
  Wifi,
  QrCode,
  Radio,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  RefreshCw,
  Building,
  Users,
  Eye,
  Lock
} from 'lucide-react';
import { CampusZone, CampusPresenceRecord } from '../../types';
import { apiService } from '../../lib/supabase';
import { dataStore } from '../../lib/mockData';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { useAuth } from '../../context/AuthContext';
import {
  verifyCampusZonePresence,
  getLastVerifiedPresence,
  ZoneVerificationResult,
  isZonePresenceEnabled
} from '../../lib/aiCampusPhase2Service';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  roleMode?: 'principal' | 'hod';
  departmentFilter?: string;
}

export const CampusPresenceView: React.FC<Props> = ({ roleMode = 'principal', departmentFilter }) => {
  const { user, role } = useAuth();
  const isStudent = role === 'student';

  const [zones, setZones] = useState<CampusZone[]>(() => dataStore.getCampusZones());
  const [records, setRecords] = useState<CampusPresenceRecord[]>(() => dataStore.getCampusPresence());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<CampusPresenceRecord | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Student QR Zone Verification States (Phase 2)
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyTokenInput, setVerifyTokenInput] = useState('');
  const [verifyConsent, setVerifyConsent] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [lastVerified, setLastVerified] = useState<ZoneVerificationResult | null>(() => {
    const cached = getLastVerifiedPresence();
    if (cached) {
      return {
        success: true,
        zone_name: cached.zone_name,
        zone_code: cached.zone_code,
        building_name: cached.building_name,
        floor_name: cached.floor_name,
        confidence_score: cached.confidence_score,
        detected_at: cached.detected_at
      };
    }
    return null;
  });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [z, p] = await Promise.all([
        apiService.getCampusZones(),
        apiService.getCampusPresence(departmentFilter ? { department: departmentFilter } : undefined)
      ]);
      setZones(z);
      setRecords(p);
    } catch (err) {
      console.warn('Campus presence load fallback:', err);
    } finally {
      setLoading(false);
    }
  }, [departmentFilter]);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [z, p] = await Promise.all([
          apiService.getCampusZones(),
          apiService.getCampusPresence(departmentFilter ? { department: departmentFilter } : undefined)
        ]);
        if (isMounted) {
          setZones(z);
          setRecords(p);
        }
      } catch (err) {
        console.warn('Campus presence load fallback:', err);
      }
    })();
    return () => { isMounted = false; };
  }, [departmentFilter]);

  // Filtered records
  const filteredRecords = records.filter(rec => {
    const matchesSearch =
      rec.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.student_roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZone === 'all' || rec.current_zone === selectedZone;
    const matchesStatus = selectedStatus === 'all' || rec.status === selectedStatus;
    const matchesDept = !departmentFilter || rec.department === departmentFilter;

    return matchesSearch && matchesZone && matchesStatus && matchesDept;
  });

  // Camera Scanner Controls
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (!qrScannerRef.current) {
        qrScannerRef.current = new Html5Qrcode('zone-qr-camera-feed');
      }
      await qrScannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await executeVerification(decodedText);
          stopCamera();
        },
        () => {}
      );
    } catch (err: unknown) {
      console.warn('Zone QR camera error:', err);
      setCameraError('Camera access denied or unavailable. Use manual token input or test tokens below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (qrScannerRef.current && isCameraActive) {
      qrScannerRef.current.stop().then(() => {
        setIsCameraActive(false);
      }).catch(() => {
        setIsCameraActive(false);
      });
    } else {
      setIsCameraActive(false);
    }
  };

  const executeVerification = async (tokenToVerify: string) => {
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await verifyCampusZonePresence({
        zoneToken: tokenToVerify,
        consent: verifyConsent,
      });

      if (res.success) {
        setLastVerified(res);
        setIsVerifyModalOpen(false);
        stopCamera();
      } else {
        setVerifyError(res.message || 'Verification failed. Please scan a valid zone poster.');
      }
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : 'Zone verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const totalPresent = records.filter(r => r.status === 'Present').length;
  const totalExited = records.filter(r => r.status === 'Exited').length;

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Gate Checkpoint':
        return <QrCode className="w-3.5 h-3.5 text-blue-600" />;
      case 'Wi-Fi AP Zone':
        return <Wifi className="w-3.5 h-3.5 text-emerald-600" />;
      case 'RFID/NFC Scanner':
        return <Radio className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  // ---------------------------------------------------------------------------
  // STUDENT SELF-SERVICE VIEW (Prompt Part D & Part I: Strict Privacy)
  // ---------------------------------------------------------------------------
  if (isStudent) {
    return (
      <div className="space-y-6 font-sans animate-fade-in">
        {/* Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Campus Services' },
            { label: 'Campus Presence Verification', active: true }
          ]}
          title="Verify Campus Zone"
          description="Voluntary, consent-based campus zone verification • No continuous background tracking"
          badge="Voluntary Self-Service"
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPrivacyPolicy(true)}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0f2942] text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Privacy Notice</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsVerifyModalOpen(true);
                  startCamera();
                }}
                className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <QrCode className="w-4 h-4 text-blue-300" />
                <span>Scan Zone QR</span>
              </button>
            </div>
          }
        />

        {/* Privacy Assurance Banner */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="text-xs text-emerald-950 space-y-0.5">
            <p className="font-bold text-sm">Privacy-First Architecture</p>
            <p className="text-slate-700 leading-relaxed">
              Your location is recorded <strong>only when you choose to verify a campus zone</strong>.
              The HIET Digital Campus app does not continuously track you, does not run background GPS, and does not record raw images or face biometrics.
            </p>
          </div>
        </div>

        {/* Current Verification Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Presence Status</span>
              <h2 className="text-lg font-bold text-[#0f2942] mt-0.5">
                {lastVerified ? lastVerified.zone_name : 'No Zone Verified Today'}
              </h2>
            </div>
            {lastVerified ? (
              <span className="px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Present</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-full self-start sm:self-auto">
                Unverified Session
              </span>
            )}
          </div>

          {lastVerified ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Building & Complex</span>
                <p className="font-bold text-slate-800 text-sm">{lastVerified.building_name || 'Academic Block'}</p>
                <p className="text-[11px] text-slate-500">{lastVerified.floor_name || 'Campus Floor'}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Zone Code / Room</span>
                <p className="font-bold text-slate-800 text-sm font-mono">{lastVerified.zone_code || 'ACAD-F1'}</p>
                <p className="text-[11px] text-slate-500">{lastVerified.room_code ? `Room ${lastVerified.room_code}` : 'General Zone'}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Detection Method</span>
                <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>Static Zone QR</span>
                </p>
                <p className="text-[11px] text-slate-500">Voluntary Poster Scan</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Last Verified At</span>
                <p className="font-bold text-[#0f2942] text-sm">
                  {lastVerified.detected_at
                    ? new Date(lastVerified.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now'}
                </p>
                <p className="text-[11px] text-emerald-600 font-semibold">{lastVerified.confidence_score || 95}% Confidence</p>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-3">
              <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="space-y-1 max-w-md mx-auto">
                <p className="text-sm font-bold text-slate-700">Check In at Any Campus Zone</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Scan the QR poster located near classroom entrances, floor lobbies, the Central Library, or hostel gates to confirm your presence for services.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsVerifyModalOpen(true);
                  startCamera();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <QrCode className="w-4 h-4 text-blue-300" />
                <span>Verify Zone QR Poster</span>
              </button>
            </div>
          )}

          {lastVerified && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500">
                Verified at <strong>{lastVerified.zone_name}</strong>. Valid for today’s campus session.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsVerifyModalOpen(true);
                  startCamera();
                }}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Re-verify / Change Zone</span>
              </button>
            </div>
          )}
        </div>

        {/* Verification Modal */}
        {isVerifyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden my-auto animate-scale-in">
              <div className="p-4 bg-[#0f2942] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-300" />
                  <h3 className="text-sm font-bold">Verify Campus Zone QR</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsVerifyModalOpen(false);
                  }}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Camera Scanner Viewport */}
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 min-h-[220px] flex items-center justify-center">
                    <div id="zone-qr-camera-feed" className="w-full h-full min-h-[220px]" />
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900/90 text-slate-300 space-y-2">
                        <QrCode className="w-8 h-8 text-blue-400" />
                        <p className="text-xs">Camera scanner paused or inactive.</p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                        >
                          Start Camera Feed
                        </button>
                      </div>
                    )}
                  </div>
                  {cameraError && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      {cameraError}
                    </p>
                  )}
                </div>

                {/* Manual Token Entry Fallback */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Or Enter Zone Token Manually:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verifyTokenInput}
                      onChange={(e) => setVerifyTokenInput(e.target.value)}
                      placeholder="e.g. TOKEN-ACAD-F1"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#0f2942]"
                    />
                    <button
                      type="button"
                      disabled={isVerifying || !verifyTokenInput.trim()}
                      onClick={() => executeVerification(verifyTokenInput)}
                      className="px-4 py-2 bg-[#0f2942] text-white rounded-xl text-xs font-bold hover:bg-[#0a1c2e] disabled:opacity-50 transition"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {/* Quick Test Chips for Development / Pilots */}
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Quick Test Zone Posters:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { code: 'TOKEN-ACAD-F1', label: 'Academic F1' },
                      { code: 'TOKEN-C101', label: 'Room C-101' },
                      { code: 'TOKEN-LIB-01', label: 'Library' },
                      { code: 'TOKEN-HOSTEL-01', label: 'Hostel Gate' }
                    ].map(chip => (
                      <button
                        key={chip.code}
                        type="button"
                        onClick={() => {
                          setVerifyTokenInput(chip.code);
                          executeVerification(chip.code);
                        }}
                        className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 transition font-medium"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy Consent Checkbox */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifyConsent}
                      onChange={(e) => setVerifyConsent(e.target.checked)}
                      className="mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-0"
                    />
                    <span className="text-[11px] text-slate-700 leading-tight">
                      I voluntarily consent to record my zone check-in at this location. I acknowledge this is not continuous tracking.
                    </span>
                  </label>
                </div>

                {verifyError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
                    {verifyError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Institutional Privacy Policy Modal */}
        {showPrivacyPolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-auto animate-scale-in">
              <div className="p-5 bg-[#0f2942] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-300" />
                  <h3 className="text-base font-bold">HIET Campus Location Privacy Policy</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs text-slate-700 leading-relaxed max-h-[70vh] overflow-y-auto">
                <div className="space-y-1">
                  <h4 className="font-bold text-[#0f2942] text-sm">1. Purpose Limitation (Section 48, 51)</h4>
                  <p>
                    Campus presence records are utilized solely for campus safety, disaster management, statutory student attendance verification, and perimeter control. Data is never shared with third parties or advertisers.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-[#0f2942] text-sm">2. Non-Invasive Technology (Section 49)</h4>
                  <p>
                    No continuous satellite GPS tracking or covert background surveillance is conducted. Location detection is limited to passive Gate QR/RFID check-ins and voluntary zone poster verifications.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-[#0f2942] text-sm">3. Role-Based Access Isolation (Section 51, 58)</h4>
                  <p>
                    Students cannot view peer location data. Faculty access is restricted to their assigned lecture halls. Only the Office of the Principal and Campus Security have authorized institutional oversight.
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-[#0f2942] text-sm">4. Data Retention & Ledger (Section 51)</h4>
                  <p>
                    Presence logs are automatically retained for 90 academic days before archival. Every administrative query of student telemetry is permanently logged in the institutional audit ledger.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="px-4 py-2 bg-[#0f2942] text-white rounded-xl text-xs font-bold hover:bg-[#0a1c2e] transition"
                >
                  Acknowledge & Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* 1. Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'Institutional Governance' },
          { label: 'Campus Presence & Zonal Telemetry', active: true }
        ]}
        title="Campus Presence & Zonal Monitoring"
        description="Authorized Institutional Location & Checkpoint Telemetry • Phase 1 Gate & Phase 2 Wi-Fi AP System"
        badge={roleMode === 'principal' ? 'Principal Command' : 'HOD Oversight'}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsVerifyModalOpen(true);
                startCamera();
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-xs font-bold text-blue-900 transition flex items-center gap-1.5 shadow-2xs"
            >
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>Verify Zone QR</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPrivacyPolicy(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0f2942] text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Privacy Policy</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        }
      />

      {/* 2. Statutory Privacy & Device Limitation Banner (Section 48, 51) */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="min-w-0 text-xs text-blue-900 leading-relaxed">
            <p className="font-bold text-sm text-[#0f2942]">Authorized Institutional Presence Infrastructure Notice</p>
            <p className="text-slate-600 mt-0.5">
              Presence is determined strictly via authorized campus infrastructure: Gate Checkpoint QR/RFID terminals and Campus Wi-Fi AP association.
              Continuous mobile GPS tracking is prohibited. Access is restricted to institutional leadership and fully audited.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Monitored"
          value={records.length}
          subtext="Students registered in active session"
          icon={Users}
          badge="Students"
          badgeColor="blue"
        />

        <StatCard
          label="On Campus (Present)"
          value={totalPresent}
          subtext="Verified inside campus perimeter"
          icon={CheckCircle2}
          badge="Active"
          badgeColor="emerald"
        />

        <StatCard
          label="Off Campus / Exited"
          value={totalExited}
          subtext="Gate exit pass or off-grid"
          icon={Clock}
          badge="Exited"
          badgeColor="slate"
        />

        <StatCard
          label="Configured Zones"
          value={zones.length}
          subtext="Audited institutional telemetry zones"
          icon={Building}
          badge="Perimeter"
          badgeColor="blue"
        />
      </div>

      {/* 4. Campus Zones Grid (Section 49) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0f2942] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Institutional Campus Zones</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              10 configured zones mapped across Vidyanagar, Shahpur Campus (Click to filter)
            </p>
          </div>
          {selectedZone !== 'all' && (
            <button
              onClick={() => setSelectedZone('all')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {zones.map(zone => {
            const isSelected = selectedZone === zone.name;
            return (
              <button
                key={zone.id || zone.zone_id}
                type="button"
                onClick={() => setSelectedZone(isSelected ? 'all' : (zone.name || zone.zone_name || ''))}
                className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#0f2942] bg-[#0f2942] text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white border border-slate-200 text-slate-600'
                    }`}>
                      {getMethodIcon(zone.detection_method || 'Wi-Fi AP')}
                      <span className="truncate max-w-[70px]">{(zone.detection_method || 'Wi-Fi AP').split(' ')[0]}</span>
                    </span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white text-[#0f2942]' : 'bg-blue-100 text-[#0f2942]'
                    }`}>
                      {zone.active_students_count}
                    </span>
                  </div>
                  <p className="text-xs font-bold truncate">{zone.name}</p>
                </div>
                <p className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                  {zone.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Real-Time Student Presence Table (Section 50) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0f2942] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0f2942]" />
              <span>Real-Time Student Presence Registry</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live checkpoint detections and Wi-Fi zone telemetry
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, roll no..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#0f2942]"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Exited">Exited</option>
              <option value="Away">Away</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No student presence records found</p>
            <p className="text-xs text-slate-500">
              No telemetry events match your selected filters or search parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Student Details</th>
                  <th className="py-3 px-4">Presence Status</th>
                  <th className="py-3 px-4">Current Zone</th>
                  <th className="py-3 px-4">Detection Source</th>
                  <th className="py-3 px-4">Confidence Level</th>
                  <th className="py-3 px-4">Last Detected</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div>
                        <span className="font-bold text-slate-900">{rec.student_name}</span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Roll: <span className="font-mono font-semibold">{rec.student_roll}</span> • {rec.department} (Sem {rec.semester})
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        rec.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'Exited'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          rec.status === 'Present' ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                        }`} />
                        {rec.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{rec.current_zone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {rec.detection_source}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Shield className="w-3 h-3 text-blue-600" />
                        {rec.confidence}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rec.last_detected}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(rec)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#0f2942] hover:bg-slate-100 transition"
                        title="View presence details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Student Telemetry Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-auto animate-scale-in">
            <div className="p-5 bg-[#0f2942] text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-blue-300">Student Presence Telemetry</p>
                <h3 className="text-base font-bold mt-0.5">{selectedStudent.student_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Roll Number</span>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{selectedStudent.student_roll}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedStudent.department} (Sem {selectedStudent.semester})</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Current Status</span>
                  <p className="font-bold text-emerald-700 text-sm mt-0.5">{selectedStudent.status}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Last Detected</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedStudent.last_detected}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <p className="font-bold text-slate-800">Zone Telemetry Trace</p>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-blue-900 font-bold">
                    <span>{selectedStudent.current_zone}</span>
                    <span className="text-[11px] bg-blue-200/80 px-2 py-0.5 rounded-md">{selectedStudent.confidence}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Source: <span className="font-mono">{selectedStudent.detection_source}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Recorded at: {selectedStudent.updated_at}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Limitation Notice:</strong> This represents zone-level presence based on Wi-Fi access point / Gate QR scan. It does not provide sub-meter room triangulation.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-[#0f2942] text-white rounded-xl text-xs font-bold hover:bg-[#0a1c2e] transition"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin QR Verification Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden my-auto animate-scale-in">
            <div className="p-4 bg-[#0f2942] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-300" />
                <h3 className="text-sm font-bold">Verify Campus Zone QR</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsVerifyModalOpen(false);
                }}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 min-h-[220px] flex items-center justify-center">
                  <div id="zone-qr-camera-feed" className="w-full h-full min-h-[220px]" />
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900/90 text-slate-300 space-y-2">
                      <QrCode className="w-8 h-8 text-blue-400" />
                      <p className="text-xs">Camera scanner paused or inactive.</p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                      >
                        Start Camera Feed
                      </button>
                    </div>
                  )}
                </div>
                {cameraError && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    {cameraError}
                  </p>
                )}
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Or Enter Zone Token Manually:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verifyTokenInput}
                    onChange={(e) => setVerifyTokenInput(e.target.value)}
                    placeholder="e.g. TOKEN-ACAD-F1"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#0f2942]"
                  />
                  <button
                    type="button"
                    disabled={isVerifying || !verifyTokenInput.trim()}
                    onClick={() => executeVerification(verifyTokenInput)}
                    className="px-4 py-2 bg-[#0f2942] text-white rounded-xl text-xs font-bold hover:bg-[#0a1c2e] disabled:opacity-50 transition"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Quick Test Zone Posters:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { code: 'TOKEN-ACAD-F1', label: 'Academic F1' },
                    { code: 'TOKEN-C101', label: 'Room C-101' },
                    { code: 'TOKEN-LIB-01', label: 'Library' },
                    { code: 'TOKEN-HOSTEL-01', label: 'Hostel Gate' }
                  ].map(chip => (
                    <button
                      key={chip.code}
                      type="button"
                      onClick={() => {
                        setVerifyTokenInput(chip.code);
                        executeVerification(chip.code);
                      }}
                      className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 transition font-medium"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {verifyError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
                  {verifyError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Institutional Privacy Policy Modal (Section 51) */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-auto animate-scale-in">
            <div className="p-5 bg-[#0f2942] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-300" />
                <h3 className="text-base font-bold">HIET Campus Location Privacy Policy</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyPolicy(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700 leading-relaxed max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <h4 className="font-bold text-[#0f2942] text-sm">1. Purpose Limitation (Section 48, 51)</h4>
                <p>
                  Campus presence records are utilized solely for campus safety, disaster management, statutory student attendance verification, and perimeter control. Data is never shared with third parties or advertisers.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#0f2942] text-sm">2. Non-Invasive Technology (Section 49)</h4>
                <p>
                  No continuous satellite GPS tracking or covert background surveillance is conducted. Location detection is limited to passive Gate QR/RFID check-ins and connection logs to designated college Wi-Fi access points.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#0f2942] text-sm">3. Role-Based Access Isolation (Section 51, 58)</h4>
                <p>
                  Students cannot view peer location data. Faculty access is restricted to their assigned lecture halls. Only the Office of the Principal and Campus Security have authorized institutional oversight.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#0f2942] text-sm">4. Data Retention & Ledger (Section 51)</h4>
                <p>
                  Presence logs are automatically retained for 90 academic days before archival. Every administrative query of student telemetry is permanently logged in the institutional audit ledger.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyPolicy(false)}
                className="px-4 py-2 bg-[#0f2942] text-white rounded-xl text-xs font-bold hover:bg-[#0a1c2e] transition"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
