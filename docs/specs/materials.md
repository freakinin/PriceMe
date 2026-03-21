# Materials — Material Library

## What It Does

The Materials page is your central library of everything you use to make your products. Instead of typing the same material name and price into every product, you build it once here and reuse it everywhere. When a material cost changes, update it in the library and PriceMe reflects the change across all products that use it.

---

## Views

Toggle between:
- **Table view** — compact rows for managing a large library quickly
- **Grid view** — card-based layout with key details visible at a glance

---

## Table Columns

| Column | Description |
|--------|-------------|
| **Name** | Material name |
| **Stock** | Quantity currently in stock |
| **Unit** | Measurement unit (g, ml, pcs, etc.) |
| **Cost per Unit** | Price per unit of measurement |
| **Total Value** | Stock × Cost per unit — what this inventory is worth |
| **Reorder Point** | The stock level at which you want a low-stock alert |
| **Last Updated** | When the cost or stock was last changed |

---

## Searching & Filtering

- **Search bar** — filter by material name in real time
- **Advanced filters** — filter by column values using operators (contains, equals, starts with, ends with)
- **Out of Stock filter** — toggle to show only materials where stock has reached zero

---

## Adding & Editing a Material

Click **Add Material** or the edit icon on any row to open the material form:

- **Name** — what you call this material
- **Unit** — how it's measured (ml, g, oz, pcs, m, etc.)
- **Cost per unit** — what you pay per unit
- **Current stock** — how much you have right now
- **Reorder point** — the minimum stock level before you get a low-stock alert
- **Consumable flag** — mark it as a consumable if you use it as a percentage of a batch (e.g. wax, glue) rather than a fixed quantity
- **Supplier** — optionally link this material to a supplier in your Suppliers list
- **Last purchased date** — when you last restocked

---

## Adding Stock

When you restock a material, use the **Add Stock** button instead of manually editing the quantity. This records:

- How many units you bought
- What you paid (the price per unit of that purchase)

PriceMe calculates a **weighted average cost** — blending the new price with the existing stock price — so your cost-per-unit is always accurate rather than jumping to the latest purchase price.

---

## Low Stock Alerts

Any material whose stock has fallen to or below its reorder point is highlighted in the table and surfaces on the Home dashboard. This gives you advance warning before you run out mid-production.

---

## Bulk Actions

Select multiple materials and:
- **Delete** — remove them from the library (with confirmation)
- **Update category** — reassign a batch to a different category

---

## Material Usage

From any material's row, you can see which products in your catalogue use it. This is helpful when you're deciding whether it's safe to delete a material or update its cost.

---

## What's Next

- Material cost history (chart of how the price has changed over time)
- Price alerts (notify you when a material's cost has risen above a threshold)
- CSV import of materials
- Supplier contact details and lead times
