'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Calendar, BarChart2, Target, Settings } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Track', icon: CheckSquare },
    { href: '/history', label: 'History', icon: Calendar },
    { href: '/charts', label: 'Analytics', icon: BarChart2 },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/settings/questions', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-[52px] backdrop-blur-lg bg-substrate-bg/85 border-t border-substrate-border flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] select-none">
      <div className="w-full max-w-lg mx-auto flex items-center justify-around h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer group ${
                isActive ? 'text-gold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Subtle 1.5px gold top-border glow */}
              {isActive && (
                <div className="absolute top-0 left-2 right-2 h-[1.5px] bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
              )}

              <Icon
                className="w-4 h-4 mb-0.5"
                strokeWidth={1.5}
              />
              <span className="font-mono text-[10px] tracking-widest uppercase leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
