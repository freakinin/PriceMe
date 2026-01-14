# Home Page Specification

## Overview
Dashboard-style overview page showing key metrics, quick actions, and recent products.

## Features

### Analytics Cards
- **Total Products**: Shows total product count with "on sale" count
- **Potential Revenue**: Calculated from all products' target prices and batch sizes
- **Potential Profit**: Revenue minus costs, with average margin display
- **Total Cost**: Combined cost of all products

### Quick Actions
- Create New Product (navigates to `/products/add`)
- View All Products (navigates to `/products`)
- View On Sale Products (navigates to `/on-sale`)
- Manage Materials (navigates to `/materials`)

### Product Status Overview
Visual breakdown showing:
- Draft products (not yet priced)
- In Progress products
- On Sale products

### Recent Products Table
- Shows 5 most recently updated products
- Displays: Name, Status, Price, Cost, Profit, Margin
- Clickable rows navigate to Products page
- Empty state with call-to-action if no products exist

## Data Requirements
- Fetches all products from `/api/products`
- Calculates analytics from product data
- Uses user settings for currency formatting

## UI Components
- ShadCN Card components for analytics
- ShadCN Table for recent products
- Responsive grid layout (1 col mobile, 2 col tablet, 4 col desktop)
- Loading skeletons during data fetch
