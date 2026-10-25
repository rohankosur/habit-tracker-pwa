'use client';

import React from 'react';
import { Mic, MicOff, Shuffle, Loader2, Cloud, HardDrive, Sparkles, ShieldCheck } from 'lucide-react';
import { playMechanicalTick, playTransmutationSwoosh } from '@/lib/cosmicAudio';
import { inferHabitCircadianPhase } from '@/lib/circadian';

interface HabitListProps {
  questions: any[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  isListening?: Record<string, boolean>;
  onToggleVoiceDictation?: (questionId: string) => void;
  submitting?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  selectedDate: string;
  isTodaySelected: boolean;
  autoSaveStatus?: string;
  lastSavedTime?: string | null;
  onShuffle?: () => void;
  submitLabel?: string;
}

export default function HabitList({
  questions,
  answers,
  onAnswerChange,
  isListening = {},
  onToggleVoiceDictation,
  submitting = false,
  onSubmit,
  selectedDate,
  isTodaySelected,
  autoSaveStatus,
  lastSavedTime,
  onShuffle,
  submitLabel,
}: HabitListProps) {
  const handleToggle = (questionId: string, val: any, isBadResisted: boolean = false) => {
    if (isBadResisted) {
      playTransmutationSwoosh();
    } else {
      playMechanicalTick();
    }
    onAnswerChange(questionId, val);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Habit Deck Surface Celestial Card */}
      <div className="w-full celestial-card rounded-none p-4 corner-brackets relative bg-substrate-card/90 backdrop-blur-md border border-substrate-border shadow-2xl">
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />

        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-substrate-border pb-3 mb-2">
          <div className="space-y-0.5">
            <h3 className="font-serif tracking-wide text-xs uppercase text-gold font-semibold flex items-center space-x-1.5">
              <span>HABIT DECK // {isTodaySelected ? 'ACTIVE ORBIT' : selectedDate}</span>
            </h3>
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest block">
              {questions.length} Astrolabe Vectors Synchronized
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Auto-Save Status */}
            {autoSaveStatus && (
              <div className="flex items-center space-x-1.5 text-[10px] font-mono">
                {autoSaveStatus === 'saving' && (
                  <span className="flex items-center space-x-1 text-gold/80 border border-gold/30 px-1.5 py-0.5">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    <span>SAVING</span>
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="flex items-center space-x-1 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5">
                    <Cloud className="w-2.5 h-2.5" />
                    <span>SYNCED {lastSavedTime ? `@ ${lastSavedTime}` : ''}</span>
                  </span>
                )}
                {autoSaveStatus === 'offline' && (
                  <span className="flex items-center space-x-1 text-amber-300 border border-amber-500/30 px-1.5 py-0.5">
                    <HardDrive className="w-2.5 h-2.5" />
                    <span>CACHED</span>
                  </span>
                )}
              </div>
            )}

