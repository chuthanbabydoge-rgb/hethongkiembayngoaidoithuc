import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { WebGLCanvas } from "@/components/WebGLCanvas";
import { WebGLErrorBoundary } from "@/components/WebGLErrorBoundary";
import { OrbitControls, Stars, Line, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Target, MapPin, Navigation } from "lucide-react";

// ─── Terrain ────────────────────────────────────────────────────
function TerrainGrid() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[60, 60, 60, 60]} />
      <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.07} />
    </mesh>
  );
}

function Mountain({ pos, height, radius }: { pos: [number, number, number]; height: number; radius: number }) {
  return (
    <group position={pos}>
      <mesh position={[0, height / 2 - 0.5, 0]}>
        <coneGeometry args={[radius, height, 6]} />
        <meshStandardMaterial color="#0a2030" emissive="#003344" emissiveIntensity={0.3} wireframe={false} />
      </mesh>
      {/* Peak glow */}
      <mesh position={[0, height - 0.5, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#00aacc" emissive="#00aacc" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

const MOUNTAINS = [
  { pos: [-8, 0, -5] as [number, number, number], height: 4.5, radius: 2.5 },
  { pos: [-5, 0, -8] as [number, number, number], height: 3.2, radius: 1.8 },
  { pos: [10, 0, -6] as [number, number, number], height: 5, radius: 3 },
  { pos: [12, 0, -3] as [number, number, number], height: 3.5, radius: 2 },
  { pos: [-12, 0, 4] as [number, number, number], height: 4, radius: 2.2 },
  { pos: [6, 0, 8] as [number, number, number], height: 2.8, radius: 1.6 },
  { pos: [-7, 0, 10] as [number, number, number], height: 3.8, radius: 2 },
];

// ─── Cities ──────────────────────────────────────────────────────
interface City {
  name: string;
  pos: [number, number, number];
  type: "city" | "base" | "waypoint";
  color: string;
}

const CITIES: City[] = [
  { name: "HANOI BASE", pos: [0, 0, 0], type: "base", color: "#00ffcc" },
  { name: "Mountain Peak Alpha", pos: [-8, 4, -5], type: "waypoint", color: "#ffcc00" },
  { name: "Valley City B", pos: [5, 0, 4], type: "city", color: "#00aaff" },
  { name: "Border Station C", pos: [-10, 0, 6], type: "base", color: "#ff6600" },
  { name: "Summit Outpost D", pos: [10, 5, -6], type: "waypoint", color: "#ff44cc" },
  { name: "River Delta E", pos: [3, 0, -7], type: "city", color: "#00ff88" },
];

function CityMarker({ city, onSelect, selected }: { city: City; onSelect: (c: City) => void; selected: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (mesh.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + city.pos[0]) * 0.1;
      mesh.current.scale.setScalar(scale);
    }
    if (ring.current && selected) ring.current.rotation.z = state.clock.elapsedTime * 2;
  });

  return (
    <group position={city.pos}>
      <mesh ref={mesh} onClick={() => onSelect(city)}>
        <sphereGeometry args={[selected ? 0.22 : 0.16, 16, 16]} />
        <meshStandardMaterial color={city.color} emissive={city.color} emissiveIntensity={selected ? 3 : 1.5} />
      </mesh>
      {selected && (
        <mesh ref={ring}>
          <torusGeometry args={[0.45, 0.015, 8, 32]} />
          <meshBasicMaterial color={city.color} transparent opacity={0.8} />
        </mesh>
      )}
      {/* Vertical beam */}
      <mesh position={[0, -city.pos[1] / 2 - 0.25, 0]}>
        <cylinderGeometry args={[0.008, 0.008, Math.abs(city.pos[1]) + 0.5, 4]} />
        <meshBasicMaterial color={city.color} transparent opacity={0.3} />
      </mesh>
      <Text position={[0, 0.4, 0]} fontSize={0.22} color={city.color} anchorX="center" anchorY="bottom" font={undefined}>
        {city.name}
      </Text>
      <pointLight color={city.color} intensity={0.6} distance={3} />
    </group>
  );
}

// ─── Mission Path ─────────────────────────────────────────────────
function MissionPath({ destination }: { destination: City | null }) {
  const trailRef = useRef<THREE.Mesh>(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    progress.current = (progress.current + delta * 0.3) % 1;
    if (trailRef.current && destination) {
      const t = progress.current;
      trailRef.current.position.set(
        t * destination.pos[0],
        t * destination.pos[1],
        t * destination.pos[2]
      );
    }
  });

  if (!destination) return null;

  const points: [number, number, number][] = [
    [0, 0, 0],
    [destination.pos[0] * 0.25, destination.pos[1] * 0.5 + 2, destination.pos[2] * 0.25],
    [destination.pos[0] * 0.5, destination.pos[1] * 0.5 + 3, destination.pos[2] * 0.5],
    destination.pos,
  ];

  return (
    <group>
      <Line points={points} color={destination.color} lineWidth={2.5} transparent opacity={0.7} dashed dashSize={0.3} gapSize={0.15} />
      <mesh ref={trailRef}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={destination.color} emissive={destination.color} emissiveIntensity={5} />
      </mesh>
    </group>
  );
}

// ─── Current Position ────────────────────────────────────────────
function CurrentPosition() {
  const beam = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (beam.current) beam.current.position.y = Math.sin(t) * 0.3 + 0.5;
    if (ring.current) ring.current.rotation.z = t * 1.5;
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={beam} position={[0, 0.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.12, 0.5, 8]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={3} transparent opacity={0.9} />
      </mesh>
      <mesh ref={ring}>
        <torusGeometry args={[0.6, 0.02, 8, 32]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 1.2, 32]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#00ffcc" intensity={1.5} distance={4} />
    </group>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function WorldMap() {
  const [selected, setSelected] = useState<City | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleSelect = (city: City) => {
    if (city.name === "HANOI BASE") return;
    setSelected(city);
    setConfirming(false);
  };

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => setConfirming(false), 2000);
  };

  return (
    <div className="h-full w-full relative bg-[#000508]">
      <WebGLErrorBoundary>
      <Canvas camera={{ position: [0, 18, 20], fov: 55 }} shadows>
        <color attach="background" args={["#000508"]} />
        <fog attach="fog" args={["#000508", 25, 70]} />
        <ambientLight intensity={0.1} />
        <Stars radius={80} depth={50} count={2000} factor={4} saturation={0} fade speed={0.3} />

        <Suspense fallback={null}>
          <TerrainGrid />
          {MOUNTAINS.map((m, i) => <Mountain key={i} {...m} />)}
          {CITIES.map((city) => (
            <CityMarker key={city.name} city={city} selected={selected?.name === city.name} onSelect={handleSelect} />
          ))}
          <CurrentPosition />
          <MissionPath destination={selected} />
        </Suspense>

        <OrbitControls enableDamping dampingFactor={0.07} minDistance={6} maxDistance={40} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
      </WebGLErrorBoundary>

      {/* Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2 mb-2">
          <Map className="w-4 h-4 text-primary" />
          <span className="font-display text-xs tracking-[0.25em] text-primary uppercase">3D World Map</span>
        </div>
        <div className="font-mono text-[9px] text-muted-foreground/40">Nhấp vào mục tiêu để chọn điểm đến</div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 space-y-1 pointer-events-none">
        {[
          { color: "bg-primary", label: "Căn cứ / Vị trí" },
          { color: "bg-yellow-400", label: "Waypoint" },
          { color: "bg-blue-400", label: "Thành phố" },
          { color: "bg-orange-400", label: "Trạm biên giới" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 bg-background/50 border border-primary/10 px-2.5 py-1 backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            <span className="font-mono text-[9px] text-muted-foreground/60">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Destination info */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 border border-primary/40 bg-background/90 backdrop-blur-sm p-4 min-w-80"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-display text-xs tracking-widest text-primary uppercase">Điểm Đến Đã Chọn</span>
              </div>
              <button onClick={() => setSelected(null)} className="font-mono text-[10px] text-muted-foreground/40 hover:text-primary">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <div className="font-mono text-[9px] text-muted-foreground/50 uppercase mb-0.5">Tên Mục Tiêu</div>
                <div className="font-mono text-sm text-primary font-bold">{selected.name}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-muted-foreground/50 uppercase mb-0.5">Tọa Độ</div>
                <div className="font-mono text-xs text-foreground/70">
                  {selected.pos[0].toFixed(1)} · {selected.pos[2].toFixed(1)}
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-muted-foreground/50 uppercase mb-0.5">Độ Cao</div>
                <div className="font-mono text-xs text-foreground/70">{(Math.abs(selected.pos[1]) * 200 + 800).toFixed(0)} m</div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-muted-foreground/50 uppercase mb-0.5">Loại</div>
                <div className="font-mono text-xs" style={{ color: selected.color }}>{selected.type.toUpperCase()}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 font-mono text-[10px] tracking-widest px-4 py-2.5 border border-primary/50 text-primary hover:bg-accent transition-all uppercase">
                <Navigation className="w-3.5 h-3.5" />
                {confirming ? "Đang bay đến..." : "Xác nhận điểm đến"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying sword position */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 border border-primary/20 bg-background/60 px-3 py-2 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="font-mono text-[9px] text-primary/70 uppercase tracking-widest">HANOI BASE · Vị trí hiện tại</span>
      </div>
    </div>
  );
}
