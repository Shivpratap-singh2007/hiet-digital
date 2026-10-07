import React, { useState } from 'react';
import { 
  MapPin, 
  Building2, 
  Cpu, 
  Wrench, 
  BookOpen, 
  Home, 
  Coffee, 
  ShieldCheck, 
  Activity, 
  Phone, 
  Navigation,
  Layers,
  Box,
  Compass,
  Globe,
  Image as ImageIcon,
  Upload,
  ExternalLink,
  ZoomIn
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { CampusLocation } from '../../types';
import { ThreeCampusMap } from '../3d/ThreeCampusMap';

export const CampusMapView: React.FC = () => {
  const locations = dataStore.getLocations();
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation>(locations[0]);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'satellite' | 'custom'>('3d');
  
  // Custom blueprint image upload support
  const [customMapUrl, setCustomMapUrl] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'k' | 'm'>('k'); // 'k' = Satellite, 'm' = Roadmap

  const categories = ['All', 'Academic Block', 'Laboratory', 'Library', 'Hostel', 'Canteen', 'Administration', 'Sports Ground'];

  const filteredLocations = filterCategory === 'All'
    ? locations
    : locations.filter(l => l.category === filterCategory);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Academic Block': return Building2;
      case 'Laboratory': return Cpu;
      case 'Library': return BookOpen;
      case 'Hostel': return Home;
      case 'Canteen': return Coffee;
      case 'Administration': return ShieldCheck;
      case 'Sports Ground': return Activity;
      default: return MapPin;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomMapUrl(event.target?.result as string);
        setViewMode('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-600 dark:text-red-400 animate-icon-float icon-glow-rose" />
            Interactive HIET Campus Navigator & Maps
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Shahpur, District Kangra Campus Directory • Interactive View • Google Satellite • Blueprints
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 4 View Modes Switcher */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === '3d'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Interactive Campus World"
            >
              <Box className="w-3.5 h-3.5 animate-icon-float" />
              <span>Campus View</span>
            </button>
            <button
              onClick={() => setViewMode('satellite')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'satellite'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Live Google Satellite & Terrain Map"
            >
              <Globe className="w-3.5 h-3.5 animate-spin-slow icon-glow-cyan" />
              <span>Live Satellite</span>
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === '2d'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="2D Facility Blueprint Grid"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Blueprint</span>
            </button>
            <button
              onClick={() => setViewMode('custom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'custom'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Upload / View Custom Campus Map Image"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Custom Photo</span>
            </button>
          </div>

          <a
            href="https://maps.google.com/?q=Himachal+Institute+of+Engineering+%26+Technology+Shahpur"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 transition"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Directions</span>
          </a>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition ${
              filterCategory === cat
                ? 'bg-blue-700 text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Visual Interactive Campus Blueprint & Selected Location Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 3D / Satellite / 2D / Custom */}
        <div className="lg:col-span-2">
          {/* Mode 1: 3D World */}
          {viewMode === '3d' && (
            <ThreeCampusMap 
              locations={filteredLocations}
              selectedLocation={selectedLocation}
              onSelectLocation={setSelectedLocation}
            />
          )}

          {/* Mode 2: Live Embedded Google Satellite & Terrain Map */}
          {viewMode === 'satellite' && (
            <div className="relative w-full h-[450px] lg:h-[500px] rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl flex flex-col justify-between">
              {/* Google Map Sub-HUD */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <div className="bg-slate-900/90 backdrop-blur border border-slate-700 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-lg">
                  <Globe className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '20s' }} />
                  <span className="font-bold text-amber-400">Google Satellite Feed</span>
                  <span className="text-slate-400 hidden sm:inline">• Lat: 32.2274° N, Long: 76.3242° E</span>
                </div>

                <div className="inline-flex bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 p-0.5 text-xs">
                  <button
                    onClick={() => setMapType('k')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      mapType === 'k' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Satellite
                  </button>
                  <button
                    onClick={() => setMapType('m')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      mapType === 'm' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Roadmap
                  </button>
                </div>
              </div>

              {/* Live Google Map iframe */}
              <iframe
                title="HIET Campus Google Map"
                src={`https://maps.google.com/maps?q=Himachal%20Institute%20of%20Engineering%20and%20Technology%2C%20Shahpur%2C%20Himachal%20Pradesh&t=${mapType}&z=17&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />

              {/* Bottom coordinates bar */}
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur border border-slate-700 text-white p-2.5 rounded-xl text-[11px] flex justify-between items-center z-10 shadow-lg">
                <span className="text-slate-300">Himachal Institute of Engineering & Technology, Shahpur, Kangra, HP</span>
                <a
                  href="https://maps.google.com/?q=Himachal+Institute+of+Engineering+%26+Technology+Shahpur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  <span>Open Full Screen</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Mode 3: 2D Blueprint Layout */}
          {viewMode === '2d' && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 relative overflow-hidden shadow-lg min-h-[450px] flex flex-col justify-between">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="relative z-10 flex justify-between items-start">
                <div className="bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
                  <span className="text-amber-400 font-bold">HIET Campus Plan</span>
                  <span className="text-slate-400 ml-2">Elev: ~650m • Dhauladhar Foothills</span>
                </div>

                <div className="bg-slate-800/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-slate-300">
                  Click any pin below to inspect
                </div>
              </div>

              {/* Interactive Campus Blueprint Layout with Pins */}
              <div className="relative z-10 my-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredLocations.map(loc => {
                    const Icon = getCategoryIcon(loc.category);
                    const isSelected = selectedLocation.id === loc.id;
                    return (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedLocation(loc)}
                        className={`p-3 rounded-xl text-left transition-all relative overflow-hidden border ${
                          isSelected
                            ? 'bg-blue-600/90 border-blue-400 shadow-lg scale-[1.02] ring-2 ring-amber-400/50'
                            : 'bg-slate-800/80 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white text-blue-700' : 'bg-slate-700 text-amber-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
                            {loc.building_code}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white truncate">
                          {loc.name}
                        </h4>
                        <p className="text-[10px] text-slate-300/80 mt-0.5 truncate">
                          {loc.category}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Coordinates Strip */}
              <div className="relative z-10 flex flex-wrap justify-between items-center text-[11px] text-slate-400 pt-3 border-t border-slate-800">
                <span>Lat: 32.2274° N, Long: 76.3242° E</span>
                <span>Himachal Institute of Engineering & Technology, Shahpur</span>
              </div>
            </div>
          )}

          {/* Mode 4: Custom Campus Blueprint / Photo Upload */}
          {viewMode === 'custom' && (
            <div className="bg-white dark:bg-slate-850 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg min-h-[450px] flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      Custom Campus Layout / Blueprint Image
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upload your official HIET master layout plan, architectural drawing, or aerial campus photo.
                    </p>
                  </div>

                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Map Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Display Uploaded Image or Default Blueprint Illustration */}
                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 relative min-h-[300px] flex items-center justify-center">
                  {customMapUrl ? (
                    <img
                      src={customMapUrl}
                      alt="Uploaded HIET Campus Map"
                      className="w-full max-h-[380px] object-contain rounded-xl"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center mb-3">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No Custom Map Photo Uploaded Yet
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                        You can upload any PNG, JPEG, or SVG of your college master blueprint, floor layout, or drone photo.
                      </p>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select Image from Computer</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span>Supported Formats: JPG, PNG, WEBP, SVG</span>
                <span>Instant local preview</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Selected Location Details Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" />
              <span>Location Details</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {selectedLocation.name}
            </h3>

            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mt-2">
              <span>{selectedLocation.category}</span>
              <span>•</span>
              <span className="font-mono">{selectedLocation.building_code}</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              {selectedLocation.description}
            </p>

            {/* Floor and facilities specs */}
            <div className="mt-5 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-750">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Floor Plan / Levels:</span>
                <p className="text-slate-500 dark:text-slate-400">{selectedLocation.floor_info}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-750 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Campus Intercom Ext:</span>
                  <p className="font-mono text-blue-700 dark:text-blue-400 font-bold">Ext #{selectedLocation.contact_ext}</p>
                </div>
                <Phone className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-700/80">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.latitude},${selectedLocation.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Get Campus Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
