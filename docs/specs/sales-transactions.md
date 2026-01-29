# Sales Transactions Specification

## Overview

Replace simple `qty_sold` tracking with a proper sales transaction system that records actual sale prices, discounts, coupons, platforms, and dates. This enables accurate revenue tracking, profit calculations, and sales analytics.

## Goals

- Record actual sale prices (not just target_price)
- Track discounts and coupons
- Support multiple sales platforms/channels
- Historical sales data
- Accurate revenue and profit calculations
- Replace localStorage-based qty_sold tracking

## Database Schema

### New Table: `sales`

```sql
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL, -- NULL if base product (when variants implemented)
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0), -- Actual price sold at
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0), -- Discount in currency
  discount_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100), -- Discount in %
  coupon_code VARCHAR(50), -- Optional coupon code
  platform VARCHAR(50), -- e.g., "Etsy", "Shopify", "Direct", "Amazon", "eBay"
  customer_name VARCHAR(255), -- Optional customer info
  notes TEXT, -- Optional notes about the sale
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_sales_platform ON sales(platform);
```

### Calculated Fields (in queries, not stored)

- **total_revenue** = (unit_price × quantity) - discount_amount
- **product_cost** = product.product_cost × quantity (from products table)
- **profit** = total_revenue - product_cost
- **profit_margin** = (profit / total_revenue) × 100

### Migration from localStorage

- Existing `qty_sold` values in localStorage need to be migrated
- Create sales records with:
  - `sale_date` = product.created_at (or current date)
  - `unit_price` = product.target_price
  - `quantity` = localStorage qty_sold value
  - `platform` = "Migrated" or "Unknown"
  - `discount_amount` = 0
  - `discount_percentage` = 0

## API Endpoints

### Sales Management

#### `POST /api/sales`

Create a new sale record.

**Request Body:**

```json
{
  "product_id": 5,
  "variant_id": null, // Optional, when variants implemented
  "sale_date": "2024-01-15T10:30:00Z", // Optional, defaults to now
  "quantity": 2,
  "unit_price": 25.99,
  "discount_amount": 2.0, // Optional
  "discount_percentage": 0, // Optional, calculated if discount_amount provided
  "coupon_code": "SUMMER2024", // Optional
  "platform": "Etsy", // Optional
  "customer_name": "John Doe", // Optional
  "notes": "Customer requested gift wrapping" // Optional
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "product_id": 5,
    "variant_id": null,
    "sale_date": "2024-01-15T10:30:00Z",
    "quantity": 2,
    "unit_price": 25.99,
    "discount_amount": 2.0,
    "discount_percentage": 7.7, // Calculated: (2.00 / 25.99) * 100
    "total_revenue": 49.98, // (25.99 * 2) - 2.00
    "coupon_code": "SUMMER2024",
    "platform": "Etsy",
    "customer_name": "John Doe",
    "notes": "Customer requested gift wrapping",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### `GET /api/sales`

Get sales records with filtering and pagination.

**Query Parameters:**

- `product_id` (optional): Filter by product
- `variant_id` (optional): Filter by variant
- `platform` (optional): Filter by platform
- `start_date` (optional): Filter by date range start
- `end_date` (optional): Filter by date range end
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "product_id": 5,
      "product_name": "T-Shirt",
      "variant_id": null,
      "variant_name": null,
      "sale_date": "2024-01-15T10:30:00Z",
      "quantity": 2,
      "unit_price": 25.99,
      "discount_amount": 2.0,
      "total_revenue": 49.98,
      "platform": "Etsy",
      "coupon_code": "SUMMER2024"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "total_pages": 1
  }
}
```

#### `GET /api/sales/:saleId`

Get a single sale record.

#### `PUT /api/sales/:saleId`

Update a sale record.

**Request Body:** (same as POST, all fields optional)

#### `DELETE /api/sales/:saleId`

Delete a sale record.

### Sales Analytics

#### `GET /api/sales/analytics`

Get aggregated sales analytics.

**Query Parameters:**

- `start_date` (optional)
- `end_date` (optional)
- `product_id` (optional)
- `platform` (optional)

**Response:**

```json
{
  "status": "success",
  "data": {
    "total_sales": 150,
    "total_quantity": 320,
    "total_revenue": 7895.5,
    "total_cost": 3200.0,
    "total_profit": 4695.5,
    "average_profit_margin": 59.5,
    "by_platform": {
      "Etsy": { "revenue": 5000.0, "quantity": 200 },
      "Shopify": { "revenue": 2895.5, "quantity": 120 }
    },
    "by_product": [
      {
        "product_id": 5,
        "product_name": "T-Shirt",
        "quantity": 100,
        "revenue": 2500.0,
        "profit": 1500.0
      }
    ],
    "discounts": {
      "total_discount_amount": 150.0,
      "total_discount_percentage": 1.9,
      "coupons_used": 25
    }
  }
}
```

### Product Endpoints Updates

#### `GET /api/products/:id`

Include sales summary in product response (optional query param `?include_sales=true`).

**Response Addition:**

```json
{
  "sales_summary": {
    "total_quantity_sold": 50,
    "total_revenue": 1250.0,
    "total_profit": 750.0,
    "average_sale_price": 25.0,
    "last_sale_date": "2024-01-15T10:30:00Z"
  }
}
```

## UI Components

### On Sale Page Updates

#### Replace Qty Sold Input

