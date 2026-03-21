import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useSettings } from '@/hooks/useSettings';
import { track } from '@/lib/analytics';
import {
  TOUR_STEPS,
  PRODUCT_TOUR_STEPS,
  MARKET_ANALYSIS_TOUR_STEPS,
  COACH_TOUR_STEPS,
  type TourStep,
} from './tourSteps';

// ── Storage keys ─────────────────────────────────────────────────────────────
const APP_SESSION_KEY      = 'cravio_tour_dismissed';
const PRODUCT_TOUR_KEY     = 'cravio_product_intro_done';
const MARKET_TOUR_KEY      = 'cravio_market_intro_done';
const COACH_TOUR_KEY       = 'cravio_coach_intro_done';

export { PRODUCT_TOUR_KEY  as PRODUCT_TOUR_STORAGE_KEY };
export { MARKET_TOUR_KEY   as MARKET_TOUR_STORAGE_KEY };
export { COACH_TOUR_KEY    as COACH_TOUR_STORAGE_KEY };

// ── Context shape ─────────────────────────────────────────────────────────────
interface TourContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  activeSteps: TourStep[];
  startAppTour: () => void;
  startProductTour: () => void;
  startMarketAnalysisTour: () => void;
  startCoachTour: () => void;
  endTour: (completed: boolean) => void;
  goNext: () => void;
  goBack: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function TourProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings();
  const [isActive, setIsActive]       = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeSteps, setActiveSteps] = useState<TourStep[]>(TOUR_STEPS);

  // Helper: begin a tour with a given steps array
  const begin = useCallback((steps: TourStep[]) => {
    setActiveSteps(steps);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  // ── Named starters ────────────────────────────────────────────────────────
  const startAppTour = useCallback(() => {
    begin(TOUR_STEPS);
    track({ event: 'onboarding_tour_started' });
  }, [begin]);

  const startProductTour = useCallback(() => {
    begin(PRODUCT_TOUR_STEPS);
  }, [begin]);

  const startMarketAnalysisTour = useCallback(() => {
    begin(MARKET_ANALYSIS_TOUR_STEPS);
  }, [begin]);

  const startCoachTour = useCallback(() => {
    begin(COACH_TOUR_STEPS);
  }, [begin]);

  // ── Auto-start app tour for brand-new users (signup only, not login) ────────
  useEffect(() => {
    if (
      settings &&
      settings.onboarding_completed === false &&
      localStorage.getItem('cravio_new_signup') === '1'
    ) {
      const t = setTimeout(() => {
        localStorage.removeItem('cravio_new_signup');
        setActiveSteps(TOUR_STEPS);
        setCurrentStep(0);
        setIsActive(true);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [settings?.onboarding_completed]);

  // ── 'start-tour' event → re-play app tour (Settings "Take a Tour" button) ─
  useEffect(() => {
    const handler = () => startAppTour();
    window.addEventListener('start-tour', handler);
    return () => window.removeEventListener('start-tour', handler);
  }, [startAppTour]);

  // ── 'start-page-tour' event → page-specific tour (? button in header) ────
  useEffect(() => {
    const handler = (e: Event) => {
      const path = (e as CustomEvent<{ path: string }>).detail?.path ?? '';
      if (path === '/products/add') {
        startProductTour();
      } else if (path.startsWith('/market-analysis')) {
        startMarketAnalysisTour();
      } else if (path === '/coach') {
        startCoachTour();
      } else {
        startAppTour();
      }
    };
    window.addEventListener('start-page-tour', handler);
    return () => window.removeEventListener('start-page-tour', handler);
  }, [startAppTour, startProductTour, startMarketAnalysisTour, startCoachTour]);

  // ── endTour ───────────────────────────────────────────────────────────────
  const endTour = useCallback(
    async (completed: boolean) => {
      const wasAppTour = activeSteps === TOUR_STEPS;
      setIsActive(false);
      setCurrentStep(0);

      if (wasAppTour) {
        sessionStorage.setItem(APP_SESSION_KEY, '1');
        if (completed) {
          track({ event: 'onboarding_tour_completed' });
        } else {
          track({ event: 'onboarding_tour_skipped', step_reached: currentStep });
        }
        try { await updateSettings({ onboarding_completed: true }); } catch { /* non-critical */ }
      } else if (activeSteps === PRODUCT_TOUR_STEPS) {
        localStorage.setItem(PRODUCT_TOUR_KEY, '1');
      } else if (activeSteps === MARKET_ANALYSIS_TOUR_STEPS) {
        localStorage.setItem(MARKET_TOUR_KEY, '1');
      } else if (activeSteps === COACH_TOUR_STEPS) {
        localStorage.setItem(COACH_TOUR_KEY, '1');
      }
    },
    [activeSteps, currentStep, updateSettings]
  );

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      endTour(true);
    }
  }, [currentStep, activeSteps.length, endTour]);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: activeSteps.length,
        activeSteps,
        startAppTour,
        startProductTour,
        startMarketAnalysisTour,
        startCoachTour,
        endTour,
        goNext,
        goBack,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}
