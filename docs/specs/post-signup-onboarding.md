# Post-Signup Onboarding

## What It Does

Immediately after a new user signs up, instead of landing straight in the app, they go through a short onboarding wizard. The wizard collects their Coach profile — five quick questions about their business — so that the AI Coach is personalised and ready to give relevant advice from the moment they start using PriceMe.

The whole flow takes about two minutes and can be skipped at any time.

---

## The Flow

```
Sign up
  ↓
Onboarding wizard (/onboarding)
  ├── Complete all 5 steps → Coach profile saved → insights generate in background → Home
  └── Skip → Home (Coach nudge banner shown until profile is set up)
```

---

## Screen Layout

The onboarding page uses a two-panel layout (the same style as the signup page):

**Left panel** (desktop only):
- At the start: A value proposition — what the Coach will do for you, with three feature highlights
- Once you've advanced past the first step: A live preview of your profile as it builds up, row by row. Each row you've answered fills in with a checkmark; unanswered rows stay dimmed

**Right panel** (the form):
- A step counter ("Step 2 of 5") with a progress bar
- The current question
- Back, Skip, and Next/Finish buttons

---

## The Five Questions

1. **What do you make?** — pick your craft type (e.g. candles, jewellery, ceramics, prints)
2. **Where do you sell?** — choose your sales channels (Etsy, Shopify, markets, direct, etc.)
3. **How long have you been selling?** — experience level
4. **What's your biggest pricing challenge?** — e.g. "I don't know if I'm charging enough" or "My costs keep changing"
5. **What's your monthly revenue goal?** — sets a target for Coach insights and progress tracking

---

## On Completion

When you click **Finish Setup**:
1. Your profile is saved
2. The AI begins generating your first batch of pricing insights in the background
3. You're taken to the Home dashboard
4. By the time you navigate to the Coach page, your first insights are ready

---

## Skipping

You can click **Skip for now** at any step. You'll land on the Home dashboard with a dismissible banner inviting you to complete the setup. The banner goes away once your profile is saved, or if you dismiss it manually (it won't come back after dismissal).

If you skip onboarding, the Coach page will prompt you to set up your profile the first time you visit it.

---

## Returning to Onboarding

Once your profile is complete (either from onboarding or from the Coach page), the `/onboarding` route redirects to Home. You can't go through it a second time.

---

## Mobile

On mobile the layout is single-column (no left panel). The brand icon and app name appear at the top of the form instead.
