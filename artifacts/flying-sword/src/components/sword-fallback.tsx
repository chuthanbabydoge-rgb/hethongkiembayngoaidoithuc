import { useRef, useEffect } from "react";

export function SwordFallback({ flightMode }: { flightMode: string }) {
  const swordRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let raf: number;

    const animate = () => {
      frame++;
      if (swordRef.current) {
        const t = frame * 0.01;
        const hover = Math.sin(t * 1.5) * 8;
        const tilt = flightMode !== "manual" ? Math.sin(t * 0.3) * 5 : 0;
        swordRef.current.style.transform = `translateY(${hover}px) rotateZ(${tilt}deg)`;
      }
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [flightMode]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div ref={swordRef} className="relative" style={{ transition: "transform 0.05s linear" }}>
        {/* Outer glow aura */}
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(ellipse, hsl(var(--primary)) 0%, transparent 70%)", width: "400px", height: "400px", top: "-120px", left: "-140px" }}
        />

        {/* Sword body */}
        <div className="relative flex flex-col items-center">
          {/* Tip */}
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderBottom: "40px solid hsl(var(--primary))",
              filter: "drop-shadow(0 0 12px hsl(var(--primary)))",
            }}
          />

          {/* Upper blade */}
          <div
            className="relative"
            style={{
              width: "16px",
              height: "200px",
              background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(185 100% 35%) 100%)",
              boxShadow: "0 0 20px hsl(var(--primary)), 0 0 60px hsl(var(--primary) / 0.3), inset 0 0 10px hsl(0 0% 100% / 0.3)",
            }}
          >
            {/* Blade edge highlights */}
            <div className="absolute inset-y-0 left-0 w-px" style={{ background: "linear-gradient(180deg, white, hsl(var(--primary)))" }} />
            <div className="absolute inset-y-0 right-0 w-px" style={{ background: "linear-gradient(180deg, white, hsl(var(--primary)))" }} />

            {/* Energy rings along blade */}
            {[30, 80, 140].map((top, i) => (
              <div
                key={i}
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top,
                  width: `${24 + i * 8}px`,
                  height: "2px",
                  background: "hsl(var(--primary))",
                  boxShadow: `0 0 ${8 + i * 4}px hsl(var(--primary))`,
                  opacity: 0.6 + i * 0.1,
                }}
              />
            ))}
          </div>

          {/* Guard / crossguard */}
          <div className="relative flex items-center justify-center">
            <div
              style={{
                width: "80px",
                height: "12px",
                background: "linear-gradient(90deg, transparent, hsl(var(--primary)), hsl(200 80% 60%), hsl(var(--primary)), transparent)",
                boxShadow: "0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary) / 0.4)",
                clipPath: "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
              }}
            />
          </div>

          {/* Grip */}
          <div
            style={{
              width: "12px",
              height: "60px",
              background: "repeating-linear-gradient(45deg, hsl(220 30% 20%), hsl(220 30% 20%) 4px, hsl(185 100% 20%) 4px, hsl(185 100% 20%) 8px)",
              boxShadow: "0 0 8px hsl(var(--primary) / 0.3)",
            }}
          />

          {/* Pommel */}
          <div
            className="rounded-full"
            style={{
              width: "20px",
              height: "20px",
              background: "radial-gradient(circle, hsl(185 100% 60%), hsl(var(--primary)))",
              boxShadow: "0 0 15px hsl(var(--primary)), 0 0 30px hsl(var(--primary) / 0.5)",
            }}
          />
        </div>

        {/* Particle dots */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * 360;
          const r = 80 + Math.sin(i) * 20;
          const x = Math.cos((angle * Math.PI) / 180) * r;
          const y = Math.sin((angle * Math.PI) / 180) * r;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: "3px",
                height: "3px",
                background: "hsl(var(--primary))",
                boxShadow: "0 0 6px hsl(var(--primary))",
                top: "50%",
                left: "50%",
                transform: `translate(${x - 1.5}px, ${y - 200}px)`,
                opacity: 0.4 + Math.random() * 0.4,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
