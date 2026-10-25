'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldAlert, Sparkles, Wind, Heart, RotateCcw } from 'lucide-react';
import { startUrgeDefuserDrone, stopUrgeDefuserDrone } from '@/lib/cosmicAudio';
import { triggerHaptic } from '@/lib/feedback';

interface UrgeDefuserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDefusedSuccess?: () => void;
}

type BreathPhase = 'inhale' | 'topoff' | 'exhale' | 'rest';

export default function UrgeDefuserModal({
  isOpen,
  onClose,
  onDefusedSuccess,
}: UrgeDefuserModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(90);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [cycleTime, setCycleTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Audio and interval control
  useEffect(() => {
    if (!isOpen) {
      stopUrgeDefuserDrone();
      setSecondsRemaining(90);
      setIsCompleted(false);
      return;
    }

    startUrgeDefuserDrone();
    triggerHaptic(50);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCompleted(true);
          stopUrgeDefuserDrone();
          triggerHaptic(100);
          onDefusedSuccess?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      stopUrgeDefuserDrone();
    };
  }, [isOpen]);

  // Physiological Sigh Cycle: 4s Inhale -> 1s Top-off Inhale -> 6s Exhale (11s total)
  useEffect(() => {
    if (!isOpen || isCompleted) return;

    const breathTimer = setInterval(() => {
      setCycleTime((prev) => {
        const nextTime = (prev + 1) % 11;
        if (nextTime < 4) {
          setBreathPhase('inhale');
        } else if (nextTime === 4) {
          setBreathPhase('topoff');
          triggerHaptic(20);
        } else {
          setBreathPhase('exhale');
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(breathTimer);
  }, [isOpen, isCompleted]);

  if (!isOpen) return null;

  const progressPercent = Math.round(((90 - secondsRemaining) / 90) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in select-none">
      {/* Ambient background pulsing aura */}
      <div
        className="absolute w-96 h-96 rounded-full pointer-events-none transition-all duration-1000"
        style={{
          background:
            breathPhase === 'inhale' || breathPhase === 'topoff'
              ? 'radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, rgba(2, 4, 10, 0) 70%)'
              : 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(2, 4, 10, 0) 70%)',
          transform: breathPhase === 'inhale' || breathPhase === 'topoff' ? 'scale(1.25)' : 'scale(0.85)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative w-full max-w-md bg-substrate-card/90 border border-gold/30 p-6 md:p-8 flex flex-col items-center text-center shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-gold transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Emergency Header Badge */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] tracking-widest uppercase mb-4">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Neurochemical Urge Defusal Engine</span>
        </div>

        <h2 className="font-serif text-2xl font-light text-slate-100 tracking-wide">
          {isCompleted ? 'Urge Neutralized' : 'Ride the Dopamine Wave'}
        </h2>
        <p className="font-sans text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
          {isCompleted
            ? 'The neurochemical craving spike has decayed. You have retained complete sovereign control.'
            : 'Dopamine spikes peak and dissolve within 90 seconds. Match the breath circle.'}
        </p>

        {/* Physiological Sigh Breath Circle */}
        <div className="relative w-48 h-48 my-8 flex items-center justify-center">
          {/* Outer Progress Track */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="86"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="86"
              stroke="#D4AF37"
              strokeWidth="3"
              fill="none"
              strokeDasharray={2 * Math.PI * 86}
              strokeDashoffset={2 * Math.PI * 86 - (progressPercent / 100) * 2 * Math.PI * 86}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Animated Breath Orb */}
          <div
            className={`w-32 h-32 rounded-full border border-gold/40 flex flex-col items-center justify-center transition-all duration-1000 ${
              breathPhase === 'inhale'
                ? 'scale-110 bg-gold/15 shadow-[0_0_30px_rgba(212,175,55,0.3)]'
                : breathPhase === 'topoff'
                ? 'scale-125 bg-amber-400/20 shadow-[0_0_40px_rgba(243,229,171,0.5)]'
                : 'scale-90 bg-sky-950/20 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
            }`}
          >
            {isCompleted ? (
              <Sparkles className="w-8 h-8 text-gold animate-bounce" />
            ) : (
              <>
                <span className="font-serif text-3xl font-light text-slate-100">
                  {secondsRemaining}s
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-gold mt-1">
                  {breathPhase === 'inhale' && 'Inhale Deep (Nose)'}
                  {breathPhase === 'topoff' && 'Top-Off Inhale (+)'}
                  {breathPhase === 'exhale' && 'Slow Exhale (Mouth)'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Breathing Protocol Guide */}
        <div className="w-full bg-slate-900/40 border border-slate-800 p-3 text-left space-y-1 mb-6">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Cycle Protocol:</span>
            <span className="text-gold">Physiological Sigh (Huberman)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Harmonic Resonator:</span>
            <span className="text-sky-300">432Hz Alpha Waves</span>
          </div>
        </div>

        {/* Action Button */}
        {isCompleted ? (
          <button
            onClick={onClose}
            className="w-full py-2.5 px-6 bg-gold hover:bg-gold-bright text-slate-950 font-mono text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center space-x-2"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Return Sovereign to Orbit</span>
          </button>
        ) : (
          <button
            onClick={() => setSecondsRemaining(0)}
            className="text-slate-500 hover:text-slate-300 font-mono text-[10px] tracking-wider uppercase transition-colors"
          >
            I feel stabilized (Skip to Finish)
          </button>
        )}
      </div>
    </div>
  );
}
