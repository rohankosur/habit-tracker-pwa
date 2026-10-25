'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell, BellOff, ChevronLeft, ChevronRight, Calendar, 
  ShieldAlert, Mic, Flame, Sparkles, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { getCurrentCircadianInfo, CircadianInfo } from '@/lib/circadian';
import { triggerHaptic } from '@/lib/feedback';
import { DEFAULT_VAPID_PUBLIC_KEY } from '@/lib/vapid';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type NotificationSetting = 'granted' | 'denied' | 'default';

interface HeaderHUDProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  maxDate?: string;
  streak?: number;
  netWillpowerScore?: number;
  isOnline?: boolean;
  onOpenUrgeDefuser?: () => void;
  onTriggerVoiceDebrief?: () => void;
  isListening?: boolean;
}

export default function HeaderHUD({
  selectedDate,
  onSelectDate,
  maxDate,
  streak = 0,
  netWillpowerScore = 0,
  isOnline: propIsOnline,
  onOpenUrgeDefuser,
  onTriggerVoiceDebrief,
  isListening = false,
}: HeaderHUDProps) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(propIsOnline ?? true);
  const [circadian, setCircadian] = useState<CircadianInfo | null>(null);
  const [permission, setPermission] = useState<NotificationSetting | 'loading'>('loading');
  const [subscription, setSubscription] = useState<any>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifNotice, setNotifNotice] = useState<string | null>(null);

  const dateInputRef = useRef<HTMLInputElement | null>(null);

  // Online status listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (propIsOnline === undefined) {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      setIsOnline(propIsOnline);
    }
  }, [propIsOnline]);

  // Circadian tracker
  useEffect(() => {
    setCircadian(getCurrentCircadianInfo());
    const interval = setInterval(() => {
      setCircadian(getCurrentCircadianInfo());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Notification initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('denied');
      return;
    }

    setPermission(Notification.permission as NotificationSetting);

    navigator.serviceWorker.ready
      .then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setSubscription(sub);
        });
      })
      .catch(() => {});
  }, []);

  // Quick Notification Toggle
  const handleToggleNotifications = async () => {
    if (!user || notifLoading) return;
    triggerHaptic(20);
    setNotifLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        setSubscription(null);
        await fetch('/api/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint, user_id: user.id }),
        });
        showNotice('Daily reminders muted.');
      } else {
        const reqPerm = await Notification.requestPermission();
        setPermission(reqPerm as NotificationSetting);

        if (reqPerm !== 'granted') {
          showNotice('Notification permission blocked in browser.');
          setNotifLoading(false);
          return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
        const converted = urlBase64ToUint8Array(vapidKey);

        const newSub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: converted,
        });

        setSubscription(newSub);
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: newSub, user_id: user.id }),
        });

        showNotice('Daily reminders synchronized.');
      }
    } catch (e: any) {
      showNotice(e.message || 'Notification error.');
    } finally {
      setNotifLoading(false);
    }
  };

  const showNotice = (msg: string) => {
    setNotifNotice(msg);
    setTimeout(() => setNotifNotice(null), 3000);
  };

  const handlePrevDay = () => {
    if (!selectedDate) return;
    triggerHaptic(10);
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    const nextD = String(date.getDate()).padStart(2, '0');
    onSelectDate(`${nextY}-${nextM}-${nextD}`);
  };

  const handleNextDay = () => {
    if (!selectedDate) return;
    if (maxDate && selectedDate >= maxDate) return;
    triggerHaptic(10);
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    const nextD = String(date.getDate()).padStart(2, '0');
    const nextDateStr = `${nextY}-${nextM}-${nextD}`;
    if (!maxDate || nextDateStr <= maxDate) {
      onSelectDate(nextDateStr);
    }
  };

  const isNextDisabled = Boolean(maxDate && selectedDate >= maxDate);

  return (
    <header className="sticky top-0 z-50 w-full h-[48px] backdrop-blur-xl bg-substrate-bg/90 border-b border-substrate-border flex items-center justify-between px-3 sm:px-6 select-none transition-all shadow-xl">
      {/* Left: Identity + Circadian Phase */}
      <div className="flex items-center space-x-2.5">
        <Link href="/" className="flex items-center space-x-1.5 group">
          <span className="font-mono text-xs tracking-[0.25em] text-gold font-bold uppercase hover:text-gold-bright transition-colors">
            REFLECT
          </span>
        </Link>

        {circadian && (
          <div className="hidden sm:flex items-center space-x-1 px-2 py-0.5 border border-substrate-border bg-substrate-card/60 text-[9px] font-mono text-slate-300">
            <span>{circadian.icon}</span>
            <span className="text-gold font-bold uppercase">{circadian.label}</span>
            <span className="text-slate-500">({circadian.countdownMinutes}m)</span>
          </div>
        )}
      </div>

      {/* Center: Minimal Date Navigation < 2026-10-25 > */}
      <div className="flex items-center space-x-1 font-mono text-xs text-slate-300">
        <button
          type="button"
          onClick={handlePrevDay}
          className="p-1 hover:text-gold transition-colors cursor-pointer"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker?.()}
            className="flex items-center space-x-1 px-1.5 py-0.5 hover:text-gold transition-colors cursor-pointer text-slate-200"
          >
            <Calendar className="w-3 h-3 text-gold/70" />
            <span className="tracking-wide text-xs">{selectedDate}</span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            max={maxDate}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
          />
        </div>

        <button
          type="button"
          onClick={handleNextDay}
          disabled={isNextDisabled}
          className={`p-1 transition-colors ${
            isNextDisabled ? 'text-slate-700 cursor-not-allowed' : 'hover:text-gold cursor-pointer'
          }`}
          aria-label="Next day"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Metrics + Quick Actions */}
      <div className="flex items-center space-x-2">
        {/* Willpower Score */}
        <div className="hidden md:flex items-center space-x-1 px-2 py-0.5 border border-gold/30 bg-gold/10 text-gold-bright text-[10px] font-mono font-bold">
          <Sparkles className="w-3 h-3 text-gold" />
          <span>{netWillpowerScore > 0 ? `+${netWillpowerScore}` : netWillpowerScore} WP</span>
        </div>

        {/* Streak Indicator */}
        <div className="flex items-center space-x-1 px-2 py-0.5 border border-substrate-border bg-substrate-card/60 text-slate-300 font-mono text-[10px] font-bold">
          <Flame className="w-3 h-3 text-amber-400" />
          <span>{streak}D</span>
        </div>

        {/* Voice Debrief Trigger */}
        {onTriggerVoiceDebrief && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(20);
              onTriggerVoiceDebrief();
            }}
            className={`p-1.5 border transition-all cursor-pointer ${
              isListening
                ? 'border-red-500 bg-red-950/60 text-red-300 animate-pulse'
                : 'border-substrate-border hover:border-gold text-slate-400 hover:text-gold'
            }`}
            title="Speak Daily Debrief"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        )}

        {/* SOS Emergency Urge Defuser */}
        {onOpenUrgeDefuser && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(30);
              onOpenUrgeDefuser();
            }}
            className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 font-mono text-[9px] uppercase tracking-wider flex items-center space-x-1 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)] cursor-pointer"
            title="Emergency SOS Urge Defuser"
          >
            <ShieldAlert className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="hidden sm:inline">SOS</span>
          </button>
        )}

        {/* Push Notification Toggle Button */}
        <button
          type="button"
          onClick={handleToggleNotifications}
          disabled={notifLoading}
          className={`p-1.5 border transition-all cursor-pointer ${
            subscription
              ? 'border-gold/40 text-gold bg-gold/10'
              : 'border-substrate-border text-slate-500 hover:text-slate-300'
          }`}
          title={subscription ? 'Reminders Active (Click to Mute)' : 'Enable Daily Push Reminders'}
        >
          {notifLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : subscription ? (
            <Bell className="w-3.5 h-3.5" />
          ) : (
            <BellOff className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Online Sync Indicator */}
        <span
          className={`w-2 h-2 rounded-full inline-block shrink-0 ${
            isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-red-500'
          }`}
          title={isOnline ? 'Connected to Orbit' : 'Offline Mode'}
        />
      </div>

      {/* Micro Toast Notification Notice */}
      {notifNotice && (
        <div className="absolute top-12 right-4 px-3 py-1.5 bg-substrate-card border border-gold/40 shadow-2xl text-[10px] font-mono text-slate-200 animate-fade-in z-50">
          {notifNotice}
        </div>
      )}
    </header>
  );
}
