import { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Environment, Float } from "@react-three/drei";
import { FlyingSword3D } from "@/components/flying-sword-3d";
import { CanvasErrorBoundary } from "@/components/canvas-error-boundary";
import { SwordFallback } from "@/components/sword-fallback";
import { useFlightSimulation } from "@/hooks/use-flight-simulation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

export default function Cockpit() {
  const flightData = useFlightSimulation();
  const [webGLSupported] = useState(() => hasWebGL());

  return (
    <div className="relative w-full h-full min-h-screen bg-background overflow-hidden flex flex-col">
      {/* 3D Viewport */}
      <div className="absolute inset-0 z-0">
        {webGLSupported ? (
          <CanvasErrorBoundary flightMode={flightData.flightMode}>
            <Suspense fallback={<SwordFallback flightMode={flightData.flightMode} />}>
              <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
                <color attach="background" args={["#05080f"]} />
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00e5ff" />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                  <FlyingSword3D flightMode={flightData.flightMode} speed={flightData.speed} />
                </Float>
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
                <Environment preset="night" />
              </Canvas>
            </Suspense>
          </CanvasErrorBoundary>
        ) : (
          <SwordFallback flightMode={flightData.flightMode} />
        )}
      </div>

      {/* AR HUD Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 grid grid-cols-3 grid-rows-3 gap-4">
        {/* Top Left: Flight Mode & Status */}
        <div className="col-start-1 row-start-1">
          <Card className="bg-background/40 backdrop-blur-md border-primary/30 rounded-none w-fit">
            <CardContent className="p-4 space-y-2">
              <div className="text-primary font-mono text-xs uppercase tracking-widest opacity-80">Trạng Thái Hệ Thống</div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)] animate-pulse" />
                <span className="font-mono text-xl text-primary font-bold uppercase">{flightData.flightMode}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Right: Telemetry Mini */}
        <div className="col-start-3 row-start-1 flex justify-end">
           <Card className="bg-background/40 backdrop-blur-md border-primary/30 rounded-none w-fit text-right">
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="text-primary/60 font-mono text-xs uppercase tracking-widest">Độ Cao</div>
                <div className="font-mono text-3xl text-primary font-bold">{flightData.altitude.toFixed(0)}<span className="text-sm opacity-50 ml-1">M</span></div>
              </div>
              <div>
                <div className="text-primary/60 font-mono text-xs uppercase tracking-widest">Tốc Độ</div>
                <div className="font-mono text-3xl text-primary font-bold">{flightData.speed.toFixed(1)}<span className="text-sm opacity-50 ml-1">KM/H</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Left: Motor Status */}
        <div className="col-start-1 row-start-3 self-end">
           <Card className="bg-background/40 backdrop-blur-md border-primary/30 rounded-none">
            <CardContent className="p-4">
              <div className="text-primary/60 font-mono text-xs uppercase tracking-widest mb-4">Công Suất Lõi</div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(flightData.motorStatus).map(([key, val]) => (
                  <div key={key}>
                    <div className="text-[10px] text-primary/80 uppercase font-mono mb-1">{key}</div>
                    <div className="h-1 w-full bg-muted overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_8px_theme(colors.primary.DEFAULT)] transition-all duration-100" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Right: Warnings & Battery */}
        <div className="col-start-3 row-start-3 self-end flex flex-col items-end gap-4">
          {flightData.warnings.length > 0 && (
             <Card className="bg-destructive/10 backdrop-blur-md border-destructive/50 rounded-none w-full max-w-sm">
              <CardContent className="p-4">
                <div className="text-destructive font-mono text-xs uppercase tracking-widest animate-pulse mb-2">Cảnh Báo</div>
                {flightData.warnings.map((w, i) => (
                  <div key={i} className="text-destructive font-mono text-sm border-l-2 border-destructive pl-2 mb-1">{w}</div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="bg-background/40 backdrop-blur-md border-primary/30 rounded-none w-64">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-primary/60 font-mono text-xs uppercase tracking-widest">Năng Lượng</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-xl text-primary font-bold">{flightData.battery.toFixed(1)}%</div>
                <div className="w-16 h-4 border border-primary/50 p-[1px]">
                  <div className="h-full bg-primary/80 shadow-[0_0_5px_theme(colors.primary.DEFAULT)]" style={{ width: `${flightData.battery}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Crosshair Center */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border border-primary/20 rounded-full relative animate-[spin_60s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-4 bg-primary/50"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-4 bg-primary/50"></div>
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-1 bg-primary/50"></div>
          <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-1 bg-primary/50"></div>
        </div>
        <div className="absolute w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)]"></div>
      </div>
    </div>
  );
}
