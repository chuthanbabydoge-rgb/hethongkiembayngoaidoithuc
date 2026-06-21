import { useState, useEffect } from "react";

export interface FlightData {
  altitude: number;
  speed: number;
  heading: number;
  battery: number;
  motorStatus: { left: number; right: number; front: number; rear: number };
  flightMode: "manual" | "assisted" | "autonomous";
  gpsSignal: number;
  warnings: string[];
}

export function useFlightSimulation() {
  const [data, setData] = useState<FlightData>({
    altitude: 1200,
    speed: 85,
    heading: 45,
    battery: 92,
    motorStatus: { left: 45, right: 45, front: 50, rear: 40 },
    flightMode: "autonomous",
    gpsSignal: 98,
    warnings: [],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        // Add some noise
        const altJitter = (Math.random() - 0.5) * 2;
        const speedJitter = (Math.random() - 0.5) * 1.5;
        const headingJitter = (Math.random() - 0.5) * 0.5;

        return {
          ...prev,
          altitude: Math.max(0, Math.min(5000, prev.altitude + altJitter)),
          speed: Math.max(0, Math.min(300, prev.speed + speedJitter)),
          heading: (prev.heading + headingJitter + 360) % 360,
          motorStatus: {
            left: Math.max(20, Math.min(100, prev.motorStatus.left + (Math.random() - 0.5) * 2)),
            right: Math.max(20, Math.min(100, prev.motorStatus.right + (Math.random() - 0.5) * 2)),
            front: Math.max(20, Math.min(100, prev.motorStatus.front + (Math.random() - 0.5) * 2)),
            rear: Math.max(20, Math.min(100, prev.motorStatus.rear + (Math.random() - 0.5) * 2)),
          },
        };
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return data;
}
