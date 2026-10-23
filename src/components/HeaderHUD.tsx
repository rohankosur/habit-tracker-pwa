'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, BellOff, Send, X, Info, Share, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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
  isOnline?: boolean;
}

export default function HeaderHUD({
  selectedDate,
  onSelectDate,
  maxDate,
  streak = 0,
  isOnline: propIsOnline,
}: HeaderHUDProps) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(propIsOnline ?? true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationSetting | 'loading'>('loading');
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

    setIsIOSDevice(isIOS);
    setIsStandaloneMode(isStandalone);

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
      .catch((err) => {
        console.warn('Service Worker not ready yet', err);
      });
  }, []);

  // Close drawer on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    if (drawerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [drawerOpen]);

  const handlePrevDay = () => {
    if (!selectedDate) return;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    const prevY = date.getFullYear();
    const prevM = String(date.getMonth() + 1).padStart(2, '0');
    const prevD = String(date.getDate()).padStart(2, '0');
    onSelectDate(`${prevY}-${prevM}-${prevD}`);
  };

  const handleNextDay = () => {
    if (!selectedDate) return;
    if (maxDate && selectedDate >= maxDate) return;
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

  const handleTestNotification = async () => {
    if (!user) return;
    setTesting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ text: 'Test push notification dispatched.', type: 'success' });
      } else {
        if ('Notification' in window && Notification.permission === 'granted') {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            reg.showNotification('Reflect Notification Test 🔔', {
              body: 'Daily precision reflection reminder active.',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
              data: { url: '/' },
            });
            setMessage({ text: 'Local test notification triggered.', type: 'success' });
          } else {
            new Notification('Reflect Notification Test 🔔', {
              body: 'Notifications enabled.',
            });
            setMessage({ text: 'Local notification popped up.', type: 'success' });
          }
        } else {
          throw new Error(data.error || 'Enable notifications before testing.');
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Notification test failed.', type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);

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

        setMessage({ text: 'Reminders disabled.', type: 'info' });
      } else {
        const reqPermission = await Notification.requestPermission();
        setPermission(reqPermission as NotificationSetting);

        if (reqPermission !== 'granted') {
          setMessage({ text: 'Permission denied in browser settings.', type: 'error' });
          setLoading(false);
          return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        const newSub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        setSubscription(newSub);

        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: newSub,
            user_id: user.id,
          }),
        });

        if (res.ok) {
          setMessage({ text: 'Reminders enabled successfully.', type: 'success' });
        } else {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to register subscription.');
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error configuring reminders.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isNextDisabled = Boolean(maxDate && selectedDate >= maxDate);

  return (
    <header className="sticky top-0 z-50 w-full h-[44px] backdrop-blur-md bg-substrate-bg/90 border-b border-substrate-border flex items-center justify-between px-3 sm:px-6 select-none">
      {/* Left: App Identity */}
      <div className="flex items-center space-x-2">
        <Link href="/" className="flex items-center space-x-2 group">
          <span className="font-mono text-xs tracking-[0.25em] text-gold font-bold uppercase hover:text-gold-bright transition-colors">
            REFLECT
          </span>
        </Link>
      </div>

      {/* Center: Minimal Date Navigation < 2026-10-23 > */}
      <div className="flex items-center space-x-1.5 font-mono text-xs text-slate-300">
        <button
          type="button"
          onClick={handlePrevDay}
          className="p-1 hover:text-gold text-slate-400 hover:bg-white/[0.03] transition-colors cursor-pointer"
          aria-label="Previous day"
          title="Previous Day"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
            className="px-2 py-0.5 tracking-wider hover:text-gold-bright hover:bg-white/[0.04] transition-colors cursor-pointer border border-transparent hover:border-substrate-border"
          >
            {selectedDate || '---- -- --'}
          </button>
          <input
            ref={dateInputRef}
            type="date"
            max={maxDate}
            value={selectedDate}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
          />
        </div>

        <button
          type="button"
          onClick={handleNextDay}
          disabled={isNextDisabled}
          className={`p-1 transition-colors cursor-pointer ${
            isNextDisabled ? 'opacity-25 pointer-events-none' : 'hover:text-gold text-slate-400 hover:bg-white/[0.03]'
          }`}
          aria-label="Next day"
          title="Next Day"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Streak Indicator, Push Reminder Bell, Sync Indicator */}
      <div className="flex items-center space-x-2.5">
        {/* Streak Indicator */}
        <div 
          className="px-2 py-0.5 border border-gold/30 bg-gold/5 font-mono text-[11px] text-gold tracking-wider flex items-center space-x-1"
          title={`Active Streak: ${streak} Days`}
        >
          <span>{streak}D</span>
        </div>

        {/* Push Reminder Bell Button */}
        <div className="relative" ref={drawerRef}>
          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-1 text-slate-300 hover:text-gold transition-colors relative cursor-pointer"
            title="Notification Settings & Testing"
            aria-label="Notification Settings"
          >
            <Bell className="w-4 h-4" style={{ strokeWidth: 1.5 }} />
            {/* Status Dot */}
            <span
              className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-full ${
                subscription
                  ? 'bg-gold shadow-[0_0_6px_rgba(212,175,55,0.8)]'
                  : 'bg-slate-600'
              }`}
            />
          </button>

          {/* Slide-out Menu Drawer / Popover */}
          {drawerOpen && (
            <div className="absolute right-0 top-8 w-72 bg-substrate-bg border border-substrate-border shadow-2xl p-4 z-50 corner-brackets animate-fade-in text-slate-200">
              <div className="corner-bracket-tr" />
              <div className="corner-bracket-bl" />
              
              <div className="flex items-center justify-between border-b border-substrate-border pb-2.5 mb-3">
                <span className="font-serif text-xs uppercase tracking-wider text-gold font-bold">
                  Push Reminders
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="text-slate-400 hover:text-gold transition-colors p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {isIOSDevice && !isStandaloneMode ? (
                <div className="space-y-2 text-xs font-mono text-slate-400">
                  <div className="flex items-center space-x-1 text-gold">
                    <Info className="w-3.5 h-3.5" />
                    <span>iOS Configuration</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Install to Home Screen via Safari Share → "Add to Home Screen" to activate push chimes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Status:</span>
                    <span className={subscription ? 'text-gold' : 'text-slate-500'}>
                      {subscription ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={handleToggleNotifications}
                      disabled={loading}
                      className="flex-1 py-1.5 px-2 bg-substrate-card border border-substrate-border hover:border-substrate-borderActive text-slate-200 hover:text-gold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {loading ? 'Processing...' : subscription ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      type="button"
                      onClick={handleTestNotification}
                      disabled={testing}
                      className="py-1.5 px-2.5 bg-substrate-card border border-substrate-border hover:border-substrate-borderActive text-gold text-[11px] uppercase tracking-wider transition-colors cursor-pointer flex items-center space-x-1"
                      title="Trigger push notification test"
                    >
                      <Send className="w-3 h-3" />
                      <span>{testing ? '...' : 'Test'}</span>
                    </button>
                  </div>

                  {message && (
                    <div
                      className={`p-2 text-[10px] border leading-relaxed ${
                        message.type === 'success'
                          ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                          : message.type === 'error'
                          ? 'border-red-500/40 text-red-300 bg-red-500/10'
                          : 'border-gold/30 text-gold-bright bg-gold/5'
                      }`}
                    >
                      {message.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Online Sync Indicator Dot */}
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isOnline
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
              : 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]'
          }`}
          title={isOnline ? 'Online (Cloud Synchronized)' : 'Offline (Local Substrate Cache)'}
        />
      </div>
    </header>
  );
}
