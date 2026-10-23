'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare } from 'lucide-react';
import { triggerHaptic } from '@/lib/feedback';

export default function InstallPwaBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    const isDismissed = localStorage.getItem('reflect_pwa_dismissed') === 'true';
    if (isDismissed) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 3000);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic(20);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('reflect_pwa_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="w-full bg-substrate-card backdrop-blur-md border border-substrate-border rounded-none p-3.5 my-3 corner-brackets relative animate-fade-in select-none">
      <div className="corner-bracket-tr" />
      <div className="corner-bracket-bl" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 border border-substrate-border bg-substrate-bg text-gold shrink-0">
            <Smartphone className="w-4 h-4" strokeWidth={1.5} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-serif text-xs uppercase tracking-wider text-gold font-bold">
                Install Precision PWA
              </h4>
              <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.2 bg-gold/10 text-gold-bright border border-gold/20">
                0 MB • OFFLINE
              </span>
            </div>

            {isIOS ? (
              <p className="font-mono text-[11px] text-slate-400 leading-relaxed">
                Safari Share <Share className="w-3 h-3 inline mx-1 text-gold" /> → <strong className="text-slate-200">"Add to Home Screen" <PlusSquare className="w-3 h-3 inline" /></strong>.
              </p>
            ) : (
              <p className="font-mono text-[11px] text-slate-400 leading-relaxed">
                Add to your home screen for full-screen offline execution and native haptics.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="py-1 px-3 border border-substrate-border hover:border-gold bg-substrate-bg text-gold text-[10px] font-mono tracking-wider uppercase transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Install</span>
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
