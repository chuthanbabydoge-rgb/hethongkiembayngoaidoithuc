import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line, Sphere } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

interface MissionWaypoint {
  id: string;
  label: string;
  position: [number, number, number];
  type: "start" | "waypoint" | "target" | "destination";
  altitude: number;
  completed: boolean;
}

const MISSION_WAYPOINTS: MissionWaypoint[] = [
  { id: "start", label: "BASE", position: [-3, -0.5, -3], type: "start", altitude: 150, completed: true },
  { id: "wp1", label: "ALPHA", position: [-1.5, 0.5, -2], type: "waypoint", altitude: 800, completed: true },
  { id: "wp2", label: "BETA", position: [0, 1, -0.5], type: "waypoint", altitude: 1200, completed: false },
  { id: "wp3", label: "GAMMA", position: [1.5, 1.5, 0.5], type: "waypoint", altitude: 2000, completed: false },
  { id: "tgt", label: "TANGO", position: [2.5, 2, 2], type: "target", altitude: 2500, completed: false },
  { id: "end", label: "SUMMIT", position: [3, 2.5, 3], type: "destination", altitude: 3200, completed: false },
];

function FlightArrow({ from, to, color = "#06b6d4", completed = false }: {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
  completed?: boolean;
}) {
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2 + 0.3,
    (from[2] + to[2]) / 2,
  ];

  const points: [number, number, number][] = [from, mid, to];

  return (
    <Line
      points={points}
      color={completed ? "#22c55e" : color}
      lineWidth={completed ? 1.5 : 2}
      dashed={!completed}
      dashSize={0.1}
      gapSize={0.05}
      transparent
      opacity={completed ? 0.6 : 0.9}
    />
  );
}

