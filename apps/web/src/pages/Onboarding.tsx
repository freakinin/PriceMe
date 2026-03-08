import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronRight,
  ChevronLeft,
  BrainCircuit,
  Check,
  Paintbrush2,
  ShoppingBag,
  Clock,
  Target,
  DollarSign,
  Sparkles,
  TrendingUp,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { coachProfileSchema, type CoachProfileInput } from '@priceme/shared';
import { useCoach } from '@/hooks/useCoach';
import { track } from '@/lib/analytics';
import {
  CoachProfileSteps,
  EXPERIENCE_OPTIONS,
  TOTAL_STEPS,
} from '@/components/coach/CoachOnboarding';

// ---------------------------------------------------------------------------
// Value prop cards shown on the left before the user starts answering
// ---------------------------------------------------------------------------

const VALUE_PROPS = [
  {
    icon: Lightbulb,
    title: 'Insights for your craft',
    body: 'Not generic advice — specific to what you make and where you sell.',
  },
  {
    icon: TrendingUp,
    title: 'Calibrated to where you are',
    body: "No beginner fluff if you're 3 years in. No advanced complexity if you're just starting.",
  },
  {
    icon: Target,
    title: 'A path to your goal',
    body: 'Tell us your revenue target and Coach will map the exact route to get there.',
  },
];

// ---------------------------------------------------------------------------
// Profile preview row config — shown on the left after step 0
// ---------------------------------------------------------------------------

function ProfilePreview({
  step,
  values,
}: {
  step: number;
  values: CoachProfileInput;
}) {
  const experienceLabel = EXPERIENCE_OPTIONS.find(o => o.value === values.experience_years)?.label ?? '—';
  const channelsLabel = values.sales_channels.length > 0
    ? values.sales_channels.join(', ')
    : null;
  const goalLabel = values.monthly_revenue_goal
    ? `$${values.monthly_revenue_goal.toLocaleString()}/mo`
    : null;

  const rows = [
    {
      icon: Paintbrush2,
      label: values.craft_type || '—',
      sublabel: 'Craft',
      filled: step >= 1 && !!values.craft_type,
      visible: true,
    },
    {
      icon: ShoppingBag,
      label: channelsLabel ?? '—',
      sublabel: 'Sells on',
      filled: step >= 2 && !!channelsLabel,
      visible: true,
    },
    {
      icon: Clock,
      label: experienceLabel,
      sublabel: 'In business',
      filled: step >= 3,
      visible: true,
    },
    {
      icon: Target,
      label: values.primary_challenge || '—',
      sublabel: 'Biggest challenge',
      filled: step >= 4 && !!values.primary_challenge,
      visible: true,
    },
    {
      icon: DollarSign,
      label: goalLabel ?? 'No goal set yet',
      sublabel: 'Monthly goal',
      filled: step >= 4 && goalLabel !== null,
      visible: true,
    },
  ];

  const allFilled = step >= 4 && !!values.craft_type && !!channelsLabel && !!values.primary_challenge;

  return (
    <div className="w-full space-y-3">
      <div className="mb-5">
        <p className="text-white/60 text-xs uppercase tracking-widest font-medium mb-1">Your Coach Profile</p>
        <div className="h-px bg-white/20" />
      </div>

      {rows.map((row, i) => {
        const Icon = row.icon;
        return (
          <div
            key={i}
            className={cn(
              'flex items-start gap-3 transition-all duration-500',
              row.filled ? 'opacity-100' : 'opacity-30',
            )}
          >
            <div className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-500',
              row.filled ? 'bg-white/20' : 'bg-white/10',
            )}>
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-[10px] uppercase tracking-wider">{row.sublabel}</p>
              <p className={cn(
                'text-sm leading-snug truncate transition-colors duration-500',
                row.filled ? 'text-white font-medium' : 'text-white/40',
              )}>
                {row.label}
              </p>
            </div>
            {row.filled && (
              <Check className="h-4 w-4 text-brand-300 flex-shrink-0 mt-1" />
            )}
          </div>
        );
      })}

      <div className={cn(
        'mt-6 pt-5 border-t border-white/20 transition-all duration-500',
        allFilled ? 'opacity-100' : 'opacity-0',
      )}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-300" />
          <p className="text-white text-sm font-medium">Your profile is ready!</p>
        </div>
        <p className="text-white/60 text-xs mt-1">Coach will start generating personalized insights.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding page
// ---------------------------------------------------------------------------

