'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceLayout, LayoutMode } from '@/contexts/DeviceLayoutContext';
import { 
  CheckSquare, Calendar, BarChart2, Target, Settings, 
  LogOut, Monitor, Smartphone, Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import BottomNav from './BottomNav';

export default function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { layoutMode, activeDevice, isMobile, isDesktop, setLayoutMode } = useDeviceLayout();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!user && pathname === '/login') {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Track', icon: CheckSquare },
    { href: '/history', label: 'History', icon: Calendar },
    { href: '/charts', label: 'Analytics', icon: BarChart2 },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/settings/questions', label: 'Settings', icon: Settings },
  ];

  const cycleLayoutMode = () => {
    const modes: LayoutMode[] = ['auto', 'mobile', 'desktop'];
    const nextIdx = (modes.indexOf(layoutMode) + 1) % modes.length;
    setLayoutMode(modes[nextIdx]);
  };

  return (
    <>
      {/* Desktop 16:9 Studio Navigation Header (44px) */}
      {isDesktop && (
        <header className="sticky top-0 z-40 w-full h-[44px] backdrop-blur-md bg-substrate-bg/90 border-b border-substrate-border flex items-center select-none transition-all">
          <div className="mx-auto px-6 w-full max-w-7xl flex items-center justify-between gap-4">
            {/* Identity */}
            <Link href="/" className="flex items-center space-x-2 shrink-0 group">
              <span className="font-mono text-xs tracking-[0.25em] text-gold font-bold uppercase hover:text-gold-bright transition-colors">
                REFLECT
              </span>
              <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest border-l border-substrate-border pl-2">
                16:9 STUDIO
              </span>
            </Link>

            {/* Center: Nav Items */}
            <nav className="flex items-center space-x-1 font-mono text-xs">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-3 py-1.5 transition-colors flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider text-[11px] ${
                      isActive
                        ? 'text-gold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{item.label}</span>

                    {isActive && (
                      <div className="absolute bottom-0 left-2 right-2 h-[1.5px] bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Status Toolbar */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* Online Indicator */}
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                    : 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                }`}
                title={isOnline ? 'Online (Cloud Sync Active)' : 'Offline (Substrate Cache Active)'}
              />

              {/* Layout Mode Switcher */}
              <button
                type="button"
                onClick={cycleLayoutMode}
                className="px-2 py-0.5 text-[10px] border border-substrate-border bg-substrate-card text-slate-300 hover:text-gold transition-colors flex items-center space-x-1 cursor-pointer font-mono uppercase tracking-wider"
                title={`Layout Mode: ${layoutMode.toUpperCase()} (Toggle Auto / Mobile / PC)`}
              >
                {layoutMode === 'auto' && <Zap className="w-3 h-3 text-gold" strokeWidth={1.5} />}
                {layoutMode === 'mobile' && <Smartphone className="w-3 h-3 text-gold" strokeWidth={1.5} />}
                {layoutMode === 'desktop' && <Monitor className="w-3 h-3 text-gold" strokeWidth={1.5} />}
                <span>{layoutMode}</span>
              </button>

              {/* Sign Out */}
              {user && (
                <button
                  onClick={() => signOut()}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Mobile Bottom Dock (52px) */}
      {isMobile && <BottomNav />}
    </>
  );
}
