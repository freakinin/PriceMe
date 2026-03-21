# PriceMe — Product Roadmap

## What We're Building

PriceMe is a pricing and profitability tool for small product-based businesses — makers, crafters, and independent sellers on Etsy, Shopify, and beyond. We help them understand exactly what their products cost, what they should charge, and whether their business is actually making money.

---

## Up Next 🚀

### High Priority

**1. Stripe Billing (Subscription Phase 2)**
Users can currently switch plans in the app, but payment isn't wired up yet. This adds real card payments via Stripe:
- Checkout flow for upgrading to Starter / Growth / Pro
- Self-service billing portal (manage card, view invoices, cancel)
- Webhook handling so plan changes and renewals sync automatically
- Annual billing option with a discount
- DB schema is already Stripe-ready (stripe_subscription_id, stripe_customer_id columns exist)

**2. Platform Integrations**
Reduce manual data entry by connecting to where sellers actually sell:
- Etsy integration — auto-import orders and competitor listings
- Shopify integration — sync products and pull in sales data
- CSV import — bulk upload products, materials, or sales history

**3. Advanced Analytics**
Turn the data we already have into better business decisions:
- Revenue and profit trend charts over time
- Material cost trend analysis
- Break-even analysis at the business level (not just per product)
- Revenue forecasting based on current pricing and volume

**4. Business Finance & Overhead Tracker**
Most sellers focus on per-product margins but never account for the fixed costs of running their business — studio rent, software, electricity, equipment. This feature adds:
- Fixed and variable overhead tracking (monthly or annual)
- Capital expense amortisation (e.g. a laser cutter spread over 3 years)
- True cost per unit after overhead allocation
- Monthly P&L view: gross profit vs net profit
- Break-even volume (how many units to cover all costs)
- New `business_expenses` table planned: `id, user_id, name, category, amount, frequency, useful_life_months`

**5. Export to PDF**
Export a product's full cost breakdown and pricing analysis as a shareable PDF — useful for wholesale pricing conversations, grant applications, or personal records.

---

### Medium Priority

**6. Inventory Tracking**
- Stock level management per product (separate from batch/made)
- Low stock alerts with configurable thresholds
- Stock adjustment history

**7. Pricing Strategies**
- Save multiple pricing scenarios per product (e.g. retail vs wholesale vs market-stall price)
- Dynamic pricing suggestions based on cost changes
- Discount scenario modeller

**8. Reporting**
- Custom report builder
- Scheduled reports emailed to you
- Templates for common reports (monthly P&L, top products by margin, etc.)

**9. Product Comparison**
- Side-by-side comparison of two or more products
- Cost breakdown diff
- Margin and profitability comparison

---

### Lower Priority / Future

**10. Multi-currency Support**
- Display prices in a secondary currency
- Exchange rate tracking
- Multi-currency sales recording

**11. Team & Collaboration**
- Multiple users on one account
- Role-based access (view-only, editor, admin)
- Comments and notes on products

**12. Mobile App**
- React Native app for iOS and Android
- Quick sale recording from your phone
- Barcode scanning for materials

**13. Advanced Search**
- Full-text search across product descriptions and notes
- Saved search filters
- Search history

**14. Notifications**
- Price change alerts for tracked competitors
- Low stock reminders
- Material cost increase warnings

**15. Backup & Data Export**
- Full account data export (JSON or CSV)
- Backup scheduling
- Data recovery tools

---

## Already Shipped ✅

### Core Platform

- ✅ **Authentication** — sign up, log in, JWT-based sessions, protected routes
- ✅ **Post-signup onboarding** — guided wizard that sets up the AI Coach profile immediately after registration
- ✅ **Home dashboard** — customisable widget layout with stats, charts, coach insights, activity feed, and quick actions; date-range filtering; after-tax toggle; drag-to-reorder layout

### Product Management

