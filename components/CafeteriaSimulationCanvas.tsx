'use client';

import { startTransition, useEffect, useRef } from 'react';
import {
  createSimulationState,
  DEFAULT_CONTROLS,
  drawSimulation,
  isGridScenario,
  type SimulationControls,
  type SimulationSnapshot,
  stepSimulation,
} from '@/lib/queueing-sim';

type CafeteriaSimulationCanvasProps = {
  controls: SimulationControls;
  running: boolean;
  resetKey: number;
  onSnapshotChange: (snapshot: SimulationSnapshot) => void;
};

export function CafeteriaSimulationCanvas({
  controls,
  running,
  resetKey,
  onSnapshotChange,
}: CafeteriaSimulationCanvasProps) {
  const gridMode = isGridScenario(controls.modelId);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef(controls);
  const simulationRef = useRef(createSimulationState(DEFAULT_CONTROLS));
  const snapshotRef = useRef<SimulationSnapshot>(simulationRef.current.latestSnapshot);
  const animationFrameRef = useRef<number | null>(null);
  const previousTimestampRef = useRef<number | null>(null);
  const lastUiSyncRef = useRef(0);

  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  useEffect(() => {
    simulationRef.current = createSimulationState(controls);
    snapshotRef.current = simulationRef.current.latestSnapshot;
    onSnapshotChange(snapshotRef.current);
    previousTimestampRef.current = null;
  }, [controls, onSnapshotChange, resetKey]);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = Math.max(gridMode ? 520 : 440, Math.round(width * (gridMode ? 0.68 : 0.6)));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSimulation(ctx, width, height, simulationRef.current, snapshotRef.current);
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [gridMode]);

  useEffect(() => {
    const renderFrame = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      if (previousTimestampRef.current == null) {
        previousTimestampRef.current = timestamp;
      }

      const deltaSeconds = (timestamp - previousTimestampRef.current) / 1000;
      previousTimestampRef.current = timestamp;

      if (running) {
        const nextSnapshot = stepSimulation(
          simulationRef.current,
          controlsRef.current,
          deltaSeconds * controlsRef.current.speed,
        );
        snapshotRef.current = nextSnapshot;

        if (timestamp - lastUiSyncRef.current > 140) {
          lastUiSyncRef.current = timestamp;
          startTransition(() => onSnapshotChange(nextSnapshot));
        }
      }

      drawSimulation(ctx, canvas.clientWidth, canvas.clientHeight, simulationRef.current, snapshotRef.current);
      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animationFrameRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onSnapshotChange, running]);

  return (
    <div
      ref={containerRef}
      style={{
        overflow: 'hidden',
        borderRadius: 28,
        border: gridMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid #decfbe',
        background: gridMode ? '#020617' : '#fffaf5',
        boxShadow: gridMode ? '0 24px 70px rgba(2,6,23,0.45)' : '0 24px 70px rgba(84,58,24,0.12)',
        minHeight: gridMode ? 580 : 520,
      }}
    >
      <canvas
        ref={canvasRef}
        width={1200}
        height={720}
        aria-label="범용 큐잉 시뮬레이션 캔버스"
        style={{ display: 'block', width: '100%', height: gridMode ? 580 : 520 }}
      />
    </div>
  );
}
