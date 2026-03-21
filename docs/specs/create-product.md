# Create / Edit Product

## What It Does

This is where you build the full cost picture for a product. Every input — materials, time, packaging, shipping — feeds into a live pricing calculator that tells you instantly what you need to charge to hit your profit goals.

The same screen is used when creating a new product and when editing an existing one.

---

## Product Information

At the top of the form you set the basics:

- **Name** — what you call this product (required)
- **SKU** — an optional reference code; one is auto-suggested if you leave it blank
- **Category** — group this product with similar items
- **Status** — Draft / In Progress / On Sale / Inactive
- **Description** — optional notes about the product
- **Made (Batch Size)** — how many units you produce in one run (defaults to 1)

---

## Cost Sections

Costs are broken into three sections, displayed as a three-column grid:

### Materials
Add the raw materials that go into making this product.

- Pick from your saved Materials Library or type a new one
- Choose whether the quantity is an **exact amount** (e.g. 50g) or a **percentage** (for consumables like wax or glue)
- Set whether the quantity is per item or per batch
- Each material appears as a card showing its cost contribution per unit

You can save any new materials directly to your library from the product form.

### Labour
Track the time it takes to make this product.

- Add activities (e.g. "Cutting", "Assembling", "Finishing")
- Set time in minutes and an hourly rate (defaults to your rate from Settings)
- Mark activities as per item or per batch

### Other Costs
Anything that doesn't fit neatly into materials or labour:

- Packaging, boxes, tissue paper
- Shipping supplies
- Transaction or listing fees (if not handled via fee profiles in Settings)
- Each cost can be per item or per batch

---

## Pricing Calculator

A live calculator sits alongside the cost breakdown. As you add costs, it updates in real time.

**Choose your pricing method:**

| Method | How It Works |
|--------|-------------|
| **Set Price** | You type the price; PriceMe shows the resulting profit and margin |
| **Target Profit $** | Type the dollar profit you want per unit; price is calculated for you |
| **Target Margin %** | Type the margin percentage you want; price is calculated for you |
| **Markup %** | Type the percentage above cost; price is calculated for you |

**Summary indicators** — three circular gauges show your Profit, Margin %, and Markup % at a glance, colour-coded to indicate health.

**Break-even chart** — shows how many units you need to sell at this price to cover the total cost of your batch.

---

## Shipping Scenarios

Add multiple shipping cost templates (e.g. "Standard", "Priority", "International") to see how different shipping costs affect your net profit. Useful when you sell on platforms that handle shipping differently.

---

## Product Variants

Toggle on **"This product has variants"** to set up different versions of the same product (e.g. Small / Medium / Large, or different colours).

- Define the attribute types (Size, Colour, Material, etc.) and their values
- PriceMe generates the full variant matrix automatically
- Each variant can have its own price override, SKU, and stock level
- Cost structure is shared with the base product by default

See [product-variants.md](product-variants.md) for the full spec.

---

## AI Product Generator

New to PriceMe, or creating a product you've never made before? The **Generate with AI** flow (accessible from the Products list) lets you describe the product in plain language. PriceMe suggests:

- Likely materials and quantities
- Estimated labour activities and times
- Shipping cost scenarios
- A recommended starting price

You can accept, edit, or discard any suggestion before saving.

---

## Market Analysis Panel

Once a product has been saved, an embedded market analysis panel shows:

- Average competitor price for this type of product
- How many competitors are being tracked
- Your product's position: below market / at market / above market
- AI-generated insights and recommendations

---

## Templates

Before saving, you can click **Save as Template** to store this product's cost structure as a reusable starting point. Next time you make something similar, you can load the template and adjust rather than starting from scratch.

See [product-templates.md](product-templates.md) for the full spec.

---

## Saving

Click **Save** to create or update the product. All costs, pricing, and variant data are saved together. The product appears immediately in your Products list.

Click **Cancel** to discard changes and return to the list.
