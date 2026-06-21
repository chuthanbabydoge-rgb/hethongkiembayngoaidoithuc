import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Group, Color } from "three";

interface FlyingSword3DProps {
  flightMode?: string;
  speed?: number;
}

export function FlyingSword3D({ flightMode = "autonomous", speed = 0 }: FlyingSword3DProps) {
  const groupRef = useRef<Group>(null);
  const bladeRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Hovering effect
    const t = state.clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.1;

    // Tilt based on speed/mode
    const targetRotX = speed > 50 ? Math.PI / 8 : 0;
    groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * delta * 2;
    
    // Slow rotation
    groupRef.current.rotation.y += delta * 0.2;
  });

  return (
    <group ref={groupRef}>
      {/* Blade */}
      <mesh ref={bladeRef} castShadow>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial 
          color="#00e5ff" 
          emissive="#00e5ff"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
          wireframe
        />
      </mesh>
      
      {/* Core Core */}
      <mesh>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial 
          color="#006080" 
          emissive="#00e5ff"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Energy Rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.02, 16, 100]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={1.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <torusGeometry args={[0.6, 0.01, 16, 100]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}
