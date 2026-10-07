import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CampusLocation } from '../../types';
import { Sun, Moon, RotateCcw, Play, Pause, Maximize2, Compass } from 'lucide-react';

interface Props {
  locations: CampusLocation[];
  selectedLocation: CampusLocation;
  onSelectLocation: (loc: CampusLocation) => void;
}

export const ThreeCampusMap: React.FC<Props> = ({
  locations,
  selectedLocation,
  onSelectLocation
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNight, setIsNight] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);

  // References to communicate state into animation loop
  const autoRotateRef = useRef(isAutoRotate);
  const isNightRef = useRef(isNight);
  const selectedLocationRef = useRef(selectedLocation);
  const onSelectLocationRef = useRef(onSelectLocation);

  useEffect(() => {
    autoRotateRef.current = isAutoRotate;
  }, [isAutoRotate]);

  useEffect(() => {
    isNightRef.current = isNight;
  }, [isNight]);

  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNight ? 0x090d16 : 0xdbeafe);
    scene.fog = new THREE.FogExp2(isNight ? 0x090d16 : 0xdbeafe, 0.015);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.5, 500);
    camera.position.set(22, 18, 26);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isNight ? 0.4 : 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, isNight ? 0.3 : 1.4);
    sunLight.position.set(25, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Night moonlight / point lights
    const moonLight = new THREE.PointLight(0x38bdf8, isNight ? 2.5 : 0.5, 50);
    moonLight.position.set(0, 15, 0);
    scene.add(moonLight);

    // 3. Ground Terrain
    const groundGeo = new THREE.CylinderGeometry(24, 25, 1, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x111827 : 0x4ade80, // Lush Himachal grass in day, dark in night
      roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Campus Roadways & Pathways
    const roadMat = new THREE.MeshStandardMaterial({ color: isNight ? 0x1f2937 : 0x94a3b8, roughness: 0.6 });
    const road1Geo = new THREE.PlaneGeometry(36, 1.8);
    const road1 = new THREE.Mesh(road1Geo, roadMat);
    road1.rotation.x = -Math.PI / 2;
    road1.position.y = 0.02;
    scene.add(road1);

    const road2Geo = new THREE.PlaneGeometry(1.8, 36);
    const road2 = new THREE.Mesh(road2Geo, roadMat);
    road2.rotation.x = -Math.PI / 2;
    road2.position.y = 0.02;
    scene.add(road2);

    // Sports track loop
    const trackGeo = new THREE.RingGeometry(4, 5.5, 32);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(13, 0.03, 11);
    scene.add(track);

    // 4. Background Mountain Backdrop (Dhauladhar Range)
    const mountainGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const height = 14 + Math.random() * 8;
      const radius = 6 + Math.random() * 5;
      const mGeo = new THREE.ConeGeometry(radius, height, 5);
      const mMat = new THREE.MeshStandardMaterial({
        color: isNight ? 0x0f172a : 0x334155,
        roughness: 0.9,
        flatShading: true
      });
      const mountain = new THREE.Mesh(mGeo, mMat);
      const angle = (i / 8) * Math.PI - Math.PI / 6;
      mountain.position.set(Math.cos(angle) * 32, height / 2 - 2, Math.sin(angle) * -32);
      mountainGroup.add(mountain);

      // Snow peaks on top
      const snowGeo = new THREE.ConeGeometry(radius * 0.35, height * 0.35, 5);
      const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, flatShading: true });
      const snow = new THREE.Mesh(snowGeo, snowMat);
      snow.position.set(mountain.position.x, mountain.position.y + height * 0.32, mountain.position.z);
      mountainGroup.add(snow);
    }
    scene.add(mountainGroup);

    // 5. Procedural 3D Buildings & Location Beacons
    const buildingsGroup = new THREE.Group();
    const clickableMeshes: { mesh: THREE.Mesh; location: CampusLocation }[] = [];
    const pinsGroup = new THREE.Group();

    // Coordinates mapping on the 3D plane (-15 to 15)
    const buildingPositions: Record<string, { x: number; z: number; w: number; h: number; d: number; color: number }> = {
      'loc-01': { x: -4, z: -5, w: 6, h: 4.5, d: 4, color: 0x1e3a8a }, // Main Block
      'loc-02': { x: -6, z: 4, w: 4, h: 3.2, d: 3.5, color: 0x2563eb }, // Computing Lab
      'loc-03': { x: 7, z: -6, w: 5, h: 2.8, d: 4.5, color: 0xd97706 }, // Workshop
      'loc-04': { x: 4, z: -1, w: 4.2, h: 3.8, d: 3.8, color: 0x7c3aed }, // Library
      'loc-05': { x: -10, z: -10, w: 4.5, h: 5, d: 3.5, color: 0x0284c7 }, // Boys Hostel
      'loc-06': { x: -11, z: 8, w: 4, h: 4.2, d: 3.2, color: 0xe11d48 }, // Girls Hostel
      'loc-07': { x: 2, z: 4, w: 3.2, h: 1.8, d: 3, color: 0x059669 }, // Cafeteria
      'loc-08': { x: 0, z: -11, w: 5, h: 3.5, d: 3.2, color: 0xb45309 }, // Admin Directorate
      'loc-09': { x: 13, z: 11, w: 2, h: 0.5, d: 2, color: 0x16a34a } // Sports Ground
    };

    locations.forEach(loc => {
      const config = buildingPositions[loc.id] || { x: 0, z: 0, w: 3, h: 3, d: 3, color: 0x3b82f6 };

      // Building Body
      const bGeo = new THREE.BoxGeometry(config.w, config.h, config.d);
      const bMat = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: 0.3,
        metalness: 0.2
      });
      const buildingMesh = new THREE.Mesh(bGeo, bMat);
      buildingMesh.position.set(config.x, config.h / 2, config.z);
      buildingMesh.castShadow = true;
      buildingMesh.receiveShadow = true;
      buildingMesh.userData = { location: loc };
      buildingsGroup.add(buildingMesh);
      clickableMeshes.push({ mesh: buildingMesh, location: loc });

      // Roof details
      const roofGeo = new THREE.BoxGeometry(config.w + 0.3, 0.25, config.d + 0.3);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(config.x, config.h + 0.12, config.z);
      buildingsGroup.add(roof);

      // 3D Hovering Pin / Beacon
      const pinGroup = new THREE.Group();
      pinGroup.position.set(config.x, config.h + 1.8, config.z);

      const coneGeo = new THREE.ConeGeometry(0.35, 0.8, 16);
      coneGeo.rotateX(Math.PI);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.6
      });
      const pinCone = new THREE.Mesh(coneGeo, coneMat);
      pinGroup.add(pinCone);

      const sphereGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.8
      });
      const pinSphere = new THREE.Mesh(sphereGeo, sphereMat);
      pinSphere.position.y = 0.5;
      pinGroup.add(pinSphere);

      pinGroup.userData = { initialY: config.h + 1.8, location: loc };
      pinsGroup.add(pinGroup);
    });

    scene.add(buildingsGroup);
    scene.add(pinsGroup);

    // 6. Trees scattered on campus grounds
    const treeGroup = new THREE.Group();
    for (let i = 0; i < 35; i++) {
      const tx = (Math.random() - 0.5) * 32;
      const tz = (Math.random() - 0.5) * 32;
      // Don't place on central roads
      if (Math.abs(tx) > 2 || Math.abs(tz) > 2) {
        const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(tx, 0.45, tz);

        const crownGeo = new THREE.ConeGeometry(0.7, 1.6, 8);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.set(tx, 1.4, tz);

        treeGroup.add(trunk);
        treeGroup.add(crown);
      }
    }
    scene.add(treeGroup);

    // 7. Active Selection Glow Ring
    const ringGeo = new THREE.RingGeometry(2.5, 2.9, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const selectionRing = new THREE.Mesh(ringGeo, ringMat);
    selectionRing.position.y = 0.05;
    scene.add(selectionRing);

    // 8. Raycasting & Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableMeshes.map(c => c.mesh));

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const loc = hit.userData.location as CampusLocation;
        if (loc) {
          onSelectLocationRef.current(loc);
        }
      }
    };

    container.addEventListener('click', handleClick);

    // Orbit Drag Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraAngle = 0.8;
    let cameraRadius = 38;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      cameraAngle += deltaX * 0.006;
      camera.position.y = Math.max(8, Math.min(30, camera.position.y - deltaY * 0.08));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraRadius = Math.max(16, Math.min(55, cameraRadius + e.deltaY * 0.03));
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // 9. Animation Loop
    let clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Auto rotation if enabled
      if (autoRotateRef.current && !isDragging) {
        cameraAngle += 0.0018;
      }

      camera.position.x = Math.sin(cameraAngle) * cameraRadius;
      camera.position.z = Math.cos(cameraAngle) * cameraRadius;
      camera.lookAt(0, 2, 0);

      // Animate hovering pins
      pinsGroup.children.forEach((p, idx) => {
        const initY = p.userData.initialY || 4;
        p.position.y = initY + Math.sin(elapsedTime * 2.5 + idx) * 0.25;
        p.rotation.y = elapsedTime * 1.2;
      });

      // Update selection ring position
      const currentSelected = selectedLocationRef.current;
      const config = buildingPositions[currentSelected?.id] || { x: 0, z: 0 };
      selectionRing.position.x = config.x;
      selectionRing.position.z = config.z;
      selectionRing.rotation.z = elapsedTime * 0.8;

      // Update Night/Day theme in scene
      const night = isNightRef.current;
      scene.background = new THREE.Color(night ? 0x090d16 : 0xdbeafe);
      scene.fog?.color.set(night ? 0x090d16 : 0xdbeafe);
      ambientLight.intensity = night ? 0.35 : 0.9;
      sunLight.intensity = night ? 0.2 : 1.4;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[450px] lg:h-[500px] rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top 3D Control HUD */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-lg">
          <Compass className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
          <span className="font-bold text-amber-400">3D HIET Campus Navigator</span>
          <span className="text-slate-400 hidden sm:inline">• Drag to rotate • Wheel to zoom</span>
        </div>

        <button
          onClick={() => setIsNight(!isNight)}
          className="p-2 rounded-xl bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-200 hover:text-white shadow-lg transition"
          title={isNight ? 'Switch to Day Light' : 'Switch to Night Campus Lighting'}
        >
          {isNight ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>

        <button
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`px-2.5 py-1.5 rounded-xl backdrop-blur border text-xs font-semibold flex items-center gap-1.5 shadow-lg transition ${
            isAutoRotate
              ? 'bg-blue-600/90 text-white border-blue-500'
              : 'bg-slate-900/80 text-slate-300 border-slate-700'
          }`}
          title="Toggle Auto Tour Camera Rotation"
        >
          {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isAutoRotate ? 'Auto Orbit ON' : 'Paused'}</span>
        </button>
      </div>

      {/* Bottom Floating Active Pin Overlay */}
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-slate-900/90 backdrop-blur border border-slate-700 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-4 pointer-events-auto">
        <div>
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
            Selected 3D Building Pin:
          </span>
          <h4 className="text-sm font-bold text-white mt-0.5">{selectedLocation.name}</h4>
          <span className="text-xs text-slate-400">{selectedLocation.building_code} • {selectedLocation.category}</span>
        </div>

        <span className="text-[11px] font-mono px-2 py-1 bg-blue-900/60 border border-blue-700 rounded-lg text-blue-300 shrink-0">
          Ext #{selectedLocation.contact_ext}
        </span>
      </div>
    </div>
  );
};
