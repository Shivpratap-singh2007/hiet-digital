import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

export const ThreeCosmicBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // 2. Cosmic Constellation Network Particles & Connections
    const isDark = () => themeRef.current === 'dark' || document.documentElement.classList.contains('dark');

    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    const boundsX = 35;
    const boundsY = 22;
    const boundsZ = 20;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * boundsX * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * boundsY * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * boundsZ * 2;

      velocities.push({
        x: (Math.random() - 0.5) * 0.025,
        y: (Math.random() - 0.5) * 0.025,
        z: (Math.random() - 0.5) * 0.02
      });
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.28,
      color: isDark() ? 0x60a5fa : 0x2563eb,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    // Dynamic Connection Lines
    const maxConnections = 60;
    const linePositions = new Float32Array(maxConnections * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMat = new THREE.LineBasicMaterial({
      color: isDark() ? 0x38bdf8 : 0x60a5fa,
      transparent: true,
      opacity: isDark() ? 0.22 : 0.14,
      blending: THREE.AdditiveBlending
    });

    const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineMesh);

    // 3. Floating Zero-G Low-Poly Geometric Crystals
    const crystalGroup = new THREE.Group();
    scene.add(crystalGroup);

    const crystals: {
      mesh: THREE.Mesh;
      rotSpeed: { x: number; y: number; z: number };
      floatSpeed: number;
      baseY: number;
    }[] = [];

    const geometries = [
      new THREE.IcosahedronGeometry(0.85, 0),
      new THREE.OctahedronGeometry(0.75, 0),
      new THREE.TetrahedronGeometry(0.8, 0),
      new THREE.TorusGeometry(0.7, 0.18, 8, 16)
    ];

    const crystalCount = 14;
    for (let i = 0; i < crystalCount; i++) {
      const geo = geometries[i % geometries.length];
      const wireMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? (isDark() ? 0x38bdf8 : 0x2563eb) : (isDark() ? 0xf59e0b : 0xd97706),
        wireframe: true,
        transparent: true,
        opacity: isDark() ? 0.35 : 0.22
      });

      const mesh = new THREE.Mesh(geo, wireMat);
      const posX = (Math.random() - 0.5) * 50;
      const posY = (Math.random() - 0.5) * 30;
      const posZ = (Math.random() - 0.5) * 20 - 5;

      mesh.position.set(posX, posY, posZ);
      crystalGroup.add(mesh);

      crystals.push({
        mesh,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.008,
          y: (Math.random() - 0.5) * 0.012,
          z: (Math.random() - 0.5) * 0.006
        },
        floatSpeed: 0.5 + Math.random() * 0.8,
        baseY: posY
      });
    }

    // 4. Subtle ambient lighting for 3D depth
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // 5. Mouse tracking & smooth parallax
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 3;
      targetY = (e.clientY / window.innerHeight - 0.5) * -3;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 6. Resize Handler
    const handleResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Visibility change handler (pause when tab hidden to save battery)
    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Camera parallax interpolation
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      camera.position.x = currentX;
      camera.position.y = currentY;
      camera.lookAt(0, 0, 0);

      // Update particle positions
      const posAttr = particlesGeo.getAttribute('position') as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        posArray[idx] += velocities[i].x;
        posArray[idx + 1] += velocities[i].y;
        posArray[idx + 2] += velocities[i].z;

        // Bounce within bounds
        if (Math.abs(posArray[idx]) > boundsX) velocities[i].x *= -1;
        if (Math.abs(posArray[idx + 1]) > boundsY) velocities[i].y *= -1;
        if (Math.abs(posArray[idx + 2]) > boundsZ) velocities[i].z *= -1;
      }
      posAttr.needsUpdate = true;

      // Update dynamic connecting lines
      let lineIdx = 0;
      const lineAttr = lineGeo.getAttribute('position') as THREE.BufferAttribute;
      const lArray = lineAttr.array as Float32Array;
      const connectDistSq = 36; // 6 units max distance

      for (let i = 0; i < particleCount && lineIdx < maxConnections; i++) {
        const x1 = posArray[i * 3];
        const y1 = posArray[i * 3 + 1];
        const z1 = posArray[i * 3 + 2];

        for (let j = i + 1; j < particleCount && lineIdx < maxConnections; j++) {
          const dx = posArray[j * 3] - x1;
          const dy = posArray[j * 3 + 1] - y1;
          const dz = posArray[j * 3 + 2] - z1;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < connectDistSq) {
            const ptr = lineIdx * 6;
            lArray[ptr] = x1;
            lArray[ptr + 1] = y1;
            lArray[ptr + 2] = z1;
            lArray[ptr + 3] = posArray[j * 3];
            lArray[ptr + 4] = posArray[j * 3 + 1];
            lArray[ptr + 5] = posArray[j * 3 + 2];
            lineIdx++;
          }
        }
      }

      // Zero out remaining lines
      for (let k = lineIdx * 6; k < maxConnections * 6; k++) {
        lArray[k] = 0;
      }
      lineAttr.needsUpdate = true;

      // Animate floating low-poly crystals
      for (let i = 0; i < crystals.length; i++) {
        const item = crystals[i];
        item.mesh.rotation.x += item.rotSpeed.x;
        item.mesh.rotation.y += item.rotSpeed.y;
        item.mesh.rotation.z += item.rotSpeed.z;
        item.mesh.position.y = item.baseY + Math.sin(elapsed * item.floatSpeed + i) * 1.2;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      renderer.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      geometries.forEach(g => g.dispose());
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60 dark:opacity-80 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
};