- ✅ **Create & edit products** — single-screen form with materials, labour, other costs, and live pricing calculator
- ✅ **Products list** — table and grid views, advanced filtering, global search, sortable and hideable columns with drag-to-reorder
- ✅ **Bulk operations** — bulk delete, bulk status change, bulk category reassign
- ✅ **Product status workflow** — Draft → In Progress → On Sale → Inactive
- ✅ **Inline pricing** — update price and pricing method directly from the product list; profit/margin/markup update in real time
- ✅ **Fee-aware pricing** — toggle to see profit and margin after platform fees
- ✅ **Market Position column** — shows at-a-glance whether a product is priced below, at, or above the market

### Cost Tracking

- ✅ **Materials costs** — exact quantity or percentage-based (consumables), per item or per batch
- ✅ **Labour costs** — activity-based time tracking with configurable hourly rate
- ✅ **Other costs** — packaging, shipping supplies, fees, etc.
- ✅ **Batch size management** — all costs roll up correctly across any batch size

### Pricing Calculator

- ✅ **Four pricing methods** — Set Price, Target Profit $, Target Margin %, Markup %
- ✅ **Real-time indicators** — profit, margin, and markup update as you type
- ✅ **Break-even chart** — units needed to cover batch cost at current price
- ✅ **Shipping scenarios** — model different shipping costs and their impact

### Product Variants

- ✅ Cartesian variant generator (e.g. 3 sizes × 3 colours = 9 variants)
- ✅ Per-variant price override, SKU, and stock level
- ✅ Variants shown as expandable rows in the product list

### Product Templates

- ✅ Save any product's cost structure as a named template
- ✅ Load a template when creating a product to pre-fill all costs
- ✅ Manage (rename, delete) templates from settings

### Materials Library

- ✅ Central reusable library of materials
- ✅ Weighted average cost calculation when restocking
- ✅ Stock tracking with configurable reorder points
- ✅ Low stock alerts on dashboard
- ✅ Consumable flag for percentage-based materials
- ✅ Inline category editing

### Sales Tracking

- ✅ Record sales with actual price, quantity, platform, discount, and date
- ✅ Real Profit vs Sold Profit toggle
- ✅ After-tax profit toggle
- ✅ Sales history per product
- ✅ Legacy localStorage sales data migrated to database

### On Sale Page

- ✅ Table and grid views for active listings
- ✅ Analytics cards: revenue, profit, units sold, investment
- ✅ Fee-aware revenue estimates
- ✅ Suggested products ready to list

### Categories & Suppliers

- ✅ Full category management (create, rename, delete, bulk operations)
- ✅ Supplier directory with contact details linked to materials

### Market Analysis & Competitor Tracking

- ✅ Add competitor listings per product
- ✅ Average competitor price and market position column on products list
- ✅ Automated 24-hour price monitoring
- ✅ AI-generated recommendations via Google Gemini
- ✅ Price history per competitor

### AI Coach

- ✅ Business health score widget
- ✅ Personalised pricing insights based on your product data
- ✅ Chat interface for natural-language pricing questions
- ✅ Report generation
- ✅ Growth chart widget
- ✅ Plan-based usage limits

### AI Product Generator

- ✅ Describe a product in plain language; AI suggests materials, labour, costs, and a price
- ✅ Per-activity labour breakdown
- ✅ Default shipping scenarios pre-filled
- ✅ Available on Starter plan and above

### Subscription & Plans

- ✅ Four plan tiers: Free, Starter, Growth, Pro
- ✅ Usage limits enforced in the app and at the API level
- ✅ In-app plan switcher
- ✅ Trial support with expiry banner
- ✅ Near-limit warnings (at 80%) and at-limit upgrade prompts
- ✅ Usage dashboard in Settings
- ✅ QA mode for testing different plan limits

### Settings

- ✅ Currency, tax rate, default labour rate
- ✅ Platform fee profiles (Etsy, Shopify, etc.)
- ✅ Shipping templates
- ✅ Custom measurement units
- ✅ Account profile management

### Roadmap Page

- ✅ Feature voting — upvote and downvote planned features
- ✅ Community feedback visible to all users

### Infrastructure & Quality

- ✅ Vercel deployment (frontend as SPA, API as separate service)
- ✅ PostgreSQL database (Neon) with inline migrations
- ✅ PostHog analytics integration
- ✅ Production and QA environment modes
- ✅ Signup page redesigned as marketing landing with hero and pricing grid
