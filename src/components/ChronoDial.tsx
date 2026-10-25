'use client';

import React from 'react';
import { Mic, Sparkles, Lock } from 'lucide-react';
import { getCurrentCircadianInfo } from '@/lib/circadian';
import { triggerHaptic } from '@/lib/feedback';

interface ChronoDialProps {
  completionRate: number; // Float between 0 and 1
  isStamped: boolean;
  totalHabits: number;
  completedHabits: number;
  systemMessage?: string;
  onModify?: () => void;
  onVoiceDebrief?: () => void;
  isListening?: boolean;
}

export const ChronoDial: React.FC<ChronoDialProps> = ({
  completionRate,
  isStamped,
  totalHabits,
  completedHabits,
  systemMessage = "System memory synchronized. Execution loop complete.",
  onModify,
  onVoiceDebrief,
  isListening = false,
}) => {
  const size = 210;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = center - 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - completionRate * circumference;

  const circadian = getCurrentCircadianInfo();

  return (
    <div className="relative flex flex-col items-center justify-center my-6 select-none">
      {/* Ambient Radial Core Nebula Glow */}
      <div 
        className="absolute w-52 h-52 rounded-full pointer-events-none transition-all duration-1000"
        style={{
          background: isStamped 
            ? 'radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, rgba(6, 11, 36, 0) 70%)'
            : isListening
            ? 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(6, 11, 36, 0) 70%)'
            : 'radial-gradient(circle, rgba(38, 70, 160, 0.45) 0%, rgba(6, 11, 36, 0) 70%)',
          filter: 'blur(24px)',
        }}
      />

      <div className="relative w-[210px] h-[210px] flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="goldNebula" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F3E5AB" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#AA7C11" />
            </linearGradient>
            <linearGradient id="trackBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(140, 180, 255, 0.18)" />
              <stop offset="100%" stopColor="rgba(70, 100, 180, 0.08)" />
            </linearGradient>
          </defs>

          {/* 24 Outer Coordinate Astrolabe Ticks (representing 24 solar hours) */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const x1 = center + (radius + 8) * Math.cos(angle);
            const y1 = center + (radius + 8) * Math.sin(angle);
            const x2 = center + (radius + 15) * Math.cos(angle);
            const y2 = center + (radius + 15) * Math.sin(angle);

            // Is this tick before the current hour of the day?
            const currentHourTick = Math.floor(circadian.solarHourProgress * 24);
            const isCurrentSolarHour = i === currentHourTick;
            const isActiveHabit = i / 24 <= completionRate;

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isCurrentSolarHour ? '#F3E5AB' : isActiveHabit ? '#D4AF37' : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth={isCurrentSolarHour ? 2.5 : i % 6 === 0 ? 1.5 : 0.75}
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
              {/* Celestial Star Vector Seal */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gold mb-1">
                <circle cx="12" cy="12" r="9" stroke="#D4AF37" strokeWidth="1" strokeDasharray="2 2" />
                <path d="M12 2L12 22M2 12L22 12" stroke="#F3E5AB" strokeWidth="1" />
                <polygon points="12,6 15,12 12,18 9,12" fill="rgba(212, 175, 55, 0.45)" stroke="#D4AF37" strokeWidth="0.75" />
              </svg>
              <span className="font-mono text-[9px] tracking-[0.25em] text-gold uppercase font-bold">
                ORBIT LOCKED
              </span>
              <span className="font-mono text-[8px] text-slate-400 mt-0.5">
                {completedHabits}/{totalHabits} HARMONIZED
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="font-serif text-3xl font-light text-slate-100 tracking-tight">
                {Math.round(completionRate * 100)}%
              </span>
              <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase mt-0.5">
                {completedHabits}/{totalHabits} LOGGED
              </span>

              {/* One-Tap Voice Debrief Trigger */}
              {onVoiceDebrief && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(20);
                    onVoiceDebrief();
                  }}
                  className={`mt-2 p-1.5 rounded-full border transition-all ${
                    isListening
                      ? 'border-red-500 bg-red-950/60 text-red-300 animate-pulse'
                      : 'border-gold/30 hover:border-gold bg-gold/10 text-gold hover:scale-105'
                  }`}
                  title="Speak daily debrief"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Circadian Phase Readout */}
      <div className="mt-3 px-6 text-center max-w-sm">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-substrate-card border border-substrate-border mb-2">
          <span className="text-xs">{circadian.icon}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-gold">
            {circadian.label}
          </span>
        </div>

        <p className="font-serif italic text-xs tracking-wide text-slate-300 leading-relaxed">
          &ldquo;{systemMessage}&rdquo;
        </p>

        {isStamped && onModify && (
          <button
            onClick={() => {
              triggerHaptic(15);
              onModify();
            }}
            className="mt-3 text-[10px] font-mono tracking-widest text-slate-400 hover:text-gold uppercase transition-colors underline decoration-slate-600 underline-offset-4"
          >
            MODIFY LOCKED ORBIT
          </button>
        )}
      </div>
    </div>
  );
};

export default ChronoDial;
