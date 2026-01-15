# Products Page Specification

## Overview

Main product management page with advanced filtering, search, and editing capabilities.

## Features

### Product Table

- Displays all products in sortable table
- Columns: Name, SKU, Status, Category, Batch Size, Target Price, Cost, Profit, Profit Margin, Created, Updated
- Column visibility toggle (show/hide columns)
- Sortable by any column
- Resizable columns

### Advanced Filtering

- Filter dropdown with column selection
- Filter operators:
  - Contains
  - Equals
  - Not Contains
  - Starts With
  - Ends With
- Status filter: Equals, Not Equals
- Active filters displayed as badges with operator
- Remove individual filters

### Global Search

- Search box searches product names and SKUs
- Works in combination with filters
- Real-time filtering

### Product Actions

- Edit product (opens side panel)
- Delete product (with confirmation)
- Create new product button

### Inline Editing

- Editable cells for certain fields
- Click to edit, Enter to save, Escape to cancel
- Visual highlighting of editable cells

### Product Status

- Status badges: Draft, In Progress, On Sale, Inactive
- Color-coded status indicators

## Data Requirements

- Fetches products from `/api/products`
- Calculates costs, profit, and margins server-side
- Updates product via `/api/products/:id` (PUT)

## UI Components

- TanStack Table for data display
- ShadCN components: Table, Button, Input, Select, Badge, DropdownMenu
- EditProductPane side panel component
- Responsive design with mobile support
