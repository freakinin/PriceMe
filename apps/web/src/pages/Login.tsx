import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CravioIcon } from '@/components/CravioIcon';
import api from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      localStorage.setItem('token', response.data.token);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel: craft illustration ── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col"
        style={{ background: 'linear-gradient(148deg, #ea580c 0%, #c2410c 40%, #7c2d12 100%)' }}
      >
        {/* SVG craft motifs */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 600 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            {/* Linen / canvas texture */}
            <pattern id="linen" width="8" height="8" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="8" y2="8" stroke="white" strokeWidth="0.5" strokeOpacity="0.04" />
              <line x1="8" y1="0" x2="0" y2="8" stroke="white" strokeWidth="0.5" strokeOpacity="0.04" />
            </pattern>
            {/* Dot grid */}
            <pattern id="dotgrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="14" cy="14" r="1.2" fill="white" fillOpacity="0.07" />
            </pattern>
          </defs>

          {/* Background texture layers */}
          <rect width="600" height="900" fill="url(#linen)" />
          <rect width="600" height="900" fill="url(#dotgrid)" />

          {/* ── Large yarn ball — top right corner ── */}
          <g opacity="0.09">
            <circle cx="530" cy="90" r="160" fill="white" />
            <circle cx="530" cy="90" r="110" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="530" cy="90" r="70"  fill="none" stroke="white" strokeWidth="1" />
            {/* Winding curves across ball */}
            <path d="M390 80 C430 30 510 50 560 30"  fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.5" />
            <path d="M385 100 C425 55 510 75 565 55"  fill="none" stroke="white" strokeWidth="1"   strokeOpacity="0.4" />
            <path d="M400 120 C440 70 520 95 560 75"  fill="none" stroke="white" strokeWidth="1"   strokeOpacity="0.35" />
            <path d="M420 140 C455 95 530 115 560 100" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.3" />
          </g>

          {/* ── Price tag #1 — left, mid-high ── */}
          <g transform="translate(65, 210) rotate(-12)">
            {/* Tag body */}
            <rect x="0" y="14" width="100" height="68" rx="7" fill="none" stroke="white" strokeWidth="1.8" strokeOpacity="0.22" />
            {/* Notch strip at top */}
            <rect x="0" y="0"  width="100" height="16" rx="7" fill="none" stroke="white" strokeWidth="1.8" strokeOpacity="0.22" />
            {/* Eyelet */}
            <circle cx="16" cy="8" r="4.5" fill="none" stroke="white" strokeWidth="1.8" strokeOpacity="0.22" />
            {/* String */}
            <path d="M16 3 C16 -8 8 -16 0 -22" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.18" strokeDasharray="4 3" />
            {/* "Price" lines */}
            <line x1="20" y1="34" x2="80" y2="34" stroke="white" strokeWidth="2.2" strokeOpacity="0.22" strokeLinecap="round" />
            <line x1="20" y1="48" x2="65" y2="48" stroke="white" strokeWidth="1.4" strokeOpacity="0.16" strokeLinecap="round" />
            <line x1="20" y1="60" x2="75" y2="60" stroke="white" strokeWidth="1.4" strokeOpacity="0.16" strokeLinecap="round" />
            <line x1="20" y1="72" x2="55" y2="72" stroke="white" strokeWidth="1.2" strokeOpacity="0.13" strokeLinecap="round" />
          </g>

          {/* ── Price tag #2 — right, lower ── */}
          <g transform="translate(400, 440) rotate(18)">
            <rect x="0" y="10" width="68" height="46" rx="5" fill="none" stroke="white" strokeWidth="1.4" strokeOpacity="0.17" />
            <rect x="0" y="0"  width="68" height="12" rx="5" fill="none" stroke="white" strokeWidth="1.4" strokeOpacity="0.17" />
            <circle cx="12" cy="6" r="3.2" fill="none" stroke="white" strokeWidth="1.4" strokeOpacity="0.17" />
            <path d="M12 3 C12 -6 5 -12 0 -16" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.14" strokeDasharray="3 2" />
            <line x1="18" y1="25" x2="52" y2="25" stroke="white" strokeWidth="1.8" strokeOpacity="0.18" strokeLinecap="round" />
            <line x1="18" y1="36" x2="44" y2="36" stroke="white" strokeWidth="1.1" strokeOpacity="0.13" strokeLinecap="round" />
            <line x1="18" y1="46" x2="50" y2="46" stroke="white" strokeWidth="1.1" strokeOpacity="0.13" strokeLinecap="round" />
          </g>

          {/* ── Price tag #3 — tiny, bottom left ── */}
          <g transform="translate(90, 680) rotate(8)">
            <rect x="0" y="8" width="44" height="30" rx="4" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.14" />
            <rect x="0" y="0" width="44" height="9"  rx="4" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.14" />
            <circle cx="8" cy="4.5" r="2.5" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.14" />
            <line x1="13" y1="18" x2="36" y2="18" stroke="white" strokeWidth="1.4" strokeOpacity="0.14" strokeLinecap="round" />
            <line x1="13" y1="28" x2="30" y2="28" stroke="white" strokeWidth="0.9" strokeOpacity="0.11" strokeLinecap="round" />
          </g>

          {/* ── Scissors — center ── */}
          <g transform="translate(240, 310) rotate(30)" opacity="0.17">
            {/* Handle rings */}
            <ellipse cx="0"  cy="0" rx="16" ry="20" fill="none" stroke="white" strokeWidth="1.8" />
            <ellipse cx="34" cy="0" rx="16" ry="20" fill="none" stroke="white" strokeWidth="1.8" />
            {/* Blades */}
            <path d="M14 -10 L110 -42" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M14  10 L110  42" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            {/* Pivot screw */}
            <circle cx="55" cy="-14" r="4" fill="none" stroke="white" strokeWidth="1.5" />
            <circle cx="55" cy="-14" r="1.5" fill="white" />
          </g>

          {/* ── Thread spool — lower left ── */}
          <g transform="translate(50, 530) rotate(-6)" opacity="0.17">
            {/* Top flange */}
            <ellipse cx="40" cy="12"  rx="40" ry="12" fill="none" stroke="white" strokeWidth="1.8" />
            {/* Body */}
            <rect x="8" y="12" width="64" height="50" fill="none" stroke="white" strokeWidth="1.5" />
            {/* Bottom flange */}
            <ellipse cx="40" cy="62"  rx="40" ry="12" fill="none" stroke="white" strokeWidth="1.8" />
            {/* Thread wound lines */}
            <line x1="8" y1="24" x2="72" y2="24" stroke="white" strokeWidth="0.8" strokeOpacity="0.55" />
            <line x1="8" y1="34" x2="72" y2="34" stroke="white" strokeWidth="0.8" strokeOpacity="0.55" />
            <line x1="8" y1="44" x2="72" y2="44" stroke="white" strokeWidth="0.8" strokeOpacity="0.55" />
            <line x1="8" y1="54" x2="72" y2="54" stroke="white" strokeWidth="0.8" strokeOpacity="0.55" />
          </g>

          {/* ── Needle with thread ── */}
          <g transform="translate(370, 520) rotate(-55)" opacity="0.15">
            {/* Needle body */}
            <rect x="-2" y="0" width="4" height="130" rx="2" fill="white" />
            {/* Eye */}
            <ellipse cx="0" cy="18" rx="6" ry="3.5" fill="none" stroke="white" strokeWidth="2" />
            <ellipse cx="0" cy="18" rx="2.5" ry="1.5" fill="none" stroke="none" />
            {/* Thread trailing from eye */}
            <path d="M6 18 C25 25 10 50 30 60 C50 70 35 95 55 100 C75 105 60 130 80 135"
              fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" strokeDasharray="6 4" />
          </g>

          {/* ── Leaf sprig — bottom right ── */}
          <g transform="translate(440, 740) rotate(-10)" opacity="0.14">
            <path d="M0 0 C12 -40 50 -48 55 -18" fill="white" />
            <path d="M0 0 C-12 -35 -48 -30 -45 -5" fill="white" />
            <path d="M0 0 C5 -15 30 -18 32 -5"  fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
            <path d="M0 0 C-6 -12 -28 -12 -26 -2" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
            <line x1="0" y1="0" x2="0" y2="30" stroke="white" strokeWidth="1.2" strokeOpacity="0.4" />
          </g>

          {/* ── Leaf sprig #2 — upper left ── */}
          <g transform="translate(30, 140) rotate(15)" opacity="0.11">
            <path d="M0 0 C8 -28 38 -32 38 -12" fill="white" />
            <path d="M0 0 C-8 -24 -32 -20 -30 -3" fill="white" />
            <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
          </g>

          {/* ── Flowing thread curves across mid-panel ── */}
          <path d="M0 460 C100 440 160 480 260 460 C360 440 420 475 520 460 C560 453 580 458 600 455"
            fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.07" />
          <path d="M0 480 C100 460 160 500 260 480 C360 460 420 495 520 478"
            fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.05" />

          {/* ── Cross-stitch marks — bottom area ── */}
          {[0,1,2,3,4,5,6,7].map(i => (
            <g key={i} transform={`translate(${55 + i * 72}, 840)`} opacity="0.1">
              <line x1="-5" y1="-5" x2="5" y2="5"  stroke="white" strokeWidth="1" />
              <line x1="5"  y1="-5" x2="-5" y2="5" stroke="white" strokeWidth="1" />
            </g>
          ))}
          {[0,1,2,3,4,5,6,7].map(i => (
            <g key={i} transform={`translate(${91 + i * 72}, 865)`} opacity="0.07">
              <line x1="-5" y1="-5" x2="5" y2="5"  stroke="white" strokeWidth="1" />
              <line x1="5"  y1="-5" x2="-5" y2="5" stroke="white" strokeWidth="1" />
            </g>
          ))}
        </svg>

        {/* Brand content — sits above SVG */}
        <div className="relative z-10 flex flex-col h-full p-14 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <CravioIcon size={28} color="white" />
            <span className="font-display text-2xl font-semibold text-white tracking-tight">
              Cravio
            </span>
          </div>

          {/* Tagline */}
          <div className="space-y-4 max-w-sm">
            <h1 className="font-display text-[2.6rem] font-semibold text-white leading-[1.15] tracking-tight">
              Price your craft<br />with confidence.
            </h1>
            <p className="text-white/55 text-sm leading-relaxed">
              Track your materials, calculate real costs, and set prices that truly honour the work you put in.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 bg-background">

        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <CravioIcon size={24} />
          <span className="font-display text-xl font-semibold text-foreground">Cravio</span>
        </div>

        <div className="w-full max-w-[360px] space-y-7">
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to your pricing studio
            </p>
          </div>

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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">Password</FormLabel>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
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

              <Button
                type="submit"
                className="w-full h-10 font-semibold"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            New here?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
