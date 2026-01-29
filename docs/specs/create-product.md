# Create Product Page Specification

## Overview

Single-screen product creation form with all fields visible at once. Materials, labor, and other costs displayed as cards below input sections.

## Features

### Product Information Section (Top Row)
- Product name (required)
- SKU (optional)
- Batch size (default: 1, renamed to "Made")
- Target price (optional)
- Pricing method selection (Markup %, Markup $, Final Price)
- Pricing value input (based on method)

### Materials Section (Left Column)
- Material search/selection from library or create new
- Material fields:
  - Name
  - Quantity type: Exact (Qt) or Percentage (%)
  - Quantity value (number or percentage dropdown: 10, 20, 30, etc.)
  - Per item or per batch checkbox
  - Unit
  - Cost (price per unit, read-only if from library)
  - Items from quantity (hidden when percentage + per batch)
- Materials displayed as cards below input section
- Each card shows: Name, Quantity, Unit, Cost per Product
- "Save to Library" button on cards for non-library materials

### Labor Costs Section (Middle Column)
- Activity name
- Time spent (minutes)
- Hourly rate (defaults from user settings, resets after each addition)
- Per batch checkbox
- Labor costs displayed as cards below input section
- Each card shows: Activity, Time, Rate, Cost per Product

### Other Costs Section (Right Column)
- Item name
- Quantity
- Cost
- Per batch checkbox
- Other costs displayed as cards below input section
- Each card shows: Item, Quantity, Cost per Product

### Sticky Footer Section
- Total cost per product
- Sell price display
- Real-time profit/margin/markup indicators (circular graphics)
  - Profit (teal/mint color)
  - Margin (violet/purple color)
  - Markup (rose/pink color)
- Save and Cancel buttons (aligned right)
- Sidebar auto-collapses on page load

## Data Requirements

- Creates product via `/api/products` (POST)
- Includes materials, labor_costs, other_costs arrays
- Uses user settings for default values

## UI Components

- Single-screen layout with 3-column grid for cost sections
- Card-based display for materials, labor, and other costs
- Sticky footer with totals and metrics
- ShadCN Form components
- React Hook Form for form management
- Zod validation
- Real-time calculation updates
- Responsive design
- Sidebar auto-collapse on mount