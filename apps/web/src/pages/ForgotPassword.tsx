import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ChartScatter, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetFormValues = z.infer<typeof resetSchema>;

/* ─────────────────────────────────────────── */
/*  Craft illustration (shared visual motif)   */
/* ─────────────────────────────────────────── */
function CraftPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col"
      style={{ background: 'linear-gradient(148deg, #2a6b4a 0%, #1e5038 55%, #153826 100%)' }}
    >
      {/* SVG motifs */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 560 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="fp-linen" width="8" height="8" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="8" y2="8" stroke="white" strokeWidth="0.5" strokeOpacity="0.04" />
            <line x1="8" y1="0" x2="0" y2="8" stroke="white" strokeWidth="0.5" strokeOpacity="0.04" />
          </pattern>
          <pattern id="fp-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="14" cy="14" r="1.2" fill="white" fillOpacity="0.06" />
          </pattern>
        </defs>

        <rect width="560" height="900" fill="url(#fp-linen)" />
        <rect width="560" height="900" fill="url(#fp-dots)" />

        {/* Yarn ball — top right */}
        <g opacity="0.08">
          <circle cx="500" cy="110" r="155" fill="white" />
          <circle cx="500" cy="110" r="105" fill="none" stroke="white" strokeWidth="1" />
          <path d="M365 98  C408 52 492 72 542 48"  fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.5" />
          <path d="M360 118 C405 70 492 92 547 68"  fill="none" stroke="white" strokeWidth="1"   strokeOpacity="0.4" />
          <path d="M378 138 C422 90 508 112 548 90"  fill="none" stroke="white" strokeWidth="1"   strokeOpacity="0.35" />
        </g>

        {/* Large price tag — left */}
        <g transform="translate(55, 225) rotate(-10)">
          <rect x="0" y="14" width="92" height="64" rx="6" fill="none" stroke="white" strokeWidth="1.6" strokeOpacity="0.2" />
          <rect x="0" y="0"  width="92" height="16" rx="6" fill="none" stroke="white" strokeWidth="1.6" strokeOpacity="0.2" />
          <circle cx="15" cy="8" r="4.5" fill="none" stroke="white" strokeWidth="1.6" strokeOpacity="0.2" />
          <path d="M15 3 C15 -8 7 -16 1 -22" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.15" strokeDasharray="4 3" />
          <line x1="20" y1="34" x2="74" y2="34" stroke="white" strokeWidth="2" strokeOpacity="0.2" strokeLinecap="round" />
          <line x1="20" y1="46" x2="62" y2="46" stroke="white" strokeWidth="1.2" strokeOpacity="0.14" strokeLinecap="round" />
          <line x1="20" y1="58" x2="70" y2="58" stroke="white" strokeWidth="1.2" strokeOpacity="0.14" strokeLinecap="round" />
          <line x1="20" y1="70" x2="55" y2="70" stroke="white" strokeWidth="1" strokeOpacity="0.1" strokeLinecap="round" />
        </g>

        {/* Scissors */}
        <g transform="translate(290, 330) rotate(26)" opacity="0.16">
          <ellipse cx="0"  cy="0" rx="15" ry="19" fill="none" stroke="white" strokeWidth="1.6" />
          <ellipse cx="33" cy="0" rx="15" ry="19" fill="none" stroke="white" strokeWidth="1.6" />
          <path d="M13 -9 L102 -40" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M13  9 L102  40" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="51" cy="-14" r="3.5" fill="none" stroke="white" strokeWidth="1.4" />
          <circle cx="51" cy="-14" r="1.4" fill="white" />
        </g>

        {/* Spool */}
        <g transform="translate(45, 545) rotate(-5)" opacity="0.16">
          <ellipse cx="38" cy="11" rx="38" ry="11" fill="none" stroke="white" strokeWidth="1.6" />
          <rect x="8" y="11" width="60" height="46" fill="none" stroke="white" strokeWidth="1.4" />
          <ellipse cx="38" cy="57" rx="38" ry="11" fill="none" stroke="white" strokeWidth="1.6" />
          <line x1="8" y1="23" x2="68" y2="23" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
          <line x1="8" y1="33" x2="68" y2="33" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
          <line x1="8" y1="43" x2="68" y2="43" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
          <line x1="8" y1="53" x2="68" y2="53" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
        </g>

        {/* Small price tag — lower right */}
        <g transform="translate(395, 460) rotate(18)">
          <rect x="0" y="9" width="60" height="42" rx="5" fill="none" stroke="white" strokeWidth="1.3" strokeOpacity="0.15" />
          <rect x="0" y="0" width="60" height="11" rx="5" fill="none" stroke="white" strokeWidth="1.3" strokeOpacity="0.15" />
          <circle cx="11" cy="5.5" r="3" fill="none" stroke="white" strokeWidth="1.3" strokeOpacity="0.15" />
          <line x1="17" y1="23" x2="46" y2="23" stroke="white" strokeWidth="1.6" strokeOpacity="0.16" strokeLinecap="round" />
          <line x1="17" y1="33" x2="40" y2="33" stroke="white" strokeWidth="1"   strokeOpacity="0.12" strokeLinecap="round" />
          <line x1="17" y1="42" x2="44" y2="42" stroke="white" strokeWidth="1"   strokeOpacity="0.12" strokeLinecap="round" />
        </g>

        {/* Needle with thread */}
        <g transform="translate(360, 500) rotate(-57)" opacity="0.14">
          <rect x="-2" y="0" width="4" height="125" rx="2" fill="white" />
          <ellipse cx="0" cy="18" rx="6" ry="3.5" fill="none" stroke="white" strokeWidth="1.8" />
          <path d="M6 18 C25 26 10 50 30 62 C50 74 34 96 54 104"
            fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" strokeDasharray="5 3" />
        </g>

        {/* Leaf sprig */}
        <g transform="translate(430, 740) rotate(-8)" opacity="0.13">
          <path d="M0 0 C10 -36 48 -44 52 -16" fill="white" />
          <path d="M0 0 C-10 -32 -46 -27 -42 -4" fill="white" />
          <line x1="0" y1="0" x2="0" y2="28" stroke="white" strokeWidth="1.2" strokeOpacity="0.4" />
        </g>

        {/* Wave thread lines */}
        <path d="M0 455 C90 437 155 472 250 455 C345 437 410 470 510 455"
          fill="none" stroke="white" strokeWidth="0.9" strokeOpacity="0.07" />

        {/* Cross-stitch row */}
        {[0,1,2,3,4,5,6,7].map(i => (
          <g key={i} transform={`translate(${50 + i * 68}, 848)`} opacity="0.09">
            <line x1="-5" y1="-5" x2="5" y2="5"  stroke="white" strokeWidth="1" />
            <line x1="5"  y1="-5" x2="-5" y2="5" stroke="white" strokeWidth="1" />
          </g>
        ))}
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-14 justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.13)' }}>
            <ChartScatter className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-2xl font-semibold text-white tracking-tight">
            PriceMe
          </span>
        </div>

        {/* Tagline */}
        <div className="space-y-3 max-w-sm">
          <h2 className="font-display text-3xl font-semibold text-white leading-[1.2] tracking-tight">
            It happens to<br />the best of us.
          </h2>
          <p className="text-white/55 text-sm leading-relaxed">
            Set a new password and get back to what matters — pricing your craft with confidence.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Success state                              */
