'use client';

import React from 'react';

interface ChronoDialProps {
  completionRate: number; // Float between 0 and 1
  isStamped: boolean;
  totalHabits: number;
  completedHabits: number;
  systemMessage?: string;
  onModify?: () => void;
}

export const ChronoDial: React.FC<ChronoDialProps> = ({
  completionRate,
  isStamped,
  totalHabits,
  completedHabits,
  systemMessage = "System memory synchronized. Execution loop complete.",
  onModify,
}) => {
  const size = 200;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = center - 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - completionRate * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center my-6 select-none">
      {/* Ambient Radial Core Glow */}
      <div 
        className="absolute w-44 h-44 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(38, 70, 160, 0.4) 0%, rgba(6, 11, 36, 0) 70%)',
          filter: 'blur(20px)',
        }}
      />

      <div className="relative w-[200px] h-[200px] flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="goldNebula" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F3E5AB" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#AA7C11" />
            </linearGradient>
            <linearGradient id="trackBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(140, 180, 255, 0.15)" />
              <stop offset="100%" stopColor="rgba(70, 100, 180, 0.08)" />
            </linearGradient>
          </defs>

          {/* Outer Coordinate Ticks */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const x1 = center + (radius + 8) * Math.cos(angle);
            const y1 = center + (radius + 8) * Math.sin(angle);
            const x2 = center + (radius + 14) * Math.cos(angle);
            const y2 = center + (radius + 14) * Math.sin(angle);
            const isActive = i / 24 <= completionRate;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isActive ? '#D4AF37' : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth={i % 6 === 0 ? 1.5 : 0.75}
              />
            );
          })}

          {/* Background Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#trackBlue)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Active Radial Progress Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#goldNebula)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Central Glyph & Metric Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          {isStamped ? (
            <div className="flex flex-col items-center animate-fade-in">
              {/* Astrolabe / Star Vector Seal */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gold mb-1">
                <circle cx="12" cy="12" r="9" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2 2" />
                <path d="M12 2L12 22M2 12L22 12" stroke="#F3E5AB" strokeWidth="1" />
                <polygon points="12,7 15,12 12,17 9,12" fill="rgba(212, 175, 55, 0.4)" stroke="#D4AF37" strokeWidth="0.75" />
              </svg>
              <span className="font-mono text-[9px] tracking-[0.25em] text-gold uppercase">LOCKED</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="font-serif text-3xl font-light text-slate-100 tracking-tight">
                {Math.round(completionRate * 100)}%
              </span>
              <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase mt-0.5">
                {completedHabits}/{totalHabits} LOGGED
              </span>
            </div>
          )}
        </div>
      </div>

      {/* System Status Readout */}
      <div className="mt-4 px-6 text-center max-w-sm">
        <p className="font-serif italic text-xs tracking-wide text-slate-300 leading-relaxed">
          &ldquo;{systemMessage}&rdquo;
        </p>
        
        {isStamped && onModify && (
          <button
            onClick={onModify}
            className="mt-3 px-3 py-1 bg-cosmos-card border border-cosmos-border hover:border-gold/40 text-[10px] font-mono tracking-widest text-slate-300 transition-colors uppercase cursor-pointer"
          >
            Modify Entry
          </button>
        )}
      </div>
    </div>
  );
};

export default ChronoDial;