function WaypointMarker({ wp }: { wp: MissionWaypoint }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    t.current += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8;
      meshRef.current.position.y = wp.position[1] + Math.sin(t.current * 1.5) * 0.04;
    }
  });

  const colorMap = {
    start: "#22c55e",
    waypoint: "#06b6d4",
    target: "#ef4444",
    destination: "#f59e0b",
  };
  const color = colorMap[wp.type];
  const sizeMap = { start: 0.08, waypoint: 0.07, target: 0.1, destination: 0.12 };
  const size = sizeMap[wp.type];

  return (
    <group position={wp.position}>
      {/* Diamond marker */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[size, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={wp.completed ? 0.3 : 1.5}
          transparent
          opacity={wp.completed ? 0.5 : 1}
          wireframe={wp.type === "target"}
        />
      </mesh>

      {/* Pulse ring for active */}
      {!wp.completed && wp.type !== "start" && (
        <PulseRing color={color} size={size} />
      )}

      {/* Label */}
      <Text
        position={[0, size + 0.1, 0]}
        fontSize={0.08}
        color={color}
        anchorX="center"
        anchorY="bottom"
        font={undefined}
      >
        {wp.label}
      </Text>
      <Text
        position={[0, size + 0.02, 0]}
        fontSize={0.05}
        color={color}
        anchorX="center"
        anchorY="top"
        font={undefined}
      >
        {wp.altitude}m
      </Text>

      {/* Vertical drop line */}
      <Line
        points={[[0, 0, 0], [0, -wp.position[1] - 0.5, 0]]}
        color={color}
        lineWidth={0.5}
        transparent
        opacity={0.15}
      />
    </group>
  );
}

function PulseRing({ color, size }: { color: string; size: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    if (ref.current) {
      const s = 1 + Math.sin(t.current * 2) * 0.3;
      ref.current.scale.setScalar(s);
      (ref.current.material as THREE.MeshStandardMaterial).opacity = 0.3 - Math.sin(t.current * 2) * 0.25;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[size * 1.2, size * 1.6, 16]} />
      <meshStandardMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

function AircraftIcon() {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  const progress = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    progress.current = (progress.current + delta * 0.05) % 1;
    if (ref.current) {
      const curve = new THREE.CatmullRomCurve3(
        MISSION_WAYPOINTS.map((wp) => new THREE.Vector3(...wp.position))
      );
      const pt = curve.getPoint(Math.min(progress.current * 2, 0.35));
      ref.current.position.copy(pt);
      ref.current.rotation.y = t.current * 0.5;
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <coneGeometry args={[0.04, 0.15, 6]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} />
      </mesh>
      <pointLight intensity={0.5} distance={0.5} color="#06b6d4" />
    </group>
  );
}

function TerrainMesh() {
  return (
    <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10, 20, 20]} />
      <meshStandardMaterial color="#0a1a0a" wireframe transparent opacity={0.3} />
    </mesh>
  );
}

export function MissionVisualization3D() {
  const routePoints = MISSION_WAYPOINTS.map((wp) => new THREE.Vector3(...wp.position));

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[8px] text-primary/40 uppercase tracking-widest">3D Mission Route</div>
        <div className="flex items-center gap-2">
          {(["start", "waypoint", "target", "destination"] as const).map((type) => {
            const colorMap = { start: "bg-green-500", waypoint: "bg-cyan-500", target: "bg-red-500", destination: "bg-yellow-500" };
            return (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 ${colorMap[type]}`} />
                <span className="font-mono text-[7px] text-muted-foreground/40 uppercase">{type}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 border border-primary/20 bg-black/60 relative" style={{ minHeight: 300 }}>
        <Canvas camera={{ position: [4, 4, 6], fov: 45 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 5, 0]} intensity={0.5} color="#06b6d4" />
          <pointLight position={[3, 3, 3]} intensity={0.3} color="#f59e0b" />

          <TerrainMesh />

          {/* Route line */}
          <Line
            points={MISSION_WAYPOINTS.map((wp) => wp.position as [number, number, number])}
            color="#06b6d4"
            lineWidth={1}
            transparent
            opacity={0.2}
          />

          {/* Arrows between waypoints */}
          {MISSION_WAYPOINTS.slice(0, -1).map((wp, i) => (
            <FlightArrow
              key={wp.id}
              from={wp.position as [number, number, number]}
              to={MISSION_WAYPOINTS[i + 1].position as [number, number, number]}
              completed={wp.completed}
            />
          ))}

          {/* Waypoints */}
          {MISSION_WAYPOINTS.map((wp) => (
            <WaypointMarker key={wp.id} wp={wp} />
          ))}

          {/* Aircraft */}
          <AircraftIcon />

          <OrbitControls enablePan={false} minDistance={3} maxDistance={12} autoRotate autoRotateSpeed={0.3} />
        </Canvas>

        <div className="absolute top-2 left-2 font-mono text-[8px] text-primary/50 uppercase tracking-widest border border-primary/20 px-2 py-1 bg-black/60">
          ◆ MISSION ALPHA-7 · 3D ROUTE
        </div>
      </div>

      {/* Waypoint list */}
      <div className="space-y-1">
        {MISSION_WAYPOINTS.map((wp, i) => (
          <div key={wp.id} className={`flex items-center gap-3 px-2 py-1.5 border ${wp.completed ? "border-green-500/20 bg-green-500/5" : "border-primary/10"}`}>
            <span className="font-mono text-[9px] text-muted-foreground/30 w-3">{i + 1}</span>
            <div className={`w-1.5 h-1.5 ${wp.completed ? "bg-green-400" : "bg-primary"}`} />
            <span className="font-mono text-[9px] text-primary/70 font-bold w-14">{wp.label}</span>
            <span className="font-mono text-[8px] text-muted-foreground/30 flex-1 uppercase">{wp.type}</span>
            <span className="font-mono text-[8px] text-muted-foreground/40">{wp.altitude}m</span>
            <span className={`font-mono text-[7px] uppercase ${wp.completed ? "text-green-400" : "text-primary/40"}`}>
              {wp.completed ? "DONE" : "PENDING"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
