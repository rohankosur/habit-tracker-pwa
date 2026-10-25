'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceLayout } from '@/contexts/DeviceLayoutContext';
import { supabase } from '@/lib/supabase';
import HeaderHUD from '@/components/HeaderHUD';
import DynamicIslandHUD from '@/components/DynamicIslandHUD';
import ChronoDial from '@/components/ChronoDial';
import HabitList from '@/components/HabitList';
import SavedEntries from '@/components/SavedEntries';
import InstallPwaBanner from '@/components/InstallPwaBanner';
import ShareableCardModal from '@/components/ShareableCardModal';
import UrgeDefuserModal from '@/components/UrgeDefuserModal';
import { 
  playCompletionChime, triggerHaptic, updateAppBadge, 
  triggerVariableReward, getRandomQuote, calculateStreakWithFreezes,
  generateMicroInsight, StreakInfo, shuffleArray
} from '@/lib/feedback';
import { playCelestialLockGong } from '@/lib/cosmicAudio';
import { parseVoiceTranscript } from '@/lib/voiceDebrief';
import { 
  calculateUserLevel, calculateAchievementBadges, LevelInfo, ACCENT_THEMES, AchievementBadge
} from '@/lib/gamification';
import { 
  ShieldCheck, Lightbulb, Loader2, Trophy, Flame, Sparkles
} from 'lucide-react';

