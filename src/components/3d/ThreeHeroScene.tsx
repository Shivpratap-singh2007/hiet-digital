import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, RotateCw, Layers, ShieldCheck } from 'lucide-react';

type SceneMode = 'medallion' | 'tower' | 'quantum';

export const ThreeHeroScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState<SceneMode>('medallion');
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const activeModeRef = useRef<SceneMode>(activeMode);

  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0.5, 8.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Main group for dragging / rotation
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Sub-groups for mode switching
    const medallionGroup = new THREE.Group();
    const towerGroup = new THREE.Group();
    const quantumGroup = new THREE.Group();

    mainGroup.add(medallionGroup);
    mainGroup.add(towerGroup);
    mainGroup.add(quantumGroup);

    towerGroup.visible = false;
    quantumGroup.visible = false;

    // ==========================================
    // 1. CYBERNETIC HOLOGRAPHIC PROJECTION BASE GRID
    // ==========================================
    const baseGridGroup = new THREE.Group();
    baseGridGroup.position.y = -2.2;
    mainGroup.add(baseGridGroup);

    // Glowing Concentric Rings
    for (let i = 1; i <= 3; i++) {
      const ringGeo = new THREE.RingGeometry(i * 0.9, i * 0.9 + 0.04, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x38bdf8 : 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45 - i * 0.08
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      baseGridGroup.add(ringMesh);
    }

    // Circular Hex Grid Base Plate
    const discBaseGeo = new THREE.CircleGeometry(3.2, 32);
    const discBaseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.5,
      transparent: true,
      opacity: 0.6
    });
    const discBase = new THREE.Mesh(discBaseGeo, discBaseMat);
    discBase.rotation.x = -Math.PI / 2;
    discBase.position.y = -0.02;
    baseGridGroup.add(discBase);

    // Upward Vertical Cyber Scanner Beam
    const beamGeo = new THREE.CylinderGeometry(2.4, 2.8, 4.4, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 2.2;
    baseGridGroup.add(beamMesh);

    // ==========================================
    // 2. MODE A: OFFICIAL HIET MEDALLION CREST
    // ==========================================
    const textureLoader = new THREE.TextureLoader();
    const hietTexture = textureLoader.load('/images/hiet_crest.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      renderer.render(scene, camera);
    });

    const emblemSub = new THREE.Group();
    medallionGroup.add(emblemSub);

    const discRadius = 1.48;
    const frontGeo = new THREE.CircleGeometry(discRadius, 64);
    const frontMat = new THREE.MeshStandardMaterial({
      map: hietTexture,
      transparent: true,
      roughness: 0.15,
      metalness: 0.1,
      side: THREE.FrontSide
    });
    const frontMesh = new THREE.Mesh(frontGeo, frontMat);
    frontMesh.position.z = 0.12;
    emblemSub.add(frontMesh);

    const backMesh = new THREE.Mesh(frontGeo, frontMat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -0.12;
    emblemSub.add(backMesh);

    // Heavy Gold Core Cylinder
    const coinGeo = new THREE.CylinderGeometry(discRadius + 0.03, discRadius + 0.03, 0.22, 64);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.2
    });
    emblemSub.add(new THREE.Mesh(coinGeo, coinMat));

    // Outer Golden Rim with High Gloss
    const goldenRimGeo = new THREE.TorusGeometry(discRadius + 0.06, 0.08, 16, 100);
    const goldenRimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.5,
      roughness: 0.15,
      metalness: 0.95
    });
    emblemSub.add(new THREE.Mesh(goldenRimGeo, goldenRimMat));

    // Radiant Cyan Accent Ring
    const innerRimGeo = new THREE.TorusGeometry(discRadius * 0.93, 0.03, 16, 90);
    const innerRimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.9
    });
    emblemSub.add(new THREE.Mesh(innerRimGeo, innerRimMat));

    // Orbiting Golden Halo Rings with Neon Emissive Glow
    const ringGeo1 = new THREE.TorusGeometry(2.7, 0.035, 16, 120);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.65,
      metalness: 0.9
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    medallionGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(3.3, 0.025, 16, 120);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      metalness: 0.9
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 6;
    medallionGroup.add(ring2);

    // Orbiting Satellites
    const sat1Geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const sat1Mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.2 });
    const sat1 = new THREE.Mesh(sat1Geo, sat1Mat);

    const sat2Geo = new THREE.DodecahedronGeometry(0.32);
    const sat2Mat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 });
    const sat2 = new THREE.Mesh(sat2Geo, sat2Mat);

    const sat3Geo = new THREE.TetrahedronGeometry(0.35);
    const sat3Mat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.7, roughness: 0.3 });
    const sat3 = new THREE.Mesh(sat3Geo, sat3Mat);

    medallionGroup.add(sat1);
    medallionGroup.add(sat2);
    medallionGroup.add(sat3);

    // ==========================================
    // 3. MODE B: 3D FUTURISTIC CAMPUS CORE TOWER
    // ==========================================
    const towerSpireGeo = new THREE.ConeGeometry(0.8, 3.2, 6);
    const towerSpireMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x0369a1,
      emissiveIntensity: 0.3
    });
    const towerSpire = new THREE.Mesh(towerSpireGeo, towerSpireMat);
    towerSpire.position.y = 0.6;
    towerGroup.add(towerSpire);

    // Floating Glass Slabs
    for (let s = -2; s <= 2; s++) {
      const slabGeo = new THREE.BoxGeometry(2.2 - Math.abs(s) * 0.3, 0.12, 2.2 - Math.abs(s) * 0.3);
      const slabMat = new THREE.MeshStandardMaterial({
        color: s % 2 === 0 ? 0x0284c7 : 0xf59e0b,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.8
      });
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.y = s * 0.55;
      towerGroup.add(slabMesh);
    }

    // Energy Beacon on Tower Apex
    const apexGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const apexMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const apexMesh = new THREE.Mesh(apexGeo, apexMat);
    apexMesh.position.y = 2.3;
    towerGroup.add(apexMesh);

    // Floating Ring around Tower
    const towerRingGeo = new THREE.TorusGeometry(2.1, 0.05, 16, 64);
    const towerRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      metalness: 0.9
    });
    const towerRing = new THREE.Mesh(towerRingGeo, towerRingMat);
    towerRing.rotation.x = Math.PI / 2.2;
    towerGroup.add(towerRing);

    // ==========================================
    // 4. MODE C: QUANTUM AI NEURAL CORE
    // ==========================================
    const quantumCoreGeo = new THREE.IcosahedronGeometry(1.3, 2);
    const quantumCoreMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.8
    });
    const quantumCore = new THREE.Mesh(quantumCoreGeo, quantumCoreMat);
    quantumGroup.add(quantumCore);

    const innerSphereGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const innerSphereMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xdb2777,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.9
    });
    const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
    quantumGroup.add(innerSphere);

    // Dual orbiting gyro rings for quantum core
    const qRing1Geo = new THREE.TorusGeometry(2.3, 0.04, 16, 80);
    const qRing1Mat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.9 });
    const qRing1 = new THREE.Mesh(qRing1Geo, qRing1Mat);
    quantumGroup.add(qRing1);

    const qRing2Geo = new THREE.TorusGeometry(2.6, 0.03, 16, 80);
    const qRing2Mat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.9 });
    const qRing2 = new THREE.Mesh(qRing2Geo, qRing2Mat);
    qRing2.rotation.x = Math.PI / 2;
    quantumGroup.add(qRing2);

    // ==========================================
    // 5. FLOATING 3D TECH DATA BADGES (Canvas Textures)
    // ==========================================
    const createHoloBadge = (text: string, sub: string, color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 80;
      const ctx = canvas.getContext('2d')!;

      // Glassy badge background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.roundRect(4, 4, 248, 72, 16);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(text, 128, 36);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(sub, 128, 58);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.95 });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(1.4, 0.45, 1);
      return sprite;
    };

    const badge1 = createHoloBadge('HIET SHAHPUR', 'EST. 2007 • HPTU', '#38bdf8');
    const badge2 = createHoloBadge('5,000+ SCHOLARS', '100% DIGITAL PORTAL', '#f59e0b');
    const badge3 = createHoloBadge('DHAULADHAR VALLEY', 'HIMACHAL PRADESH', '#10b981');

    badge1.position.set(-2.6, 1.8, 0);
    badge2.position.set(2.6, -1.2, 0);
    badge3.position.set(-2.2, -1.6, 0);

    mainGroup.add(badge1);
    mainGroup.add(badge2);
    mainGroup.add(badge3);

    // ==========================================
    // 6. DYNAMIC CLICK BURST PARTICLES
    // ==========================================
    const shockwaveGeo = new THREE.RingGeometry(0.1, 0.25, 32);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    scene.add(shockwave);
    let shockwaveScale = 0;
    let shockwaveOpacity = 0;

    const triggerShockwave = () => {
      shockwaveScale = 0.2;
      shockwaveOpacity = 1.0;
      shockwave.scale.set(1, 1, 1);
      shockwaveMat.opacity = 1;
    };

    // ==========================================
    // 7. BACKGROUND HIGH DENSITY STARFIELD
    // ==========================================
    const particleCount = 480;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 22;
      particlePos[i + 1] = (Math.random() - 0.5) * 22;
      particlePos[i + 2] = (Math.random() - 0.5) * 22;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ==========================================
    // 8. LIGHTING SETUP
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x38bdf8, 4.5, 30);
    pointLight1.position.set(6, 6, 6);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xf59e0b, 3.8, 30);
    pointLight2.position.set(-6, -4, 4);
    scene.add(pointLight2);

    // ==========================================
    // 9. 3D INTERACTIVE DRAG-TO-ROTATE CONTROLS
    // ==========================================
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    let targetGroupRotX = 0;
    let targetGroupRotY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      setIsUserInteracting(true);
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      triggerShockwave();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        rotVelY = deltaX * 0.008;
        rotVelX = deltaY * 0.008;

        targetGroupRotY += rotVelY;
        targetGroupRotX += rotVelX;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => setIsUserInteracting(false), 2000);
    };

    // Touch support for mobile 3D drag
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        setIsUserInteracting(true);
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
        triggerShockwave();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevMouseX;
        const deltaY = e.touches[0].clientY - prevMouseY;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;

        targetGroupRotY += deltaX * 0.01;
        targetGroupRotX += deltaY * 0.01;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
      setTimeout(() => setIsUserInteracting(false), 2000);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Resize Handler
    const onResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', onResize);

    // ==========================================
    // 10. ANIMATION LOOP
    // ==========================================
    const startTime = performance.now();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Update visible mode
      const currentMode = activeModeRef.current;
      medallionGroup.visible = currentMode === 'medallion';
      towerGroup.visible = currentMode === 'tower';
      quantumGroup.visible = currentMode === 'quantum';

      // Inertial damping for 3D dragging
      if (!isDragging) {
        rotVelX *= 0.94;
        rotVelY *= 0.94;
        targetGroupRotX += rotVelX;
        targetGroupRotY += rotVelY;

        // Auto drift if user is not actively interacting
        targetGroupRotY += 0.003;
      }

      // Clamp vertical tilt to prevent flip upside down
      targetGroupRotX = Math.max(-0.7, Math.min(0.7, targetGroupRotX));

      mainGroup.rotation.y = targetGroupRotY;
      mainGroup.rotation.x = targetGroupRotX;

      // Rotate cyber base rings
      baseGridGroup.rotation.y = elapsedTime * 0.2;

      // Mode-specific animations
      if (currentMode === 'medallion') {
        emblemSub.rotation.y = Math.sin(elapsedTime * 0.6) * 0.25;
        ring1.rotation.z = elapsedTime * 0.3;
        ring2.rotation.z = -elapsedTime * 0.25;

        sat1.position.x = Math.cos(elapsedTime * 0.8) * 2.8;
        sat1.position.z = Math.sin(elapsedTime * 0.8) * 2.8;
        sat1.position.y = Math.sin(elapsedTime * 1.2) * 0.6;
        sat1.rotation.x += 0.02;

        sat2.position.x = Math.cos(elapsedTime * 0.6 + 2) * 3.3;
        sat2.position.z = Math.sin(elapsedTime * 0.6 + 2) * 3.3;
        sat2.position.y = Math.cos(elapsedTime * 0.9) * 0.8;
        sat2.rotation.y += 0.02;

        sat3.position.x = Math.cos(elapsedTime * 0.7 + 4) * 2.4;
        sat3.position.z = Math.sin(elapsedTime * 0.7 + 4) * 2.4;
        sat3.position.y = Math.sin(elapsedTime * 0.8) * 0.9;
        sat3.rotation.z += 0.03;
      } else if (currentMode === 'tower') {
        towerSpire.rotation.y = elapsedTime * 0.6;
        towerRing.rotation.z = -elapsedTime * 0.4;
      } else if (currentMode === 'quantum') {
        quantumCore.rotation.x = elapsedTime * 0.4;
        quantumCore.rotation.y = elapsedTime * 0.6;
        innerSphere.rotation.y = -elapsedTime * 0.8;
        qRing1.rotation.z = elapsedTime * 0.7;
        qRing2.rotation.x = -elapsedTime * 0.5;
      }

      // Animate shockwave
      if (shockwaveOpacity > 0.01) {
        shockwaveScale += 0.08;
        shockwaveOpacity *= 0.92;
        shockwave.scale.set(shockwaveScale, shockwaveScale, shockwaveScale);
        shockwaveMat.opacity = shockwaveOpacity;
      }

      // Subtle float on tech badges
      badge1.position.y = 1.8 + Math.sin(elapsedTime * 1.5) * 0.12;
      badge2.position.y = -1.2 + Math.cos(elapsedTime * 1.3) * 0.12;
      badge3.position.y = -1.6 + Math.sin(elapsedTime * 1.1 + 1) * 0.12;

      // Slowly rotate particle field
      particles.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between">
      {/* Top 3D Control Bar & Mode Switcher */}
      <div className="absolute top-2.5 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 z-20 flex items-center justify-between gap-1.5 pointer-events-auto">
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-blue-500/40 text-white text-[10px] font-bold shadow-lg shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>3D WebGL</span>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl ml-auto shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMode('medallion');
            }}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all ${
              activeMode === 'medallion'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Official HIET Gold Medallion"
          >
            Medallion
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMode('tower');
            }}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all ${
              activeMode === 'tower'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="3D Campus Spire Tower"
          >
            Tower
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMode('quantum');
            }}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all ${
              activeMode === 'quantum'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Quantum AI Hologram Core"
          >
            AI Core
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-[220px] sm:h-[380px] lg:h-[420px] relative pointer-events-auto cursor-grab active:cursor-grabbing select-none"
      />

      {/* 3D Drag Tip Overlay */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur border border-blue-400/30 text-[10px] text-blue-200 font-mono shadow-md animate-pulse">
          <RotateCw className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Click & Drag to Rotate in 3D</span>
        </div>
      </div>
    </div>
  );
};
