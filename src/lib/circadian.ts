// Circadian Solar Engine: Maps daily habits to human biological rhythms

export type CircadianPhase = 'dawn' | 'peak' | 'afternoon' | 'dusk' | 'restoration';

export interface CircadianInfo {
  phase: CircadianPhase;
  label: string;
  tagline: string;
  icon: string;
  nextMilestone: string;
  countdownMinutes: number;
  solarHourProgress: number; // 0 to 1 through the 24h cycle
}

export function getCurrentCircadianInfo(): CircadianInfo {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTotalMinutes = hours * 60 + minutes;

  // Solar progress float (0.0 at midnight, 0.5 at noon)
  const solarHourProgress = currentTotalMinutes / 1440;

  if (hours >= 6 && hours < 9) {
    const endMinutes = 9 * 60;
    return {
      phase: 'dawn',
      label: 'Dawn Anchor',
      tagline: 'Sunlight photons, hydration & delayed caffeine window.',
      icon: '🌅',
      nextMilestone: 'Solar Peak Focus',
      countdownMinutes: endMinutes - currentTotalMinutes,
      solarHourProgress,
    };
  }

  if (hours >= 9 && hours < 13) {
    const endMinutes = 13 * 60;
    return {
      phase: 'peak',
      label: 'Solar Peak Focus',
      tagline: 'Peak cortisol & dopamine. Prime window for hardest task.',
      icon: '☀️',
      nextMilestone: 'Adenosine Reset & Caffeine Cutoff (14:00)',
      countdownMinutes: endMinutes - currentTotalMinutes,
      solarHourProgress,
    };
  }

  if (hours >= 13 && hours < 17) {
    const caffeineCutoffMinutes = 14 * 60;
    const isPastCutoff = currentTotalMinutes >= caffeineCutoffMinutes;
    const endMinutes = 17 * 60;
    return {
      phase: 'afternoon',
      label: 'Adenosine Reset',
      tagline: isPastCutoff
        ? 'Caffeine cutoff locked. Walk outside to clear adenosine.'
        : 'Caffeine cutoff approaching at 14:00. Prioritize movement.',
      icon: '🌤️',
      nextMilestone: isPastCutoff ? 'Dusk Wind-down' : '14:00 Caffeine Cutoff',
      countdownMinutes: isPastCutoff ? endMinutes - currentTotalMinutes : caffeineCutoffMinutes - currentTotalMinutes,
      solarHourProgress,
    };
  }

  if (hours >= 17 && hours < 22) {
    const endMinutes = 22 * 60;
    return {
      phase: 'dusk',
      label: 'Dusk Wind-Down',
      tagline: 'Dim blue light, digital sunset, and physical relaxation.',
      icon: '🌇',
      nextMilestone: 'Melatonin Window (22:00)',
      countdownMinutes: endMinutes - currentTotalMinutes,
      solarHourProgress,
    };
  }

  // Deep Restoration (22:00 to 06:00)
  const morningMinutes = 6 * 60;
  const remaining = hours >= 22 ? (24 * 60 - currentTotalMinutes) + morningMinutes : morningMinutes - currentTotalMinutes;
  return {
    phase: 'restoration',
    label: 'Deep Restoration',
    tagline: 'Melatonin surge, core temperature drop & cellular repair.',
    icon: '🌙',
    nextMilestone: 'Dawn Sunrise (06:00)',
    countdownMinutes: remaining,
    solarHourProgress,
  };
}

// Maps habits/prompts to their ideal circadian phase if not explicitly defined
export function inferHabitCircadianPhase(prompt: string): CircadianPhase {
  const p = prompt.toLowerCase();
  if (p.includes('sun') || p.includes('light') || p.includes('water') || p.includes('cold') || p.includes('morning') || p.includes('wake')) {
    return 'dawn';
  }
  if (p.includes('deep work') || p.includes('focus') || p.includes('read') || p.includes('study') || p.includes('workout') || p.includes('gym')) {
    return 'peak';
  }
  if (p.includes('caffeine') || p.includes('coffee') || p.includes('walk') || p.includes('afternoon') || p.includes('stretch')) {
    return 'afternoon';
  }
  if (p.includes('sleep') || p.includes('screen') || p.includes('journal') || p.includes('meditat') || p.includes('night') || p.includes('relax')) {
    return 'dusk';
  }
  return 'peak';
}
