import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture, Text } from "@react-three/drei";
import * as THREE from "three";
import cakeimg from "@/assets/images/image.png";

// Preload safely
if (typeof window !== "undefined") {
  useTexture.preload(cakeimg as string);
}

// ── Flower petal decoration ────────────────────────────────────────────────────
function Flower({ position, color = "#FF69B4", scale = 1 }: { position: [number, number, number]; color?: string; scale?: number; }) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color="#FFDA44" metalness={0.3} roughness={0.4} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26]} rotation={[Math.PI / 2, 0, a]}>
            <sphereGeometry args={[0.15, 8, 6]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Frosting rosette blobs ─────────────────────────────────────────────────────
function Rosettes({ y, radius, count }: { y: number; radius: number; count: number }) {
  const colors = ["#FF69B4", "#FF1493", "#FFB6C1", "#DB3D68", "#FF85C2"];
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}>
            <sphereGeometry args={[0.13, 8, 8]} />
            <meshStandardMaterial color={colors[i % colors.length]} roughness={0.5} />
          </mesh>
        );
      })}
    </>
  );
}

// ── Photo printed on cake top ──────────────────────────────────────────────────
function CakePhoto() {
  const texture = useTexture(cakeimg as string);
  texture.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={[0, 2.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.1, 32]} />
      <meshStandardMaterial map={texture} roughness={0.3} toneMapped={false} />
    </mesh>
  );
}

// ── Premium multi-part candle ──────────────────────────────────────────────────
function PremiumCandle({ candleLit }: { candleLit: boolean }) {
  const flameRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const innerFlameRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (candleLit) {
      if (flameRef.current) {
        flameRef.current.scale.y = 1 + Math.sin(t * 14) * 0.18;
        flameRef.current.scale.x = 1 + Math.cos(t * 11) * 0.12;
        flameRef.current.position.y = 3.22 + Math.sin(t * 11) * 0.025;
        flameRef.current.rotation.y = t * 2;
      }
      if (innerFlameRef.current) {
        innerFlameRef.current.scale.y = 1 + Math.sin(t * 16 + 1) * 0.2;
        innerFlameRef.current.position.y = 3.18 + Math.sin(t * 13) * 0.02;
      }
      if (glowRef.current) {
        (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 8) * 0.06;
      }
    }
  });

  return (
    <group>
      <mesh position={[0, 2.15, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.08, 32]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.05} />
      </mesh>
      <mesh position={[0, 2.58, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.85, 32]} />
        <meshStandardMaterial color="#FFF5F8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.35, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.05, 32]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[0, 2.72, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.05, 32]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[0, 3.03, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {candleLit && (
        <group>
          <mesh ref={glowRef} position={[0, 3.22, 0]}>
            <sphereGeometry args={[0.38, 16, 16]} />
            <meshBasicMaterial color="#FF8C00" transparent opacity={0.14} />
          </mesh>
          <mesh ref={flameRef} position={[0, 3.22, 0]}>
            <coneGeometry args={[0.1, 0.32, 16]} />
            <meshBasicMaterial color="#FF6A00" />
          </mesh>
          <mesh ref={innerFlameRef} position={[0, 3.18, 0]}>
            <coneGeometry args={[0.055, 0.22, 16]} />
            <meshBasicMaterial color="#FFE033" />
          </mesh>
          <mesh position={[0, 3.32, 0]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <pointLight position={[0, 3.3, 0]} color="#FF7A00" intensity={12} distance={7} decay={2} />
          <pointLight position={[0, 3.0, 0]} color="#FFD580" intensity={4} distance={4} decay={2} />
        </group>
      )}
    </group>
  );
}

