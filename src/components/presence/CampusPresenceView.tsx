import React, { useState, useEffect, useCallback } from 'react';
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

interface Props {
  roleMode?: 'principal' | 'hod';
  departmentFilter?: string;
}

export const CampusPresenceView: React.FC<Props> = ({ roleMode = 'principal', departmentFilter }) => {
  const [zones, setZones] = useState<CampusZone[]>(() => dataStore.getCampusZones());
  const [records, setRecords] = useState<CampusPresenceRecord[]>(() => dataStore.getCampusPresence());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<CampusPresenceRecord | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

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
                key={zone.id}
                type="button"
                onClick={() => setSelectedZone(isSelected ? 'all' : zone.name)}
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
                      {getMethodIcon(zone.detection_method)}
                      <span className="truncate max-w-[70px]">{zone.detection_method.split(' ')[0]}</span>
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