export default function Onboarding() {
  const navigate = useNavigate();
  const { profile, isProfileLoading, upsertProfile, isUpsertingProfile, generateInsights } = useCoach();

  const [step, setStep] = useState(0);
  const [hasAdvanced, setHasAdvanced] = useState(false);

  // Route guard — if user already has a profile, redirect to dashboard
  useEffect(() => {
    if (!isProfileLoading && profile) {
      navigate('/', { replace: true });
    }
  }, [isProfileLoading, profile, navigate]);

  const form = useForm<CoachProfileInput>({
    resolver: zodResolver(coachProfileSchema),
    defaultValues: {
      craft_type: '',
      sales_channels: [],
      experience_years: '<1year',
      primary_challenge: '',
      monthly_revenue_goal: undefined,
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors } } = form;
  const values = watch();

  const canProceed = () => {
    switch (step) {
      case 0: return !!values.craft_type;
      case 1: return values.sales_channels.length > 0;
      case 2: return !!values.experience_years;
      case 3: return !!values.primary_challenge;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!hasAdvanced) setHasAdvanced(true);
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setStep(s => s - 1);
  };

  const handleSkip = () => {
    localStorage.setItem('cravio_onboarding_skipped', '1');
    track({ event: 'coach_onboarding_skipped' });
    // Clear the tour session key so new users always see the app walkthrough
    sessionStorage.removeItem('cravio_tour_dismissed');
    navigate('/', { replace: true });
  };

  const onSubmit = handleSubmit(async (data) => {
    await upsertProfile(data);
    track({ event: 'coach_onboarding_completed', craft_type: data.craft_type, experience_years: data.experience_years });
    // Fire insight generation in the background — user goes to dashboard immediately
    generateInsights().catch(() => {});
    // Clear the tour session key so new users always see the app walkthrough
    sessionStorage.removeItem('cravio_tour_dismissed');
    navigate('/', { replace: true });
  });

  // While checking if profile exists, show nothing to avoid flash
  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  const showProfilePreview = hasAdvanced;

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(148deg, #ea580c 0%, #c2410c 40%, #7c2d12 100%)',
        }}
      >
        {/* Decorative background circles */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-black/10 pointer-events-none" />

        {/* Top: wordmark */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
            <BrainCircuit className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Cravio</span>
        </div>

        {/* Middle: value prop or profile preview */}
        <div className="relative z-10 transition-all duration-500">
          {!showProfilePreview ? (
            /* Phase 1 — value proposition */
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <p className="text-white/70 text-sm uppercase tracking-widest font-medium mb-3">Coach</p>
                <h2 className="font-display text-3xl font-semibold text-white leading-tight">
                  Your pricing coach,<br />built around you.
                </h2>
                <p className="text-white/60 text-sm mt-3">
                  Takes about 60 seconds. Your answers unlock insights tailored to your craft.
                </p>
              </div>

              <div className="space-y-3">
                {VALUE_PROPS.map((vp, i) => {
                  const Icon = vp.icon;
                  return (
                    <div key={i} className="flex gap-3.5 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                      <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{vp.title}</p>
                        <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{vp.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Phase 2 — live profile preview */
            <div className="animate-in fade-in duration-500">
              <ProfilePreview step={step} values={values} />
            </div>
          )}
        </div>

        {/* Bottom: reassurance */}
        <p className="text-white/40 text-xs relative z-10">
          You can update your profile anytime from the Coach page.
        </p>
      </div>

      {/* ── Right panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen bg-warm-50">

        {/* Mobile: brand header */}
        <div className="lg:hidden flex items-center gap-2.5 px-6 pt-6">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(148deg, #ea580c, #7c2d12)' }}
          >
            <BrainCircuit className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-foreground">Cravio</span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 py-10 max-w-lg mx-auto w-full">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Set up your Coach profile
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Step {step + 1} of {TOTAL_STEPS}
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-primary rounded-full transition-all duration-400"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          {/* Step content */}
          <form
            onSubmit={onSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            className="space-y-6"
          >
            <CoachProfileSteps
              step={step}
              values={values}
              setValue={setValue}
              errors={errors}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="text-muted-foreground"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                >
                  Skip for now
                </button>
              </div>

              {step < TOTAL_STEPS - 1 ? (
                <Button
                  key="next"
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  key="submit"
                  type="submit"
                  disabled={isUpsertingProfile}
                >
                  {isUpsertingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up…
                    </>
                  ) : (
                    <>
                      Finish Setup
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
