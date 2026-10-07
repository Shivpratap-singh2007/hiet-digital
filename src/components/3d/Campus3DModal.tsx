import React, { useState } from 'react';
import { 
  X, 
  Compass, 
  MapPin, 
  Sun, 
  Moon, 
  Maximize2, 
  Building2, 
  Phone, 
  Layers, 
  Sparkles,
  CloudSnow,
  Eye
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { CampusLocation } from '../../types';
import { ThreeCampusMap } from './ThreeCampusMap';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialLocationId?: string;
}

export const Campus3DModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialLocationId
}) => {
  const locations = dataStore.getLocations();
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation>(() => {
    if (initialLocationId) {
      return locations.find(l => l.id === initialLocationId) || locations[0];
    }
    return locations[0];
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fade-in">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[880px] bg-slate-900 border border-blue-500/40 rounded-3xl shadow-[0_25px_70px_rgba(37,99,235,0.35)] flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-900/95 border-b border-slate-800 z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-xs sm:text-base font-black text-white tracking-tight truncate max-w-[180px] xs:max-w-[280px] sm:max-w-none">
                  HIET Virtual Campus 3D Sandbox
                </h3>
                <span className="hidden xs:inline px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] sm:text-[10px] font-mono font-bold shrink-0">
                  WebGL 60 FPS
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[220px] xs:max-w-[320px] sm:max-w-none">
                Himachal Institute of Engineering & Technology • Shahpur
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Close 3D Campus"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D Viewport Area */}
        <div className="relative flex-1 w-full bg-slate-950 overflow-hidden">
          {/* Main Three.js Scene */}
          <ThreeCampusMap
            locations={locations}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
          />

          {/* Floating Selected Building Info Card (Glassmorphic) */}
          <div className="absolute top-3 left-3 right-3 sm:right-auto sm:top-4 sm:left-4 z-10 max-w-xs sm:max-w-sm pointer-events-none">
            <div className="pointer-events-auto p-3 sm:p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 shadow-2xl text-white animate-fade-in">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                    {selectedLocation.category} • {selectedLocation.building_code}
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-white mt-0.5">
                    {selectedLocation.name}
                  </h4>
                </div>
                <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {selectedLocation.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800 text-slate-400">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Floors:</span>
                  <span className="font-semibold text-slate-200">{selectedLocation.floor_info}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Intercom Ext:</span>
                  <span className="font-semibold text-amber-300 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedLocation.contact_ext}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Building Selector Carousel at Bottom */}
          <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
              {locations.map(loc => {
                const isSelected = selectedLocation.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
                      isSelected
                        ? 'bg-blue-600 text-white border border-blue-400 shadow-blue-500/40'
                        : 'bg-slate-900/80 text-slate-300 border border-slate-700/80 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-blue-400'}`} />
                    <span>{loc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
