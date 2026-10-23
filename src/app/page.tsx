'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceLayout } from '@/contexts/DeviceLayoutContext';
import { supabase } from '@/lib/supabase';
import HeaderHUD from '@/components/HeaderHUD';
import DailyProgress from '@/components/DailyProgress';
import HabitList from '@/components/HabitList';
import SavedEntries from '@/components/SavedEntries';
import InstallPwaBanner from '@/components/InstallPwaBanner';
import ShareableCardModal from '@/components/ShareableCardModal';
import { 
  playCompletionChime, triggerHaptic, updateAppBadge, 
  triggerVariableReward, getRandomQuote, calculateStreakWithFreezes,
  generateMicroInsight, StreakInfo, shuffleArray
} from '@/lib/feedback';
import { 
  calculateUserLevel, calculateAchievementBadges, LevelInfo, ACCENT_THEMES, AchievementBadge
} from '@/lib/gamification';
import { 
  Award, ShieldCheck, Lightbulb, Share2, Loader2, Trophy
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
  const [copiedShare, setCopiedShare] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const getLocalTodayDateStr = () => {
    const dateObj = new Date();
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getYesterdayDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getLocalHabitTypeMap = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('reflect_habit_types') || '{}');
    } catch {
      return {};
    }
  };

  const getDraftStorageKey = (userId: string, date: string) => `reflect_draft_${userId}_${date}`;

  useEffect(() => {
    const theme = localStorage.getItem('reflect_accent_theme') || 'teal';
    setActiveThemeId(theme);
    setSelectedDate(getLocalTodayDateStr());

    const handleThemeChange = () => {
      const updatedTheme = localStorage.getItem('reflect_accent_theme') || 'teal';
      setActiveThemeId(updatedTheme);
    };

    window.addEventListener('reflect_theme_change', handleThemeChange);
    return () => window.removeEventListener('reflect_theme_change', handleThemeChange);
  }, []);

  // Account & Date isolated data loader
  useEffect(() => {
    if (!user || !selectedDate) return;

    isInitialMount.current = true;
    setAutoSaveStatus('idle');

    const fetchDataForDate = async () => {
      setLoading(true);
      try {
        const { data: activeQuestions, error: qError } = await supabase
          .from('questions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (qError) throw qError;

        const localHabits = getLocalHabitTypeMap();
        let loadedQuestions = (activeQuestions || []).map((q: any) => ({
          ...q,
          habit_type: localHabits[q.id] || q.habit_type || 'good',
        }));

        const isRandomized = localStorage.getItem('reflect_randomize_questions') === 'true';
        if (isRandomized) {
          loadedQuestions = shuffleArray(loadedQuestions);
        }

        setQuestions(loadedQuestions);

        // Fetch Log for selectedDate & user.id
        const { data: targetLog, error: logError } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', selectedDate)
          .maybeSingle();

        if (logError) throw logError;

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
          
          // Check account-isolated local draft
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

  // Perform background debounced auto-save across accounts
  const performAutoSave = useCallback(
    async (updatedAnswers: Record<string, any>) => {
      if (!user || !selectedDate || isInitialMount.current) return;
      
      setAutoSaveStatus('saving');

      // 1. Save to account-isolated local storage draft immediately
      const draftKey = getDraftStorageKey(user.id, selectedDate);
      localStorage.setItem(draftKey, JSON.stringify(updatedAnswers));

      // 2. Perform Supabase upsert for user.id + date
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

  const toggleVoiceJournaling = (questionId: string) => {
    triggerHaptic(20);
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Safari on iOS or Chrome.');
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

  const handleShareStreak = async () => {
    triggerHaptic(20);
    setShowShareModal(true);
  };

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
    } catch (err: any) {
      console.error('Error saving daily log:', err);
      alert('Failed to save log: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
        <span className="font-mono text-xs text-slate-400 tracking-widest uppercase">
          INITIALIZING SUBSTRATE DATA...
        </span>
      </div>
    );
  }

  const isDesktop = activeDevice === 'desktop';
  const todayStr = getLocalTodayDateStr();
  const isTodaySelected = selectedDate === todayStr;

  const loggedCount = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ''
  ).length;
  const completionPercentage = questions.length > 0 ? (loggedCount / questions.length) * 100 : 0;

  return (
    <div className="space-y-4 pb-8">
      {/* Precision Header HUD (Slim 44px Fixed Status Bar) */}
      <HeaderHUD
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        maxDate={todayStr}
        streak={streakInfo.currentStreak}
      />

      {/* Smart PWA Install Banner */}
      <InstallPwaBanner />

      {/* Shareable Life Wrapped Modal */}
      <ShareableCardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        stats={{
          streak: streakInfo.currentStreak,
          level: levelInfo.level,
          levelTitle: levelInfo.title,
          totalXP: levelInfo.totalXP,
          totalLogs: levelInfo.totalXP > 0 ? Math.round(levelInfo.totalXP / 20) : 1,
          consistencyRate: Math.min(100, (streakInfo.currentStreak / 30) * 100 > 0 ? Math.round((streakInfo.currentStreak / 30) * 100) : 100),
          goodHabitsCount: Object.values(answers).filter(v => v === true).length,
          badHabitsAvoided: 1,
          periodName: isTodaySelected ? "Today's" : selectedDate,
        }}
      />

      {/* Main Grid: Desktop 16:9 Studio 2-Column Split vs Mobile Single-Column */}
      <div className={`grid gap-4 ${isDesktop ? 'grid-cols-12' : 'grid-cols-1'}`}>
        
        {/* Left Column (Desktop 16:9 Studio Stats Sidebar) */}
        {isDesktop && (
          <div className="col-span-4 space-y-4">
            {/* Level Progress Blueprint Card */}
            <div className="bg-substrate-card backdrop-blur-md border border-substrate-border rounded-none p-4 corner-brackets relative space-y-2">
              <div className="corner-bracket-tr" />
              <div className="corner-bracket-bl" />
              
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-1.5 text-slate-300">
                  <Trophy className="w-3.5 h-3.5 text-gold" strokeWidth={1.5} />
                  <span className="font-serif uppercase tracking-wider text-gold font-bold">
                    RANK // {levelInfo.level}
                  </span>
                </div>
                <span className="text-gold-bright font-mono">{levelInfo.totalXP} XP</span>
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

            {/* Achievement Vault Blueprint Card */}
            <div className="bg-substrate-card backdrop-blur-md border border-substrate-border rounded-none p-4 corner-brackets relative space-y-2.5">
              <div className="corner-bracket-tr" />
              <div className="corner-bracket-bl" />

              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="font-serif uppercase tracking-wider text-gold">
                  Milestones Vault
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {badges.filter((b) => b.unlocked).length}/{badges.length} UNLOCKED
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className={`p-2 border text-center transition-all ${
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
            <div className="bg-substrate-card backdrop-blur-md border border-substrate-border rounded-none p-3.5 text-xs font-mono flex items-center justify-between corner-brackets relative">
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
              <div className="bg-substrate-card backdrop-blur-md border border-substrate-border rounded-none p-3.5 text-xs text-slate-300 flex items-start space-x-2.5 corner-brackets relative">
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
          
          {/* Main Status & Chrono Dial */}
          <DailyProgress
            isCompleted={!isEditing && Boolean(log)}
            completionPercentage={completionPercentage}
            completedCount={loggedCount}
            totalCount={questions.length}
            statusLine={motivationalQuote || activeThemeObj.nicheQuote}
            selectedDate={selectedDate}
            isEditing={isEditing}
            onModifyEntry={() => {
              triggerHaptic(10);
              setIsEditing(true);
            }}
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
