import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  torque: number;
  wear: number;
  riskLevel: 'optimal' | 'warning' | 'critical';
}

function MotorBase() {
  return (
    <mesh position={[0, -0.5, 0]}>
      <boxGeometry args={[3.5, 0.4, 2.5]} />
      <meshStandardMaterial color="#1e2430" metalness={0.8} roughness={0.3} />
    </mesh>
  );
}

function MotorBody({ riskLevel }: { riskLevel: string }) {
  const emissiveColor = useMemo(() => {
    if (riskLevel === 'critical') return '#ef4444';
    if (riskLevel === 'warning') return '#f59e0b';
    return '#000000';
  }, [riskLevel]);

  const intensity = riskLevel === 'critical' ? 0.8 : riskLevel === 'warning' ? 0.3 : 0;

  return (
    <group>
      {/* Main motor housing */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 2.0, 32]} />
        <meshStandardMaterial
          color="#2a3040"
          metalness={0.9}
          roughness={0.2}
          emissive={emissiveColor}
          emissiveIntensity={intensity}
        />
      </mesh>
      {/* Cooling fins */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[0, 0.5, 0]} rotation={[0, (i * Math.PI) / 4, 0]}>
          <boxGeometry args={[2.2, 1.6, 0.04]} />
          <meshStandardMaterial
            color="#333d4d"
            metalness={0.7}
            roughness={0.4}
            emissive={emissiveColor}
            emissiveIntensity={intensity * 0.5}
          />
        </mesh>
      ))}
      {/* End cap front */}
      <mesh position={[0, 0.5, 1.05]}>
        <cylinderGeometry args={[0.95, 0.95, 0.1, 32]} />
        <meshStandardMaterial color="#3a4555" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Shaft({ wear }: { wear: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const wearRatio = wear / 250;

  const shaftColor = useMemo(() => {
    if (wearRatio > 0.8) return '#ef4444';
    if (wearRatio > 0.6) return '#f59e0b';
    return '#888888';
  }, [wearRatio]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.z += delta * 3;
    }
  });

  return (
    <group>
      {/* Main shaft */}
      <mesh ref={ref} position={[0, 0.5, 1.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 1.5, 16]} />
        <meshStandardMaterial
          color={shaftColor}
          metalness={0.95}
          roughness={0.15}
          emissive={wearRatio > 0.8 ? '#ef4444' : '#000000'}
          emissiveIntensity={wearRatio > 0.8 ? 0.6 : 0}
        />
      </mesh>
      {/* Coupling */}
      <mesh position={[0, 0.5, 2.6]}>
        <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
        <meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

function StatusRing({ riskLevel }: { riskLevel: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.5;
  });

  const color = riskLevel === 'critical' ? '#ef4444' : riskLevel === 'warning' ? '#f59e0b' : '#10b981';

  return (
    <mesh ref={ref} position={[0, 0.5, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.3, 0.015, 8, 64]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.7} />
    </mesh>
  );
}

function Labels() {
  return (
    <>
      <Float speed={1.5} floatIntensity={0.3}>
        <Text position={[0, 2.2, 0]} fontSize={0.15} color="#10b981" anchorX="center" font="https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZs.woff">
          SPINDLE MOTOR
        </Text>
      </Float>
      <Float speed={1.5} floatIntensity={0.3}>
        <Text position={[0, 0.5, 3.2]} fontSize={0.12} color="#94a3b8" anchorX="center" font="https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZs.woff">
          OUTPUT SHAFT
        </Text>
      </Float>
    </>
  );
}

function MotorScene({ torque, wear, riskLevel }: Props) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <pointLight position={[-3, 3, 3]} intensity={0.3} color="#3b82f6" />

      <MotorBase />
      <MotorBody riskLevel={riskLevel} />
      <Shaft wear={wear} />
      <StatusRing riskLevel={riskLevel} />
      <Labels />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.5}
      />
      <Environment preset="city" />
    </>
  );
}

export function SceneView({ torque, wear, riskLevel }: Props) {
  return (
    <div className="glass overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-4 left-5 z-10 flex items-center gap-3">
        <div className="bg-accent-blue/15 text-accent-blue text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
          ◆ Digital Twin
        </div>
      </div>
      <div className="absolute top-4 right-5 z-10 text-[11px] text-white/30">
        Drag to Rotate • Scroll to Zoom
      </div>

      {/* 3D Canvas */}
      <div className="three-canvas h-[420px]">
        <Canvas camera={{ position: [4, 3, 6], fov: 42 }} dpr={[1, 2]}>
          <MotorScene torque={torque} wear={wear} riskLevel={riskLevel} />
        </Canvas>
      </div>
    </div>
  );
}
