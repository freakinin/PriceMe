import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTour } from './TourContext';
import type { TourStep } from './tourSteps';

const TOOLTIP_WIDTH = 300;
const TOOLTIP_GAP = 20;
const PADDING = 8;
const EDGE_MARGIN = 12;

function computePosition(step: TourStep): React.CSSProperties {
  if (!step.targetId || step.position === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const el = document.querySelector(`[data-tour="${step.targetId}"]`);
  if (!el) {
    return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  switch (step.position) {
    case 'right': {
      let top = r.top + r.height / 2;
      let left = r.right + PADDING + TOOLTIP_GAP;
      top = Math.max(EDGE_MARGIN + 40, Math.min(top, vh - EDGE_MARGIN - 40));
      left = Math.min(left, vw - TOOLTIP_WIDTH - EDGE_MARGIN);
      return { position: 'fixed', top, left, transform: 'translateY(-50%)' };
    }
    case 'left': {
      let top = r.top + r.height / 2;
      const left = r.left - PADDING - TOOLTIP_GAP - TOOLTIP_WIDTH;
      top = Math.max(EDGE_MARGIN + 40, Math.min(top, vh - EDGE_MARGIN - 40));
      return { position: 'fixed', top, left: Math.max(EDGE_MARGIN, left), transform: 'translateY(-50%)' };
    }
    case 'bottom': {
      let top = r.bottom + PADDING + TOOLTIP_GAP;
      let left = r.left + r.width / 2;
      top = Math.min(top, vh - 200 - EDGE_MARGIN);
      left = Math.max(TOOLTIP_WIDTH / 2 + EDGE_MARGIN, Math.min(left, vw - TOOLTIP_WIDTH / 2 - EDGE_MARGIN));
      return { position: 'fixed', top, left, transform: 'translateX(-50%)' };
    }
    case 'top': {
      const top = r.top - PADDING - TOOLTIP_GAP;
      let left = r.left + r.width / 2;
      left = Math.max(TOOLTIP_WIDTH / 2 + EDGE_MARGIN, Math.min(left, vw - TOOLTIP_WIDTH / 2 - EDGE_MARGIN));
      return { position: 'fixed', top, left, transform: 'translate(-50%, -100%)' };
    }
    default:
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
}

export function TourTooltip() {
  const { currentStep, totalSteps, activeSteps, goNext, goBack, endTour } = useTour();
  const step = activeSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  const [posStyle, setPosStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const update = () => setPosStyle(computePosition(step));
    update();
    // Re-calc after spotlight transition settles
    const t = setTimeout(update, 130);
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', update);
    };
  }, [step]);

  if (!step) return null;

  return (
    <div
      style={{ ...posStyle, zIndex: 9999, width: TOOLTIP_WIDTH }}
      className="bg-card border border-border rounded-xl shadow-2xl p-5 select-none"
    >
      {/* Progress dots + close */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === currentStep ? 18 : 6,
                  background: i === currentStep ? 'hsl(18 88% 40%)' : 'hsl(36 30% 80%)',
                }}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>
        <button
          onClick={() => endTour(false)}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
          aria-label="Skip tour"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <h3 className="text-sm font-semibold text-foreground mb-1.5">{step.title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{step.description}</p>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={() => endTour(false)}
        >
          Skip
        </Button>
        <div className="flex gap-2">
          {!isFirst && (
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={goBack}>
              <ChevronLeft className="h-3 w-3 mr-0.5" />
              Back
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 px-3 text-xs text-white"
            style={{ background: 'hsl(18 88% 40%)' }}
            onClick={goNext}
          >
            {isLast ? 'Got it!' : 'Next'}
            {!isLast && <ChevronRight className="h-3 w-3 ml-0.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
