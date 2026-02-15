# PriceMe Project Plan

## Future Features 🚀

### High Priority (Next Up)

1. **Billing & Subscription**
   - Plan and subscription management (Track data usage by plan limits)
   - Payment for subscription

2. **Integration Features**
   - Etsy integration
   - Shopify integration
   - CSV Import

3. **Advanced Analytics**
   - Cost trend analysis over time
   - Profit margin trends
   - Material cost analysis
   - Labor cost analysis
   - Revenue forecasting

4. **Product Categories**
   - Category management
   - Filter by category
   - Category-based analytics

5. **Export Functionality**
   - Export cost breakdowns as PDF

### Medium Priority

6. **Inventory Tracking**
   - Stock levels per product
   - Low stock alerts
   - Inventory history
   - Stock adjustments

7. **Material Library Enhancements**
   - Material cost history
   - Price alerts for materials
   - Supplier management
   - Material usage analytics

8. **Pricing Strategies**
   - Multiple pricing methods per product
   - A/B testing for pricing
   - Competitor price tracking
   - Dynamic pricing suggestions

9. **Reporting**
    - Custom report builder
    - Scheduled reports
    - Email reports
    - Report templates

10. **Product Comparison**
    - Side-by-side product comparison
    - Cost breakdown comparison
    - Profitability comparison

### Low Priority / Future Enhancements

11. **Multi-currency Support**
    - Currency conversion
    - Multi-currency pricing
    - Exchange rate tracking

12. **Collaboration Features**
    - Team accounts
    - Role-based access control
    - Shared product libraries
    - Comments and notes on products

13. **Mobile App**
    - React Native mobile app
    - Quick product creation on mobile
    - Barcode scanning for materials

14. **Advanced Search**
    - Full-text search
    - Search history
    - Saved searches
    - Search filters presets

15. **Notifications**
    - Low stock alerts
    - Price change notifications
    - Material price alerts
    - System notifications

16. **Data Visualization**
    - Charts and graphs for analytics
    - Profit trends visualization
    - Cost breakdown pie charts
    - Revenue forecasting charts

17. **Backup & Restore**
    - Data export/import
    - Backup scheduling
    - Data recovery
    - Version history

---

## Completed Features ✅

### Recently Completed

- ✅ **Bulk Operations** (Edit, Delete, Update Pricing)
- ✅ **Export to CSV/Excel**
- ✅ **Home Dashboard UI Overhaul** (Modern charts, cards, recent activity, alerts)
- ✅ **Product Variants** (Cartesian generator, cost/price overrides, stock)
- ✅ New single-screen Add Product UI (replaced multi-step wizard)
- ✅ On Sale page improvements (Made/Investment columns, profit toggle)
- ✅ Materials library enhancements (Add Stock, weighted average, filters)
- ✅ Percentage-based quantity for consumable materials
- ✅ Labor hourly cost defaults from settings
- ✅ Edit Material Dialog improvements (popup, better layout, consumable flag)
- ✅ Batch size validation fixes
- ✅ Real-time profit/margin/markup indicators in Add Product
- ✅ **Bug Fixes & Refinements**
  - Resolved category persistence issues in product editing.
  - Fixed "400 Bad Request" errors for zero-value numeric fields.
  - Standardized success toast notifications across the application.

### Core Features

- ✅ **Authentication System**
  - User registration and login
  - JWT-based authentication
  - Protected routes

- ✅ **User Settings**
  - Currency selection
  - Custom unit management
  - Tax percentage settings
  - Default labor hourly cost

- ✅ **Product Management**
  - Create products (single-screen UI with all fields visible)
  - Edit products
  - Delete products
  - Product status workflow (draft → in_progress → on_sale → inactive)
  - Batch size management (renamed to "Made")
  - Real-time profit/margin/markup indicators

- ✅ **Cost Tracking**
  - Materials tracking with user library
  - Percentage-based quantity for consumable materials (per item or per batch)
  - Labor costs tracking with default hourly rate from settings
  - Other costs tracking
  - Real-time cost calculations
  - Dynamic profit/margin/markup indicators

- ✅ **Pricing & Calculations**
  - Target price setting
  - Pricing methods (Markup %, Markup $, Final Price)
  - Automatic profit calculation
  - Automatic margin calculation
  - Cost breakdown visualization

- ✅ **Product List & Management**
  - Advanced filtering (contains, equals, not contains, starts with, ends with)
  - Global search
  - Column visibility toggle
  - Sortable columns
  - Inline editing

- ✅ **Materials Library**
  - User material library
  - Reusable materials across products
  - Material management page
  - Add Stock functionality with weighted average cost calculation
  - Inline category editing
  - Out of stock filter toggle
  - Stock level tracking with reorder points
  - Last purchased date and price tracking
  - Investment tracking (total cost)
  - Consumable material flag (percentage-based materials)

- ✅ **On Sale Page**
  - Dedicated page for products on sale
  - Sales tracking (migrated to Database) with legacy localStorage support
  - Revenue, profit, and margin analytics
  - Stock calculation (Made - Sold)
  - Investment column (total cost to produce)
  - Profit calculation toggle (Real Profit vs Sold Profit)
  - Real Profit: Revenue - Total Investment (all items made)
  - Sold Profit: Revenue - COGS (only sold items)

- ✅ **Sales Transactions**
  - Replace localStorage-based sales with a proper DB system
  - Record actual sale prices, discounts, and platforms
  - Historical sales data and analytics
  - See: `docs/specs/sales-transactions.md`

- ✅ **Home Dashboard**
  - Overview analytics
  - Quick actions
  - Recent products
  - Status breakdown

- ✅ **Roadmap**
  - Feature voting system
  - Upvote/downvote functionality
  - Feature search

- ✅ **Product Templates**
  - Save product configurations as templates
  - Quick product creation from templates
  - Template management from create screen and DB
  - See: `docs/specs/product-templates.md`

- ✅ **Product Variants**
  - Product variants support
  - Variant-specific pricing
  - Variant stock tracking
  - See: `docs/specs/product-variants.md`

- ✅ **Production Deployment**
  - Separated Frontend (web) and Backend (api) Vercel projects
  - Configured CORS, SPA Routing, and API rewrites
  - Production Database (Neon) connection verified
  - Auth flow (JWT) fixed for production environment

### Small things to fix

- [x] SKU auto generated even though typed when creating a product
