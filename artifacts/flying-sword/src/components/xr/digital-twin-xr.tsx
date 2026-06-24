import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Environment, Grid, Edges } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

function FlyingSwordModel({ wireframe, scale, rotationSpeed }: { wireframe: boolean; scale: number; rotationSpeed: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
      groupRef.current.position.y = Math.sin(t.current * 0.8) * 0.05;
    }
  });

  const mat = wireframe
    ? <meshStandardMaterial color="#06b6d4" wireframe />
    : <meshStandardMaterial color="#1e3a5f" metalness={0.9} roughness={0.1} emissive="#0066aa" emissiveIntensity={0.3} />;

  const emissiveMat = <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={wireframe ? 0.5 : 0.2} transparent opacity={0.8} />;

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* Main fuselage */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.08, 1.2, 4, 16]} />
        {mat}
        {wireframe && <Edges color="#06b6d4" />}
      </mesh>

      {/* Wings */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Main wing */}
          <mesh position={[side * 0.5, 0, -0.1]} rotation={[0, side === 1 ? -0.1 : 0.1, 0]}>
            <boxGeometry args={[0.9, 0.03, 0.35]} />
            {mat}
          </mesh>
          {/* Wing tip */}
          <mesh position={[side * 0.95, 0.05, -0.05]} rotation={[0, 0, side * 0.3]}>
            <boxGeometry args={[0.08, 0.15, 0.12]} />
            {emissiveMat}
          </mesh>
          {/* Canard */}
          <mesh position={[side * 0.22, 0, 0.4]} rotation={[0.05, 0, 0]}>
            <boxGeometry args={[0.4, 0.02, 0.15]} />
            {mat}
          </mesh>
        </group>
      ))}

      {/* Tail fins */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.12, 0.15, -0.55]} rotation={[0, 0, side * 0.2]}>
          <boxGeometry args={[0.04, 0.3, 0.25]} />
          {mat}
        </mesh>
      ))}

      {/* Vertical tail */}
      <mesh position={[0, 0.18, -0.5]}>
        <boxGeometry args={[0.04, 0.38, 0.22]} />
        {mat}
      </mesh>

      {/* Engine nozzle */}
      <mesh position={[0, 0, -0.72]}>
        <cylinderGeometry args={[0.06, 0.09, 0.18, 12]} />
        {emissiveMat}
      </mesh>

      {/* Cockpit */}
      <mesh position={[0, 0.07, 0.38]}>
        <sphereGeometry args={[0.09, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#001830" emissive="#003366" emissiveIntensity={0.5} transparent opacity={0.7} />
      </mesh>

      {/* Weapon pylons */}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, -0.05, -0.05]}>
          <capsuleGeometry args={[0.015, 0.3, 4, 8]} />
          <meshStandardMaterial color="#0a2030" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function HolographicGrid() {
  return (
    <>
      <Grid args={[8, 8]} cellSize={0.5} cellThickness={0.3} cellColor="#06b6d4" sectionSize={2}
        sectionThickness={0.8} sectionColor="#06b6d4" fadeDistance={5} fadeStrength={1}
        position={[0, -0.8, 0]} />
      {/* Vertical scan lines */}
      {[-2, -1, 0, 1, 2].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <planeGeometry args={[0.01, 2]} />
          <meshStandardMaterial color="#06b6d4" transparent opacity={0.05} />
        </mesh>
      ))}
    </>
  );
}

