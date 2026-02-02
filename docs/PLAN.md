# PriceMe Project Plan

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
  - Sales tracking (qty sold) - currently in localStorage (Database migration planned)
  - Revenue, profit, and margin analytics
  - Stock calculation (Made - Sold)
  - Investment column (total cost to produce)
  - Profit calculation toggle (Real Profit vs Sold Profit)
  - Real Profit: Revenue - Total Investment (all items made)
  - Sold Profit: Revenue - COGS (only sold items)

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

- ✅ **Product Variants** (Recently Implemented)
  - Product variants support
  - Variant-specific pricing
  - Variant stock tracking
  - See: `docs/specs/product-variants.md`

---

## Future Features 🚀

### High Priority (Next Up)

1. **Sales Transactions** 📋 _SPEC Ready_
   - Replace localStorage-based sales with a proper DB system
   - Record actual sale prices, discounts, and platforms
   - Historical sales data and analytics
   - See: `docs/specs/sales-transactions.md`

2. **Integration Features**
   - Etsy integration (Authentication ready)
   - Shopify integration
   - CSV import/export

3. **Export Functionality**
   - Export products to CSV/Excel
   - Export cost breakdowns as PDF
   - Export product list with all details

4. **Bulk Operations**
   - Bulk edit products (status, category, etc.)
   - Bulk delete products
   - Bulk update pricing

5. **Advanced Analytics**
   - Cost trend analysis over time
   - Profit margin trends
   - Material cost analysis
   - Labor cost analysis
   - Revenue forecasting

6. **Product Categories**
   - Category management
   - Filter by category
   - Category-based analytics

### Medium Priority

7. **Inventory Tracking**
   - Stock levels per product
   - Low stock alerts
   - Inventory history
   - Stock adjustments

8. **Material Library Enhancements**
   - Material cost history
   - Price alerts for materials
   - Supplier management
   - Material usage analytics

9. **Pricing Strategies**
   - Multiple pricing methods per product
   - A/B testing for pricing
   - Competitor price tracking
   - Dynamic pricing suggestions

10. **Reporting**
    - Custom report builder
    - Scheduled reports
    - Email reports
    - Report templates

11. **Product Comparison**
    - Side-by-side product comparison
    - Cost breakdown comparison
    - Profitability comparison

### Low Priority / Future Enhancements

12. **Multi-currency Support**
    - Currency conversion
    - Multi-currency pricing
    - Exchange rate tracking

13. **Integration Features**
    - Etsy integration
    - Shopify integration
    - CSV import/export
    - API for third-party integrations

14. **Collaboration Features**
    - Team accounts
    - Role-based access control
    - Shared product libraries
    - Comments and notes on products

15. **Mobile App**
    - React Native mobile app
    - Quick product creation on mobile
    - Barcode scanning for materials

16. **Advanced Search**
    - Full-text search
    - Search history
    - Saved searches
    - Search filters presets

17. **Notifications**
    - Low stock alerts
    - Price change notifications
    - Material price alerts
    - System notifications

18. **Data Visualization**
    - Charts and graphs for analytics
    - Profit trends visualization
    - Cost breakdown pie charts
    - Revenue forecasting charts

19. **Backup & Restore**
    - Data export/import
    - Backup scheduling
    - Data recovery
    - Version history

### Recently Completed ✅

- ✅ **Product Variants** (Cartesian generator, cost/price overrides, stock)
- ✅ New single-screen Add Product UI (replaced multi-step wizard)
- ✅ On Sale page improvements (Made/Investment columns, profit toggle)
- ✅ Materials library enhancements (Add Stock, weighted average, filters)
- ✅ Percentage-based quantity for consumable materials
- ✅ Labor hourly cost defaults from settings
- ✅ Edit Material Dialog improvements (popup, better layout, consumable flag)
- ✅ Batch size validation fixes
- ✅ Real-time profit/margin/markup indicators in Add Product

### Small things to fix

- [x] SKU auto generated even though typed when creating a product
