# Sales Transactions

## What It Does

Sales Transactions is the system behind the On Sale page's revenue tracking. Instead of just counting units sold, it records the full details of every sale — the actual price charged, any discounts, the platform it sold on, and when it happened. This gives you accurate revenue, profit, and margin figures based on what you really earned, not just what your target price was.

---

## What a Sale Record Contains

Each sale you record captures:

| Field | Description |
|-------|-------------|
| **Product** | Which product was sold |
| **Variant** | Which variant (if the product has variants) |
| **Date** | When the sale happened (defaults to today; can be backdated) |
| **Quantity** | How many units in this transaction |
| **Unit price** | The actual price per unit the customer paid |
| **Discount** | Optional — amount off or percentage off |
| **Platform** | Where it sold: Etsy, Shopify, Direct, Amazon, eBay, or Other |
| **Notes** | Free-form notes about the sale |

---

## Recording a Sale

From the On Sale page, click **Record Sale** on a product row. A dialog opens with all the fields above pre-filled with sensible defaults:

- Unit price defaults to your set price
- Date defaults to today
- Platform remembers the last one you used

The dialog shows a live summary as you fill it in: subtotal, discount applied, total revenue, cost, and profit for this transaction.

---

## How Sales Affect Your Numbers

Once a sale is saved, it flows through the whole app:

- **On Sale page** — Sold, Revenue, Profit, and Margin columns update immediately
- **Analytics cards** — Total revenue, profit, and average margin recalculate
- **Stock** — Remaining stock (Made minus Sold) decreases automatically

---

## Sales History

Every sale you've recorded is stored permanently. From any product on the On Sale page you can view its full transaction history — a table showing every sale with the date, quantity, price, discount, and platform. Individual sales can be edited or deleted from here.

---

## Profit Calculation Modes

Sales figures feed into two different profit views you can toggle on the On Sale page:

- **Sold Profit** — profit calculated only on items actually sold (standard COGS approach)
- **Real Profit** — profit calculated against the total investment of everything you made, including unsold stock

---

## Discounts

When a customer pays less than your full price (a sale, coupon, or negotiated discount), you can record either:

- A **flat discount amount** (e.g. £2.00 off)
- A **percentage discount** (e.g. 10% off)

PriceMe calculates the other figure automatically. The discounted price is what's used in all revenue and profit calculations.

---

## Platforms

Recording which platform each sale came from lets you (in a future analytics view) compare performance across channels — how much you're selling on Etsy vs direct, which platform gives the best margins, and so on.

---

## Legacy Data Migration

If you used an earlier version of PriceMe that stored sales in your browser (localStorage), a one-time migration prompt helps move those records into the database. All historical figures are preserved.

---

## What's Next

- Revenue and profit trend charts by date
- Sales breakdown by platform (which channel performs best)
- CSV import of bulk sales
- Refund and return recording
- Platform integrations: auto-import orders from Etsy and Shopify