function TelemetryLabel({ position, label, value, color = "#06b6d4" }: {
  position: [number, number, number];
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <group position={position}>
      <Text fontSize={0.045} color={color} anchorX="left" anchorY="middle" font={undefined}>
        {`${label}: ${value}`}
      </Text>
      <mesh position={[-0.05, 0, 0]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

export function DigitalTwinXR() {
  const [wireframe, setWireframe] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotationSpeed, setRotationSpeed] = useState(0.4);
  const [showLabels, setShowLabels] = useState(true);
  const [inspectMode, setInspectMode] = useState<"full" | "exploded" | "xray">("full");

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="font-mono text-[8px] text-primary/40 uppercase tracking-widest mr-2">Digital Twin XR</div>
        {[
          { label: "Solid", active: !wireframe, onClick: () => setWireframe(false) },
          { label: "Wire", active: wireframe, onClick: () => setWireframe(true) },
          { label: "Labels", active: showLabels, onClick: () => setShowLabels((v) => !v) },
        ].map((btn) => (
          <button key={btn.label} onClick={btn.onClick}
            className={`px-2 py-1 font-mono text-[8px] uppercase tracking-widest border transition-all ${
              btn.active ? "border-primary bg-primary/10 text-primary" : "border-primary/20 text-muted-foreground/40 hover:border-primary/40"
            }`}>
            {btn.label}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-auto">
          <span className="font-mono text-[8px] text-muted-foreground/40">SCALE</span>
          <input type="range" min={0.5} max={2} step={0.1} value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-16 accent-primary" />
          <span className="font-mono text-[8px] text-primary/60">{scale.toFixed(1)}x</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[8px] text-muted-foreground/40">ROT</span>
          <input type="range" min={0} max={2} step={0.1} value={rotationSpeed}
            onChange={(e) => setRotationSpeed(Number(e.target.value))}
            className="w-16 accent-primary" />
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 border border-primary/20 bg-black/60 relative min-h-0" style={{ minHeight: 300 }}>
        <Canvas camera={{ position: [1.5, 1, 2], fov: 45 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[2, 3, 2]} intensity={1} color="#06b6d4" />
          <pointLight position={[-2, -1, -2]} intensity={0.5} color="#0066ff" />
          <spotLight position={[0, 5, 0]} intensity={2} angle={0.3} penumbra={0.5} color="#ffffff" />

          <HolographicGrid />
          <FlyingSwordModel wireframe={wireframe} scale={scale} rotationSpeed={rotationSpeed} />

          {showLabels && (
            <>
              <TelemetryLabel position={[0.6, 0.4, 0]} label="ALT" value="2,340 m" />
              <TelemetryLabel position={[0.6, 0.3, 0]} label="SPD" value="142 km/h" />
              <TelemetryLabel position={[0.6, 0.2, 0]} label="HDG" value="275°" color="#f59e0b" />
              <TelemetryLabel position={[0.6, 0.1, 0]} label="BAT" value="82%" color="#22c55e" />
              <TelemetryLabel position={[0.6, 0, 0]} label="SYS" value="NOMINAL" color="#22c55e" />
            </>
          )}

          <OrbitControls enablePan={false} minDistance={1.5} maxDistance={6} autoRotate={false} />
          <Environment preset="night" />
        </Canvas>

        {/* AR overlay label */}
        <div className="absolute top-2 left-2 font-mono text-[8px] text-cyan-400/50 uppercase tracking-widest border border-cyan-400/20 px-2 py-1 bg-black/60">
          ⊙ XR TWIN · 飛劍 MK.V
        </div>
        <div className="absolute bottom-2 right-2 font-mono text-[8px] text-muted-foreground/30 uppercase">
          DRAG · SCROLL TO ZOOM
        </div>
      </div>

      {/* Telemetry strip */}
      <div className="grid grid-cols-4 gap-px border border-primary/10 overflow-hidden">
        {[
          { label: "Frame", value: "CARBON-7", color: "text-primary" },
          { label: "Engine", value: "TF-X ACTIVE", color: "text-green-400" },
          { label: "Stealth", value: "ENGAGED", color: "text-cyan-400" },
          { label: "Status", value: "OPERATIONAL", color: "text-green-400" },
        ].map((item) => (
          <div key={item.label} className="bg-black/60 px-2 py-2 text-center border-r border-primary/10 last:border-r-0">
            <div className="font-mono text-[7px] text-muted-foreground/30 uppercase mb-0.5">{item.label}</div>
            <div className={`font-mono text-[8px] font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
