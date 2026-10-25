'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentCircadianInfo, CircadianInfo } from '@/lib/circadian';
import { ShieldAlert, Mic, Flame, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/lib/feedback';

interface DynamicIslandHUDProps {
  streak: number;
  netWillpowerScore?: number;
  onOpenUrgeDefuser: () => void;
  onTriggerVoiceDebrief?: () => void;
  isListening?: boolean;
}

export default function DynamicIslandHUD({
  streak,
  netWillpowerScore = 0,
  onOpenUrgeDefuser,
  onTriggerVoiceDebrief,
  isListening = false,
}: DynamicIslandHUDProps) {
  const [circadian, setCircadian] = useState<CircadianInfo | null>(null);

  useEffect(() => {
    setCircadian(getCurrentCircadianInfo());
    const interval = setInterval(() => {
      setCircadian(getCurrentCircadianInfo());
    }, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex justify-center py-2 px-3 sticky top-11 z-30 pointer-events-none">
      <div className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2 bg-substrate-card/90 backdrop-blur-xl border border-substrate-border text-slate-200 shadow-2xl max-w-2xl w-full">
        {/* Left: Circadian Solar Phase */}
        <div className="flex items-center space-x-2">
          <span className="text-base select-none">{circadian?.icon || '☀️'}</span>
          <div className="flex flex-col">
            <span className="font-mono text-[9px] uppercase tracking-widest text-gold font-bold">
              {circadian?.label || 'Cosmic Orbit'}
            </span>
            <span className="font-mono text-[8px] text-slate-400">
              Next: {circadian?.nextMilestone} ({circadian?.countdownMinutes}m)
            </span>
          </div>
        </div>

        {/* Center: Willpower & Streak Metrics */}
        <div className="hidden sm:flex items-center space-x-4 border-x border-white/10 px-4">
          <div className="flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[10px] text-slate-300 font-bold tracking-wider">
              {streak}D ORBIT
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="font-mono text-[10px] text-gold-bright font-bold tracking-wider">
              {netWillpowerScore > 0 ? `+${netWillpowerScore}` : netWillpowerScore} WP
            </span>
          </div>
        </div>

        {/* Right: Quick Action Triggers */}
        <div className="flex items-center space-x-2">
          {/* Voice Debrief Trigger */}
          {onTriggerVoiceDebrief && (
            <button
              onClick={() => {
                triggerHaptic(20);
                onTriggerVoiceDebrief();
              }}
              className={`p-1.5 border transition-all flex items-center space-x-1 text-[10px] font-mono tracking-wider uppercase ${
                isListening
                  ? 'border-red-500 bg-red-950/40 text-red-300 animate-pulse'
                  : 'border-substrate-border hover:border-gold/50 bg-substrate-bg/80 text-slate-300'
              }`}
              title="Voice Stream Debrief"
            >
              <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-red-400' : 'text-gold'}`} />
              <span className="hidden md:inline">{isListening ? 'LISTENING...' : 'VOICE'}</span>
            </button>
          )}

          {/* Emergency SOS Defuse Urge Button */}
          <button
            onClick={() => {
              triggerHaptic(30);
              onOpenUrgeDefuser();
            }}
            className="py-1 px-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 font-mono text-[10px] uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)]"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>SOS DEFUSE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
