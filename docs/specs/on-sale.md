# On Sale Page Specification

## Overview

Dedicated page for products with "On Sale" status, focused on sales metrics and analytics.

## Features

### Analytics Cards

- **Total Revenue**: Sum of (Qty Sold × Price) for all on-sale products
- **Total Profit**: Revenue minus costs (based on selected profit mode)
- **Products Sold**: Total quantity sold across all products
- **Total Investment**: Sum of (Made × Cost Per Product) - total spent to produce
- Average margin displayed in Products Sold card

### Product Table

- Displays only products with status "on_sale"
- Columns: Name, Price, Sold, Made (Batch Size), Stock, Investment, Revenue, Profit, Margin
- Sortable columns
- Resizable columns
- "Made" column is editable (batch size)

### Editable Fields

- **Qty Sold**: Editable, stored in local storage (to be migrated to sales transactions)
- **Made (Batch Size)**: Editable, saved to database
- Visual highlighting for editable cells (blue background, border)

### Calculations

- **Stock**: Made - Sold
- **Investment**: Made × Product Cost per unit (total spent to produce)
- **Revenue**: Qty Sold × Target Price
- **Profit**:
  - **Real Profit Mode** (default): Revenue - Investment (all items made)
  - **Sold Profit Mode**: Revenue - COGS (only sold items)
- **Margin**: (Profit / Revenue) × 100

### Profit Calculation Toggle

- Toggle button next to search box
- **Real Profit**: Shows actual profit considering total investment (all items produced)
- **Sold Profit**: Shows profit on sold items only (traditional COGS)
- Tooltip explains each mode
- Updates Profit and Margin columns in real-time

### Global Search

- Search by product name or SKU
- Real-time filtering

## Data Requirements

- Fetches products from `/api/products`
- Filters client-side for "on_sale" status
- Updates batch_size via `/api/products/:id` (PUT)
- Qty Sold stored in browser local storage (temporary, to be migrated to sales transactions table)
- Profit calculation mode stored in component state (defaults to Real Profit)

## UI Components

- TanStack Table for data display
- Analytics cards with icons and color coding
- EditableCell component for inline editing
- ShadCN components: Card, Table, Input, Button
- Responsive grid layout for analytics
