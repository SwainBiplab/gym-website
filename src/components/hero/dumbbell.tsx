"use client";
import { useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";
import * as THREE from "three";

import { accentHex } from "@/lib/theme";
const LIME = accentHex();

/**
 * Procedural dumbbell (no external asset). Scene units ≈ metres.
 * Bar: 2.2 m long, Ø 0.11. Plates per side: Ø 0.84 / 0.68 / 0.52, 0.09 thick.
 * Swap for a GLB by replacing the body of this component (see README › 3D hero).
 */
export function Dumbbell(props: ThreeElements["group"]) {
  const mats = useMemo(() => {
    // Brushed black titanium: anisotropic highlights read as machined metal instead of plastic.
    const titanium = new THREE.MeshPhysicalMaterial({
      color: "#2b2e34",
      metalness: 1,
      roughness: 0.42,
      anisotropy: 0.75,
      anisotropyRotation: Math.PI / 2,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
      envMapIntensity: 1.4,
    });
    const bar = new THREE.MeshPhysicalMaterial({ color: "#44474f", metalness: 1, roughness: 0.28, anisotropy: 0.9, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 1.7 });
    const knurl = new THREE.MeshStandardMaterial({ color: "#1b1c20", metalness: 0.9, roughness: 0.7, envMapIntensity: 1.2 });
    const edge = new THREE.MeshPhysicalMaterial({ color: "#8a8e98", metalness: 1, roughness: 0.18, clearcoat: 1, envMapIntensity: 2.2 });
    const lime = new THREE.MeshStandardMaterial({ color: LIME, emissive: LIME, emissiveIntensity: 1.6, metalness: 0.2, roughness: 0.4, toneMapped: false });
    return { titanium, bar, knurl, edge, lime };
  }, []);

  const plates = [
    { x: 0.78, r: 0.42, t: 0.09, accent: true },
    { x: 0.88, r: 0.34, t: 0.08, accent: false },
    { x: 0.97, r: 0.26, t: 0.07, accent: false },
  ];

  return (
    <group {...props}>
      {/* bar */}
      <mesh material={mats.bar} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 2.2, 48]} />
      </mesh>
      {/* knurled grip */}
      <mesh material={mats.knurl} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.058, 0.058, 0.9, 48]} />
      </mesh>
      {[-0.46, 0.46].map((x) => (
        <mesh key={x} material={mats.edge} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.064, 0.064, 0.02, 48]} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} scale={[side, 1, 1]}>
          {/* collar */}
          <mesh material={mats.edge} position={[0.68, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.085, 0.085, 0.06, 48]} />
          </mesh>
          {plates.map((p, i) => (
            <group key={i} position={[p.x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <mesh material={mats.titanium} castShadow receiveShadow>
                <cylinderGeometry args={[p.r, p.r, p.t, 96]} />
              </mesh>
              {/* bevelled rim highlight */}
              <mesh material={mats.edge} position={[0, side > 0 ? p.t / 2 : -p.t / 2, 0]}>
                <torusGeometry args={[p.r - 0.012, 0.012, 16, 96]} />
              </mesh>
              {/* inner recess */}
              <mesh material={mats.knurl} position={[0, side > 0 ? p.t / 2 + 0.002 : -p.t / 2 - 0.002, 0]}>
                <ringGeometry args={[0.1, p.r * 0.72, 96]} />
              </mesh>
              {p.accent && (
                <mesh material={mats.lime} position={[0, side > 0 ? p.t / 2 + 0.004 : -p.t / 2 - 0.004, 0]}>
                  <ringGeometry args={[p.r * 0.74, p.r * 0.78, 96]} />
                </mesh>
              )}
            </group>
          ))}
          {/* end cap */}
          <mesh material={mats.edge} position={[1.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.06, 0.04, 48]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
