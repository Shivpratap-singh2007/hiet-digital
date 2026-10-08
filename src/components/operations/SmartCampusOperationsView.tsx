// =============================================================================
// HIET DIGITAL CAMPUS — SMART CAMPUS OPERATIONS DASHBOARD
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// Unified Role-Scoped Console for Occupancy, Zone Telemetry & Edge Device Health
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  ShieldAlert,
  Radio,
  QrCode,
  Building,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Trash2,
  Eye,
  Info,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import {
  getMockOccupancyOverview,
  OccupancyAnalyticsOverview,
  ZoneOccupancySummary,
  SEED_WASTE_EVENTS,
  SEED_WASTE_BINS
} from '../../lib/aiCampusPhase2Service';
import { useAuth } from '../../context/AuthContext';
import { CrowdLevel } from '../../types';
import { NavTab } from '../common/Sidebar';

interface Props {
  roleMode?: 'principal' | 'hod' | 'security' | 'md';
  onNavigateTab?: (tab: NavTab) => void;
}

export const SmartCampusOperationsView: React.FC<Props> = ({
  roleMode = 'principal',
  onNavigateTab
}) => {
  const { role } = useAuth();
  const effectiveRole = roleMode || role || 'principal';

  const [loading, setLoading] = useState(false);
  const [occupancyData, setOccupancyData] = useState<OccupancyAnalyticsOverview>(() =>
    getMockOccupancyOverview()
  );
  const [selectedZoneCode, setSelectedZoneCode] = useState<string>('all');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setOccupancyData(getMockOccupancyOverview());
      setLoading(false);
    }, 400);
  };

  const getCrowdBadge = (level: CrowdLevel) => {
    switch (level) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const filteredZones = occupancyData.zones.filter(z => {
    // Role-specific scoping:
    if (effectiveRole === 'security') {
      // Security views gate, hostel, and public gathering zones only
      return ['MAIN-GATE', 'CANTEEN', 'LIBRARY'].includes(z.zoneCode);
    }
    if (effectiveRole === 'hod') {
      // HOD focuses on academic departmental labs and library
      return ['C-LAB-1', 'LIBRARY'].includes(z.zoneCode);
    }
    if (selectedZoneCode !== 'all') {
      return z.zoneCode === selectedZoneCode;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* 1. Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'Campus Operations' },
          { label: 'Smart Operations & Crowd Analytics', active: true }
        ]}
        title={
          effectiveRole === 'security'
            ? 'Security Zone Operations & Alerts'
            : effectiveRole === 'hod'
            ? 'Departmental Space & Occupancy Operations'
            : 'Smart Campus Operations Command'
        }
        description={
          effectiveRole === 'security'
            ? 'Operational perimeter occupancy, gate telemetry, and automated crowd threshold alerts'
            : effectiveRole === 'hod'
            ? 'Department lecture hall capacity, laboratory headcounts, and academic zone health'
            : 'Privacy-aware operational intelligence • CV Occupancy, QR Verifications & Hardware Telemetry'
        }
        badge={
          effectiveRole === 'security'
            ? 'Perimeter Security'
            : effectiveRole === 'hod'
            ? 'HOD Oversight'
            : 'Operations Command'
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0f2942] text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
            >
              <Info className="w-4 h-4 text-slate-500" />
              <span>Privacy Rules</span>
            </button>
            <button
              type="button"
              onClick={refreshData}
              disabled={loading}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Operations</span>
            </button>
          </div>
        }
      />

      {/* 2. Statutory Privacy Safeguard Notice */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0 mt-0.5">
          <Activity className="w-5 h-5" />
        </div>
        <div className="text-xs text-blue-950 space-y-0.5">
          <p className="font-bold text-sm">Privacy-Aware Aggregate Analytics Guarantee</p>
          <p className="text-slate-600 leading-relaxed">
            All occupancy metrics are computed using anonymous object detection at edge gateways.
            <strong> Zero face recognition</strong> is conducted, and <strong>no raw video frames</strong> are retained or stored.
            Occupancy figures represent aggregate counts only and are never used for automated disciplinary action.
          </p>
        </div>
      </div>

      {/* 3. Top Operational Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Headcount (Active)"
          value={occupancyData.totalCampusCount}
          subtext={`Across ${occupancyData.zones.length} optical detection zones`}
          icon={Users}
          badge="Live Aggregate"
          badgeColor="blue"
        />

        <StatCard
          label="Campus Occupancy Rate"
          value={`${occupancyData.averageOccupancyRate}%`}
          subtext={`Of total capacity (${occupancyData.totalCapacity} persons)`}
          icon={TrendingUp}
          badge="Capacity Load"
          badgeColor="emerald"
        />

        <StatCard
          label="Crowd Density Alerts"
          value={occupancyData.criticalAlertCount}
          subtext="Zones exceeding 70% threshold"
          icon={AlertTriangle}
          badge={occupancyData.criticalAlertCount > 0 ? 'Attention Needed' : 'Normal'}
          badgeColor={occupancyData.criticalAlertCount > 0 ? 'amber' : 'emerald'}
        />

        <StatCard
          label="Edge Gateways Online"
          value="4 / 4"
          subtext="Raspberry Pi & Jetson Nodes"
          icon={Cpu}
          badge="Healthy Heartbeat"
          badgeColor="emerald"
        />
      </div>

      {/* 4. Live Zone Occupancy Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#0f2942] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Pilot Zone Occupancy Telemetry</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live anonymous headcount stream from hardware gateways (Refreshed every 30s)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Filter Zone:</span>
            <select
              value={selectedZoneCode}
              onChange={(e) => setSelectedZoneCode(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 focus:outline-hidden focus:border-[#0f2942]"
            >
              <option value="all">All Pilot Zones</option>
              {occupancyData.zones.map((z) => (
                <option key={z.zoneCode} value={z.zoneCode}>
                  {z.zoneName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredZones.map((zone) => {
            const isHigh = zone.crowdLevel === 'critical' || zone.crowdLevel === 'high';
            return (
              <div
                key={zone.zoneCode}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                  isHigh
                    ? 'border-amber-300 bg-amber-50/40'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {zone.zoneCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getCrowdBadge(
                        zone.crowdLevel
                      )}`}
                    >
                      {zone.crowdLevel}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug">
                    {zone.zoneName}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{zone.buildingName}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-[#0f2942]">
                        {zone.personCount}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        / {zone.capacity} max
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {zone.occupancyPercentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        zone.occupancyPercentage >= 90
                          ? 'bg-rose-500'
                          : zone.occupancyPercentage >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, zone.occupancyPercentage)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100/70 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Device: {zone.deviceCode}</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Split Section: Recent Events & Waste Bin Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ingestion Telemetry Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0f2942] flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Recent Anonymous Occupancy Events</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hardware gateway transaction log (zero video storage)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 font-bold">
              YOLOv8n-CrowdCount
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Zone Code</th>
                  <th className="p-3">Headcount</th>
                  <th className="p-3">Load %</th>
                  <th className="p-3">Crowd Level</th>
                  <th className="p-3">Model Conf.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {occupancyData.recentEvents.map((evt) => (
                  <tr key={evt.occupancy_event_id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(evt.event_timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-bold text-blue-900">{evt.zone_code}</td>
                    <td className="p-3 text-slate-800 font-bold text-sm">
                      {evt.person_count}
                    </td>
                    <td className="p-3 text-slate-600">{evt.occupancy_percentage}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${getCrowdBadge(
                          evt.crowd_level
                        )}`}
                      >
                        {evt.crowd_level}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {evt.model_confidence}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Smart Waste AI Integration-Ready Status (Part H) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f2942] flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-emerald-600" />
                <span>Smart Waste Telemetry</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                Integration-Ready
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time ultrasonic & optical fill-level sensor stream ready for campus sanitation logistics.
            </p>

            <div className="space-y-3 pt-2">
              {SEED_WASTE_BINS.map((bin, i) => {
                const event = SEED_WASTE_EVENTS[i] || SEED_WASTE_EVENTS[0];
                return (
                  <div key={bin.waste_device_id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{bin.device_name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{bin.device_code}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 capitalize">{event.waste_category} Bin</span>
                        <span className="font-bold text-slate-800">{event.fill_level_percentage}% Fill</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (event.fill_level_percentage || 0) > 80
                              ? 'bg-rose-500'
                              : (event.fill_level_percentage || 0) > 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${event.fill_level_percentage}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Location: {bin.zone_name} • {(event.fill_level_percentage || 0) > 75 ? 'Collection Needed' : 'Normal Operation'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Hardware: Ultrasonic HC-SR04 / LoRaWAN Gateways
          </div>
        </div>
      </div>

      {/* 6. Privacy & Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-auto animate-scale-in">
            <div className="p-4 bg-[#0f2942] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-300" />
                <h3 className="text-sm font-bold">Smart Operations Privacy Framework</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700 leading-relaxed max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <h4 className="font-bold text-[#0f2942] text-sm">1. Zero Face Recognition Policy</h4>
                <p>
                  Edge gateways execute integer headcount inference only (general class person). Under no circumstances are face embeddings generated, compared, or stored.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#0f2942] text-sm">2. Zero Raw Video Storage</h4>
                <p>
                  Video buffers reside in volatile edge memory for less than 50 milliseconds and are immediately destroyed. No video frames are written to disk or sent to cloud servers.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#0f2942] text-sm">3. Non-Punitive Aggregates</h4>
                <p>
                  Occupancy data serves strictly for campus resource optimization, HVAC energy savings, and safety management. It is legally barred from being used for disciplinary action.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-[#0f2942] text-white rounded-xl font-bold hover:bg-[#0a1c2e] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
