import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  size?: number; // width & height in px
  status?: 'idle' | 'listening' | 'speaking';
  className?: string;
  isHovered?: boolean;
}

export const ThreeAIOrb: React.FC<Props> = ({
  size = 56,
  status = 'idle',
  className = '',
  isHovered = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef(status);
  const hoverRef = useRef(isHovered);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    hoverRef.current = isHovered;
  }, [isHovered]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Central AI Energy Sphere
    const coreGeo = new THREE.SphereGeometry(0.72, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // Wireframe overlay around core for quantum grid aesthetic
    const wireGeo = new THREE.IcosahedronGeometry(0.85, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);

    // 3. Gyroscopic Orbital Neon Rings
    const ringGeo1 = new THREE.TorusGeometry(1.25, 0.04, 16, 64);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.0,
      metalness: 0.9,
      roughness: 0.1
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    scene.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(1.48, 0.03, 16, 64);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.9,
      metalness: 0.95,
      roughness: 0.15
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 3;
    scene.add(ring2);

    const ringGeo3 = new THREE.TorusGeometry(1.7, 0.02, 16, 64);
    const ringMat3 = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2
    });
    const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
    ring3.rotation.y = Math.PI / 4;
    scene.add(ring3);

    // 4. Orbiting Mini Energy Sparks
    const sparkGeo = new THREE.BufferGeometry();
    const sparkCount = 16;
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i += 3) {
      const radius = 1.3 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      sparkPos[i] = radius * Math.sin(phi) * Math.cos(theta);
      sparkPos[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      sparkPos[i + 2] = radius * Math.cos(phi);
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    // 5. Lighting
    const pointLight = new THREE.PointLight(0xffffff, 2.5, 10);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // 6. Animation Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const currentStatus = statusRef.current;
      const hovered = hoverRef.current;

      const speedMultiplier = hovered ? 2.2 : 1.0;

      // Color & Emissive Adjustments based on state
      if (currentStatus === 'listening') {
        // Red Audio Reactive Pulse
        coreMat.color.setHex(0xef4444);
        coreMat.emissive.setHex(0xb91c1c);
        ringMat1.emissive.setHex(0xef4444);
        const pulse = 1 + Math.sin(elapsed * 12) * 0.15;
        coreMesh.scale.set(pulse, pulse, pulse);
      } else if (currentStatus === 'speaking') {
        // Golden Active Broadcast
        coreMat.color.setHex(0xf59e0b);
        coreMat.emissive.setHex(0xd97706);
        ringMat1.emissive.setHex(0xfbbf24);
        const pulse = 1 + Math.sin(elapsed * 8) * 0.1;
        coreMesh.scale.set(pulse, pulse, pulse);
      } else {
        // Normal Cyan / Sky Quantum AI
        coreMat.color.setHex(0x38bdf8);
        coreMat.emissive.setHex(0x0284c7);
        ringMat1.emissive.setHex(0x0284c7);
        const pulse = 1 + Math.sin(elapsed * 2.5) * 0.04;
        coreMesh.scale.set(pulse, pulse, pulse);
      }

      // Rotate central meshes
      coreMesh.rotation.y = elapsed * 0.7 * speedMultiplier;
      wireMesh.rotation.y = -elapsed * 0.5 * speedMultiplier;
      wireMesh.rotation.x = elapsed * 0.3 * speedMultiplier;

      // Gyroscopic ring rotation
      ring1.rotation.z = elapsed * 0.9 * speedMultiplier;
      ring1.rotation.x = Math.sin(elapsed * 0.6) * 0.4;

      ring2.rotation.y = -elapsed * 1.1 * speedMultiplier;
      ring2.rotation.z = Math.cos(elapsed * 0.5) * 0.5;

      ring3.rotation.x = elapsed * 0.7 * speedMultiplier;
      ring3.rotation.y = elapsed * 0.6 * speedMultiplier;

      // Orbit spark cloud
      sparks.rotation.y = -elapsed * 0.4 * speedMultiplier;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      ringGeo3.dispose();
      ringMat3.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center pointer-events-none select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};
