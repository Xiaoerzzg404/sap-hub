"use client";

import { useEffect, useRef } from "react";

export function WaveformVisualizer({
  active,
  analyser
}: {
  active: boolean;
  analyser?: AnalyserNode | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let raf = 0;
    const bars = 64;
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#edf3f7";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width / bars;
      if (active && analyser && dataArray) {
        analyser.getByteTimeDomainData(dataArray);
        for (let i = 0; i < bars; i += 1) {
          const idx = Math.floor((i / bars) * dataArray.length);
          const value = dataArray[idx] / 128 - 1;
          const height = Math.abs(value) * canvas.height * 0.9 + 4;
          context.fillStyle = "#0f6fbd";
          context.fillRect(i * width + 2, canvas.height / 2 - height / 2, width - 4, height);
        }
      } else {
        for (let i = 0; i < bars; i += 1) {
          const height = 6;
          context.fillStyle = "#9aa8b5";
          context.fillRect(i * width + 2, canvas.height / 2 - height / 2, width - 4, height);
        }
      }
      raf = window.requestAnimationFrame(draw);
    };
    draw();
    return () => window.cancelAnimationFrame(raf);
  }, [active, analyser]);

  return <canvas ref={canvasRef} className="h-20 w-full rounded-md border border-line" width={720} height={96} />;
}