// ── Wooden / marble table ─────────────────────────────────────────────────────
function Table() {
  const tableRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (tableRef.current) tableRef.current.rotation.y += 0.004;
  });
  return (
    <group ref={tableRef} position={[0, -0.6, 0]}>
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[5.0, 5.0, 0.18, 32]} />
        <meshStandardMaterial color="#1a0a00" metalness={0.1} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.0, 0.06, 12, 32]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[4.8, 5.2, 0.06, 32]} />
        <meshStandardMaterial color="#3d0018" roughness={0.9} />
      </mesh>
      {/* Pedestal: top flush with table bottom (local y=-0.09), height 1.65 */}
      <mesh position={[0, -0.87, 0]}>
        <cylinderGeometry args={[0.28, 0.52, 1.65, 32]} />
        <meshStandardMaterial color="#0d0502" metalness={0.2} roughness={0.5} />
      </mesh>
      {/* Base: top flush with pedestal bottom */}
      <mesh position={[0, -1.74, 0]}>
        <cylinderGeometry args={[1.6, 1.8, 0.18, 32]} />
        <meshStandardMaterial color="#1a0a00" metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ── Main exported Cake ────────────────────────────────────────────────────────
export function PremiumCake({ candleLit }: { candleLit: boolean }) {
  const cakeBodyRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (cakeBodyRef.current) cakeBodyRef.current.rotation.y -= 0.004;
  });

  const bottomFlowers: [number, number, number][] = Array.from({ length: 6 }).map((_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return [Math.cos(a) * 1.85, 1.15, Math.sin(a) * 1.85];
  });
  const topFlowers: [number, number, number][] = Array.from({ length: 5 }).map((_, i) => {
    const a = (i / 5) * Math.PI * 2;
    return [Math.cos(a) * 1.28, 2.13, Math.sin(a) * 1.28];
  });
  const flowerColors = ["#FF69B4", "#FF1493", "#FFB6C1", "#DB3D68", "#FF85C2", "#FF69B4", "#FF1493", "#FFB6C1"];

  return (
    <group position={[0, 0, 0]}>
      <group ref={cakeBodyRef}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[2.5, 2.6, 0.2, 32]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[2, 2, 1.2, 32]} />
          <meshStandardMaterial color="#FFF0F5" roughness={0.4} />
        </mesh>
        <Rosettes y={0.02} radius={1.92} count={10} />
        <Rosettes y={1.0}  radius={1.92} count={10} />
        <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2, 0.06, 12, 32]} />
          <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[1.4, 1.4, 1, 32]} />
          <meshStandardMaterial color="#fff" roughness={0.2} />
        </mesh>
        <Rosettes y={1.15} radius={1.33} count={8} />
        <Rosettes y={1.95} radius={1.33} count={8} />
        <mesh position={[0, 2.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.4, 0.04, 12, 32]} />
          <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
        </mesh>

        <CakePhoto />

        {bottomFlowers.map((pos, i) => (
          <Flower key={`bf-${i}`} position={pos} color={flowerColors[i]} scale={0.72} />
        ))}
        {topFlowers.map((pos, i) => (
          <Flower key={`tf-${i}`} position={pos} color={flowerColors[i]} scale={0.55} />
        ))}

        <PremiumCandle candleLit={candleLit} />

        <Text position={[0, 0.75, 2.01]} fontSize={0.19} color="#DB3D68" anchorX="center" anchorY="middle" letterSpacing={0.05} outlineWidth={0.008} outlineColor="#5a001a">
          Happy Birthday
        </Text>
        <Text position={[0, 0.34, 2.01]} fontSize={0.31} color="#D4AF37" anchorX="center" anchorY="middle" letterSpacing={0.1} outlineWidth={0.01} outlineColor="#5a3a00">
          Sneha 
        </Text>
        <Text position={[0, 1.63, 1.41]} fontSize={0.19} color="#D4AF37" anchorX="center" anchorY="middle" letterSpacing={0.06} outlineWidth={0.008} outlineColor="#5a3a00">
          ✦ Sneha  ✦
        </Text>
      </group>
    </group>
  );
}

export { Table };