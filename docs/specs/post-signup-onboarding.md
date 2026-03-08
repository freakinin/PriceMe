# Post-Signup Onboarding — Spec & Architecture

## Overview

A dedicated full-page onboarding wizard shown immediately after user registration. It collects the Coach profile (5 questions) while the user is at peak motivation, activating the AI Coach feature before the user even navigates to it.

**Route:** `/onboarding`
**Branch:** `feat/post-signup-onboarding`

---

## User Flow

```
Signup form submit
    ↓
POST /auth/register (success)
    ↓
window.location.href = '/onboarding'  ← hard redirect to pick up fresh JWT
    ↓
/onboarding loads
    ├── Route guard: profile exists? → redirect to /
    ├── Step 0 → Step 4 (questionnaire)
    │       ├── Skip at any point → localStorage flag + redirect to /
    │       └── Complete → upsertProfile → generateInsights (bg) → redirect to /
    └── Dashboard: coach nudge shown if profile still missing + not dismissed
```

---

## Page Layout

Two-panel, full-viewport (mirrors Signup `FormStep` layout).

### Left Panel (desktop only, 45% width)
- Brand gradient background: `linear-gradient(148deg, #ea580c 0%, #c2410c 40%, #7c2d12 100%)`
- **Phase 1** (step 0, before user advances): Value proposition
  - Headline: "Your pricing coach, built around you."
  - Three feature cards: craft insights, experience calibration, revenue goal path
- **Phase 2** (after user advances past step 0): Live profile preview card
  - 5 rows: Craft, Channels, Experience, Challenge, Revenue goal
  - Unfilled rows: opacity 30% (dimmed)
  - Filled rows: opacity 100% + white checkmark + brand-300 accent
  - "Your profile is ready!" message when all filled
- Phase transition: controlled by `hasAdvanced` state (sticky — stays in Phase 2 if user goes back to step 0)

### Right Panel (flex-1)
- Mobile: brand gradient icon + wordmark at top
- "Set up your Coach profile" heading (Playfair Display / `font-display`)
- "Step X of 5" label + progress bar (`bg-primary`, transitions on step change)
- `CoachProfileSteps` component renders the current step
- Navigation row:
  - Left: `← Back` (ghost button, disabled on step 0) + "Skip for now" (text link)
  - Right: `Next →` (steps 0–3) | `Finish Setup` (step 4, submits form)

---

## Components

### `CoachProfileSteps` (extracted from `CoachOnboarding.tsx`)
**File:** `apps/web/src/components/coach/CoachOnboarding.tsx`
**Export type:** Named export

Props:
```typescript
interface CoachProfileStepsProps {
  step: number;
  values: CoachProfileInput;
  setValue: UseFormSetValue<CoachProfileInput>;
  errors: FieldErrors<CoachProfileInput>;
  initialMonthlyGoal?: number;
}
```

Renders only the step JSX — no modal shell, no nav buttons, no progress bar. Used by:
- `CoachOnboarding` (modal wrapper, unchanged behavior)
- `Onboarding` page (full-page wrapper)

### Exported constants (from `CoachOnboarding.tsx`)
- `CRAFT_TYPES: string[]`
- `SALES_CHANNELS: string[]`
- `EXPERIENCE_OPTIONS: { value, label }[]`
- `CHALLENGES: string[]`
- `TOTAL_STEPS: number` (= 5)

### `ProfilePreview` (internal to `Onboarding.tsx`)
Renders the live profile card in Phase 2. All 5 rows always visible; opacity controlled by `step` and whether the value is set. Uses Lucide icons. Animations via Tailwind `transition-all duration-500`.

---

## State Management

### Onboarding page
```typescript
const [step, setStep] = useState(0);         // current step (0–4)
const [hasAdvanced, setHasAdvanced] = useState(false); // sticky: Phase 1 → 2
const form = useForm<CoachProfileInput>({ ... }); // react-hook-form
const { profile, isProfileLoading, upsertProfile, isUpsertingProfile, generateInsights } = useCoach();
```

### Route guard
```typescript
useEffect(() => {
  if (!isProfileLoading && profile) navigate('/', { replace: true });
}, [isProfileLoading, profile, navigate]);
```
Prevents flash by showing a spinner while `isProfileLoading` is true.

