"use client";
import { Suspense, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, ContactShadows, Environment, Float, Lightformer, MeshReflectorMaterial, Preload } from "@react-three/drei";
import * as THREE from "three";
import { Kettlebell, WeightPlate, MedicineBall } from "./equipment-models";

import { accentHex } from "@/lib/theme";
const LIME = accentHex();

function Stage({ progress }: { progress: MutableRefObject<number> }) {
  const g = useRef<THREE.Group>(null);
  const plate = useRef<THREE.Group>(null);
  const bell = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, -0.5 + progress.current * 1.0, 3, dt);
    if (plate.current) plate.current.rotation.y += dt * 0.3; // spins about its own hub
    if (bell.current) bell.current.rotation.y = THREE.MathUtils.damp(bell.current.rotation.y, -0.3 + progress.current * 0.8, 2, dt);
  });
  return (
    <group ref={g}>
      {/* plate stands upright, face turned 3/4 to camera, spinning on its hub */}
      <group position={[-1.05, 0.46, 0]} rotation={[0, -0.55, 0.06]}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <group ref={plate}>
            <WeightPlate />
          </group>
        </group>
      </group>
      <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.25} floatingRange={[-0.03, 0.03]}>
        <group ref={bell} position={[0.05, 0, 0]}>
          <Kettlebell />
        </group>
      </Float>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3} floatingRange={[0.02, 0.1]}>
        <MedicineBall position={[1.1, 0.3, 0.2]} />
      </Float>
    </group>
  );
}

export function EquipmentScene({ active, progress }: { active: boolean; progress: MutableRefObject<number> }) {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  return (
    <Canvas
      dpr={[1, 1.6]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.75, 4.9], fov: 32, near: 0.1, far: 30 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      shadows={{ type: THREE.PCFShadowMap }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={4} color="#ffffff" position={[0, 3, -2]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 1.2, 1]} />
          <Lightformer intensity={1.2} color="#f2f3f5" position={[-4, 1, 2]} rotation={[0, Math.PI / 2, 0]} scale={[3, 3, 1]} />
          <Lightformer intensity={1.6} color={LIME} position={[4, 0.5, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[2.5, 0.6, 1]} />
        </Environment>
        <spotLight position={[2.5, 4.5, 3]} angle={0.55} penumbra={0.9} intensity={120} color="#fff6e8" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0002} />
        <spotLight position={[-3.5, 3, -2]} angle={0.6} penumbra={1} intensity={50} color="#e8eaf0" />
        <pointLight position={[1.8, 0.2, 1.8]} intensity={9} color={LIME} distance={5} decay={2} />
        <ambientLight intensity={0.22} />
        <Stage progress={progress} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
          <planeGeometry args={[16, 16]} />
          {isMobile ? (
            <meshStandardMaterial color="#0b0c0f" roughness={0.95} metalness={0.3} />
          ) : (
            <MeshReflectorMaterial resolution={384} blur={[400, 120]} mixBlur={1} mixStrength={12} roughness={0.9} depthScale={1.1} minDepthThreshold={0.6} maxDepthThreshold={1.4} color="#0b0c0f" metalness={0.4} mirror={0.4} />
          )}
        </mesh>
        <ContactShadows position={[0, 0.005, 0]} opacity={0.8} scale={8} blur={2.2} far={2.5} resolution={512} color="#000" frames={active ? Infinity : 1} />
        <fog attach="fog" args={["#07080a", 6, 13]} />
        <AdaptiveDpr pixelated={false} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
