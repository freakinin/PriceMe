# Create Product Page Specification

## Overview

Multi-step wizard for creating products with materials, labor, and other costs.

## Features

### Step 1: Basic Info

- Product name (required)
- SKU (optional)
- Batch size (default: 1)
- Target price (optional)
- Pricing method selection (Markup %, Markup $, Final Price)
- Pricing value input (based on method)

### Step 2: Materials

- Add materials from user library or create new
- Material fields:
  - Name
  - Quantity
  - Unit
  - Price per unit
  - Units made (for batch calculations)
- Calculate total cost per unit
- Add/remove materials
- Edit materials inline

### Step 3: Labor Costs

- Add labor activities
- Fields:
  - Activity name
  - Time spent (minutes)
  - Hourly rate (defaults from user settings)
  - Per unit or per batch
- Calculate total cost
- Add/remove labor costs

### Step 4: Other Costs

- Add other cost items
- Fields:
  - Item name
  - Quantity
  - Cost
  - Per unit or per batch
- Calculate total cost
- Add/remove other costs

### Step 5: Review & Pricing

- Summary of all costs
- Total cost per product calculation
- Profit and margin calculations
- Final pricing display
- Submit to create product

### Navigation

- Step indicator showing current step
- Previous/Next buttons
- Can navigate between steps
- Form validation before proceeding

## Data Requirements

- Creates product via `/api/products` (POST)
- Includes materials, labor_costs, other_costs arrays
- Uses user settings for default values

## UI Components

- Multi-step wizard UI
- ShadCN Form components
- React Hook Form for form management
- Zod validation
- Step indicator component
- Responsive design
