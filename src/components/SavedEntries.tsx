'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';

interface SavedEntriesProps {
  selectedDate: string;
  questions: any[];
  answers: Record<string, any>;
}

export default function SavedEntries({
  selectedDate,
  questions,
  answers,
}: SavedEntriesProps) {
  return (
    <div className="w-full bg-substrate-card backdrop-blur-md border border-substrate-border rounded-none p-4 corner-brackets relative">
      <div className="corner-bracket-tr" />
      <div className="corner-bracket-bl" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-substrate-border pb-2.5">
        <h3 className="font-serif tracking-wide text-sm uppercase text-gold font-semibold">
          Saved Entries // {selectedDate}
        </h3>
        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
          {questions.length} Records
        </span>
      </div>

      {/* List items: Compact 40px rows with fine 1px dividers */}
      <div className="divide-y divide-white/5 mt-1">
        {questions.map((q) => {
          const val = answers[q.id];
          const isText = q.type === 'text';

          return (
            <div
              key={q.id}
              className={`min-h-[40px] py-2 flex ${
                isText ? 'flex-col items-start space-y-1.5' : 'items-center justify-between'
              } text-xs font-mono`}
            >
              <div className="flex items-center space-x-2 text-slate-300 truncate pr-2">
                <span className="text-[10px] text-gold/60 font-mono">▸</span>
                <span className="truncate">{q.prompt}</span>
              </div>

              {isText ? (
                <div className="w-full pl-4 py-1 text-slate-300 font-serif italic text-xs leading-relaxed border-l border-substrate-border/50 bg-white/[0.01]">
                  {val ? `"${val}"` : <span className="text-slate-500 font-mono not-italic">-</span>}
                </div>
              ) : q.type === 'boolean' ? (
                <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                  {val === true ? (
                    <div className="flex items-center space-x-1.5 text-gold">
                      <div className="w-2.5 h-2.5 bg-gold border border-gold tick-diamond" />
                      <span className="font-mono text-[11px] uppercase tracking-wider">Yes</span>
                    </div>
                  ) : val === false ? (
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <div className="w-2.5 h-2.5 border border-slate-600 rounded-none" />
                      <span className="font-mono text-[11px] uppercase tracking-wider">No</span>
                    </div>
                  ) : (
                    <span className="font-mono text-slate-600">-</span>
                  )}
                </div>
              ) : q.type === 'scale_1_to_5' ? (
                <div className="flex items-center space-x-1 shrink-0 pl-2 font-mono text-xs">
                  <span className="text-gold font-bold">{val ? `${val}/5` : '-'}</span>
                </div>
              ) : (
                <div className="shrink-0 pl-2 font-mono text-xs text-gold-bright font-bold">
                  {val !== undefined && val !== null && val !== '' ? String(val) : '-'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
