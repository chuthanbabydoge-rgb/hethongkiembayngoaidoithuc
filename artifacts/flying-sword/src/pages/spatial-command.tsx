import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { WebGLCanvas } from "@/components/WebGLCanvas";
import { WebGLErrorBoundary } from "@/components/WebGLErrorBoundary";
import { OrbitControls, Stars, Line, Float, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useFlightSimulation } from "@/hooks/use-flight-simulation";
import { Eye, Zap, Target, Radio, GitBranch } from "lucide-react";

// ─── Flying Sword ───────────────────────────────────────────────
function FlyingSword({ flightData }: { flightData: ReturnType<typeof useFlightSimulation> }) {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);
  const bladeMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = (flightData.heading * Math.PI) / 180;
    group.current.position.y = Math.sin(t * 0.4) * 0.15;
    if (glow.current) glow.current.intensity = 1.5 + Math.sin(t * 2.5) * 0.5;
    if (bladeMat.current) bladeMat.current.emissiveIntensity = 0.6 + (flightData.speed / 300) * 0.8;
  });

  return (
    <Float speed={1.2} rotationIntensity={0} floatIntensity={0.3}>
      <group ref={group} position={[0, 0, 0]}>
        {/* Blade */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[0.06, 2.8, 0.035]} />
          <meshStandardMaterial ref={bladeMat} color="#00ffcc" emissive="#00ffcc" emissiveIntensity={0.7} metalness={0.95} roughness={0.05} />
        </mesh>
        {/* Blade tip */}
        <mesh position={[0, 2.5, 0]}>
          <coneGeometry args={[0.03, 0.25, 4]} />
          <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={1.2} />
        </mesh>
        {/* Guard */}
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.75, 0.06, 0.06]} />
          <meshStandardMaterial color="#003344" emissive="#00aacc" emissiveIntensity={0.4} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, -0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.04, 0.08, 4]} />
          <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={0.8} />
        </mesh>
        {/* Handle */}
        <mesh position={[0, -0.65, 0]}>
          <cylinderGeometry args={[0.04, 0.035, 0.85, 8]} />
          <meshStandardMaterial color="#001a22" metalness={0.8} roughness={0.4} />
        </mesh>
        {/* Pommel */}
        <mesh position={[0, -1.12, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={1} />
        </mesh>
        {/* Energy sparkles along blade */}
        <Sparkles count={20} size={1.5} position={[0, 1, 0]} scale={[0.1, 2.8, 0.1]} color="#00ffcc" speed={0.5} />
        <pointLight ref={glow} color="#00ffcc" intensity={2} distance={4} />
      </group>
    </Float>
  );
}

// ─── Energy Core ────────────────────────────────────────────────
function EnergyCore({ battery }: { battery: number }) {
  const core = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (mat.current) mat.current.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.3 * (battery / 100);
    if (ring1.current) ring1.current.rotation.z = t * 0.7;
    if (ring2.current) ring2.current.rotation.x = t * 0.5;
    if (ring3.current) ring3.current.rotation.y = t * 0.9;
  });

  const coreColor = battery > 40 ? "#0055ff" : battery > 20 ? "#ffaa00" : "#ff2200";

  return (
    <group position={[3.5, 0, -1]}>
      <mesh ref={core}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial ref={mat} color={coreColor} emissive={coreColor} emissiveIntensity={0.8} transparent opacity={0.92} />
      </mesh>
      <mesh ref={ring1}>
        <torusGeometry args={[0.75, 0.018, 8, 80]} />
        <meshStandardMaterial color="#0088ff" emissive="#0088ff" emissiveIntensity={1.2} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.95, 0.012, 8, 80]} />
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.9} />
      </mesh>
      <mesh ref={ring3} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[1.15, 0.008, 8, 80]} />
        <meshStandardMaterial color="#0066ff" emissive="#0066ff" emissiveIntensity={0.7} />
      </mesh>
      <Sparkles count={30} size={2} scale={[2.5, 2.5, 2.5]} color={coreColor} speed={0.3} />
      <pointLight color={coreColor} intensity={3} distance={6} />
    </group>
  );
}