type AutoSaveStatus = 'saved' | 'saving' | 'offline' | 'idle';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { activeDevice } = useDeviceLayout();
  const [questions, setQuestions] = useState<any[]>([]);
  const [log, setLog] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isListening, setIsListening] = useState<Record<string, boolean>>({});
  const [isVoiceDebriefing, setIsVoiceDebriefing] = useState(false);
  const [showUrgeDefuser, setShowUrgeDefuser] = useState(false);
  const [allLogDates, setAllLogDates] = useState<string[]>([]);
  const [activeThemeId, setActiveThemeId] = useState('teal');
  const [badges, setBadges] = useState<AchievementBadge[]>([]);

  // Robust Auto-Save State
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef<boolean>(true);

  const [streakInfo, setStreakInfo] = useState<StreakInfo>({
    currentStreak: 0,
    bestStreak: 0,
    freezesUsedThisMonth: 0,
    freezesRemaining: 2,
    freezeAppliedToday: false,
    isMilestone: false
  });
  const [levelInfo, setLevelInfo] = useState<LevelInfo>({
    totalXP: 0,
    level: 1,
    title: 'Novice Reflector',
    currentLevelXP: 0,
    nextLevelXP: 100,
    progressPercent: 0,
  });
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [microInsight, setMicroInsight] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  const getLocalTodayDateStr = () => {
    const dateObj = new Date();
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDraftStorageKey = (userId: string, date: string) => {
    return `reflect_draft_${userId}_${date}`;
  };

  useEffect(() => {
    const today = getLocalTodayDateStr();
    setSelectedDate(today);

    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('reflect_accent_theme') || 'teal';
      setActiveThemeId(savedTheme);
      setMotivationalQuote(getRandomQuote());
    }
  }, []);

  // Fetch habits and entry logs
  useEffect(() => {
    if (!user || !selectedDate) return;

    const fetchDataForDate = async () => {
      setLoading(true);
      try {
        const { data: qData, error: qError } = await supabase
          .from('questions')
          .select('*')
          .eq('user_id', user.id)
          .eq('archived', false)
          .order('order_index', { ascending: true });

        if (qError) throw qError;

        let loadedQuestions = qData || [];

        // Apply local habit category mappings
        if (typeof window !== 'undefined') {
          try {
            const habitTypes = JSON.parse(localStorage.getItem('reflect_habit_types') || '{}');
            loadedQuestions = loadedQuestions.map((q) => ({
              ...q,
              habit_type: habitTypes[q.id] || q.habit_type || 'good',
            }));
          } catch {}
        }

        setQuestions(loadedQuestions);

        const { data: allLogs } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id);

        const logsList = allLogs || [];
        const targetLog = logsList.find((l: any) => l.date === selectedDate);

        const logDates = logsList.map((l: any) => l.date);
        setAllLogDates(logDates);
        
        const streak = calculateStreakWithFreezes(logDates);
        setStreakInfo(streak);
        setLevelInfo(calculateUserLevel(logsList, activeThemeId));
        setBadges(calculateAchievementBadges(logsList, streak.currentStreak));
        setMicroInsight(generateMicroInsight(logsList, loadedQuestions));

        if (targetLog) {
          setLog(targetLog);
          setAnswers(targetLog.responses || {});
          setIsEditing(false);
          setAutoSaveStatus('saved');
          if (selectedDate === getLocalTodayDateStr()) updateAppBadge(0);
        } else {
          setLog(null);
          setIsEditing(true);
          if (selectedDate === getLocalTodayDateStr()) updateAppBadge(1);
          
          const draftKey = getDraftStorageKey(user.id, selectedDate);
          const savedDraft = localStorage.getItem(draftKey);

          if (savedDraft) {
            try {
              const parsedDraft = JSON.parse(savedDraft);
              setAnswers(parsedDraft);
              setAutoSaveStatus('offline');
            } catch {
              setInitialDefaultAnswers(loadedQuestions);
            }
          } else {
            setInitialDefaultAnswers(loadedQuestions);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
        setTimeout(() => {
          isInitialMount.current = false;
        }, 300);
      }
    };

    fetchDataForDate();
  }, [user?.id, selectedDate, activeThemeId]);

  const setInitialDefaultAnswers = (qs: any[]) => {
    const initialAnswers: Record<string, any> = {};
    qs?.forEach((q) => {
      if (q.type === 'boolean') initialAnswers[q.id] = null;
      else if (q.type === 'number') initialAnswers[q.id] = '';
      else if (q.type === 'scale_1_to_5') initialAnswers[q.id] = 3;
      else if (q.type === 'text') initialAnswers[q.id] = '';
    });
    setAnswers(initialAnswers);
  };

  // Perform background debounced auto-save
  const performAutoSave = useCallback(
    async (updatedAnswers: Record<string, any>) => {
      if (!user || !selectedDate || isInitialMount.current) return;
      
      setAutoSaveStatus('saving');

      const draftKey = getDraftStorageKey(user.id, selectedDate);
      localStorage.setItem(draftKey, JSON.stringify(updatedAnswers));

      try {
        const payload = {
          user_id: user.id,
          date: selectedDate,
          responses: updatedAnswers,
        };

        const { data, error } = await supabase
          .from('daily_logs')
          .upsert(payload, { onConflict: 'user_id, date' })
          .select()
          .single();

        if (error) throw error;

        if (data) setLog(data);
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedTime(timeNow);
        setAutoSaveStatus('saved');
      } catch (err) {
        console.warn('Auto-save network notice (saved locally):', err);
        setAutoSaveStatus('offline');
      }
    },
    [user?.id, selectedDate]
  );

  const activeThemeObj = ACCENT_THEMES.find((t) => t.id === activeThemeId) || ACCENT_THEMES[0];

  const handleShuffleQuestions = () => {
    triggerHaptic(20);
    setQuestions((prev) => shuffleArray(prev));
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    triggerHaptic(10);
    const updated = {
      ...answers,
      [questionId]: value,
    };
    setAnswers(updated);

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave(updated);
    }, 800);
  };

  // Voice stream debrief (Speech to structured habits)
  const handleTriggerVoiceDebrief = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Voice recognition not supported in this browser. Try Safari or Chrome.');
      return;
    }

    if (isVoiceDebriefing) {
      setIsVoiceDebriefing(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceDebriefing(true);
        triggerHaptic(30);
      };

      recognition.onresult = (evt: any) => {
        const text = evt.results[0][0].transcript;
        const parsed = parseVoiceTranscript(text, questions);
        const merged = { ...answers, ...parsed.matchedAnswers };
        setAnswers(merged);
        performAutoSave(merged);
        setIsVoiceDebriefing(false);
        triggerVariableReward();
        triggerHaptic(50);
      };

      recognition.onerror = () => setIsVoiceDebriefing(false);
      recognition.onend = () => setIsVoiceDebriefing(false);
      recognition.start();
    } catch {
      setIsVoiceDebriefing(false);
    }
  };

  const toggleVoiceJournaling = (questionId: string) => {
    triggerHaptic(20);
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening[questionId]) {
      setIsListening((prev) => ({ ...prev, [questionId]: false }));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening((prev) => ({ ...prev, [questionId]: true }));
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const newText = answers[questionId] ? `${answers[questionId]} ${transcript}` : transcript;
        handleAnswerChange(questionId, newText);
        setIsListening((prev) => ({ ...prev, [questionId]: false }));
        triggerHaptic(15);
      };

      recognition.onerror = () => {
        setIsListening((prev) => ({ ...prev, [questionId]: false }));
      };

      recognition.onend = () => {
        setIsListening((prev) => ({ ...prev, [questionId]: false }));
      };

      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  // Keyboard Shortcuts Studio Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement?.tagName.toLowerCase();
      if (activeEl === 'input' || activeEl === 'textarea') return;

      // Number keys 1-9 toggle habit items
      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (questions[idx]) {
          const q = questions[idx];
          if (q.type === 'boolean') {
            handleAnswerChange(q.id, !answers[q.id]);
          }
        }
      } else if (e.key.toLowerCase() === 'u') {
        setShowUrgeDefuser(true);
      } else if (e.key === 'Escape') {
        setShowUrgeDefuser(false);
        setShowShareModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questions, answers, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate) return;
    setSubmitting(true);

    try {
      const payload = {
        user_id: user.id,
        date: selectedDate,
        responses: answers,
      };

      const { data, error } = await supabase
        .from('daily_logs')
        .upsert(payload, { onConflict: 'user_id, date' })
        .select()
        .single();

      if (error) throw error;

      const draftKey = getDraftStorageKey(user.id, selectedDate);
      localStorage.removeItem(draftKey);

      triggerVariableReward();
      playCompletionChime();
      playCelestialLockGong();
      triggerHaptic(40);
      if (selectedDate === getLocalTodayDateStr()) updateAppBadge(0);
      setMotivationalQuote(getRandomQuote());

      const { data: allLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id);
      const logsList = allLogs || [];
      const logDates = logsList.map((l: any) => l.date);
      setAllLogDates(logDates);
      const streak = calculateStreakWithFreezes(logDates);
      setStreakInfo(streak);
      setLevelInfo(calculateUserLevel(logsList, activeThemeId));
      setBadges(calculateAchievementBadges(logsList, streak.currentStreak));
      setMicroInsight(generateMicroInsight(logsList, questions));

      setLog(data);
      setIsEditing(false);
      setAutoSaveStatus('saved');
    } catch (err) {
      console.error('Error submitting daily reflection:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate Net Willpower Score
  const calculateNetWillpower = () => {
    let score = 0;
    questions.forEach((q) => {
      const val = answers[q.id];
      if (val === undefined || val === null) return;
      if (q.type === 'boolean') {
        if (q.habit_type === 'bad') {
          if (val === false) score += 20; // Resisted vice: +20 WP
          if (val === true) score -= 30;  // Indulged vice: -30 WP
        } else {
          if (val === true) score += 15;  // Accomplished virtue: +15 WP
        }
      } else if (q.type === 'scale_1_to_5') {
        score += Number(val) * 3;
      }
    });
    return score;
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
          Synchronizing Astrolabe Core...
        </span>
      </div>
    );
  }

  const isTodaySelected = selectedDate === getLocalTodayDateStr();
  const isStamped = Boolean(log) && !isEditing;

  const totalAnswerable = questions.length;
  const loggedCount = questions.filter((q) => {
    const val = answers[q.id];
    return val !== undefined && val !== null && val !== '';
  }).length;
  const completionRate = totalAnswerable > 0 ? loggedCount / totalAnswerable : 0;
  const netWillpower = calculateNetWillpower();

  const isDesktop = activeDevice === 'desktop';

  return (
    <div className="space-y-4 pb-12">
      {/* Floating Dynamic Island HUD in Space */}
      <DynamicIslandHUD
        streak={streakInfo.currentStreak}
        netWillpowerScore={netWillpower}
        onOpenUrgeDefuser={() => setShowUrgeDefuser(true)}
        onTriggerVoiceDebrief={handleTriggerVoiceDebrief}
        isListening={isVoiceDebriefing}
      />

      {/* Top Header HUD */}
      <HeaderHUD
        selectedDate={selectedDate}
        onSelectDate={(d) => setSelectedDate(d)}
        streak={streakInfo.currentStreak}
      />

      {/* Urge Defuser 90s Breath Modal */}
      <UrgeDefuserModal
        isOpen={showUrgeDefuser}
        onClose={() => setShowUrgeDefuser(false)}
        onDefusedSuccess={() => {
          triggerVariableReward();
        }}
      />

      {/* Shareable Card Modal */}
      <ShareableCardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        stats={{
          streak: streakInfo.currentStreak,
          level: levelInfo.level,
          levelTitle: levelInfo.title,
          totalXP: levelInfo.totalXP,
          totalLogs: allLogDates.length,
          consistencyRate: Math.round(completionRate * 100),
          goodHabitsCount: loggedCount,
          badHabitsAvoided: questions.filter((q) => q.habit_type === 'bad' && answers[q.id] === false).length,
          periodName: selectedDate,
        }}
      />

      <InstallPwaBanner />

      <div className={isDesktop ? 'grid grid-cols-12 gap-6 items-start' : 'space-y-4'}>
        {/* Left Stats Sidebar (PC Studio Layout) */}
        {isDesktop && (
          <div className="col-span-4 space-y-4 sticky top-28">
            {/* Rank Level Celestial Card */}
            <div className="celestial-card rounded-none p-4 corner-brackets relative space-y-2 bg-substrate-card/90 backdrop-blur-md border border-substrate-border shadow-xl">
              <div className="corner-bracket-tr" />
              <div className="corner-bracket-bl" />
              
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="font-serif uppercase tracking-wider text-gold">
                  Orbital Rank // LVL {levelInfo.level}
                </span>
                <span className="text-gold-bright">{levelInfo.totalXP} XP</span>
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                Title: <span className="text-slate-200">{levelInfo.title}</span>
              </div>

              <div className="w-full h-1.5 bg-substrate-bg border border-substrate-border rounded-none overflow-hidden mt-1">
                <div 
                  className="h-full transition-all duration-500 bg-gold"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Achievement Vault Celestial Card */}
            <div className="celestial-card rounded-none p-4 corner-brackets relative space-y-2.5 bg-substrate-card/90 backdrop-blur-md border border-substrate-border shadow-xl">
              <div className="corner-bracket-tr" />
              <div className="corner-bracket-bl" />

              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="font-serif uppercase tracking-wider text-gold">
                  Milestones Vault
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {badges.filter((b) => b.unlocked).length}/{badges.length} UNLOCKED
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className={`p-2 border rounded-none text-center transition-all ${
                      b.unlocked
                        ? 'bg-gold/10 border-gold/40 text-gold-bright'
                        : 'bg-substrate-bg/40 border-substrate-border/50 text-slate-600 opacity-30'
                    }`}
                    title={`${b.name}: ${b.description}`}
                  >
                    <span className="text-sm block">{b.icon}</span>
                    <span className="text-[8px] font-mono truncate block mt-0.5 uppercase tracking-wider">
                      {b.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Streak Grace Freezes */}
            <div className="celestial-card rounded-none p-3.5 text-xs font-mono flex items-center justify-between corner-brackets relative bg-substrate-card/90 backdrop-blur-md border border-substrate-border shadow-xl">
              <div className="corner-bracket-tr" />
              <div className="corner-bracket-bl" />
              <div className="flex items-center space-x-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-gold" strokeWidth={1.5} />
                <span className="uppercase tracking-wider">Shields:</span>
              </div>
              <span className="text-gold font-bold">{streakInfo.freezesRemaining} Freezes Left</span>
            </div>

            {/* Micro Insight */}
            {microInsight && (
              <div className="celestial-card rounded-none p-3.5 text-xs text-slate-300 flex items-start space-x-2.5 corner-brackets relative bg-substrate-card/90 backdrop-blur-md border border-substrate-border shadow-xl">
                <div className="corner-bracket-tr" />
                <div className="corner-bracket-bl" />
                <Lightbulb className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="font-sans leading-relaxed text-[11px] text-slate-300">{microInsight}</span>
              </div>
            )}
          </div>
        )}

        {/* Main Workspace Column */}
        <div className={isDesktop ? 'col-span-8 space-y-4' : 'col-span-1 space-y-4'}>
          
          {/* Central Astrolabe Radial Chrono Dial with Circadian 24H Coordinate Ticks */}
          <ChronoDial
            completionRate={completionRate}
            isStamped={isStamped}
            totalHabits={questions.length}
            completedHabits={loggedCount}
            systemMessage={motivationalQuote || activeThemeObj.nicheQuote || "System memory synchronized. Execution loop complete."}
            onModify={() => {
              triggerHaptic(10);
              setIsEditing(true);
            }}
            onVoiceDebrief={handleTriggerVoiceDebrief}
            isListening={isVoiceDebriefing}
          />

          {/* Habit Deck / Question Form vs Saved Entries */}
          {isEditing ? (
            <HabitList
              questions={questions}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              isListening={isListening}
              onToggleVoiceDictation={toggleVoiceJournaling}
              submitting={submitting}
              onSubmit={handleSubmit}
              selectedDate={selectedDate}
              isTodaySelected={isTodaySelected}
              autoSaveStatus={autoSaveStatus}
              lastSavedTime={lastSavedTime}
              onShuffle={handleShuffleQuestions}
            />
          ) : (
            <SavedEntries
              selectedDate={selectedDate}
              questions={questions}
              answers={answers}
            />
          )}
        </div>
      </div>
    </div>
  );
}
