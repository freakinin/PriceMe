# Product Templates Specification

## Overview

Enable users to save product configurations as templates and create new products from these templates. This streamlines the creation of similar products (e.g., a "T-Shirt" template with predefined sizes, materials, and labor costs).

## Core Features

1.  **Save as Template**: Convert an existing product into a template.
2.  **Create from Template**: Select a template when creating a new product to pre-fill fields.
3.  **Manage Templates**: A dedicated section to view, edit, and delete templates.

## Database Schema

We will use a separate table `product_templates` to store template data. This avoids "polluting" the main products table with non-sellable items and allows for template-specific metadata.

### New Table: `product_templates`

```sql
CREATE TABLE product_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL, -- Template name (e.g. "Standard T-Shirt")
  description TEXT,
  category VARCHAR(100),
  
  -- Core Product Data (Pre-fill values)
  default_batch_size INTEGER DEFAULT 1,
  default_pricing_method VARCHAR(20),
  default_markup_percentage DECIMAL(5, 2),
  
  -- JSON Blobs for complex nested data
  -- We store these as JSONB for flexibility since they are just "recipes" to be copied
  materials_json JSONB,     -- Array of material objects { name, quantity, unit, ... }
  labor_costs_json JSONB,   -- Array of labor objects { activity, time_spent_minutes, ... }
  other_costs_json JSONB,   -- Array of other cost expenses
  variants_json JSONB,      -- Array of variant definitions { name, ... } (optional)

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. Templates Management (`/api/templates`)

*   **GET /api/templates**: List all templates for the user.
*   **POST /api/templates**: Create a new template (either from scratch or from a product).
    *   *Body*: `{ name, description, materials: [...], labor_costs: [...] }`
*   **GET /api/templates/:id**: Get text details of a specific template.
*   **PUT /api/templates/:id**: Update a template.
*   **DELETE /api/templates/:id**: Delete a template.

### 2. Product Integration

*   **POST /api/products/from-template/:templateId**: (Optional) specific endpoint, OR
*   Just use the existing **POST /api/products** but frontend pre-fills the form data from the template. *Decision: Frontend pre-fill is simpler and more flexible.*

## Frontend Changes

### 1. Create Product Page (`/products/add`)
*   Add a "Load Template" button or dropdown at the top.
*   Selecting a template fetches the template data and populates the form (`useForm` reset/setValue).

### 2. Products List / Edit
*   Add action: "Save as Template" in the product dropdown menu.
    *   Opens a modal to name the new template.
    *   Sends current product data to `POST /api/templates`.

### 3. Settings / Templates Manager (Optional for V1)
*   A new tab in "Settings" or a separate page to manage templates.
*   For MVP, we might just allow creating/loading from the Product screens.

## Implementation Steps

1.  **Database**: Create `product_templates` table via migration script.
2.  **API**: Create `templateController.ts` and routes.
3.  **Frontend**:
    *   Implement "Save as Template" modal.
    *   Implement "Load Template" selector in Create Product.