/* ─────────────────────────────────────────── */
function SuccessPanel() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 bg-background">
      <div className="w-full max-w-[360px] text-center space-y-5">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight">
            Password updated
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your password has been reset successfully.<br />
            You can now sign in with your new password.
          </p>
        </div>
        <Link to="/login">
          <Button className="w-full h-10 font-semibold mt-2">
            Sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Main page                                  */
/* ─────────────────────────────────────────── */
export default function ForgotPassword() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetFormValues) => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: data.email,
        newPassword: data.newPassword,
      });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <CraftPanel />

      {/* ── Right panel ── */}
      {done ? (
        <SuccessPanel />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 bg-background">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <ChartScatter className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-semibold text-foreground">PriceMe</span>
          </div>

          <div className="w-full max-w-[360px] space-y-6">

            {/* Back + heading */}
            <div className="space-y-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
              <div className="space-y-1.5">
                <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight">
                  Reset your password
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email and choose a new password.
                </p>
              </div>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          className="h-10 bg-card"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">New password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Min. 8 characters"
                          className="h-10 bg-card"
                          {...field}
                        />
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
                      <FormLabel className="text-sm font-medium">Confirm new password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-10 bg-card"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="text-sm text-destructive bg-destructive/8 border border-destructive/20 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
                  {loading ? 'Updating password…' : 'Update password'}
                </Button>
              </form>
            </Form>

            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
