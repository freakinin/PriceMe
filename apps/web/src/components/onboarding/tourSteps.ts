export interface TourStep {
  id: string;
  targetId: string | null;
  title: string;
  description: string;
  position: 'center' | 'right' | 'bottom' | 'top' | 'left';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetId: null,
    position: 'center',
    title: 'Welcome to Cravio',
    description: "Your pricing studio for makers and Etsy sellers. Let's take 30 seconds to show you around the key features.",
  },
  {
    id: 'add-product',
    targetId: 'tour-add-product',
    position: 'right',
    title: 'Add Your First Product',
    description: 'Tap here to create a product. Enter materials, labor, and overhead — Cravio calculates your ideal selling price.',
  },
  {
    id: 'products',
    targetId: 'tour-nav-products',
    position: 'right',
    title: 'Your Product Catalog',
    description: 'All your products in one place. Track status from Draft → In Progress → On Sale, and see profit margins at a glance.',
  },
  {
    id: 'materials',
    targetId: 'tour-nav-materials',
    position: 'right',
    title: 'Materials Library',
    description: 'Build a reusable library of materials with unit costs. Attach them to any product instead of re-entering prices every time.',
  },
  {
    id: 'coach',
    targetId: 'tour-nav-coach',
    position: 'right',
    title: 'AI Pricing Coach',
    description: 'Get personalized insights on your pricing strategy, profit margins, and growth opportunities — powered by AI.',
  },
  {
    id: 'on-sale',
    targetId: 'tour-nav-on-sale',
    position: 'right',
    title: 'On Sale',
    description: 'When a product is ready to sell, flip it to On Sale here. Track active listings and quickly manage what\'s live in your shop.',
  },
  {
    id: 'dashboard',
    targetId: 'tour-stats-grid',
    position: 'bottom',
    title: 'Your Business at a Glance',
    description: "Total products, potential revenue, profit, and costs — all on your dashboard. You're all set to start!",
  },
];

// ── Market Analysis Tour ───────────────────────────────────────────────────

export const MARKET_ANALYSIS_TOUR_STEPS: TourStep[] = [
  {
    id: 'matour-stats',
    targetId: 'matour-stats',
    position: 'bottom',
    title: 'Market Overview',
    description: 'See your position vs competitors at a glance — price gap, average market price, and your target price all in one row.',
  },
  {
    id: 'matour-add-competitor',
    targetId: 'matour-add-competitor',
    position: 'bottom',
    title: 'Track a Competitor',
    description: 'Paste any product URL (Etsy, Shopify, Amazon…) and hit Track. Cravio scrapes the price, title, and details automatically.',
  },
  {
    id: 'matour-competitor-list',
    targetId: 'matour-competitor-list',
    position: 'left',
    title: 'Competitor Cards',
    description: 'Each tracked competitor shows their price, competition level, and quality score. Edit details or remove them anytime.',
  },
  {
    id: 'matour-product-details',
    targetId: 'matour-product-details',
    position: 'right',
    title: 'Your Product Details',
    description: 'Your costs, materials, and profit sit here for easy reference while you analyse the competition.',
  },
];

// ── Coach Tour ─────────────────────────────────────────────────────────────

export const COACH_TOUR_STEPS: TourStep[] = [
  {
    id: 'ctour-top-bar',
    targetId: 'ctour-top-bar',
    position: 'bottom',
    title: 'Your Coach Profile',
    description: 'Your craft type and experience level personalise every insight. Hit Re-analyze anytime to refresh with your latest product data.',
  },
  {
    id: 'ctour-health-score',
    targetId: 'ctour-health-score',
    position: 'right',
    title: 'Business Health Score',
    description: 'A single score across your pricing, margins, and product mix. Keep it in the green by acting on the insights below.',
  },
  {
    id: 'ctour-insight-feed',
    targetId: 'ctour-insight-feed',
    position: 'right',
    title: 'Personalised Insights',
    description: 'AI-generated recommendations specific to your shop — pricing alerts, margin optimisations, and growth opportunities.',
  },
  {
    id: 'ctour-chat',
    targetId: 'ctour-chat',
    position: 'left',
    title: 'Chat with Your Coach',
    description: 'Ask anything — pricing strategy, competitor questions, profit leaks. Your coach knows your products and real costs.',
  },
];

// ── Product Form Tour ──────────────────────────────────────────────────────

export const PRODUCT_TOUR_STEPS: TourStep[] = [
  {
    id: 'ptour-name',
    targetId: 'ptour-top-section',
    position: 'bottom',
    title: 'Name Your Product',
    description: 'Give your product a name, assign a category, set a SKU, and enter a target selling price if you already have one in mind.',
  },
  {
    id: 'ptour-materials',
    targetId: 'ptour-materials',
    position: 'bottom',
    title: 'Add Materials',
    description: 'List every raw material you use — fabric, wax, resin, wire — with quantities and cost per unit. Cravio calculates the total automatically.',
  },
  {
    id: 'ptour-labor',
    targetId: 'ptour-labor',
    position: 'bottom',
    title: 'Track Your Time',
    description: 'Add labor entries by the hour or as a flat rate. Your time has value — this ensures it\'s included in every price.',
  },
  {
    id: 'ptour-other',
    targetId: 'ptour-other-costs',
    position: 'bottom',
    title: 'Other Costs',
    description: 'Packaging, shipping supplies, marketplace fees, overhead — anything that doesn\'t fit materials or labor goes here.',
  },
  {
    id: 'ptour-summary',
    targetId: 'ptour-cost-bar',
    position: 'top',
    title: 'Live Cost Summary',
    description: 'Your total cost, profit, and margin update in real time as you fill in the form. Hit "Create Product" when you\'re done!',
  },
];