// ─── Radar Sphere ───────────────────────────────────────────────
function RadarSphere() {
  const sweep = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sweep.current) sweep.current.rotation.y = state.clock.elapsedTime * 1.4;
  });

  const BLIPS = [
    { pos: [0.55, 0.3, 0.7] as [number, number, number], color: "#00ff88" },
    { pos: [-0.6, 0.15, 0.45] as [number, number, number], color: "#ffcc00" },
    { pos: [0.2, -0.5, -0.65] as [number, number, number], color: "#ff4444" },
    { pos: [-0.3, 0.7, 0.2] as [number, number, number], color: "#00ffcc" },
  ];

  return (
    <group position={[-3.5, 0, -1]}>
      <mesh>
        <sphereGeometry args={[1.1, 18, 18]} />
        <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.12} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.1, 0.006, 8, 80]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.1, 0.006, 8, 80]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.2} />
      </mesh>
      {/* Sweep plane */}
      <mesh ref={sweep}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
      {/* Sweep line */}
      <mesh ref={sweep} position={[0.55, 0, 0]}>
        <boxGeometry args={[1.1, 0.005, 0.01]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.5} />
      </mesh>
      {BLIPS.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={3} />
        </mesh>
      ))}
      <pointLight color="#00ffcc" intensity={0.5} distance={3} />
    </group>
  );
}

// ─── Mission Nodes ───────────────────────────────────────────────
const NODES: { pos: [number, number, number]; label: string; color: string }[] = [
  { pos: [3, 0.8, -4], label: "ALPHA", color: "#00ffcc" },
  { pos: [-2.5, 0.3, -3.5], label: "BETA", color: "#ffcc00" },
  { pos: [1.5, -0.4, 4], label: "GAMMA", color: "#ff6600" },
  { pos: [-1, 1.2, 3.5], label: "DELTA", color: "#00aaff" },
];

function MissionNodes() {
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    pulseRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + i * 1.2) * 0.15;
        mesh.scale.setScalar(scale);
      }
    });
  });

  const edges: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]];

  return (
    <group>
      {edges.map(([a, b], i) => (
        <Line key={i}
          points={[NODES[a].pos, NODES[b].pos]}
          color="#00ffcc"
          transparent
          opacity={0.2}
          lineWidth={1}
        />
      ))}
      {NODES.map((node, i) => (
        <group key={i} position={node.pos}>
          <mesh ref={(el) => { pulseRefs.current[i] = el; }}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={2.5} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color={node.color} transparent opacity={0.07} />
          </mesh>
          <Text position={[0, 0.35, 0]} fontSize={0.18} color={node.color} anchorX="center" anchorY="bottom" font={undefined}>
            {node.label}
          </Text>
          <pointLight color={node.color} intensity={0.8} distance={2.5} />
        </group>
      ))}
    </group>
  );
}

// ─── Flight Path ─────────────────────────────────────────────────
function FlightPath() {
  const pathPoints: [number, number, number][] = [
    [0, 0, 0], [1, 0.3, -1.5], [2, 0.5, -2.8], [3, 0.8, -4],
  ];

  const progressRef = useRef(0);
  const trailMesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    progressRef.current = (Math.sin(state.clock.elapsedTime * 0.4) + 1) / 2;
    if (trailMesh.current) {
      const t = progressRef.current;
      trailMesh.current.position.set(t * 3, t * 0.8, t * -4);
    }
  });

  return (
    <group>
      <Line points={pathPoints} color="#00ffcc" lineWidth={2} transparent opacity={0.6} dashed dashSize={0.2} gapSize={0.1} />
      <mesh ref={trailMesh} position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={4} />
      </mesh>
      <Sparkles count={8} size={2} position={[1.5, 0.4, -2]} scale={[3, 0.5, 2]} color="#00ffcc" speed={0.5} />
    </group>
  );
}

// ─── Ground Grid ─────────────────────────────────────────────────
function GroundGrid() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
      <planeGeometry args={[40, 40, 40, 40]} />
      <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.06} />
    </mesh>
  );
}

// ─── Camera Controller ───────────────────────────────────────────
type CinematicTarget = "sword" | "core" | "radar" | "path";

const CINEMA_POSITIONS: Record<CinematicTarget, THREE.Vector3> = {
  sword: new THREE.Vector3(0, 1.5, 5),
  core: new THREE.Vector3(3.5, 1, 4),
  radar: new THREE.Vector3(-3.5, 1, 4),
  path: new THREE.Vector3(2, 2.5, 6),
};

