# PriceMe MVP Project Plan

## Overview
A pricing tool for physical products (handmade items) sold on Etsy, Shopify, etc. Users can calculate product costs and pricing based on materials, labor, equipment, and other costs.

## MVP Scope (Phase 1)

### Core Features
1. **User Settings**
   - Currency selection (USD, EUR, GBP, etc.)
   - Unit types (ml, pcs, g, oz, etc.) - user can define their own list

2. **Product Creation (Step-by-Step)**
   - Step 1: Product Basic Info
     - Product name
     - SKU (optional)
     - Batch size (how many products per batch)
   - Step 2: Materials
     - Add/edit/remove materials
     - Each material: name, quantity, unit, price per unit
     - Calculate total cost per unit
   - Step 3: (Future) Labor Costs
   - Step 4: (Future) Equipment Costs
   - Step 5: (Future) Other Costs
   - Step 6: (Future) Pricing Calculation

3. **Product List**
   - View all products
   - Edit/Delete products

## Database Schema Updates

### New Tables Needed

**user_settings**
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER REFERENCES users(id))
- currency (VARCHAR(3) DEFAULT 'USD')
- units (TEXT[] - array of unit strings)
- created_at, updated_at

**materials**
- id (SERIAL PRIMARY KEY)
- product_id (INTEGER REFERENCES products(id))
- name (VARCHAR(255))
- quantity (DECIMAL(10, 4))
- unit (VARCHAR(50))
- price_per_unit (DECIMAL(10, 4))
- total_cost (DECIMAL(10, 4))
- created_at, updated_at

**products** (update existing)
- Add: sku (VARCHAR(100))
- Add: batch_size (INTEGER DEFAULT 1)

## Implementation Plan

### Phase 1: MVP (Current Focus)
1. ✅ Authentication & Layout - DONE
2. 🔄 User Settings (Currency & Units)
3. 🔄 Create Product Form (Step 1: Basic Info)
4. 🔄 Create Product Form (Step 2: Materials)
5. 🔄 Product List View
6. 🔄 Edit Product

### Phase 2: Pricing Calculations (Future)
- Labor costs
- Equipment costs
- Other costs
- Pricing methods (Markup %, Markup $, Final Price, etc.)
- Price breakdown visualization

### Phase 3: Advanced Features (Future)
- Inventory tracking
- Cost analytics
- Export functionality
- Multiple products comparison

## UI/UX Approach

- Clean, step-by-step wizard for product creation
- ShadCN UI components for consistency
- Responsive design
- Form validation with Zod
- Real-time cost calculations

## Technical Stack

- Frontend: React + TypeScript + ShadCN UI
- Backend: Node.js + Express + TypeScript
- Database: Vercel Postgres (Neon)
- Validation: Zod schemas
- Forms: React Hook Form





