"use client";
import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";

import { accentHex } from "@/lib/theme";
const LIME = accentHex();

function useMaterials() {
  return useMemo(() => {
    const titanium = new THREE.MeshPhysicalMaterial({ color: "#33363c", metalness: 1, roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.3, envMapIntensity: 1.6 });
    const polished = new THREE.MeshPhysicalMaterial({ color: "#8a8e98", metalness: 1, roughness: 0.16, clearcoat: 1, envMapIntensity: 2.2 });
    const rubber = new THREE.MeshStandardMaterial({ color: "#17181c", roughness: 0.85, metalness: 0.05 });
    const rubberLight = new THREE.MeshStandardMaterial({ color: "#2a2c31", roughness: 0.7, metalness: 0.1 });
    const lime = new THREE.MeshStandardMaterial({ color: LIME, emissive: LIME, emissiveIntensity: 1.4, roughness: 0.45, toneMapped: false });
    return { titanium, polished, rubber, rubberLight, lime };
  }, []);
}

/** Kettlebell: Ø0.64 body, flat base, cast handle, lime equator band. */
export function Kettlebell(props: ThreeElements["group"]) {
  const m = useMaterials();
  return (
    <group {...props}>
      <mesh material={m.titanium} castShadow receiveShadow position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.32, 64, 48]} />
      </mesh>
      <mesh material={m.rubber} position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.06, 48]} />
      </mesh>
      <mesh material={m.lime} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.322, 0.006, 8, 96]} />
      </mesh>
      {/* handle */}
      <mesh material={m.polished} position={[0, 0.66, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.2, 0.042, 24, 64, Math.PI]} />
      </mesh>
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} material={m.polished} position={[x, 0.55, 0]}>
          <cylinderGeometry args={[0.042, 0.05, 0.22, 24]} />
        </mesh>
      ))}
    </group>
  );
}

/** Bumper plate: Ø0.9, 0.1 thick, steel hub, lime rim stripe. Stood upright on the floor. */
export function WeightPlate(props: ThreeElements["group"]) {
  const m = useMaterials();
  const r = 0.45;
  const t = 0.1;
  return (
    <group {...props}>
      <group rotation={[0, 0, 0]}>
        <mesh material={m.rubberLight} castShadow receiveShadow>
          <cylinderGeometry args={[r, r, t, 128]} />
        </mesh>
        {[1, -1].map((s) => (
          <group key={s} position={[0, (s * t) / 2, 0]} rotation={[s > 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0]}>
            <mesh material={m.rubber} position={[0, 0, 0.002]}>
              <ringGeometry args={[0.12, r * 0.86, 128]} />
            </mesh>
            <mesh material={m.lime} position={[0, 0, 0.004]}>
              <ringGeometry args={[r * 0.88, r * 0.92, 128]} />
            </mesh>
            <mesh material={m.polished} position={[0, 0, 0.003]}>
              <ringGeometry args={[0.055, 0.12, 64]} />
            </mesh>
          </group>
        ))}
        <mesh material={m.polished}>
          <cylinderGeometry args={[0.055, 0.055, t + 0.01, 48, 1, true]} />
        </mesh>
        <mesh material={m.polished} position={[0, t / 2, 0]}>
          <torusGeometry args={[r - 0.01, 0.01, 12, 128]} />
        </mesh>
      </group>
    </group>
  );
}

/** Medicine ball: Ø0.56 textured rubber with lime seams. */
export function MedicineBall(props: ThreeElements["group"]) {
  const m = useMaterials();
  return (
    <group {...props}>
      <mesh material={m.rubber} castShadow receiveShadow>
        <sphereGeometry args={[0.28, 64, 48]} />
      </mesh>
      {[0, Math.PI / 3, (2 * Math.PI) / 3].map((rot) => (
        <mesh key={rot} material={m.lime} rotation={[Math.PI / 2, 0, rot]}>
          <torusGeometry args={[0.281, 0.004, 8, 96]} />
        </mesh>
      ))}
      <mesh material={m.rubberLight} position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.05, 32]} />
      </mesh>
    </group>
  );
}
