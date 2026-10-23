import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        substrate: {
          bg: '#050711',
          card: 'rgba(10, 14, 30, 0.72)',
          cardHover: 'rgba(16, 22, 46, 0.85)',
          border: 'rgba(212, 175, 55, 0.18)',
          borderActive: 'rgba(212, 175, 55, 0.5)',
        },
        cosmos: {
          bg: '#050711',
          card: 'rgba(10, 14, 30, 0.72)',
          border: 'rgba(212, 175, 55, 0.18)',
        },
        gold: {
          DEFAULT: '#D4AF37',
          dim: '#8A7322',
          bright: '#F3E5AB',
          glow: 'rgba(212, 175, 55, 0.25)',
        },
        blueprint: 'rgba(255, 255, 255, 0.035)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Playfair Display', 'Cinzel', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'SF Mono', 'monospace'],
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
