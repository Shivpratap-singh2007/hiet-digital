import React, { useState } from 'react';
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { campusLifeStore } from '../../lib/campusLifeData';
import { BusRoute } from '../../types';

interface Props {
  onNavigate?: (tab: any) => void;
}

export const TransportTrackerView: React.FC<Props> = () => {
  const [routes] = useState<BusRoute[]>(() => campusLifeStore.getBusRoutes());
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || 'bus-rt-01');

  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  const getStatusBadge = (status: BusRoute['current_status']) => {
    switch (status) {
      case 'on_route':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            On Route • Active
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Arrived on Campus
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            Scheduled Departure
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Delayed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-2 border border-blue-100">
              <Bus className="w-3 h-3 text-blue-600" />
              <span>Campus Transport & Fleet Management</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              College Bus Routes & Day Scholar Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Daily pickup schedules across Kangra, Dharamshala, Palampur, Pathankot & Chamba, with verified driver contacts and WhatsApp links.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Transport In-Charge</span>
            <div className="font-bold text-slate-800">Sh. Rajesh Kaundal</div>
            <a
              href="tel:+919816044219"
              className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
            >
              <Phone className="w-3 h-3" />
              <span>+91 98160 44219</span>
            </a>
          </div>
        </div>

        {/* Route Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-5 border-t border-slate-100">
          {routes.map(rt => {
            const isSelected = rt.id === selectedRouteId;
            return (
              <button
                key={rt.id}
                onClick={() => setSelectedRouteId(rt.id)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#0f2942] text-white border-[#0f2942] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-blue-300' : 'text-slate-400'}`}>
                    {rt.route_number}
                  </span>
                  <div className="text-xs font-bold truncate mt-0.5">
                    {rt.origin.split(' ')[0]} ⇄ Shahpur
                  </div>
                </div>
                <div className="mt-2 text-[10px] truncate opacity-80">
                  {rt.bus_number.split(' ')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Active Route Details Card */}
      {activeRoute && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver & Bus Info */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Fleet & Driver Profile
              </span>
              {getStatusBadge(activeRoute.current_status)}
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Bus</span>
                <div className="font-bold text-slate-900 text-sm">{activeRoute.bus_number}</div>
                <div className="text-[11px] text-slate-500">Seating Capacity: {activeRoute.capacity} Seats</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Designated Driver</span>
                <div className="font-bold text-slate-900 text-sm">{activeRoute.driver_name}</div>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${activeRoute.driver_phone.replace(/\s+/g, '')}`}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Driver</span>
                  </a>
                  <a
                    href={`https://api.whatsapp.com/send?phone=${activeRoute.driver_phone.replace(/[^0-9]/g, '')}&text=Hello%20${encodeURIComponent(activeRoute.driver_name)}%2C%20regarding%20HIET%20${encodeURIComponent(activeRoute.route_number)}%20bus...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center transition"
                    title="WhatsApp Driver"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {activeRoute.conductor_name && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Bus Conductor</span>
                  <div className="font-bold text-slate-900 text-xs">{activeRoute.conductor_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{activeRoute.conductor_phone}</div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 leading-snug">
                <span className="font-bold">Campus Security Notice:</span> GPS live telemetry is monitored at Main Security Post. Report delays directly to Transport Desk.
              </div>
            </div>
          </div>

          {/* Stoppages & Timetable */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {activeRoute.route_name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Morning Inward Pickup & Evening Return Timetable
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#0f2942] bg-slate-100 px-2.5 py-1 rounded-lg">
                {activeRoute.stops.length} Stoppages
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {activeRoute.stops.map((stop, index) => (
                <div
                  key={stop.stop_name}
                  className="flex items-start gap-3.5 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50/80 transition"
                >
                  <div className="flex flex-col items-center shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-[#0f2942] text-white flex items-center justify-center font-bold text-[10px]">
                      {index + 1}
                    </div>
                    {index < activeRoute.stops.length - 1 && (
                      <div className="w-0.5 h-7 bg-slate-200 my-0.5"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="font-bold text-slate-900 text-xs">{stop.stop_name}</h4>
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          Pickup: {stop.morning_pickup_time}
                        </span>
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          Drop: {stop.evening_drop_time}
                        </span>
                      </div>
                    </div>
                    {stop.landmark && (
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>Landmark: {stop.landmark}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
