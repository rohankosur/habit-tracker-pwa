'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ConstellationNode {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  z: number;
  size: number;
  active: boolean;
  score?: number;
}

interface ConstellationCanvasProps {
  logs: Array<{ date: string; responses?: Record<string, any> }>;
  onSelectDate?: (date: string) => void;
}

export default function ConstellationCanvas({ logs, onSelectDate }: ConstellationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);

  // Rotation angles for 3D orbital perspective
  const rotationRef = useRef({ rotX: 0.2, rotY: 0.1 });
  const isDraggingRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = 360);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 360;
    };

    window.addEventListener('resize', handleResize);

    // Build star nodes from logs (last 28-30 days)
    const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-28);
    const nodes: ConstellationNode[] = [];

    const total = Math.max(sortedLogs.length, 14);
    for (let i = 0; i < total; i++) {
      const log = sortedLogs[i];
      // Golden Spiral / Helix coordinate distribution in 3D
      const theta = i * 0.45;
      const radius = 90 + (i / total) * 60;
      const x = radius * Math.cos(theta);
      const y = (i - total / 2) * 12;
      const z = radius * Math.sin(theta);

      const hasLog = Boolean(log);
      const completedCount = log?.responses ? Object.values(log.responses).filter(Boolean).length : 0;

      nodes.push({
        id: log ? log.date : `day-${i}`,
        label: log ? log.date : `Pending Orbit`,
        sublabel: log ? `${completedCount} Habits Synchronized` : 'Uncharted Orbit',
        x,
        y,
        z,
        size: hasLog ? 4.5 : 2.5,
        active: hasLog,
        score: completedCount,
      });
    }

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Auto slow celestial drift when not dragging
      if (!isDraggingRef.current) {
        rotationRef.current.rotY += 0.003;
      }

      const cosX = Math.cos(rotationRef.current.rotX);
      const sinX = Math.sin(rotationRef.current.rotX);
      const cosY = Math.cos(rotationRef.current.rotY);
      const sinY = Math.sin(rotationRef.current.rotY);

      // 3D Projection coordinates array
      const projectedNodes: Array<ConstellationNode & { px: number; py: number; pz: number; scale: number }> = [];

      nodes.forEach((node) => {
        // Rotate Y
        const x1 = node.x * cosY + node.z * sinY;
        const z1 = -node.x * sinY + node.z * cosY;

        // Rotate X
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;

        // Perspective scale
        const fov = 350;
        const scale = fov / (fov + z2);
        const px = centerX + x1 * scale;
        const py = centerY + y2 * scale;

        projectedNodes.push({
          ...node,
          px,
          py,
          pz: z2,
          scale,
        });
      });

      // Sort by depth (painters algorithm)
      projectedNodes.sort((a, b) => b.pz - a.pz);

      // 1. Draw glowing constellation filaments between consecutive active stars
      ctx.lineWidth = 1.2;
      for (let i = 0; i < projectedNodes.length - 1; i++) {
        const curr = projectedNodes[i];
        const next = projectedNodes[i + 1];

        const isBothActive = curr.active && next.active;
        ctx.beginPath();
        ctx.moveTo(curr.px, curr.py);
        ctx.lineTo(next.px, next.py);

        if (isBothActive) {
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#D4AF37';
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // 2. Draw star nodes
      projectedNodes.forEach((node) => {
        const r = node.size * node.scale;

        ctx.beginPath();
        ctx.arc(node.px, node.py, r, 0, Math.PI * 2);

        if (node.active) {
          ctx.fillStyle = '#F3E5AB';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#D4AF37';
        } else {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.shadowBlur = 0;
        }
        ctx.fill();

        // Starlight cross flare on active milestones
        if (node.active && (node.score || 0) >= 3) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(243, 229, 171, 0.5)';
          ctx.lineWidth = 0.75;
          ctx.moveTo(node.px - r * 2.2, node.py);
          ctx.lineTo(node.px + r * 2.2, node.py);
          ctx.moveTo(node.px, node.py - r * 2.2);
          ctx.lineTo(node.px, node.py + r * 2.2);
          ctx.stroke();
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    // Mouse / Touch handlers for 3D rotation
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      rotationRef.current.rotY += dx * 0.008;
      rotationRef.current.rotX += dy * 0.008;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animationId);
    };
  }, [logs]);

  return (
    <div className="relative w-full overflow-hidden bg-substrate-card/80 border border-substrate-border p-4 my-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between pb-2 border-b border-substrate-border mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-gold font-serif text-xs uppercase tracking-widest">
            Celestial Astrolabe Constellation
          </span>
          <span className="font-mono text-[9px] text-slate-400">
            ({logs.length} Stars Ignited)
          </span>
        </div>
        <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest hidden sm:inline">
          Drag to Rotate Orbit ✦
        </span>
      </div>

      <canvas ref={canvasRef} className="cursor-grab active:cursor-grabbing w-full block" />

      {/* Footer Info */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-gold inline-block" />
            <span>Locked Orbit</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
            <span>Uncharted</span>
          </div>
        </div>
        <span className="text-slate-400">Continuous streaks forge golden starlight filaments</span>
      </div>
    </div>
  );
}
