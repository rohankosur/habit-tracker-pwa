'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export type LayoutMode = 'auto' | 'mobile' | 'desktop';

interface DeviceLayoutContextType {
  layoutMode: LayoutMode;
  activeDevice: 'mobile' | 'desktop';
  isMobile: boolean;
  isDesktop: boolean;
  setLayoutMode: (mode: LayoutMode) => void;
}

const DeviceLayoutContext = createContext<DeviceLayoutContextType>({
  layoutMode: 'auto',
  activeDevice: 'desktop',
  isMobile: false,
  isDesktop: true,
  setLayoutMode: () => {},
});

export function DeviceLayoutProvider({ children }: { children: React.ReactNode }) {
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>('auto');
  const [detectedDevice, setDetectedDevice] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    const saved = (localStorage.getItem('reflect_layout_mode') as LayoutMode) || 'auto';
    setLayoutModeState(saved);

    let resizeTimer: NodeJS.Timeout | null = null;

    const checkDevice = () => {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortrait = height > width;
      const isPhoneUA = /iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

      // Mobile Mode: Screen width < 768px OR (phone user agent & portrait) OR small touch screen
      if (width < 768 || (isPhoneUA && isPortrait) || (isTouchDevice && width < 600)) {
        setDetectedDevice('mobile');
      } else {
        setDetectedDevice('desktop');
      }
    };

    checkDevice();

    const debouncedCheckDevice = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkDevice, 80);
    };

    window.addEventListener('resize', debouncedCheckDevice);
    window.addEventListener('orientationchange', debouncedCheckDevice);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', debouncedCheckDevice);
      window.removeEventListener('orientationchange', debouncedCheckDevice);
    };
  }, []);

  const setLayoutMode = (mode: LayoutMode) => {
    setLayoutModeState(mode);
    localStorage.setItem('reflect_layout_mode', mode);
  };

  const activeDevice = layoutMode === 'auto' ? detectedDevice : layoutMode;
  const isMobile = activeDevice === 'mobile';
  const isDesktop = activeDevice === 'desktop';

  return (
    <DeviceLayoutContext.Provider value={{ layoutMode, activeDevice, isMobile, isDesktop, setLayoutMode }}>
      <div 
        data-device-mode={activeDevice} 
        className={`min-h-screen transition-all ${
          isMobile ? 'mobile-pwa-mode' : 'desktop-studio-mode'
        }`}
      >
        {children}
      </div>
    </DeviceLayoutContext.Provider>
  );
}

export const useDeviceLayout = () => useContext(DeviceLayoutContext);
