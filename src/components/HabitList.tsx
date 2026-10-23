'use client';

import React from 'react';
import { Mic, MicOff, Shuffle, Loader2, Cloud, HardDrive } from 'lucide-react';

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
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Habit Deck Surface Card */}
      <div className="w-full bg-substrate-card backdrop-blur-md border border-substrate-border rounded-none p-4 corner-brackets relative">
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />

        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-substrate-border pb-3 mb-2">
          <div className="space-y-0.5">
            <h3 className="font-serif tracking-wide text-sm uppercase text-gold font-semibold">
              Habit Deck // {isTodaySelected ? 'Active Log' : selectedDate}
            </h3>
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block">
              {questions.length} Metrics in Sequence
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

        {/* List Items: Compact 40px rows with fine 1px dividers */}
        <div className="divide-y divide-white/5">
          {questions.map((q, idx) => {
            const value = answers[q.id];
            const isText = q.type === 'text';
            const isBoolean = q.type === 'boolean';
            const isScale = q.type === 'scale_1_to_5';
            const isNumber = q.type === 'number';

            return (
              <div
                key={q.id}
                className={`py-3 ${
                  isText || isScale ? 'space-y-2' : 'min-h-[40px] flex items-center justify-between'
                }`}
              >
                {/* Prompt Label */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-gold/60">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span className="font-sans text-xs text-slate-200">{q.prompt}</span>
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
                    <button
                      type="button"
                      onClick={() => onAnswerChange(q.id, true)}
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
                      <span className="text-[10px] uppercase tracking-wider">YES</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAnswerChange(q.id, false)}
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
                            onClick={() => onAnswerChange(q.id, num)}
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
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest pl-2">
                      {value ? `${value}/5` : 'Scale'}
                    </span>
                  </div>
                )}

                {isNumber && (
                  <div className="flex items-center space-x-2 shrink-0">
                    <input
                      type="number"
                      value={value ?? ''}
                      onChange={(e) => onAnswerChange(q.id, e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="w-24 h-7 px-2 bg-substrate-bg/70 border border-substrate-border rounded-none text-right font-mono text-xs text-gold-bright focus:border-gold focus:outline-none"
                    />
                  </div>
                )}

                {isText && (
                  <div className="pt-1">
                    <textarea
                      value={value ?? ''}
                      onChange={(e) => onAnswerChange(q.id, e.target.value)}
                      placeholder="Enter reflection entry..."
                      rows={2}
                      className="w-full px-3 py-2 bg-substrate-bg/70 border border-substrate-border rounded-none text-xs font-serif text-slate-200 placeholder-slate-600 focus:border-gold focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Action Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 px-4 bg-substrate-card border border-substrate-border hover:border-gold text-xs font-mono tracking-[0.2em] uppercase text-gold hover:text-gold-bright transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>RECORDING SUBSTRATE ENTRY...</span>
          </>
        ) : (
          <span>{submitLabel || (isTodaySelected ? 'RECORD DAILY REFLECTION' : `SAVE ENTRY // ${selectedDate}`)}</span>
        )}
      </button>
    </form>
  );
}
