import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight, ChevronLeft, BrainCircuit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { coachProfileSchema, type CoachProfileInput } from '@priceme/shared';

interface CoachOnboardingProps {
  onComplete: (data: CoachProfileInput) => Promise<void>;
  isSubmitting: boolean;
  initialValues?: CoachProfileInput;
  onCancel?: () => void;
}

const CRAFT_TYPES = [
  'Jewelry', 'Candles', 'Ceramics / Pottery', 'Woodworking', 'Textiles / Fabric',
  'Soap & Bath', 'Art Prints', 'Leather Goods', 'Glass / Resin', 'Other',
];

const SALES_CHANNELS = ['Etsy', 'Shopify', 'Amazon Handmade', 'Markets / Fairs', 'Instagram', 'Wholesale', 'Own Website'];

const EXPERIENCE_OPTIONS: { value: CoachProfileInput['experience_years']; label: string }[] = [
  { value: '<1year', label: 'Less than 1 year' },
  { value: '1-3years', label: '1–3 years' },
  { value: '3+years', label: '3+ years' },
];

const CHALLENGES = [
  'Pricing my products correctly',
  'Low profit margins',
  'Not enough sales',
  'Standing out from competitors',
  'Managing costs',
  'Scaling my business',
];

const TOTAL_STEPS = 5;

export function CoachOnboarding({ onComplete, isSubmitting, initialValues, onCancel }: CoachOnboardingProps) {
  const [step, setStep] = useState(0);
  const isEditing = !!initialValues;

  const form = useForm<CoachProfileInput>({
    resolver: zodResolver(coachProfileSchema),
    defaultValues: initialValues ?? {
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

  const onSubmit = handleSubmit(async (data) => {
    await onComplete(data);
    onCancel?.();
  });

  const toggleChannel = (channel: string) => {
    const current = values.sales_channels;
    setValue(
      'sales_channels',
      current.includes(channel) ? current.filter(c => c !== channel) : [...current, channel],
    );
  };

  const steps = [
    // Step 0: Craft type
    <div key="craft" className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">What do you primarily make?</h2>
        <p className="text-sm text-muted-foreground mt-1">Coach needs to know your craft to give relevant advice.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CRAFT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setValue('craft_type', type)}
            className={cn(
              'px-3 py-2.5 rounded-lg border text-sm text-left transition-colors',
              values.craft_type === type
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border hover:bg-muted',
            )}
          >
            {type}
          </button>
        ))}
      </div>
      {values.craft_type === 'Other' && (
        <Input
          placeholder="Describe what you make…"
          onChange={(e) => setValue('craft_type', e.target.value || 'Other')}
          className="mt-2"
        />
      )}
    </div>,

    // Step 1: Sales channels
    <div key="channels" className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Where do you sell?</h2>
        <p className="text-sm text-muted-foreground mt-1">Select all that apply.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SALES_CHANNELS.map((channel) => (
          <button
            key={channel}
            type="button"
            onClick={() => toggleChannel(channel)}
            className={cn(
              'px-3 py-2.5 rounded-lg border text-sm text-left transition-colors',
              values.sales_channels.includes(channel)
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border hover:bg-muted',
            )}
          >
            {channel}
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Experience
    <div key="experience" className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">How long have you been in business?</h2>
        <p className="text-sm text-muted-foreground mt-1">This helps Coach set the right expectations.</p>
      </div>
      <div className="space-y-2">
        {EXPERIENCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setValue('experience_years', opt.value)}
            className={cn(
              'w-full px-4 py-3 rounded-lg border text-sm text-left transition-colors',
              values.experience_years === opt.value
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border hover:bg-muted',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>,

    // Step 3: Primary challenge
    <div key="challenge" className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">What's your biggest challenge right now?</h2>
        <p className="text-sm text-muted-foreground mt-1">Coach will prioritize insights around this.</p>
      </div>
      <div className="space-y-2">
        {CHALLENGES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setValue('primary_challenge', c)}
            className={cn(
              'w-full px-4 py-3 rounded-lg border text-sm text-left transition-colors',
              values.primary_challenge === c
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border hover:bg-muted',
            )}
          >
            {c}
          </button>
        ))}
      </div>
    </div>,

    // Step 4: Revenue goal
    <div key="goal" className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">What's your monthly revenue goal?</h2>
        <p className="text-sm text-muted-foreground mt-1">Optional — but Coach can tell you exactly how to hit it.</p>
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Monthly target ($)</Label>
        <Input
          type="number"
          min={0}
          placeholder="e.g. 2000"
          className="text-base"
          defaultValue={initialValues?.monthly_revenue_goal ?? ''}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setValue('monthly_revenue_goal', isNaN(val) ? undefined : val);
          }}
        />
        {errors.monthly_revenue_goal && (
          <p className="text-xs text-red-500">{errors.monthly_revenue_goal.message as string}</p>
        )}
      </div>
    </div>,
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{isEditing ? 'Edit Coach Profile' : 'Set up Coach'}</p>
            <p className="text-xs text-muted-foreground">Step {step + 1} of {TOTAL_STEPS}</p>
          </div>
          {isEditing && onCancel && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Step content — onKeyDown prevents Enter from submitting mid-wizard */}
        <form
          onSubmit={onSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
        >
          {steps[step]}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {step < TOTAL_STEPS - 1 ? (
              <Button
                key="next"
                type="button"
                size="sm"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                key="submit"
                type="submit"
                size="sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Start Coaching'}
                {!isSubmitting && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
