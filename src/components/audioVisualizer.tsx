import React, { useEffect, useRef } from "react";

export const AudioVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      drawSpotifyVisualizer(ctx, width, height);
      animationRef.current = requestAnimationFrame(draw);
    };

    const drawSpotifyVisualizer = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      const time = Date.now() / 1000;
      const barCount = 64;
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        const wave1 = Math.sin(time * 2 + i * 0.1) * 0.3;
        const wave2 = Math.sin(time * 3 - i * 0.15) * 0.2;
        const wave3 = Math.sin(time * 1.5 + i * 0.05) * 0.25;
        const normalizedHeight = (wave1 + wave2 + wave3 + 0.8) / 1.8;

        const barHeight = normalizedHeight * height * 0.8;
        const x = i * barWidth;
        const y = height - barHeight;

        const hue = (i / barCount) * 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="rounded-full max-w-[90vw]"
      />
      <h2 className="text-2xl font-semibold">
        Listen to the clip and guess the song!
      </h2>
    </div>
  );
};