            {/* Shuffle Button */}
            {onShuffle && questions.length > 1 && (
              <button
                type="button"
                onClick={onShuffle}
                className="p-1 border border-substrate-border hover:border-gold text-slate-400 hover:text-gold transition-colors cursor-pointer"
                title="Shuffle Sequence"
                aria-label="Shuffle Sequence"
              >
                <Shuffle className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* List Items: Compact rows with fine 1px dividers */}
        <div className="divide-y divide-white/5">
          {questions.map((q, idx) => {
            const value = answers[q.id];
            const isText = q.type === 'text';
            const isBoolean = q.type === 'boolean';
            const isScale = q.type === 'scale_1_to_5';
            const isNumber = q.type === 'number';
            const isBadHabit = q.habit_type === 'bad';
            const phase = inferHabitCircadianPhase(q.prompt);

            return (
              <div
                key={q.id}
                className={`py-3 ${
                  isText || isScale ? 'space-y-2' : 'min-h-[44px] flex items-center justify-between'
                }`}
              >
                {/* Prompt Label with Circadian & Habit Type Badges */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-gold/60 font-mono">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span className="font-sans text-xs text-slate-200">{q.prompt}</span>
                    {isBadHabit && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-red-950/50 border border-red-500/30 text-red-300 uppercase">
                        Shield
                      </span>
                    )}
                  </div>

                  {/* Voice dictation trigger for text prompts */}
                  {isText && onToggleVoiceDictation && (
                    <button
                      type="button"
                      onClick={() => onToggleVoiceDictation(q.id)}
                      className={`p-1 border text-xs font-mono flex items-center space-x-1 cursor-pointer transition-colors ${
                        isListening[q.id]
                          ? 'border-red-500 text-red-400 animate-pulse bg-red-500/10'
                          : 'border-substrate-border text-slate-400 hover:text-gold'
                      }`}
                    >
                      {isListening[q.id] ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                      <span className="text-[9px] uppercase tracking-wider">
                        {isListening[q.id] ? 'Listening' : 'Dictate'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Input Controls */}
                {isBoolean && (
                  <div className="flex items-center space-x-2 shrink-0">
                    {/* For good habits: YES is completion */}
                    {!isBadHabit ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggle(q.id, true)}
                          className={`h-7 px-2.5 border text-xs font-mono flex items-center space-x-1.5 transition-colors cursor-pointer ${
                            value === true
                              ? 'border-gold bg-gold/15 text-gold-bright shadow-[0_0_8px_rgba(212,175,55,0.25)]'
                              : 'border-substrate-border bg-substrate-bg/40 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div
                            className={`w-2.5 h-2.5 border transition-all ${
                              value === true
                                ? 'bg-gold border-gold tick-diamond'
                                : 'border-slate-500 rounded-none'
                            }`}
                          />
                          <span className="text-[10px] uppercase tracking-wider">DONE</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggle(q.id, false)}
                          className={`h-7 px-2.5 border text-xs font-mono flex items-center space-x-1.5 transition-colors cursor-pointer ${
                            value === false
                              ? 'border-red-500/60 bg-red-500/10 text-red-300'
                              : 'border-substrate-border bg-substrate-bg/40 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div
                            className={`w-2.5 h-2.5 border transition-all ${
                              value === false
                                ? 'bg-red-400 border-red-400 tick-diamond'
                                : 'border-slate-500 rounded-none'
                            }`}
                          />
                          <span className="text-[10px] uppercase tracking-wider">NO</span>
                        </button>
                      </>
                    ) : (
                      /* For bad habits: Avoided (false) triggers transmutation */
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggle(q.id, false, true)}
                          className={`h-7 px-2.5 border text-xs font-mono flex items-center space-x-1.5 transition-colors cursor-pointer ${
                            value === false
                              ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                              : 'border-substrate-border bg-substrate-bg/40 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] uppercase tracking-wider">RESISTED (+2x WP)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggle(q.id, true)}
                          className={`h-7 px-2.5 border text-xs font-mono flex items-center space-x-1.5 transition-colors cursor-pointer ${
                            value === true
                              ? 'border-red-500 bg-red-950/40 text-red-300'
                              : 'border-substrate-border bg-substrate-bg/40 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wider">INDULGED</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {isScale && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="grid grid-cols-5 gap-2 w-full max-w-xs">
                      {[1, 2, 3, 4, 5].map((num) => {
                        const isSelected = value === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleToggle(q.id, num)}
                            className={`h-8 border font-mono text-xs flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'border-gold bg-gold/15 text-gold-bright shadow-[0_0_6px_rgba(212,175,55,0.3)]'
                                : 'border-substrate-border bg-substrate-bg/40 text-slate-400 hover:text-slate-200 hover:border-substrate-borderActive'
                            }`}
                          >
                            <span>{num}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isNumber && (
                  <div className="flex items-center space-x-2 shrink-0">
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={value !== undefined && value !== null ? value : ''}
                      onChange={(e) => onAnswerChange(q.id, e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-24 h-8 bg-substrate-bg/60 border border-substrate-border focus:border-gold px-2 text-right font-mono text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                )}

                {isText && (
                  <textarea
                    rows={2}
                    placeholder="Enter daily reflection log..."
                    value={value || ''}
                    onChange={(e) => onAnswerChange(q.id, e.target.value)}
                    className="w-full bg-substrate-bg/60 border border-substrate-border focus:border-gold p-2 font-mono text-xs text-slate-200 focus:outline-none resize-none leading-relaxed"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Submit / Lock Button */}
        <div className="pt-4 mt-2 border-t border-substrate-border flex items-center justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2 bg-substrate-card hover:bg-gold/10 border border-gold text-gold font-mono text-xs uppercase tracking-widest transition-all shadow-[0_0_12px_rgba(212,175,55,0.2)] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>SYNCHRONIZING ORBIT...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>{submitLabel || 'LOCK CELESTIAL ORBIT'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
