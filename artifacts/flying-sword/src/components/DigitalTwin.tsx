import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { WebGLCanvas } from "@/components/WebGLCanvas";
import { OrbitControls, Stars, Sparkles, Float, Text } from "@react-three/drei";
import * as THREE from "three";
import { useFlightSimulation } from "@/hooks/use-flight-simulation";

interface TwinProps {
  altitude: number;
  speed: number;
  battery: number;
  heading: number;
}

function SwordMesh({ altitude, speed, battery, heading }: TwinProps) {
  const group = useRef<THREE.Group>(null);
  const blade = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef<THREE.PointLight>(null);
  const trailRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    // Heading → rotation Y
    const targetRotY = (heading * Math.PI) / 180;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotY, 0.03);

    // Altitude → subtle Y drift (normalized 0-5000 → -0.3 to 0.3)
    const altNorm = (altitude / 5000) * 0.6 - 0.3;
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, altNorm + Math.sin(t * 0.4) * 0.08, 0.05);

    // Speed → blade emissive intensity
    if (blade.current) {
      const speedIntensity = 0.5 + (speed / 300) * 1.2;
      blade.current.emissiveIntensity = THREE.MathUtils.lerp(blade.current.emissiveIntensity, speedIntensity, 0.05);
    }

    // Battery → glow intensity
    if (glow.current) {
      const battIntensity = 0.5 + (battery / 100) * 2;
      glow.current.intensity = THREE.MathUtils.lerp(glow.current.intensity, battIntensity, 0.05);
    }

    // Trail: oscillate position behind the sword
    if (trailRef.current) {
      trailRef.current.position.y = Math.sin(t * 3) * 0.06;
    }
  });

  const battColor = battery > 40 ? "#00ffcc" : battery > 20 ? "#ffaa00" : "#ff3300";
  const speedColor = speed > 200 ? "#ff4400" : speed > 100 ? "#ffcc00" : "#00ffcc";

  return (
    <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.2}>
      <group ref={group}>
        {/* Blade */}
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.055, 2.5, 0.032]} />
          <meshStandardMaterial ref={blade} color={speedColor} emissive={speedColor} emissiveIntensity={0.7}
            metalness={0.95} roughness={0.05} />
        </mesh>
        {/* Tip */}
        <mesh position={[0, 2.22, 0]}>
          <coneGeometry args={[0.028, 0.22, 4]} />
          <meshStandardMaterial color={speedColor} emissive={speedColor} emissiveIntensity={1.5} />
        </mesh>
        {/* Guard */}
        <mesh position={[0, -0.18, 0]}>
          <boxGeometry args={[0.65, 0.055, 0.055]} />
          <meshStandardMaterial color="#002233" emissive="#00aacc" emissiveIntensity={0.4} metalness={0.9} />
        </mesh>
        {/* Handle */}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.038, 0.032, 0.75, 8]} />
          <meshStandardMaterial color="#001020" metalness={0.8} roughness={0.4} />
        </mesh>
        {/* Pommel */}
        <mesh position={[0, -1.0, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color={battColor} emissive={battColor} emissiveIntensity={1.2} />
        </mesh>
        {/* Energy sparkles */}
        <Sparkles count={15} size={1.5} position={[0, 0.9, 0]} scale={[0.08, 2.5, 0.08]} color={speedColor} speed={speed / 300} />
        {/* Trail ref (attached to group for hover effect) */}
        <mesh ref={trailRef} position={[0, -1.5, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={battColor} emissive={battColor} emissiveIntensity={2} transparent opacity={0.5} />
        </mesh>
        <pointLight ref={glow} color={battColor} intensity={2} distance={3.5} />
      </group>
    </Float>
  );
}

function TelemetryLabels({ speed, altitude, battery, heading }: TwinProps) {
  return (
    <>
      <Text position={[-1.8, 1.5, 0]} fontSize={0.16} color="#00ffcc" anchorX="left" font={undefined}>
        {`ALT: ${altitude.toFixed(0)}m`}
      </Text>
      <Text position={[-1.8, 1.2, 0]} fontSize={0.16} color="#ffcc00" anchorX="left" font={undefined}>
        {`SPD: ${speed.toFixed(0)}km/h`}
      </Text>
      <Text position={[-1.8, 0.9, 0]} fontSize={0.16} color={battery > 20 ? "#00ff88" : "#ff4444"} anchorX="left" font={undefined}>
        {`BAT: ${battery.toFixed(0)}%`}
      </Text>
      <Text position={[-1.8, 0.6, 0]} fontSize={0.16} color="#00aaff" anchorX="left" font={undefined}>
        {`HDG: ${heading.toFixed(0)}°`}
      </Text>
    </>
  );
}

function Scene({ altitude, speed, battery, heading }: TwinProps) {
  return (
    <>
      <color attach="background" args={["#000810"]} />
      <ambientLight intensity={0.06} />
      <Stars radius={30} depth={20} count={600} factor={3} saturation={0} fade speed={0.5} />
      <SwordMesh altitude={altitude} speed={speed} battery={battery} heading={heading} />
      <TelemetryLabels altitude={altitude} speed={speed} battery={battery} heading={heading} />
      <OrbitControls enableDamping enableZoom={false} autoRotate={false} />
    </>
  );
}

/** Embeddable Digital Twin — pass props directly or use flight simulation hook */
export function DigitalTwinCanvas({ altitude, speed, battery, heading }: Partial<TwinProps>) {
  const sim = useFlightSimulation();
  const a = altitude ?? sim.altitude;
  const s = speed ?? sim.speed;
  const b = battery ?? sim.battery;
  const h = heading ?? sim.heading;

  return (
    <WebGLErrorBoundary>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <Scene altitude={a} speed={s} battery={b} heading={h} />
        </Suspense>
      </Canvas>
    </WebGLErrorBoundary>
  );
}

/** Standalone Digital Twin page */
export default function DigitalTwinPage() {
  const sim = useFlightSimulation();

  return (
    <div className="h-full flex flex-col bg-[#000810]">
      <div className="flex-shrink-0 p-4 border-b border-primary/10 flex items-center gap-4">
        <div>
          <div className="font-mono text-[9px] text-muted-foreground/50 tracking-[0.3em] uppercase mb-0.5">Digital Twin · Live 3D Model</div>
          <div className="font-display text-sm tracking-widest text-primary uppercase">飛劍 — DIGITAL TWIN</div>
        </div>
        <div className="ml-auto flex gap-4">
          {[
            { label: "ALT", value: `${sim.altitude.toFixed(0)}m`, ok: true },
            { label: "SPD", value: `${sim.speed.toFixed(0)}km/h`, ok: sim.speed < 200 },
            { label: "BAT", value: `${sim.battery.toFixed(0)}%`, ok: sim.battery > 20 },
            { label: "HDG", value: `${sim.heading.toFixed(0)}°`, ok: true },
          ].map((item) => (
            <div key={item.label} className="text-center border border-primary/15 px-3 py-1.5">
              <div className="font-mono text-[8px] text-muted-foreground/40 uppercase mb-0.5">{item.label}</div>
              <div className={`font-mono text-sm font-bold ${item.ok ? "text-primary" : "text-destructive"}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 relative">
        <DigitalTwinCanvas altitude={sim.altitude} speed={sim.speed} battery={sim.battery} heading={sim.heading} />
        {/* How it works overlay */}
        <div className="absolute bottom-4 left-4 space-y-1 pointer-events-none">
          {[
            { prop: "Altitude", effect: "Vị trí Y của kiếm" },
            { prop: "Speed", effect: "Màu + độ sáng lưỡi kiếm" },
            { prop: "Battery", effect: "Màu tâm kiếm + glow" },
            { prop: "Heading", effect: "Góc quay Y (hướng bay)" },
          ].map((item) => (
            <div key={item.prop} className="flex gap-2 font-mono text-[9px]">
              <span className="text-primary/60 w-16">{item.prop}</span>
              <span className="text-muted-foreground/30">→ {item.effect}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
