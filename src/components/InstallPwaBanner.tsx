'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, Check } from 'lucide-react';
import { triggerHaptic } from '@/lib/feedback';

export default function InstallPwaBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already in standalone PWA mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    const isDismissed = localStorage.getItem('reflect_pwa_dismissed') === 'true';
    if (isDismissed) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Show after 3 seconds of usage
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
    <div className="craft-card p-4 border border-teal-500/35 bg-zinc-950/95 my-4 animate-fade-in relative shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div 
            className="p-2 rounded-xl border shrink-0"
            style={{ backgroundColor: 'var(--accent-glow)', borderColor: 'var(--accent-border)', color: 'var(--accent)' }}
          >
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-extrabold text-zinc-100 font-ios-serif">Install Reflect as Native App</h4>
              <span className="text-[9px] font-bold font-ios-mono uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">
                0 MB • Offline Ready
              </span>
            </div>

            {isIOS ? (
              <p className="text-xs text-zinc-400 font-ios-sans leading-relaxed">
                Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-teal-400" /> Share button in Safari, then select <strong className="text-zinc-200">"Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 inline mx-0.5" /></strong>.
              </p>
            ) : (
              <p className="text-xs text-zinc-400 font-ios-sans leading-relaxed">
                Add to your home screen for full-screen offline habit tracking and instant push chimes.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              style={{ background: 'var(--accent-gradient)', color: '#09090b' }}
              className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1 cursor-pointer shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
