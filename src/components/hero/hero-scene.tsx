"use client";
import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, ContactShadows, Environment, Float, Lightformer, MeshReflectorMaterial, Preload } from "@react-three/drei";
import * as THREE from "three";
import { Dumbbell } from "./dumbbell";
import { useParallaxRef } from "./parallax";

import { accentHex } from "@/lib/theme";
const LIME = accentHex();

function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useParallaxRef();
  const t = useRef(0);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    t.current += dt;
    const px = pointer?.current.x ?? 0;
    const py = pointer?.current.y ?? 0;
    // Hold a readable 3/4 view: slow yaw sway around 0.55 rad, never end-on to the camera.
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, 0.55 + Math.sin(t.current * 0.22) * 0.28 + px * 0.18, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -0.1 + py * 0.12, 4, dt);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, -0.3, 4, dt);
  });
  return <group ref={group}>{children}</group>;
}

/** Slow roll about the bar's own axis (plates turn, silhouette stays readable). */
function Roll({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.x += dt * 0.35;
  });
  return <group ref={g}>{children}</group>;
}

/** Two restrained lime light trails orbiting the object. */
function Trails() {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (a.current) a.current.rotation.z += dt * 0.25;
    if (b.current) b.current.rotation.z -= dt * 0.18;
  });
  return (
    <>
      <mesh ref={a} rotation={[Math.PI / 2.4, 0.3, 0]}>
        <torusGeometry args={[1.55, 0.004, 8, 200, Math.PI * 1.1]} />
        <meshBasicMaterial color={LIME} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh ref={b} rotation={[Math.PI / 1.8, -0.4, 0]}>
        <torusGeometry args={[1.85, 0.003, 8, 200, Math.PI * 0.8]} />
        <meshBasicMaterial color={LIME} transparent opacity={0.3} toneMapped={false} />
      </mesh>
    </>
  );
}

/** Thin lime stage ring on the floor: anchors scale and ties the floor to the brand ring motif. */
function StageDisc() {
  return (
    <group position={[0, -0.935, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[1.62, 1.64, 128]} />
        <meshBasicMaterial color={LIME} transparent opacity={0.35} toneMapped={false} />
      </mesh>
      <mesh>
        <ringGeometry args={[1.2, 1.205, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Floor({ reflect }: { reflect: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]}>
      <planeGeometry args={[14, 14]} />
      {reflect ? (
        <MeshReflectorMaterial resolution={384} blur={[400, 120]} mixBlur={1} mixStrength={14} roughness={0.9} depthScale={1.1} minDepthThreshold={0.6} maxDepthThreshold={1.4} color="#0b0c0f" metalness={0.4} mirror={0.4} />
      ) : (
        <meshStandardMaterial color="#0b0c0f" roughness={0.95} metalness={0.3} />
      )}
    </mesh>
  );
}

export function HeroScene({ active }: { active: boolean }) {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  return (
    <Canvas
      className="hero-canvas"
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.22, 4.6], fov: 26, near: 0.1, far: 30 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      shadows={{ type: THREE.PCFShadowMap }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        {/* Studio-style environment built from lightformers: no HDR download needed */}
        <Environment resolution={512} frames={1}>
          {/* long soft key strip above: the signature highlight that runs along the bar and plate rims */}
          <Lightformer form="rect" intensity={5} color="#fff8ee" position={[-1.5, 3.2, 1]} rotation={[Math.PI / 2.4, 0, 0.3]} scale={[7, 0.9, 1]} />
          {/* cool fill panel, camera left */}
          <Lightformer form="rect" intensity={1.1} color="#dfe5ee" position={[-4.5, 0.8, 2]} rotation={[0, Math.PI / 2.2, 0]} scale={[3.5, 3, 1]} />
          {/* lime rim, behind right: restrained, only catches edges */}
          <Lightformer form="rect" intensity={2.2} color={LIME} position={[4.2, 0.6, -1.5]} rotation={[0, -Math.PI / 2.6, 0]} scale={[2, 0.5, 1]} />
          {/* floor bounce */}
          <Lightformer form="rect" intensity={0.35} color="#b9bec8" position={[0, -2.5, 2.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[6, 4, 1]} />
          {/* dark studio walls so reflections have contrast */}
          <Lightformer form="rect" intensity={0.08} color="#0b0c0f" position={[0, 0, -6]} scale={[20, 10, 1]} />
        </Environment>
        <spotLight position={[-2.2, 4.2, 2.6]} angle={0.42} penumbra={1} intensity={140} color="#fff6e8" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.00015} shadow-radius={4} />
        <spotLight position={[3.6, 1.4, -2.2]} angle={0.5} penumbra={1} intensity={40} color={LIME} />
        <pointLight position={[1.6, -0.4, 1.8]} intensity={5} color={LIME} distance={4} decay={2} />
        <ambientLight intensity={0.16} />

        <Rig>
          <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.35} floatingRange={[-0.06, 0.06]}>
            <Roll>
              <Dumbbell position={[0, 0.05, 0]} scale={1.08} />
            </Roll>
          </Float>
          <Trails />
        </Rig>

        <Floor reflect={!isMobile} />
        <ContactShadows position={[0, -0.94, 0]} opacity={0.9} scale={5} blur={1.6} far={1.6} resolution={1024} color="#000000" frames={active ? Infinity : 1} />
        <StageDisc />
        <fog attach="fog" args={["#07080a", 6, 12]} />
        <AdaptiveDpr pixelated={false} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