### Skip / nudge state (localStorage)
| Key | Set when | Checked by |
|-----|----------|------------|
| `cravio_onboarding_skipped` | User clicks "Skip for now" | Not currently read (future use) |
| `cravio_coach_nudge_dismissed` | User clicks ✕ on dashboard nudge | `Home.tsx` on mount |

---

## Data Flow

### On completion
1. `upsertProfile(data)` — `POST /coach/profile` (awaited)
2. `track({ event: 'coach_onboarding_completed', ... })` — analytics
3. `generateInsights()` — `POST /coach/insights/generate` (fire-and-forget, `.catch(() => {})`)
4. `navigate('/', { replace: true })`

Insight generation is non-blocking: user goes to dashboard immediately. When they later navigate to `/coach`, insights are ready (or still generating — the Coach page handles both states).

### On skip
1. `localStorage.setItem('cravio_onboarding_skipped', '1')`
2. `track({ event: 'coach_onboarding_skipped' })`
3. `navigate('/', { replace: true })`

The Coach page's existing `CoachOnboarding` modal still activates when a user with no profile visits `/coach` — no regression.

---

## Route Configuration

**File:** `apps/web/src/App.tsx`

```tsx
<Route
  path="/onboarding"
  element={
    <ProtectedRoute>
      <Onboarding />
    </ProtectedRoute>
  }
/>
```

- Wrapped in `ProtectedRoute` (redirects to `/login` if unauthenticated)
- No `AppLayout` wrapper — the page has its own full-viewport shell
- `PublicRoute` on `/signup` already redirects authenticated users to `/`, so they cannot re-enter signup after registration

---

## Dashboard Nudge

**File:** `apps/web/src/pages/Home.tsx`

Shown for existing users who have no Coach profile and haven't dismissed the nudge.

```typescript
const { profile, isProfileLoading } = useCoach();
const [nudgeDismissed, setNudgeDismissed] = useState(
  () => localStorage.getItem('cravio_coach_nudge_dismissed') === '1'
);
const showCoachNudge = !isProfileLoading && !profile && !nudgeDismissed;
```

Position: between the welcome header and the stats grid.
Design: `bg-brand-100 border-brand-500/25` banner with BrainCircuit icon, "Set up now →" button navigating to `/onboarding`, and a dismiss ✕.

The nudge naturally disappears once `profile` is set (after user completes onboarding from `/coach` modal or the onboarding page).

---

## Analytics Events

| Event | Fired when | Properties |
|-------|-----------|------------|
| `coach_onboarding_completed` | Form submitted successfully | `craft_type`, `experience_years` |
| `coach_onboarding_skipped` | "Skip for now" clicked | — |

Both defined in `apps/web/src/lib/analytics.ts` under `CoachEvent`.

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/components/coach/CoachOnboarding.tsx` | Extracted `CoachProfileSteps` + exported constants; `CoachOnboarding` modal unchanged |
| `apps/web/src/pages/Onboarding.tsx` | **New** — full-page onboarding wizard |
| `apps/web/src/App.tsx` | Added `/onboarding` route (ProtectedRoute, no AppLayout) |
| `apps/web/src/pages/Signup.tsx` | Changed `window.location.href = '/'` → `'/onboarding'` |
| `apps/web/src/pages/Home.tsx` | Added `useCoach()` + coach profile nudge banner |
| `apps/web/src/lib/analytics.ts` | Added `coach_onboarding_skipped` to `CoachEvent` union |
| `docs/specs/post-signup-onboarding.md` | **New** — this file |

---

## Verification Checklist

- [ ] Sign up as new user → lands on `/onboarding`, not `/`
- [ ] Step 0 left panel: shows value proposition (3 cards)
- [ ] Click Next on step 0 → left panel fades to profile preview; craft type row fills in
- [ ] Steps 1–3: each row transitions from dimmed → filled as user advances
- [ ] Step 4: "Your profile is ready!" message visible
- [ ] "Finish Setup" → brief "Setting up…" spinner → redirect to `/`
- [ ] Coach insights begin generating in background (visible on `/coach` after a few seconds)
- [ ] "Skip for now" at any step → redirect to `/`, dashboard nudge visible
- [ ] Dashboard nudge: dismiss ✕ → gone, persists across page refresh
- [ ] Dashboard nudge: "Set up now" → `/onboarding`
- [ ] Authenticated user with profile visits `/onboarding` → redirects to `/`
- [ ] Regression: user with no profile visits `/coach` → CoachOnboarding modal still appears ✓
- [ ] Mobile: single-column, brand wordmark visible at top of right panel
