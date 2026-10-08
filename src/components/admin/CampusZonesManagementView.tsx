// =============================================================================
// HIET DIGITAL CAMPUS — CAMPUS ZONES & BLE BEACON MANAGEMENT
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// Principal & Administrative Console for Campus Spatial Registry
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Building,
  Radio,
  QrCode,
  Plus,
  RefreshCw,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Search,
  Filter,
  Download,
  Share2
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import {
  CampusBuilding,
  CampusFloor,
  CampusZone,
  ZoneQrToken,
  BleBeacon,
  CampusZoneType
} from '../../types';
import {
  fetchCampusBuildings,
  fetchCampusFloors,
  fetchCampusZones,
  fetchZoneQrTokens,
  fetchBleBeacons,
  createCampusZone,
  createZoneQrToken,
  registerBleBeacon
} from '../../lib/aiCampusPhase2Service';

type AdminTab = 'zones' | 'buildings' | 'beacons' | 'tokens';

export const CampusZonesManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('zones');
  const [loading, setLoading] = useState(false);

  const [buildings, setBuildings] = useState<CampusBuilding[]>([]);
  const [floors, setFloors] = useState<CampusFloor[]>([]);
  const [zones, setZones] = useState<CampusZone[]>([]);
  const [tokens, setTokens] = useState<ZoneQrToken[]>([]);
  const [beacons, setBeacons] = useState<BleBeacon[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [zoneTypeFilter, setZoneTypeFilter] = useState<string>('all');

  // Modals
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [isAddBeaconOpen, setIsAddBeaconOpen] = useState(false);
  const [isGenerateTokenOpen, setIsGenerateTokenOpen] = useState(false);
  const [printToken, setPrintToken] = useState<ZoneQrToken | null>(null);

  // Add Zone Form State
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCode, setNewZoneCode] = useState('');
  const [newZoneType, setNewZoneType] = useState<CampusZoneType>('classroom');
  const [newZoneBuilding, setNewZoneBuilding] = useState('bld-01');
  const [newZoneFloor, setNewZoneFloor] = useState('flr-02');
  const [newZoneCapacity, setNewZoneCapacity] = useState('60');
  const [newRoomCode, setNewRoomCode] = useState('');

  // Add Beacon Form State
  const [newBeaconCode, setNewBeaconCode] = useState('');
  const [newBeaconZone, setNewBeaconZone] = useState('zone-03');
  const [newBeaconMajor, setNewBeaconMajor] = useState('101');
  const [newBeaconMinor, setNewBeaconMinor] = useState('4');
  const [newBeaconNotes, setNewBeaconNotes] = useState('');

  // Generate Token Form State
  const [tokenTargetZone, setTokenTargetZone] = useState('zone-03');
  const [tokenIsDynamic, setTokenIsDynamic] = useState(false);
  const [tokenExpiryMins, setTokenExpiryMins] = useState('60');

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, f, z, t, bc] = await Promise.all([
        fetchCampusBuildings(),
        fetchCampusFloors(),
        fetchCampusZones(),
        fetchZoneQrTokens(),
        fetchBleBeacons(),
      ]);
      setBuildings(b);
      setFloors(f);
      setZones(z);
      setTokens(t);
      setBeacons(bc);
    } catch (err) {
      console.warn('Error loading campus zones registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim() || !newZoneCode.trim()) return;

    const b = buildings.find(x => x.building_id === newZoneBuilding);
    const fl = floors.find(x => x.floor_id === newZoneFloor);

    await createCampusZone({
      zone_name: newZoneName.trim(),
      zone_code: newZoneCode.trim().toUpperCase(),
      zone_type: newZoneType,
      building_id: newZoneBuilding,
      floor_id: newZoneFloor,
      capacity: parseInt(newZoneCapacity) || 50,
      room_code: newRoomCode.trim(),
      building_name: b?.building_name,
      floor_name: fl?.floor_name,
    });

    setIsAddZoneOpen(false);
    setNewZoneName('');
    setNewZoneCode('');
    setNewRoomCode('');
    loadData();
  };

  const handleRegisterBeacon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeaconCode.trim()) return;

    await registerBleBeacon({
      beacon_code: newBeaconCode.trim().toUpperCase(),
      zone_id: newBeaconZone,
      major_value: parseInt(newBeaconMajor) || 101,
      minor_value: parseInt(newBeaconMinor) || 1,
      calibration_notes: newBeaconNotes.trim() || 'Pilot calibration at site.',
    });

    setIsAddBeaconOpen(false);
    setNewBeaconCode('');
    setNewBeaconNotes('');
    loadData();
  };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    await createZoneQrToken({
      zoneId: tokenTargetZone,
      isDynamic: tokenIsDynamic,
      expiresInMinutes: tokenIsDynamic ? parseInt(tokenExpiryMins) || 60 : undefined,
    });

    setIsGenerateTokenOpen(false);
    loadData();
  };

  // Filtered Zones
  const filteredZones = zones.filter(z => {
    const name = z.zone_name || z.name || '';
    const code = z.zone_code || z.code || '';
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = zoneTypeFilter === 'all' || z.zone_type === zoneTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* 1. Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Campus Administration' },
          { label: 'Campus Zones & Spatial Registry', active: true }
        ]}
        title="Campus Zones & Spatial Registry"
        description="Configure institutional buildings, floor zones, dynamic QR posters, and pilot BLE beacons"
        badge="Spatial Infrastructure"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0f2942] text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setIsGenerateTokenOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-xs font-bold text-blue-900 transition flex items-center gap-1.5 shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-700" />
              <span>Generate Zone QR</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddZoneOpen(true)}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4 text-blue-300" />
              <span>Add Zone</span>
            </button>
          </div>
        }
      />

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Campus Buildings"
          value={buildings.length}
          subtext="Main Campus & Complexes"
          icon={Building}
          badge="Infrastructure"
          badgeColor="blue"
        />
        <StatCard
          label="Registered Zones"
          value={zones.length}
          subtext="Classrooms, labs & hubs"
          icon={MapPin}
          badge="Active Zones"
          badgeColor="emerald"
        />
        <StatCard
          label="Active QR Posters"
          value={tokens.length}
          subtext="Tokens in circulation"
          icon={QrCode}
          badge="Voluntary QR"
          badgeColor="blue"
        />
        <StatCard
          label="Pilot BLE Beacons"
          value={beacons.length}
          subtext="Academic Block First Floor"
          icon={Radio}
          badge="Hardware Pilot"
          badgeColor="blue"
        />
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'zones'
              ? 'bg-[#0f2942] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Zones Directory ({zones.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('beacons')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'beacons'
              ? 'bg-[#0f2942] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>BLE Beacons Pilot ({beacons.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tokens')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'tokens'
              ? 'bg-[#0f2942] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>QR Posters & Tokens ({tokens.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('buildings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'buildings'
              ? 'bg-[#0f2942] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Buildings & Floors ({buildings.length})</span>
        </button>
      </div>

      {/* 4. Tab Content */}
      {activeTab === 'zones' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by zone code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:border-[#0f2942]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={zoneTypeFilter}
                onChange={(e) => setZoneTypeFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 focus:outline-hidden focus:border-[#0f2942]"
              >
                <option value="all">All Zone Types</option>
                <option value="classroom">Classroom</option>
                <option value="lab">Laboratory</option>
                <option value="library">Library</option>
                <option value="floor">Floor Corridor</option>
                <option value="canteen">Canteen</option>
                <option value="gate">Gate Checkpoint</option>
                <option value="hostel">Hostel</option>
              </select>
            </div>
          </div>

          {/* Zones Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Zone Code</th>
                    <th className="p-3.5">Zone Name</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Building & Floor</th>
                    <th className="p-3.5">Capacity</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredZones.map((z) => (
                    <tr key={z.zone_id || z.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-mono font-bold text-blue-900">
                        {z.zone_code || z.code}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {z.zone_name || z.name}
                        {z.room_code && (
                          <span className="ml-2 text-[10px] text-slate-400 font-normal">
                            (Room {z.room_code})
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {z.zone_type || 'General'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <p className="font-medium text-slate-800">{z.building_name || 'Academic Block'}</p>
                        <p className="text-[10px] text-slate-400">{z.floor_name || 'First Floor'}</p>
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {z.capacity || 50} persons
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          z.is_active !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {z.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setTokenTargetZone(z.zone_id || z.id || 'zone-01');
                            setIsGenerateTokenOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold transition"
                        >
                          New QR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BLE Beacons Pilot Tab */}
      {activeTab === 'beacons' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl shrink-0 mt-0.5">
              <Radio className="w-5 h-5" />
            </div>
            <div className="text-xs text-purple-950 space-y-1">
              <p className="font-bold text-sm">BLE Beacon Pilot Specification (Part E)</p>
              <p className="text-slate-700 leading-relaxed">
                Pilot architecture deployed at <strong>Academic Block First Floor</strong> (Beacons BLE-AB-F1-01, 02, 03).
                Notice: Native Android/iOS companion apps ingest RSSI proximity bands. Web browsers do not perform background BLE scanning.
                Proximity is mapped to floor/zone confidence, never claimed as exact sub-meter room triangulation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddBeaconOpen(true)}
              className="ml-auto shrink-0 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Beacon</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Beacon Code</th>
                    <th className="p-3.5">Zone & Building</th>
                    <th className="p-3.5">UUID</th>
                    <th className="p-3.5">Major / Minor</th>
                    <th className="p-3.5">Tx Power</th>
                    <th className="p-3.5">Battery</th>
                    <th className="p-3.5">Calibration Notes</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {beacons.map((b) => (
                    <tr key={b.beacon_id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-mono font-bold text-purple-900">
                        {b.beacon_code}
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">
                        {b.zone_name || 'Academic Block — First Floor'}
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-500 max-w-[150px] truncate">
                        {b.uuid_value || 'fda50693-a4e2-4fb1-afcf-c6eb07647825'}
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {b.major_value} / {b.minor_value}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {b.tx_power} dBm
                      </td>
                      <td className="p-3.5 text-emerald-700 font-semibold">
                        {b.battery_status || '98%'}
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-[200px] text-[11px]">
                        {b.calibration_notes || 'Calibrated at installation site'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {b.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QR Tokens Tab */}
      {activeTab === 'tokens' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="text-xs text-blue-950">
              <p className="font-bold text-sm">Zone QR Poster Tokens</p>
              <p className="text-slate-600 mt-0.5">
                Tokens can be printed and mounted at physical zone entry points for student self-service verification.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsGenerateTokenOpen(true)}
              className="px-3 py-1.5 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Token</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tokens.map((tok) => (
              <div
                key={tok.zone_qr_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      {tok.public_token}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      tok.is_dynamic ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {tok.is_dynamic ? 'Dynamic' : 'Static Poster'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">{tok.zone_name || 'Academic Zone'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Zone Code: {tok.zone_code}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-emerald-700 font-bold">Active in Circulation</span>
                  <button
                    type="button"
                    onClick={() => setPrintToken(tok)}
                    className="px-3 py-1 bg-slate-100 hover:bg-[#0f2942] hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Poster</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buildings & Floors Tab */}
      {activeTab === 'buildings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buildings.map((b) => (
            <div key={b.building_id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{b.building_name}</h3>
                  <p className="font-mono text-xs text-slate-400">{b.building_code}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                  Operational
                </span>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Floors Mapped:</span>
                <div className="space-y-1.5">
                  {floors.filter(f => f.building_id === b.building_id).map(fl => (
                    <div key={fl.floor_id} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{fl.floor_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Level {fl.floor_number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Zone Modal */}
      {isAddZoneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-auto animate-scale-in">
            <div className="p-4 bg-[#0f2942] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-300" />
                <h3 className="text-sm font-bold">Register New Campus Zone</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddZoneOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateZone} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Zone Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. C-103"
                    value={newZoneCode}
                    onChange={(e) => setNewZoneCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase focus:outline-hidden focus:border-[#0f2942]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Zone Type *</label>
                  <select
                    value={newZoneType}
                    onChange={(e) => setNewZoneType(e.target.value as CampusZoneType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-[#0f2942]"
                  >
                    <option value="classroom">Classroom</option>
                    <option value="lab">Laboratory</option>
                    <option value="library">Library</option>
                    <option value="floor">Floor Corridor</option>
                    <option value="canteen">Canteen</option>
                    <option value="gate">Gate Checkpoint</option>
                    <option value="hostel">Hostel</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Zone Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Seminar Hall C-103"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#0f2942]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Building</label>
                  <select
                    value={newZoneBuilding}
                    onChange={(e) => setNewZoneBuilding(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-[#0f2942]"
                  >
                    {buildings.map((b) => (
                      <option key={b.building_id} value={b.building_id}>{b.building_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Floor</label>
                  <select
                    value={newZoneFloor}
                    onChange={(e) => setNewZoneFloor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-[#0f2942]"
                  >
                    {floors.map((f) => (
                      <option key={f.floor_id} value={f.floor_id}>{f.floor_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Room Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 103"
                    value={newRoomCode}
                    onChange={(e) => setNewRoomCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#0f2942]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Capacity (Persons)</label>
                  <input
                    type="number"
                    value={newZoneCapacity}
                    onChange={(e) => setNewZoneCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#0f2942]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddZoneOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl font-bold transition shadow-xs"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Beacon Modal */}
      {isAddBeaconOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-auto animate-scale-in">
            <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-300" />
                <h3 className="text-sm font-bold">Register BLE Beacon Pilot Unit</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBeaconOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterBeacon} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Beacon Identifier Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BLE-AB-F1-04"
                  value={newBeaconCode}
                  onChange={(e) => setNewBeaconCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase focus:outline-hidden focus:border-[#0f2942]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assigned Zone</label>
                <select
                  value={newBeaconZone}
                  onChange={(e) => setNewBeaconZone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-[#0f2942]"
                >
                  {zones.map((z) => (
                    <option key={z.zone_id || z.id} value={z.zone_id || z.id}>
                      {z.zone_name || z.name} ({z.zone_code || z.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Major Value</label>
                  <input
                    type="number"
                    value={newBeaconMajor}
                    onChange={(e) => setNewBeaconMajor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#0f2942]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Minor Value</label>
                  <input
                    type="number"
                    value={newBeaconMinor}
                    onChange={(e) => setNewBeaconMinor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#0f2942]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Installation Calibration Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Mounted at east pillar outside Lab 1 at 2.5m elevation."
                  value={newBeaconNotes}
                  onChange={(e) => setNewBeaconNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#0f2942]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBeaconOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Register Beacon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Token Modal */}
      {isGenerateTokenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden my-auto animate-scale-in">
            <div className="p-4 bg-[#0f2942] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-300" />
                <h3 className="text-sm font-bold">Generate Zone QR Token</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateTokenOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateToken} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Target Campus Zone</label>
                <select
                  value={tokenTargetZone}
                  onChange={(e) => setTokenTargetZone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-[#0f2942]"
                >
                  {zones.map((z) => (
                    <option key={z.zone_id || z.id} value={z.zone_id || z.id}>
                      {z.zone_name || z.name} ({z.zone_code || z.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tokenIsDynamic}
                    onChange={(e) => setTokenIsDynamic(e.target.checked)}
                    className="rounded-sm border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>Time-Expiring Dynamic Token</span>
                </label>
                {tokenIsDynamic && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] text-slate-600">Expires After (Minutes):</label>
                    <input
                      type="number"
                      value={tokenExpiryMins}
                      onChange={(e) => setTokenExpiryMins(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenerateTokenOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl font-bold transition shadow-xs"
                >
                  Generate & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Poster Modal */}
      {printToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden my-auto animate-scale-in">
            <div className="p-4 bg-[#0f2942] text-white flex items-center justify-between">
              <span className="text-xs font-bold">Printable Zone Poster</span>
              <button
                type="button"
                onClick={() => setPrintToken(null)}
                className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 text-center space-y-4 bg-white" id="printable-zone-poster">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  HIET Digital Campus
                </p>
                <h2 className="text-base font-extrabold text-[#0f2942]">
                  {printToken.zone_name}
                </h2>
                <p className="text-xs font-mono text-slate-600 font-bold">
                  {printToken.zone_code}
                </p>
              </div>

              {/* Graphic QR Poster Simulation */}
              <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl inline-block mx-auto shadow-inner">
                <QrCode className="w-36 h-36 text-[#0f2942] mx-auto" />
                <p className="mt-2 text-[10px] font-mono text-slate-600 font-bold">
                  {printToken.public_token}
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-left text-[11px] text-blue-950 leading-relaxed">
                <p className="font-bold">Instructions for Students:</p>
                <p className="text-slate-600 mt-0.5">
                  Scan this poster with your HIET Digital Campus app to verify voluntary presence in this campus zone.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintToken(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Poster</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
