'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number; // in radians
  alpha: number;
  decay: number;
  thickness: number;
}

export default function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let isPaused = false;

    // Window resize handler
    let resizeTimer: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!canvas) return;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initStars();
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    const handleVisibilityChange = () => {
      isPaused = document.hidden;
      if (!isPaused && !animationFrameId) {
        render();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Deep Space Star Colors (Gold, Diamond White, Stellar Blue, Pale Amber)
    const starColors = [
      'rgba(243, 229, 171, ', // Celestial Gold bright
      'rgba(255, 255, 255, ', // Pure diamond white
      'rgba(212, 175, 55, ',  // Deep gold
      'rgba(186, 215, 255, ', // Stellar blue
    ];

    let stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];

    const initStars = () => {
      const starCount = width < 768 ? 90 : 180;
      stars = [];
      for (let i = 0; i < starCount; i++) {
        const baseAlpha = Math.random() * 0.7 + 0.2;
        const colorPrefix = starColors[Math.floor(Math.random() * starColors.length)];
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.4,
          baseAlpha,
          alpha: baseAlpha,
          twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
          color: colorPrefix,
        });
      }
    };

    initStars();

    // Spawn a shooting star at randomized intervals (every 3.5 - 7 seconds)
    let nextShootingStarTime = Date.now() + Math.random() * 3000 + 1000;

    const spawnShootingStar = () => {
      const startX = Math.random() * (width * 0.8) + width * 0.1;
      const startY = Math.random() * (height * 0.4);
      // Trajectory: 30 to 50 degrees downwards to the right
      const angle = (Math.PI / 180) * (Math.random() * 20 + 35);
      const speed = Math.random() * 9 + 12;
      const length = Math.random() * 90 + 70;

      shootingStars.push({
        x: startX,
        y: startY,
        length,
        speed,
        angle,
        alpha: 1.0,
        decay: Math.random() * 0.015 + 0.012,
        thickness: Math.random() * 1.4 + 1.1,
      });

      nextShootingStarTime = Date.now() + Math.random() * 4500 + 3000;
    };

    const render = () => {
      if (isPaused) return;

      ctx.clearRect(0, 0, width, height);

      // 1. Render & Twinkle Stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.alpha += star.twinkleSpeed;
        if (star.alpha >= 0.95 || star.alpha <= 0.15) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${Math.max(0.08, star.alpha)})`;
        ctx.shadowBlur = star.radius > 1.2 ? 6 : 0;
        ctx.shadowColor = '#D4AF37';
        ctx.fill();
      }

      ctx.shadowBlur = 0;

      // 2. Spawn and render Shooting Stars
      const now = Date.now();
      if (now > nextShootingStarTime) {
        spawnShootingStar();
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];

        // Calculate tail coordinates
        const tailX = s.x - Math.cos(s.angle) * s.length;
        const tailY = s.y - Math.sin(s.angle) * s.length;

        // Gradient for luminous meteor tail
        const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${s.alpha})`);
        gradient.addColorStop(0.2, `rgba(243, 229, 171, ${s.alpha * 0.9})`);
        gradient.addColorStop(0.6, `rgba(212, 175, 55, ${s.alpha * 0.4})`);
        gradient.addColorStop(1, `rgba(10, 14, 30, 0)`);

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = s.thickness;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glowing meteor head
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.thickness * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#F3E5AB';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Update position
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.alpha -= s.decay;

        // Remove decayed or out-of-bounds meteors
        if (s.alpha <= 0 || s.x > width + 100 || s.y > height + 100) {
          shootingStars.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
}
