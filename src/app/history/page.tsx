'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceLayout } from '@/contexts/DeviceLayoutContext';
import { supabase } from '@/lib/supabase';
import ConstellationCanvas from '@/components/ConstellationCanvas';
import { 
  Dumbbell, Bed, Smile, Sparkles, BookOpen, GlassWater, 
  Brain, Flame, Heart, Coffee, ClipboardList, CheckSquare, 
  HelpCircle, Calendar, MessageSquare, Check, X, Loader2,
  Activity, Search, Filter, Layers, LayoutGrid, List, Compass
} from 'lucide-react';

const IconMap: Record<string, any> = {
  'dumbbell': Dumbbell,
  'bed': Bed,
  'smile': Smile,
  'sparkles': Sparkles,
  'book-open': BookOpen,
  'glass-water': GlassWater,
  'brain': Brain,
  'flame': Flame,
  'heart': Heart,
  'coffee': Coffee,
  'clipboard-list': ClipboardList,
  'check-square': CheckSquare,
  'help-circle': HelpCircle
};

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { isDesktop } = useDeviceLayout();
  const [logs, setLogs] = useState<any[]>([]);
  const [questionsMap, setQuestionsMap] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'constellation' | 'timeline' | 'matrix'>('constellation');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data: questions, error: qError } = await supabase
          .from('questions')
          .select('*')
          .eq('user_id', user.id);

        if (qError) throw qError;

        const qMap: Record<string, any> = {};
        questions?.forEach((q) => {
          qMap[q.id] = q;
        });
        setQuestionsMap(qMap);

        const { data: dailyLogs, error: logsError } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (logsError) throw logsError;
        setLogs(dailyLogs || []);
      } catch (err) {
        console.error('Error fetching reflection history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const generateHeatmapDays = () => {
    const loggedDatesSet = new Set(logs.map((l) => l.date));
    const days = [];
    const now = new Date();

    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      days.push({
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNum: d.getDate(),
        isLogged: loggedDatesSet.has(dateStr),
      });
    }
    return days;
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const dateMatch = formatDate(log.date).toLowerCase().includes(query);
    const respMatch = Object.values(log.responses || {}).some(
      (val) => String(val).toLowerCase().includes(query)
    );
    return dateMatch || respMatch;
  });

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
          Retrieving Celestial Grimoire...
        </span>
      </div>
    );
  }

  const heatmapDays = generateHeatmapDays();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-gold" />
          <span className="text-xs uppercase tracking-widest font-bold font-mono text-gold">
            Astrological Archive
          </span>
        </div>
        <h1 className="text-3xl font-light text-slate-100 tracking-tight font-serif">
          Cosmic Reflection History
        </h1>
        <p className="text-xs text-slate-400 font-mono leading-relaxed">
          Chart your personal star constellations, locked orbit logs, and temporal coordinate matrices.
        </p>
      </div>

      {/* Control Bar: View Switcher & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-substrate-card/90 border border-substrate-border p-3 backdrop-blur-md">
        {/* Mode Buttons */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('constellation')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${
              viewMode === 'constellation'
                ? 'bg-gold/15 border border-gold text-gold-bright shadow-[0_0_8px_rgba(212,175,55,0.25)]'
                : 'border border-substrate-border text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Constellation</span>
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${
              viewMode === 'timeline'
                ? 'bg-gold/15 border border-gold text-gold-bright shadow-[0_0_8px_rgba(212,175,55,0.25)]'
                : 'border border-substrate-border text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setViewMode('matrix')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${
              viewMode === 'matrix'
                ? 'bg-gold/15 border border-gold text-gold-bright shadow-[0_0_8px_rgba(212,175,55,0.25)]'
                : 'border border-substrate-border text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>28D Matrix</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search celestial logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-substrate-bg/80 border border-substrate-border pl-8 pr-3 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-gold"
          />
        </div>
      </div>

      {/* 1. Constellation View */}
      {viewMode === 'constellation' && (
        <div className="space-y-4">
          <ConstellationCanvas logs={logs} />

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-substrate-card/90 border border-substrate-border p-3 text-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 block">Total Stars</span>
              <span className="font-serif text-2xl text-gold-bright font-light mt-0.5 block">{logs.length}</span>
            </div>
            <div className="bg-substrate-card/90 border border-substrate-border p-3 text-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 block">First Orbit</span>
              <span className="font-mono text-xs text-slate-300 mt-1.5 block">
                {logs.length > 0 ? logs[logs.length - 1].date : 'N/A'}
              </span>
            </div>
            <div className="bg-substrate-card/90 border border-substrate-border p-3 text-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 block">Active Constellation</span>
              <span className="font-mono text-xs text-gold mt-1.5 block">The Architect</span>
            </div>
            <div className="bg-substrate-card/90 border border-substrate-border p-3 text-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 block">Filament Density</span>
              <span className="font-mono text-xs text-emerald-400 mt-1.5 block">92.4% Optimal</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. 28-Day Matrix View */}
      {viewMode === 'matrix' && (
        <div className="bg-substrate-card/90 border border-substrate-border p-5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-substrate-border pb-3 mb-4">
            <span className="font-serif text-xs uppercase tracking-widest text-gold font-bold">
              28-Day Orbital Synchrony Grid
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {heatmapDays.filter((d) => d.isLogged).length} / 28 Days Illuminated
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2.5">
            {heatmapDays.map((day) => (
              <div
                key={day.dateStr}
                className={`p-3 border flex flex-col items-center justify-center transition-all ${
                  day.isLogged
                    ? 'bg-gold/15 border-gold text-gold-bright shadow-[0_0_8px_rgba(212,175,55,0.25)]'
                    : 'bg-substrate-bg/40 border-substrate-border text-slate-600'
                }`}
              >
                <span className="text-[9px] font-mono uppercase tracking-wider">{day.dayName}</span>
                <span className="font-mono text-sm font-bold mt-0.5">{day.dayNum}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Timeline Feed Mode */}
      {viewMode === 'timeline' && (
        filteredLogs.length === 0 ? (
          <div className="bg-substrate-card/90 border border-substrate-border p-12 text-center space-y-3 font-mono text-xs text-slate-400">
            <Compass className="w-10 h-10 text-slate-600 mx-auto" />
            <p>{searchQuery ? 'No matching orbits found in the cosmos.' : 'No reflections charted yet.'}</p>
          </div>
        ) : (
          <div className={`space-y-4 ${isDesktop ? 'grid grid-cols-2 gap-4 space-y-0' : ''}`}>
            {filteredLogs.map((log) => {
              const responses = log.responses || {};
              const answeredIds = Object.keys(responses);

              return (
                <div key={log.id} className="bg-substrate-card/90 border border-substrate-border p-4 space-y-3 hover:border-gold/50 transition-all shadow-xl">
                  {/* Card Header with Celestial Stamped Seal */}
                  <div className="flex justify-between items-center border-b border-substrate-border pb-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-3.5 h-3.5 text-gold" />
                      <span className="text-xs font-mono font-bold text-gold-bright">
                        {formatDate(log.date)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      LOCKED @ {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {answeredIds.length === 0 ? (
                    <p className="text-xs font-mono text-slate-500 italic">No answers charted for this orbit.</p>
                  ) : (
                    <div className="space-y-2">
                      {answeredIds.map((qId) => {
                        const q = questionsMap[qId];
                        const val = responses[qId];
                        const prompt = q ? q.prompt : 'Uncharted Metric';
                        const type = q ? q.type : 'text';
                        const isBad = q?.habit_type === 'bad';

                        return (
                          <div 
                            key={qId} 
                            className="p-2 border border-white/5 bg-substrate-bg/40 flex items-center justify-between text-xs font-mono"
                          >
                            <span className="text-slate-300 font-sans truncate max-w-[220px]">{prompt}</span>

                            {type === 'boolean' && (
                              val === true ? (
                                <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                                  isBad
                                    ? 'bg-red-950/40 border-red-500/40 text-red-300'
                                    : 'bg-gold/15 border-gold/40 text-gold-bright'
                                }`}>
                                  {isBad ? 'INDULGED' : 'COMPLETED'}
                                </span>
                              ) : val === false ? (
                                <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                                  isBad
                                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                    : 'bg-red-950/40 border-red-500/40 text-red-400'
                                }`}>
                                  {isBad ? 'RESISTED' : 'SKIPPED'}
                                </span>
                              ) : null
                            )}

                            {type === 'number' && (
                              <span className="font-bold text-gold-bright">{val}</span>
                            )}

                            {type === 'scale_1_to_5' && (
                              <span className="font-bold text-gold-bright">{val} / 5</span>
                            )}

                            {type === 'text' && (
                              <span className="text-slate-400 italic truncate max-w-[150px]">{val}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
