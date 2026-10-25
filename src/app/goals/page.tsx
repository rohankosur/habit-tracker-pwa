'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceLayout } from '@/contexts/DeviceLayoutContext';
import { supabase } from '@/lib/supabase';
import { triggerVariableReward, triggerHaptic, playCompletionChime } from '@/lib/feedback';
import { playMechanicalTick, playCelestialLockGong } from '@/lib/cosmicAudio';
import { 
  Target, Plus, Trash2, CheckCircle2, Calendar, 
  Sparkles, Layers, Award, Loader2, ArrowRight, 
  Activity, Zap, Compass, Check
} from 'lucide-react';

const CATEGORIES = ['Health', 'Mindset', 'Career', 'Finance', 'Personal'];

export default function GoalsPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeDevice } = useDeviceLayout();
  const [goals, setGoals] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const [targetValue, setTargetValue] = useState('30');
  const [unit, setUnit] = useState('days');
  const [targetDate, setTargetDate] = useState('');
  const [habitStack, setHabitStack] = useState('');
  const [linkedQuestionId, setLinkedQuestionId] = useState('');

  const fetchGoalsAndQuestions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('user_id', user.id);
      setQuestions(qData || []);

      const { data: gData, error: gError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (gError) {
        console.warn('Goals notice:', gError.message);
        setGoals([]);
      } else {
        setGoals(gData || []);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsAndQuestions();
  }, [user]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setCreating(true);
    try {
      const newGoal = {
        user_id: user.id,
        title: title.trim(),
        category,
        target_value: Number(targetValue) || 10,
        current_value: 0,
        unit: unit.trim() || 'days',
        target_date: targetDate || null,
        habit_stack: habitStack.trim() || null,
        linked_question_id: linkedQuestionId || null,
      };

      const { data, error } = await supabase
        .from('goals')
        .insert(newGoal)
        .select()
        .single();

      if (error) throw error;

      setGoals((prev) => [data, ...prev]);
      triggerVariableReward();
      playCelestialLockGong();
      triggerHaptic(30);

      // Reset Form
      setTitle('');
      setTargetValue('30');
      setUnit('days');
      setTargetDate('');
      setHabitStack('');
      setLinkedQuestionId('');
      setShowForm(false);
    } catch (err: any) {
      alert('Failed to forge celestial goal: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateProgress = async (goalId: string, increment: number) => {
    playMechanicalTick();
    triggerHaptic(15);
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newCurrent = Math.max(0, goal.current_value + increment);
    const isNowCompleted = newCurrent >= goal.target_value && goal.current_value < goal.target_value;

    try {
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, current_value: newCurrent } : g))
      );

      const { error } = await supabase
        .from('goals')
        .update({ current_value: newCurrent })
        .eq('id', goalId);

      if (error) throw error;

      if (isNowCompleted) {
        triggerVariableReward();
        playCompletionChime();
        playCelestialLockGong();
        triggerHaptic(50);
      }
    } catch (err: any) {
      console.error('Error updating goal progress:', err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to decommission this orbit milestone?')) return;
    try {
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      await supabase.from('goals').delete().eq('id', goalId);
    } catch (err: any) {
      alert('Error deleting goal: ' + err.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
          Retrieving Celestial Orbit Milestones...
        </span>
      </div>
    );
  }

  const isDesktop = activeDevice === 'desktop';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-gold" />
            <span className="text-xs uppercase tracking-widest font-bold font-mono text-gold">
              Celestial Orbits & Habit Stacks
            </span>
          </div>
          <h1 className="text-3xl font-light text-slate-100 tracking-tight font-serif">
            Milestones & OKRs
          </h1>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Propel long-term celestial goals, stack atomic habits, and anchor daily routines.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-substrate-card hover:bg-gold/15 border border-gold text-gold font-mono text-xs uppercase tracking-widest transition-all shadow-[0_0_12px_rgba(212,175,55,0.2)] flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Orbit</span>
        </button>
      </div>

      {/* Goal Creation Form */}
      {showForm && (
        <form onSubmit={handleCreateGoal} className="bg-substrate-card/90 border border-gold/40 p-6 space-y-4 shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="flex items-center justify-between border-b border-substrate-border pb-3">
            <h2 className="text-sm font-serif uppercase tracking-widest text-gold font-semibold">
              Chart New Orbit Milestone
            </h2>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Atomic System</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Orbit Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Read 12 Books or Complete 100 Cold Showers"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-substrate-bg/80 border border-substrate-border text-slate-200 focus:outline-none focus:border-gold text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-substrate-bg/80 border border-substrate-border text-slate-200 focus:outline-none focus:border-gold text-xs font-mono cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Target Units
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="1"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-24 px-3 py-2 bg-substrate-bg/80 border border-substrate-border text-slate-200 focus:outline-none focus:border-gold text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="unit (e.g. days, books)"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1 px-3 py-2 bg-substrate-bg/80 border border-substrate-border text-slate-200 focus:outline-none focus:border-gold text-xs font-mono"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Habit Stacking Formula (Anchor Star → Target Star)
              </label>
              <input
                type="text"
                placeholder="e.g. After Morning Coffee ☕ → Read 15 Pages 📖"
                value={habitStack}
                onChange={(e) => setHabitStack(e.target.value)}
                className="w-full px-3 py-2 bg-substrate-bg/80 border border-substrate-border text-slate-200 focus:outline-none focus:border-gold text-xs font-mono"
              />
            </div>

            {questions.length > 0 && (
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  Link to Habit Metric (Optional)
                </label>
                <select
                  value={linkedQuestionId}
                  onChange={(e) => setLinkedQuestionId(e.target.value)}
                  className="w-full px-3 py-2 bg-substrate-bg/80 border border-substrate-border text-slate-200 focus:outline-none focus:border-gold text-xs font-mono cursor-pointer"
                >
                  <option value="">None (Standalone Orbit)</option>
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.prompt} ({q.type})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-slate-400 hover:text-slate-200 border border-substrate-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-1.5 font-mono text-xs uppercase tracking-widest bg-gold text-slate-950 font-bold hover:bg-gold-bright transition-colors"
            >
              {creating ? 'Propelling Orbit...' : 'Forge Orbit'}
            </button>
          </div>
        </form>
      )}

      {/* Goals Feed Grid */}
      {goals.length === 0 ? (
        <div className="bg-substrate-card/90 border border-substrate-border p-12 text-center space-y-3 font-mono text-xs text-slate-400 shadow-xl">
          <Compass className="w-10 h-10 text-slate-600 mx-auto" />
          <p>No celestial orbits forged yet. Click &quot;New Orbit&quot; above to chart your first milestone!</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${isDesktop ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {goals.map((g) => {
            const percent = Math.min(100, Math.round((g.current_value / g.target_value) * 100));
            const isCompleted = percent >= 100;

            return (
              <div 
                key={g.id}
                className={`bg-substrate-card/90 border p-5 space-y-4 transition-all shadow-xl backdrop-blur-md ${
                  isCompleted 
                    ? 'border-emerald-500/50 bg-emerald-950/20' 
                    : 'border-substrate-border hover:border-gold/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-gold/30 bg-gold/10 text-gold-bright">
                        {g.category}
                      </span>
                      {g.target_date && (
                        <span className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Target: {g.target_date}</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-serif text-slate-100 leading-snug">{g.title}</h3>
                  </div>

                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete Orbit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Habit Stacking Banner */}
                {g.habit_stack && (
                  <div className="p-2 border border-white/5 bg-substrate-bg/40 text-xs font-mono text-slate-300 flex items-center space-x-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{g.habit_stack}</span>
                  </div>
                )}

                {/* Progress Bar & Percentage */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300">
                      {g.current_value} / {g.target_value} {g.unit}
                    </span>
                    <span className={`font-bold ${isCompleted ? 'text-emerald-400' : 'text-gold'}`}>
                      {percent}% {isCompleted ? '✦ ORBIT COMPLETED' : ''}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-substrate-bg border border-substrate-border overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-400' : 'bg-gold'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Propel Orbit Modifiers */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                    Propel Orbit:
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleUpdateProgress(g.id, -1)}
                      className="px-2 py-0.5 border border-substrate-border text-[10px] font-mono text-slate-400 hover:text-slate-200"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleUpdateProgress(g.id, 1)}
                      className="px-2.5 py-0.5 border border-gold/40 bg-gold/10 text-[10px] font-mono text-gold hover:bg-gold/20"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleUpdateProgress(g.id, 5)}
                      className="px-2.5 py-0.5 border border-gold/40 bg-gold/10 text-[10px] font-mono text-gold hover:bg-gold/20"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
