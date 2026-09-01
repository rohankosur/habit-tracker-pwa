'use client';

import { useState, useRef } from 'react';
import { 
  X, Share2, Download, Check, Sparkles, Flame, Trophy, 
  ShieldCheck, Activity, Award, Copy
} from 'lucide-react';
import { triggerHaptic } from '@/lib/feedback';

interface ShareableCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    streak: number;
    level: number;
    levelTitle: string;
    totalXP: number;
    totalLogs: number;
    consistencyRate: number;
    goodHabitsCount: number;
    badHabitsAvoided: number;
    periodName?: string;
  };
}

export default function ShareableCardModal({ isOpen, onClose, stats }: ShareableCardModalProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'story' | 'square'>('story');
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const handleShare = async () => {
    triggerHaptic(20);
    const text = `🔥 My Reflect Life Stats: ${stats.streak}-Day Streak! Level ${stats.level} (${stats.levelTitle}) • ${stats.consistencyRate}% Consistency with ${stats.totalLogs} check-ins. Track habits with me on Reflect!`;
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Reflect Life Wrapped',
          text,
          url: window.location.origin,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    triggerHaptic(25);
    setDownloading(true);

    try {
      const card = cardRef.current;
      if (!card) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = 2; // High-res retina scale
      const width = format === 'story' ? 360 : 360;
      const height = format === 'story' ? 580 : 360;

      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.scale(scale, scale);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#040810');
      bgGrad.addColorStop(0.5, '#09090b');
      bgGrad.addColorStop(1, '#111827');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Border glow
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Header Text
      ctx.fillStyle = '#2dd4bf';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('REFLECT • LIFE WRAPPED', 25, 40);

      // Main Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px serif';
      ctx.fillText(`${stats.periodName || 'Monthly'} Habit Snapshot`, 25, 75);

      // Subtitle
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Level ${stats.level}: ${stats.levelTitle} • ${stats.totalXP} Total XP`, 25, 98);

      // Metric Boxes
      const drawMetricBox = (x: number, y: number, w: number, h: number, title: string, val: string, color: string) => {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px monospace';
        ctx.fillText(title.toUpperCase(), x + 10, y + 20);

        ctx.fillStyle = color;
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(val, x + 10, y + 48);
      };

      drawMetricBox(25, 120, 145, 65, 'Active Streak', `🔥 ${stats.streak} Days`, '#f59e0b');
      drawMetricBox(190, 120, 145, 65, 'Consistency', `⚡ ${stats.consistencyRate}%`, '#2dd4bf');
      drawMetricBox(25, 195, 145, 65, 'Total Logs', `📝 ${stats.totalLogs}`, '#38bdf8');
      drawMetricBox(190, 195, 145, 65, 'Bad Avoided', `🛡️ ${stats.badHabitsAvoided}`, '#10b981');

      if (format === 'story') {
        // Quote Box
        ctx.fillStyle = 'rgba(45, 212, 191, 0.08)';
        ctx.fillRect(25, 280, 310, 120);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.3)';
        ctx.strokeRect(25, 280, 310, 120);

        ctx.fillStyle = '#2dd4bf';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('CORE PHILOSOPHY', 40, 305);

        ctx.fillStyle = '#e5e7eb';
        ctx.font = 'italic 14px serif';
        ctx.fillText('"Every action you take is a vote for', 40, 335);
        ctx.fillText('the person you wish to become."', 40, 355);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px monospace';
        ctx.fillText('— Atomic Habits System', 40, 382);

        // Footer Branding
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px monospace';
        ctx.fillText('Track daily on Reflect • reflect.pwa', 25, 545);
      } else {
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px monospace';
        ctx.fillText('Reflect Habit Tracker • reflect.pwa', 25, 335);
      }

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `reflect-life-wrapped-${new Date().toISOString().split('T')[0]}.png`;
      a.click();
    } catch (err) {
      console.error('Error generating card image:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/80 animate-fade-in">
      <div className="craft-card w-full max-w-md p-5 space-y-4 border-2 border-teal-500/40 bg-zinc-950 relative shadow-2xl">
        
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="font-extrabold text-sm text-zinc-100 font-ios-serif">Share Life Wrapped Card</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector: 9:16 Story vs 1:1 Square */}
        <div className="flex items-center justify-center space-x-2 p-1 bg-zinc-900 rounded-xl border border-zinc-850 text-xs font-ios-mono">
          <button
            onClick={() => setFormat('story')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
              format === 'story' ? 'bg-zinc-800 text-teal-400 shadow' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            📱 9:16 Story (IG/TikTok)
          </button>
          <button
            onClick={() => setFormat('square')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
              format === 'square' ? 'bg-zinc-800 text-teal-400 shadow' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            🔲 1:1 Square (Feed/X)
          </button>
        </div>

        {/* Live Visual Card Preview */}
        <div 
          ref={cardRef}
          className={`mx-auto rounded-2xl p-5 border border-teal-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-100 space-y-4 shadow-xl transition-all ${
            format === 'story' ? 'h-[440px] flex flex-col justify-between' : 'h-[320px]'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-ios-mono text-teal-400 font-bold uppercase tracking-widest">
              <span>Reflect • Life Wrapped</span>
              <span>2026 Snapshot</span>
            </div>
            <h3 className="text-xl font-extrabold text-zinc-50 font-ios-serif">
              {stats.periodName || 'Monthly'} Habit Progress
            </h3>
            <p className="text-xs text-zinc-400 font-ios-sans">
              Level {stats.level}: <span className="text-teal-300 font-bold">{stats.levelTitle}</span> • {stats.totalXP} XP
            </p>
          </div>

          {/* Grid of Key Stats */}
          <div className="grid grid-cols-2 gap-2.5 font-ios-mono">
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-0.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Active Streak</span>
              <p className="text-lg font-black text-amber-400 font-ios-rounded">🔥 {stats.streak} Days</p>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-0.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Consistency</span>
              <p className="text-lg font-black text-teal-300 font-ios-rounded">⚡ {stats.consistencyRate}%</p>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-0.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Total Reflections</span>
              <p className="text-lg font-black text-sky-400 font-ios-rounded">📝 {stats.totalLogs}</p>
            </div>
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-0.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Bad Avoided</span>
              <p className="text-lg font-black text-emerald-400 font-ios-rounded">🛡️ {stats.badHabitsAvoided}</p>
            </div>
          </div>

          {/* Story Format Quote & Footer */}
          {format === 'story' && (
            <div className="p-3.5 rounded-xl border border-teal-500/20 bg-teal-500/5 space-y-1">
              <span className="text-[9px] font-ios-mono text-teal-400 uppercase font-bold">Core Philosophy</span>
              <p className="text-xs font-handwritten text-lg text-zinc-300 leading-snug">
                "Every action you take is a vote for the person you wish to become."
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] font-ios-mono text-zinc-500 pt-1 border-t border-zinc-850">
            <span>reflect.pwa</span>
            <span className="text-teal-400/80">#AtomicHabits</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2 font-ios-sans">
          <button
            onClick={handleShare}
            style={{ background: 'var(--accent-gradient)', color: '#09090b' }}
            className="flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-lg hover:opacity-95 transition-opacity"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Stats Copied! 📋' : 'Share to Stories / Social'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
