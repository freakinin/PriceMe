import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourSpotlightProps {
  targetId: string | null;
  padding?: number;
  children: ReactNode;
}

const BACKDROP = 'rgba(0, 0, 0, 0.72)';
const TRANSITION = 'all 220ms cubic-bezier(0.4, 0, 0.2, 1)';

export function TourSpotlight({ targetId, padding = 8, children }: TourSpotlightProps) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  const measureTarget = useCallback(() => {
    if (!targetId) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${targetId}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - padding,
      left: r.left - padding,
      width: r.width + padding * 2,
      height: r.height + padding * 2,
    });
  }, [targetId, padding]);

  // Re-measure on resize / scroll
  useEffect(() => {
    measureTarget();
    const handle = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measureTarget);
    };
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [measureTarget]);

  // Re-measure when step changes (after sidebar settles)
  useEffect(() => {
    const t = setTimeout(measureTarget, 100);
    return () => clearTimeout(t);
  }, [targetId, measureTarget]);

  // Poll until element appears (e.g. dashboard stats still loading)
  useEffect(() => {
    if (!targetId || rect) return;
    const interval = setInterval(measureTarget, 200);
    return () => clearInterval(interval);
  }, [targetId, rect, measureTarget]);

  if (!rect) {
    // Full-screen backdrop for welcome step or element not yet found
    return (
      <div
        className="fixed inset-0 z-[9998]"
        style={{ background: BACKDROP }}
      >
        {children}
      </div>
    );
  }

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Top panel */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: Math.max(0, rect.top),
          background: BACKDROP,
          transition: TRANSITION,
          pointerEvents: 'auto',
        }}
      />
      {/* Bottom panel */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: rect.top + rect.height,
          background: BACKDROP,
          transition: TRANSITION,
          pointerEvents: 'auto',
          height: Math.max(0, vh - rect.top - rect.height),
        }}
      />
      {/* Left panel */}
      <div
        className="absolute left-0"
        style={{
          top: rect.top,
          height: rect.height,
          width: Math.max(0, rect.left),
          background: BACKDROP,
          transition: TRANSITION,
          pointerEvents: 'auto',
        }}
      />
      {/* Right panel */}
      <div
        className="absolute right-0"
        style={{
          top: rect.top,
          height: rect.height,
          left: rect.left + rect.width,
          background: BACKDROP,
          transition: TRANSITION,
          pointerEvents: 'auto',
          width: Math.max(0, vw - rect.left - rect.width),
        }}
      />
      {/* Brand-colored ring around the spotlight cutout */}
      <div
        className="absolute pointer-events-none rounded-lg"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow: '0 0 0 2px hsl(18 88% 40%), 0 0 0 4px hsl(18 88% 40% / 0.2)',
          transition: TRANSITION,
        }}
      />
      {/* Tooltip rendered on top */}
      <div style={{ pointerEvents: 'auto' }}>{children}</div>
    </div>
  );
}
