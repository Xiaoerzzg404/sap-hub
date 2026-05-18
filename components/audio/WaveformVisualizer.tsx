"use client";

import { useEffect, useRef } from "react";

export function WaveformVisualizer({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let raf = 0;

    const draw = () => {
      frame += 1;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#edf3f7";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const bars = 42;
      const width = canvas.width / bars;
      for (let i = 0; i < bars; i += 1) {
        const wave = active ? Math.sin((frame + i * 4) / 8) : Math.sin(i);
        const height = active ? 18 + Math.abs(wave) * 36 : 10 + Math.abs(wave) * 10;
        context.fillStyle = active ? "#0f6fbd" : "#9aa8b5";
        context.fillRect(i * width + 2, canvas.height / 2 - height / 2, width - 4, height);
      }
      raf = window.requestAnimationFrame(draw);
    };
    draw();
    return () => window.cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={canvasRef} className="h-20 w-full rounded-md border border-line" width={720} height={96} />;
}