function CameraController({ cinematic, target }: { cinematic: boolean; target: CinematicTarget }) {
  useFrame(({ camera }) => {
    if (!cinematic) return;
    const dest = CINEMA_POSITIONS[target];
    camera.position.lerp(dest, 0.018);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Main Page ───────────────────────────────────────────────────
export default function SpatialCommand() {
  const flightData = useFlightSimulation();
  const [cinematic, setCinematic] = useState(false);
  const [cinematicTarget, setCinematicTarget] = useState<CinematicTarget>("sword");

  const TARGETS: { id: CinematicTarget; label: string; icon: React.ReactNode }[] = [
    { id: "sword", label: "Flying Sword", icon: <GitBranch className="w-3 h-3" /> },
    { id: "core", label: "Energy Core", icon: <Zap className="w-3 h-3" /> },
    { id: "radar", label: "Radar Sphere", icon: <Radio className="w-3 h-3" /> },
    { id: "path", label: "Mission Path", icon: <Target className="w-3 h-3" /> },
  ];

  return (
    <div className="h-full w-full relative bg-[#000508]">
      {/* 3D Canvas */}
      <WebGLErrorBoundary>
      <Canvas camera={{ position: [0, 2, 8], fov: 65 }} shadows>
        <CameraController cinematic={cinematic} target={cinematicTarget} />
        <color attach="background" args={["#000508"]} />
        <fog attach="fog" args={["#000508", 20, 60]} />
        <ambientLight intensity={0.08} />
        <pointLight position={[0, 10, 0]} intensity={0.2} color="#00ffcc" />
        <Stars radius={80} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

        <Suspense fallback={null}>
          <FlyingSword flightData={flightData} />
          <EnergyCore battery={flightData.battery} />
          <RadarSphere />
          <MissionNodes />
          <FlightPath />
          <GroundGrid />
        </Suspense>

        <OrbitControls
          enabled={!cinematic}
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={25}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
      </WebGLErrorBoundary>

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Corner labels */}
        <div className="absolute top-4 left-4 font-mono text-[9px] text-primary/40 uppercase tracking-[0.3em]">
          <div>飛劍 OS · Spatial Command Center</div>
          <div className="text-primary/20 mt-0.5">React Three Fiber · Three.js v0.184</div>
        </div>

        {/* Flight data mini-panel */}
        <div className="absolute top-4 right-4 space-y-1">
          {[
            { label: "ALT", value: `${flightData.altitude.toFixed(0)} m` },
            { label: "SPD", value: `${flightData.speed.toFixed(0)} km/h` },
            { label: "HDG", value: `${flightData.heading.toFixed(0)}°` },
            { label: "BAT", value: `${flightData.battery.toFixed(0)}%` },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 border border-primary/15 bg-background/50 px-2.5 py-1 backdrop-blur-sm">
              <span className="font-mono text-[8px] text-muted-foreground/50 uppercase w-6">{item.label}</span>
              <span className="font-mono text-[10px] text-primary font-bold">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Scene labels */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-6">
          {[
            { label: "Flying Sword", x: -42 },
            { label: "Energy Core", x: 0 },
            { label: "Radar Sphere", x: 0 },
          ].map((item, i) => (
            <div key={i} className="font-mono text-[8px] text-primary/30 uppercase tracking-widest text-center">
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Cinematic Controls — pointer-events enabled */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <AnimatePresence>
          {cinematic && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="flex gap-2">
              {TARGETS.map((t) => (
                <button key={t.id} onClick={() => setCinematicTarget(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-[9px] uppercase tracking-widest transition-all ${
                    cinematicTarget === t.id
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-primary/20 text-muted-foreground/50 hover:border-primary/40 hover:text-primary"
                  }`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCinematic((c) => !c)}
          className={`flex items-center gap-2 px-5 py-2.5 border font-mono text-[10px] uppercase tracking-widest transition-all ${
            cinematic
              ? "border-primary bg-primary/20 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              : "border-primary/40 text-primary/60 hover:border-primary hover:text-primary"
          }`}
        >
          <Eye className="w-4 h-4" />
          {cinematic ? "EXIT CINEMATIC" : "ENTER CINEMATIC MODE"}
        </button>
      </div>
    </div>
  );
}
