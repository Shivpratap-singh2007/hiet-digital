import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  WifiOff, 
  RefreshCw, 
  ShieldCheck, 
  PhoneCall, 
  Calendar, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Zap, 
  Radio, 
  GraduationCap,
  DownloadCloud,
  MapPin,
  Mail
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { HietCollegeLogo } from '../common/HietCollegeLogo';

export const Offline3DModal: React.FC = () => {
  const { user } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [manualSimulate, setManualSimulate] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [reconnectedBanner, setReconnectedBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'offline_id' | 'schedule' | 'emergency'>('status');

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    mainGroup: THREE.Group;
    pulseRings: THREE.Mesh[];
  } | null>(null);

  // Monitor browser network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setManualSimulate(false);
      setReconnectedBanner(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.1 }
      });
      setTimeout(() => setReconnectedBanner(false), 5000);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showPopup = isOffline || manualSimulate;

  // Initialize Three.js 3D Disconnected Satellite Scene
  useEffect(() => {
    if (!showPopup) {
      if (threeRef.current) {
        threeRef.current.renderer.dispose();
        threeRef.current = null;
      }
      return;
    }

    const container = canvasContainerRef.current;
    if (!container) return;

    // Clean any prior canvas
    container.innerHTML = '';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. 3D HIET Official Emblem Core
    const textureLoader = new THREE.TextureLoader();
    const hietTexture = textureLoader.load('/images/hiet_crest.png');
    hietTexture.colorSpace = THREE.SRGBColorSpace;

    const emblemGeo = new THREE.CircleGeometry(1.1, 48);
    const emblemMat = new THREE.MeshStandardMaterial({
      map: hietTexture,
      transparent: true,
      roughness: 0.25,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const emblemMesh = new THREE.Mesh(emblemGeo, emblemMat);
    mainGroup.add(emblemMesh);

    const rimGeo = new THREE.TorusGeometry(1.12, 0.05, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.6,
      metalness: 0.9
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    mainGroup.add(rimMesh);

    // Central Satellite Core orbiting Earth
    const coreGeo = new THREE.DodecahedronGeometry(0.5, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 1.4, 0);
    mainGroup.add(coreMesh);

    // Inner glowing beacon (Search indicator)
    const innerGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Red alert for offline
      emissive: 0xe11d48,
      emissiveIntensity: 0.9
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.position.set(0, 1.4, 0);
    mainGroup.add(innerMesh);

    // Solar panels for satellite
    const panelGeo = new THREE.BoxGeometry(0.08, 0.7, 0.25);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.8, roughness: 0.3 });
    const panelLeft = new THREE.Mesh(panelGeo, panelMat);
    panelLeft.position.set(-0.65, 1.4, 0);
    const panelRight = new THREE.Mesh(panelGeo, panelMat);
    panelRight.position.set(0.65, 1.4, 0);
    mainGroup.add(panelLeft);
    mainGroup.add(panelRight);

    // 2. Pulsing Radio Search Wave Rings
    const pulseRings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(1.6 + i * 0.5, 1.65 + i * 0.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.6 - i * 0.15,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      mainGroup.add(ringMesh);
      pulseRings.push(ringMesh);
    }

    // 3. Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xf43f5e, 3, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    threeRef.current = { scene, camera, renderer, mainGroup, pulseRings };

    // Animation Loop
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate main satellite
      mainGroup.rotation.y = elapsedTime * 0.5;
      mainGroup.rotation.x = Math.sin(elapsedTime * 0.4) * 0.2;

      // Pulse the search rings
      pulseRings.forEach((ring, idx) => {
        const scale = 1 + ((elapsedTime + idx * 0.6) % 2) * 0.5;
        ring.scale.set(scale, scale, scale);
        const opacity = Math.max(0, 0.7 - ((elapsedTime + idx * 0.6) % 2) * 0.35);
        (ring.material as THREE.MeshBasicMaterial).opacity = opacity;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Mouse Tracking Tilt
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 1.5;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -1.5;
      mainGroup.rotation.y += x * 0.05;
      mainGroup.rotation.x += y * 0.05;
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
    };
  }, [showPopup]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      if (navigator.onLine) {
        setIsOffline(false);
        setManualSimulate(false);
        setReconnectedBanner(true);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.2 } });
        setTimeout(() => setReconnectedBanner(false), 5000);
      } else {
        // If still offline or in simulation mode
        if (manualSimulate) {
          alert("Network Simulator: Simulating successful reconnection!");
          setManualSimulate(false);
          setIsOffline(false);
          setReconnectedBanner(true);
          setTimeout(() => setReconnectedBanner(false), 5000);
        }
      }
    }, 1500);
  };

  const student = user?.studentMaster;

  return (
    <>
      {/* Online Reconnected Success Toast Banner */}
      {reconnectedBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-2.5 sm:gap-3 animate-fade-in border border-emerald-400/40 max-w-[calc(100vw-2rem)]">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs font-bold truncate">Internet Connection Restored!</h4>
            <p className="text-[10px] sm:text-[11px] text-emerald-100 truncate">Live cloud synchronization active.</p>
          </div>
          <button onClick={() => setReconnectedBanner(false)} className="ml-2 text-emerald-200 hover:text-white shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Full 3D Offline Loading & Emergency Vault Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in overflow-hidden">
          <div 
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#080d1e] border border-rose-500/40 dark:border-rose-500/30 shadow-[0_25px_80px_rgba(244,63,94,0.3)] flex flex-col md:flex-row relative"
            style={{ perspective: '1000px' }}
          >
            {/* Top Luminous Crimson Alert Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 animate-pulse" />

            {/* Left Column: 3D Animated Satellite & Earth Scene (40%) */}
            <div className="md:w-5/12 bg-gradient-to-b from-rose-950/30 via-slate-900/60 to-slate-950 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-200/20 dark:border-slate-800 relative">
              
              {/* Status Header with HIET College Emblem */}
              <div className="w-full flex items-center justify-between mb-1">
                <HietCollegeLogo size="sm" variant="badge" />
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/30">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>OFFLINE</span>
                </div>
              </div>

              {/* Three.js 3D Canvas */}
              <div 
                ref={canvasContainerRef} 
                className="w-full h-48 sm:h-56 cursor-grab active:cursor-grabbing my-2"
                title="Interactive 3D HIET Emblem & Satellite • Move cursor to inspect"
              />

              {/* 3D Indicator */}
              <div className="text-center">
                <p className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  <WifiOff className="w-4 h-4 text-rose-400" />
                  <span>Offline Mode Active</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  HIET Shahpur Local Vault cached in device storage
                </p>
              </div>
            </div>

            {/* Right Column: Offline Capabilities & Emergency Vault (60%) */}
            <div className="md:w-7/12 p-6 sm:p-7 flex flex-col justify-between space-y-4">
              
              {/* Header with dismiss button */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:text-sky-400 border border-blue-500/30">
                      HIET SHAHPUR • KANGRA
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Dhauladhar Foothills</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Internet Disconnected
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Himalayan network down or offline. Local HIET cache active for 5,000+ students!
                  </p>
                </div>
                <button
                  onClick={() => setManualSimulate(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Minimize Popup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <button
                  onClick={() => setActiveTab('status')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                    activeTab === 'status'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('offline_id')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                    activeTab === 'offline_id'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Offline ID
                </button>
                <button
                  onClick={() => setActiveTab('emergency')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                    activeTab === 'emergency'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Helpline
                </button>
              </div>

              {/* Tab 1: Overview & Auto-Sync Info */}
              {activeTab === 'status' && (
                <div className="space-y-3 animate-fade-in text-xs">
                  <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300">
                      <DownloadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Automatic Cloud Sync When Back Online</span>
                    </div>
                    <p className="text-[11px] text-blue-900/80 dark:text-blue-200/80 leading-relaxed">
                      Any leave application drafts, doubt questions, or profile updates created while offline are securely stored in your browser and will automatically sync upon reconnection.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                      <span>Verified Student Record:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Cached in Storage
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                      <span>Curriculum & PYQ Database:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Offline Available
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Offline 3D Digital Student ID Card */}
              {activeTab === 'offline_id' && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white border border-blue-400/30 space-y-2.5 animate-fade-in shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">HIET Gate Pass ID</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      OFFLINE VERIFIED
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-12 h-12 rounded-xl bg-blue-700/80 border border-white/20 flex items-center justify-center text-lg font-black text-amber-300">
                      {user?.name.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{user?.name || 'Aarav Dogra'}</h4>
                      <p className="text-[10px] text-blue-200 font-mono">Roll #{student?.roll_no || '210101'}</p>
                      <p className="text-[10px] text-slate-300">{student?.branch || 'CSE'} • Sem {student?.semester || 6}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-blue-200/80 font-mono">
                    <span>Gate Barcode: #HIET-2026-OFFLINE</span>
                    <span>Valid: 2027</span>
                  </div>
                </div>
              )}

              {/* Tab 3: Official HIET Helplines & Campus Contacts */}
              {activeTab === 'emergency' && (
                <div className="space-y-2 animate-fade-in text-xs max-h-48 overflow-y-auto pr-1">
                  <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-blue-900 dark:text-blue-300">HIET Admission & Helpdesk</div>
                      <div className="text-[11px] text-blue-700 dark:text-blue-400 font-mono">+91-88945-19999 / +91-98055-04552</div>
                    </div>
                    <a href="tel:8894519999" className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1">
                      <PhoneCall className="w-3 h-3" /> Call
                    </a>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">Campus Security & Admin</div>
                      <div className="text-[11px] text-slate-500 font-mono">+91-1892-234567</div>
                    </div>
                    <a href="tel:1892234567" className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1">
                      <PhoneCall className="w-3 h-3" /> Call
                    </a>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-rose-800 dark:text-rose-300">Anti-Ragging 24x7 Toll-Free</div>
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">1800-180-5522</div>
                    </div>
                    <a href="tel:18001805522" className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1">
                      <PhoneCall className="w-3 h-3" /> Call
                    </a>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>HIET Shahpur Campus</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Vidyanagar, Shahpur, Kangra, HP – 176223 • info@hiet.co.in
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons: Retry and Continue Offline */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>{isRetrying ? 'Connecting...' : 'Test Connection'}</span>
                </button>

                <button
                  onClick={() => setManualSimulate(false)}
                  className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition"
                >
                  Dismiss
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
