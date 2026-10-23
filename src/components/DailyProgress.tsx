'use client';

import React from 'react';

interface DailyProgressProps {
  isCompleted: boolean;
  completionPercentage: number;
  completedCount: number;
  totalCount: number;
  statusLine?: string;
  selectedDate: string;
  onModifyEntry?: () => void;
  isEditing?: boolean;
}

export default function DailyProgress({
  isCompleted,
  completionPercentage,
  completedCount,
  totalCount,
  statusLine,
  selectedDate,
  onModifyEntry,
  isEditing,
}: DailyProgressProps) {
  const clampedPercentage = Math.min(100, Math.max(0, Math.round(completionPercentage)));
  
  // 24 ticks for outer chrono dial perimeter
  const totalTicks = 24;
  const currentHour = typeof window !== 'undefined' ? new Date().getHours() : 12;
  const activeTicksCount = isCompleted ? 24 : Math.max(Math.round((clampedPercentage / 100) * 24), Math.min(currentHour, 24));

  // Inner track circumference (r = 54)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className="w-full bg-substrate-card backdrop-blur-md border border-substrate-border rounded-none p-5 sm:p-6 flex flex-col items-center justify-center corner-brackets relative">
      <div className="corner-bracket-tr" />
      <div className="corner-bracket-bl" />

      {/* Radial Chrono Dial Container */}
      <div className="relative w-[150px] h-[150px] flex items-center justify-center">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 160 160"
        >
          {/* Outer perimeter: 24 fine tick marks */}
          {Array.from({ length: totalTicks }).map((_, i) => {
            const angle = (i * 360) / totalTicks;
            const rad = (angle * Math.PI) / 180;
            const rIn = 70;
            const rOut = 76;
            const x1 = 80 + rIn * Math.cos(rad);
            const y1 = 80 + rIn * Math.sin(rad);
            const x2 = 80 + rOut * Math.cos(rad);
            const y2 = 80 + rOut * Math.sin(rad);

            const isTickActive = i <= activeTicksCount;

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isTickActive ? '#D4AF37' : 'rgba(255, 255, 255, 0.08)'}
                strokeWidth={isTickActive ? '1.5' : '1'}
                strokeOpacity={isTickActive ? '0.9' : '0.35'}
              />
            );
          })}

          {/* Inner circular background track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="rgba(212, 175, 55, 0.12)"
            strokeWidth="2"
          />

          {/* Inner circular progress stroke in stroke-gold */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="square"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Status Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 select-none">
          {!isCompleted || isEditing ? (
            <>
              <span className="font-serif text-2xl text-gold-bright font-bold tracking-tight">
                {clampedPercentage}%
              </span>
              <span className="font-mono text-[9px] text-slate-400 tracking-[0.2em] uppercase mt-0.5">
                {completedCount}/{totalCount} DONE
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1 animate-fade-in">
              {/* Minimalist stamped badge icon */}
              <svg
                className="w-7 h-7 text-gold"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                <circle cx="12" cy="12" r="3" stroke="#D4AF37" strokeWidth="1" />
              </svg>
              <span className="font-mono text-[9px] text-gold-bright tracking-widest uppercase">
                STAMPED
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Complete State Description & Existing Status Line */}
      {isCompleted && !isEditing && (
        <div className="mt-4 text-center max-w-sm space-y-3">
          <p className="font-serif italic text-sm text-slate-300 leading-relaxed">
            "{statusLine || 'All habits logged & stamped. Take a rest and enjoy real life!'}"
          </p>

          {onModifyEntry && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onModifyEntry}
                className="border border-substrate-border hover:border-substrate-borderActive bg-substrate-card text-xs font-mono tracking-wider py-1.5 px-4 rounded-none text-slate-300 hover:text-gold-bright transition-colors uppercase cursor-pointer"
              >
                Modify Entry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editing Mode Indicator */}
      {isEditing && (
        <div className="mt-3 text-center">
          <span className="font-mono text-[10px] text-slate-400 tracking-widest uppercase">
            {selectedDate} • Precision Log Active
          </span>
        </div>
      )}
    </div>
  );
}
