import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import * as THREE from "three";

interface RadarContact {
  id: string;
  angle: number;
  distance: number;
  altitude: number;
  type: "threat" | "waypoint" | "target" | "friendly";
  label: string;
  speed: number;
}

function useRadarContacts() {
  const [contacts, setContacts] = useState<RadarContact[]>([
    { id: "wp1", angle: 35, distance: 0.4, altitude: 1200, type: "waypoint", label: "WP-ALPHA", speed: 0 },
    { id: "wp2", angle: 120, distance: 0.7, altitude: 800, type: "waypoint", label: "WP-BETA", speed: 0 },
    { id: "t1", angle: 220, distance: 0.3, altitude: 2000, type: "threat", label: "BANDIT-1", speed: 280 },
    { id: "t2", angle: 310, distance: 0.6, altitude: 1500, type: "target", label: "TANGO-1", speed: 120 },
    { id: "f1", angle: 70, distance: 0.5, altitude: 1100, type: "friendly", label: "WINGMAN", speed: 145 },
  ]);

  useEffect(() => {
    const t = setInterval(() => {
      setContacts((cs) =>
        cs.map((c) => ({
          ...c,
          angle: (c.angle + (c.type === "threat" ? 0.8 : c.type === "friendly" ? 0.4 : 0.1) + 360) % 360,
          distance: c.type === "threat"
            ? Math.max(0.1, Math.min(0.9, c.distance + (Math.random() - 0.5) * 0.02))
            : c.distance,
          altitude: c.altitude + (Math.random() - 0.5) * 10,
        }))
      );
    }, 100);
    return () => clearInterval(t);
  }, []);

  return contacts;
}

function RadarBlip({ contact, sweep }: { contact: RadarContact; sweep: number }) {
  const rad = (contact.angle - 90) * Math.PI / 180;
  const r = contact.distance * 4;
  const x = r * Math.cos(rad);
  const z = r * Math.sin(rad);
  const y = contact.altitude / 1000;

  const colorMap = {
    threat: "#ef4444",
    waypoint: "#06b6d4",
    target: "#f59e0b",
    friendly: "#22c55e",
  };
  const color = colorMap[contact.type];

  const isLit = Math.abs(((contact.angle - sweep + 360) % 360)) < 30;

  return (
    <group position={[x, y, z]}>
      {/* Blip sphere */}
      <mesh>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isLit ? 2 : 0.5} transparent opacity={isLit ? 1 : 0.6} />
      </mesh>

      {/* Vertical line to ground plane */}
      <Line points={[[0, 0, 0], [0, -y, 0]]} color={color} lineWidth={0.5} transparent opacity={0.2} />

      {/* Ground dot */}
      <mesh position={[0, -y, 0]}>
        <circleGeometry args={[0.04, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* Label */}
      <Text position={[0, 0.12, 0]} fontSize={0.08} color={color} anchorX="center" anchorY="bottom" font={undefined}>
        {contact.label}
      </Text>
    </group>
  );
}

function RadarRings() {
  const rings = [1, 2, 3, 4];
  return (
    <>
      {rings.map((r) => (
        <mesh key={r} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.01, r, 64]} />
          <meshStandardMaterial color="#06b6d4" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Cross lines */}
      <Line points={[[-4, 0, 0], [4, 0, 0]]} color="#06b6d4" lineWidth={0.3} transparent opacity={0.1} />
      <Line points={[[0, 0, -4], [0, 0, 4]]} color="#06b6d4" lineWidth={0.3} transparent opacity={0.1} />
    </>
  );
}

function SweepArm({ angle }: { angle: number }) {
  const rad = (angle - 90) * Math.PI / 180;
  const endX = 4 * Math.cos(rad);
  const endZ = 4 * Math.sin(rad);

  return (
    <Line
      points={[[0, 0, 0], [endX, 0, endZ]]}
      color="#06b6d4"
      lineWidth={1}
      transparent
      opacity={0.6}
      vertexColors={[new THREE.Color("#00fff0"), new THREE.Color("#06b6d400")] as any}
    />
  );
}

export function ARRadar3D() {
  const contacts = useRadarContacts();
  const [sweep, setSweep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSweep((s) => (s + 2) % 360), 30);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 6, 6], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#06b6d4" />

        {/* Grid plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[10, 10, 20, 20]} />
          <meshStandardMaterial color="#06b6d4" transparent opacity={0.03} wireframe />
        </mesh>

        <RadarRings />
        <SweepArm angle={sweep} />

        {contacts.map((c) => (
          <RadarBlip key={c.id} contact={c} sweep={sweep} />
        ))}

        <OrbitControls enablePan={false} minDistance={4} maxDistance={12} />
      </Canvas>
    </div>
  );
}

export function ARRadarHUD() {
  const contacts = useRadarContacts();
  const [sweep, setSweep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const t = setInterval(() => setSweep((s) => (s + 3) % 360), 30);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const maxR = Math.min(cx, cy) - 8;

    ctx.clearRect(0, 0, W, H);

    // Rings
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * f, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Cross
    ctx.strokeStyle = "rgba(6, 182, 212, 0.1)";
    ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();

    // Sweep
    const sweepRad = ((sweep - 90) * Math.PI) / 180;
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxR, sweepRad - 0.5, sweepRad);
    ctx.closePath();
    ctx.fillStyle = "#06b6d4";
    ctx.fill();
    ctx.restore();

    // Sweep line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + maxR * Math.cos(sweepRad), cy + maxR * Math.sin(sweepRad));
    ctx.strokeStyle = "rgba(6,182,212,0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Contacts
    const colorMap: Record<string, string> = { threat: "#ef4444", waypoint: "#06b6d4", target: "#f59e0b", friendly: "#22c55e" };
    contacts.forEach((c) => {
      const rad = ((c.angle - 90) * Math.PI) / 180;
      const r = c.distance * maxR;
      const bx = cx + r * Math.cos(rad);
      const by = cy + r * Math.sin(rad);
      const color = colorMap[c.type];

      const isLit = Math.abs(((c.angle - sweep + 360) % 360)) < 30;
      ctx.beginPath();
      ctx.arc(bx, by, isLit ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = isLit ? 1 : 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;

      if (isLit) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = "7px monospace";
        ctx.fillStyle = color;
        ctx.fillText(c.label, bx + 6, by - 4);
      }
    });

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#06b6d4";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#06b6d4";
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [sweep, contacts]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[8px] text-primary/40 uppercase tracking-widest">AR Radar — Real Space</div>
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
          className="font-mono text-[8px] text-cyan-400 uppercase">● LIVE</motion.div>
      </div>
      <canvas ref={canvasRef} width={200} height={200} className="w-full aspect-square" />
      <div className="grid grid-cols-2 gap-1">
        {(["threat", "waypoint", "target", "friendly"] as const).map((type) => {
          const colorMap = { threat: "bg-red-500", waypoint: "bg-cyan-500", target: "bg-yellow-500", friendly: "bg-green-500" };
          const count = contacts.filter((c) => c.type === type).length;
          return (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${colorMap[type]}`} />
              <span className="font-mono text-[8px] text-muted-foreground/40 uppercase">{type}</span>
              <span className="font-mono text-[8px] text-muted-foreground/60 ml-auto">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
