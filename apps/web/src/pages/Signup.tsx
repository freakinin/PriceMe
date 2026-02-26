import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Check, TrendingUp, DollarSign, BarChart3, Zap } from 'lucide-react';
import api from '@/lib/api';
import { PLAN_ORDER, PLAN_DISPLAY, PLAN_LIMITS } from '@/config/plans';
import type { PlanName } from '@/config/plans';
import { cn } from '@/lib/utils';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

function limitLabel(val: number): string {
  return val === -1 ? 'Unlimited' : String(val);
}

const FEATURES = [
  { icon: DollarSign, text: 'Know your real profit on every product' },
  { icon: TrendingUp, text: 'Track competitor prices automatically' },
  { icon: BarChart3, text: 'Set prices that grow your business' },
];

export default function Signup() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanName>('free');

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setError('');
    setLoading(true);
    try {
      const { confirmPassword, ...signupData } = data;
      const response = await api.post('/auth/register', signupData);
      localStorage.setItem('token', response.data.token);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">PriceMe</span>
          </div>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Already have an account? <span className="text-primary font-medium">Log in</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="secondary" className="text-xs">Free to start · No credit card required</Badge>
          <h1 className="text-4xl font-bold tracking-tight">
            Price your products right.<br />
            <span className="text-primary">Sell with confidence.</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            PriceMe calculates your real costs, suggests profitable prices, and tracks what competitors charge — so you never undercut yourself again.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing grid */}
        <div>
          <p className="text-center text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">Choose your plan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLAN_ORDER.map((plan) => {
              const display = PLAN_DISPLAY[plan];
              const limits = PLAN_LIMITS[plan];
              const isSelected = plan === selectedPlan;

              return (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    'relative rounded-xl border p-5 text-left flex flex-col gap-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  {display.badge && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="text-[10px] px-2 py-0.5 bg-primary text-primary-foreground">
                        {display.badge}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <p className="font-semibold">{display.name}</p>
                    <p className="text-2xl font-bold mt-1">
                      {display.priceMonthly}
                      {plan !== 'free' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                    </p>
                    {display.priceAnnual && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        or {display.priceAnnual}/mo · {display.priceAnnualNote}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground flex-1">{display.description}</p>

                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      {limitLabel(limits.products)} products
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      {limitLabel(limits.competitors)} competitor slots
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      Unlimited materials &amp; costs
                    </li>
                  </ul>

                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 self-end transition-all',
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30',
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground m-auto mt-0.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sign up form */}
        <div className="max-w-md mx-auto">
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">
                Start with{' '}
                <span className="text-primary capitalize">{PLAN_DISPLAY[selectedPlan].name}</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedPlan === 'free'
                  ? 'No credit card required. Upgrade anytime.'
                  : 'You can upgrade after signing up.'}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create free account'}
                </Button>
              </form>
            </Form>

            <p className="text-xs text-center text-muted-foreground">
              By signing up you agree to our terms of service.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