- **Current**: Simple number input for qty_sold
- **New**: "Record Sale" button that opens sale dialog

#### Sale Recording Dialog

- **Fields**:
  - Product (pre-filled, read-only)
  - Variant (dropdown if product has variants, optional)
  - Quantity (required, number input)
  - Unit Price (defaults to target_price, editable)
  - Discount:
    - Toggle: "Apply Discount"
    - Type: "Amount" or "Percentage"
    - Value input
    - Auto-calculate the other type
  - Coupon Code (optional text input)
  - Platform (dropdown: Etsy, Shopify, Direct, Amazon, eBay, Other)
  - Sale Date (date picker, defaults to today)
  - Customer Name (optional)
  - Notes (optional textarea)
- **Calculations Display**:
  - Subtotal: unit_price × quantity
  - Discount: -discount_amount
  - Total Revenue: (highlighted)
  - Product Cost: product_cost × quantity
  - Profit: total_revenue - product_cost
  - Profit Margin: (profit / total_revenue) × 100

#### Sales History Section

- New section below product table
- Table showing all sales for selected product
- Columns: Date, Quantity, Unit Price, Discount, Revenue, Platform, Actions
- Actions: Edit, Delete
- Filter by date range, platform

#### Updated Analytics Cards

- Calculate from sales table instead of qty_sold
- Show actual revenue (not target_price × qty)
- Show profit based on actual sales prices

### Products Page Updates

#### Sales Summary Column

- Show total quantity sold (from sales table)
- Show total revenue
- Show last sale date
- Click to view sales history

### New Sales History Page (Optional)

#### Features

- All sales across all products
- Filtering:
  - Date range
  - Product
  - Platform
  - Coupon code
- Sorting by date, revenue, profit
- Export to CSV
- Charts:
  - Revenue over time
  - Sales by platform
  - Discount usage

## Data Migration

### Step 1: Create Sales Table

- Run migration to create `sales` table

### Step 2: Migrate localStorage Data

- Script to read localStorage qty_sold values
- Create sales records:
  ```javascript
  // For each product with qty_sold > 0
  {
    product_id: product.id,
    quantity: localStorage.getItem(`qty_sold_${product.id}`),
    unit_price: product.target_price || 0,
    sale_date: product.created_at || new Date(),
    platform: "Migrated",
    discount_amount: 0
  }
  ```

### Step 3: Update UI

- Replace qty_sold input with "Record Sale" button
- Update calculations to use sales table
- Remove localStorage qty_sold code

### Step 4: Cleanup

- Remove localStorage qty_sold on successful migration
- Update On Sale page to fetch from sales API

## Business Rules

1. **Discount Calculation**
   - If discount_amount provided → calculate discount_percentage
   - If discount_percentage provided → calculate discount_amount
   - Discount cannot exceed unit_price × quantity
   - Total revenue cannot be negative

2. **Sale Date**
   - Defaults to current date/time
   - Can be set to past date (for backdating)
   - Cannot be future date (or allow with warning?)

3. **Quantity**
   - Must be positive integer
   - Cannot exceed available stock (if stock tracking enabled)

4. **Unit Price**
   - Must be non-negative
   - Can be different from product.target_price
   - Represents actual price customer paid

5. **Platform**
   - Predefined list: Etsy, Shopify, Direct, Amazon, eBay
   - "Other" option with text input
   - Used for analytics and reporting

6. **Coupon Codes**
   - Optional text field
   - Not validated (free-form)
   - Used for analytics (which coupons are used most)

## Edge Cases

1. **Product Deleted**
   - Sales records keep product_id (for historical data)
   - Or cascade delete sales? (not recommended)

2. **Variant Deleted**
   - Sales records keep variant_id (historical data)
   - Sales still show which variant was sold

3. **Price Changes**
   - Sales records keep original unit_price
   - Historical accuracy maintained

4. **Negative Revenue**
   - Prevented by validation
   - Discount cannot exceed subtotal

5. **Backdating Sales**
   - Allow past dates for historical entry
   - Warn if date is very old (>1 year?)

## Future Enhancements

1. **Bulk Sale Entry**
   - Import sales from CSV
   - Multiple sales in one form
   - Template for recurring sales

2. **Sale Templates**
   - Save common sale configurations
   - Quick sale entry

3. **Platform Integrations**
   - Auto-import sales from Etsy API
   - Auto-import from Shopify
   - Sync sales data

4. **Advanced Analytics**
   - Sales trends over time
   - Platform performance comparison
   - Discount effectiveness analysis
   - Customer lifetime value

5. **Refunds/Returns**
   - Negative quantity sales
   - Refund tracking
   - Return processing

6. **Recurring Sales**
   - Subscription products
   - Monthly recurring revenue

## Open Questions

1. **Sale Deletion**: Should users be able to delete sales?
   - Soft delete (is_deleted flag)?
   - Hard delete?
   - Only allow within X days?

2. **Sale Editing**: Should users be able to edit sales?
   - Full edit allowed?
   - Only certain fields?
   - Audit trail needed?

3. **Stock Integration**: Should recording a sale automatically reduce stock?
   - Yes, if stock tracking enabled
   - Manual stock management separate?

4. **Future Dates**: Allow future-dated sales?
   - Pre-orders?
   - Scheduled sales?

5. **Currency**: Multi-currency support?
   - Store sale currency?
   - Convert to base currency?
