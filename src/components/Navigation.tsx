'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceLayout, LayoutMode } from '@/contexts/DeviceLayoutContext';
import { 
  CheckSquare, Calendar, BarChart2, Target, Settings, 
  LogOut, Monitor, Smartphone, Zap, Wifi, WifiOff
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { layoutMode, activeDevice, setLayoutMode } = useDeviceLayout();
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

  const isDesktop = activeDevice === 'desktop';

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-850/80 transition-all">
        <div className={`mx-auto px-4 sm:px-6 flex h-14 items-center justify-between gap-3 ${isDesktop ? 'max-w-7xl' : 'max-w-xl'}`}>
          
          {/* App Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group shrink-0">
            <div 
              className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all group-hover:scale-105 shadow-sm"
              style={{ backgroundColor: 'var(--accent-glow)', borderColor: 'var(--accent-border)', color: 'var(--accent)' }}
            >
              <span className="font-extrabold text-base font-handwritten">R</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-zinc-100 font-ios-serif leading-none">Reflect</span>
              <span className="text-[9px] font-ios-mono text-zinc-500 font-semibold tracking-wider uppercase mt-0.5">Personal Journal</span>
            </div>
          </Link>

          {/* Desktop Only Navigation Links (>= 768px) */}
          <nav className="hidden md:flex items-center space-x-1 font-ios-sans">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={isActive ? { backgroundColor: 'var(--accent-glow)', color: 'var(--accent)', borderColor: 'var(--accent-border)' } : {}}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                    isActive
                      ? 'shadow-sm'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'scale-110' : ''}`} />
                  <span>{item.label}</span>

                  {isActive && (
                    <div 
                      className="absolute -bottom-1 left-3 right-3 h-0.5 rounded-full"
                      style={{ background: 'var(--accent-gradient)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Status Toolbar */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Live Sync Status */}
            <div 
              className="p-1.5 rounded-xl border bg-zinc-950 text-xs flex items-center justify-center border-zinc-850"
              title={isOnline ? 'Cloud Sync Active (Online)' : 'Offline Mode (Local Auto-Save Active)'}
            >
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              )}
            </div>

            {/* Layout Mode Switcher */}
            <button
              type="button"
              onClick={cycleLayoutMode}
              className="px-2.5 py-1 rounded-xl text-[10px] font-bold border border-zinc-850 bg-zinc-950 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center space-x-1 cursor-pointer font-ios-mono"
              title={`Layout Mode: ${layoutMode.toUpperCase()}`}
            >
              {layoutMode === 'auto' && <Zap className="w-3 h-3 text-amber-400" />}
              {layoutMode === 'mobile' && <Smartphone className="w-3 h-3 text-teal-400" />}
              {layoutMode === 'desktop' && <Monitor className="w-3 h-3 text-sky-400" />}
              <span className="capitalize hidden sm:inline">{layoutMode}</span>
            </button>

            {/* Sign Out Button */}
            {user && (
              <button
                onClick={() => signOut()}
                className="p-1.5 text-zinc-500 hover:text-red-400 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile iOS Fixed Bottom Tab Bar (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-zinc-950/90 border-t border-zinc-850/90 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
        <nav className="grid grid-cols-5 gap-1 font-ios-sans max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={isActive ? { color: 'var(--accent)' } : {}}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'font-extrabold scale-105'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div 
                  className={`p-1 rounded-lg transition-all ${
                    isActive ? 'border shadow-sm' : ''
                  }`}
                  style={isActive ? { backgroundColor: 'var(--accent-glow)', borderColor: 'var(--accent-border)' } : {}}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className="text-[10px] tracking-tight font-ios-mono mt-0.5 leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
