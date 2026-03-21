# Settings

## What It Does

Settings lets you configure the defaults and preferences that apply across your entire account. It opens as a dialog from anywhere in the app. Changes save immediately.

Settings are organised into three sections: **My Business**, **Selling**, and **Account**.

---

## My Business

### Financial
Core money settings that affect calculations across every product:

- **Currency** — the currency symbol used everywhere in the app (USD, EUR, GBP, AUD, CAD, and more)
- **Tax rate** — your income tax or GST/VAT rate as a percentage. When set, an "After Tax" toggle appears on the Dashboard and On Sale page to show take-home profit
- **Default hourly labour rate** — pre-fills the labour rate field whenever you add a labour cost to a product

### Measurements
- **Unit system** — switch between metric (g, ml, cm) and imperial (oz, fl oz, in) as your default

---

## Selling

### Platform Fees
Create fee profiles for each sales channel you use. A profile captures:

- **Platform name** — e.g. Etsy, Shopify, Amazon, Not on Marketplace
- **Transaction fee %** — the platform's cut of each sale
- **Payment processing fee %** — card/payment processor fee
- **Listing fee** — flat fee per listing (if applicable)

Once profiles are set up, you can enable **Fee-Aware mode** on the Products and On Sale pages to see profit and margin figures after fees are deducted.

### Shipping
Create named shipping templates (e.g. "Standard Tracked", "International Priority") with their costs. These pre-populate the shipping scenario fields on the product pricing screen.

---

## Account

### Profile
Update your account details:
- Name
- Email address
- Password (change requires current password)

### Subscription
Your current plan, usage summary, and options to change your plan.

- Shows plan name (Free / Starter / Growth / Pro)
- Usage bars for Products, Competitors, Coach Insights, and Chat
- **Upgrade** or **Downgrade** plan buttons
- If you're on a trial, a banner shows how many days remain

See the subscription feature spec for full details.

### Usage
A dedicated view of your current usage limits in detail:
- Products used vs limit
- Competitors tracked vs limit
- Coach insights generated vs limit
- Chat messages sent today vs daily limit

A prompt to upgrade appears when any limit reaches 80%.

### Billing *(coming soon)*
Stripe-powered billing portal for viewing invoices, updating payment method, and managing subscription renewal.

---

## Units Management

A dedicated section within My Business > Measurements lets you manage the list of units available across the app:

- View all default units
- **Add** custom units (e.g. "sheet", "spool", "yard")
- **Remove** units you don't use (prevented if the unit is currently in use by a material)
