# On Sale Page Specification

## Overview
Dedicated page for products with "On Sale" status, focused on sales metrics and analytics.

## Features

### Analytics Cards
- **Total Revenue**: Sum of (Qty Sold × Price) for all on-sale products
- **Total Profit**: Revenue minus costs
- **Products Sold**: Total quantity sold across all products
- **Total Cost**: Sum of costs for sold units
- Average margin displayed in Products Sold card

### Product Table
- Displays only products with status "on_sale"
- Columns: Name, Price, Sold, Created (Batch Made), Stock, Cost, Revenue, Profit, Margin
- Sortable columns
- Resizable columns

### Editable Fields
- **Qty Sold**: Editable, stored in local storage
- **Batch Made (Created)**: Editable, saved to database
- Visual highlighting for editable cells (blue background, border)

### Calculations
- **Stock**: Created - Sold
- **Cost**: Qty Sold × Product Cost per unit
- **Revenue**: Qty Sold × Target Price
- **Profit**: Revenue - Cost
- **Margin**: (Profit / Revenue) × 100

### Global Search
- Search by product name or SKU
- Real-time filtering

## Data Requirements
- Fetches products from `/api/products`
- Filters client-side for "on_sale" status
- Updates batch_size via `/api/products/:id` (PUT)
- Qty Sold stored in browser local storage

## UI Components
- TanStack Table for data display
- Analytics cards with icons and color coding
- EditableCell component for inline editing
- ShadCN components: Card, Table, Input, Button
- Responsive grid layout for analytics
