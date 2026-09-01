'use client';

import { useDeviceLayout } from '@/contexts/DeviceLayoutContext';

export default function DeviceMainContainer({ children }: { children: React.ReactNode }) {
  const { isMobile } = useDeviceLayout();

  return (
    <main
      className={`flex-1 w-full mx-auto z-10 relative overflow-x-hidden transition-all duration-300 ${
        isMobile
          ? 'max-w-lg px-4 pt-3 pb-28'
          : 'max-w-7xl px-6 sm:px-8 pt-6 pb-12'
      }`}
    >
      {children}
    </main>
  );
}
