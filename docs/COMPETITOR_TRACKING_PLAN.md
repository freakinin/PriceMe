# Competitor Price Tracking & Analysis - Implementation Plan

## 1. Overview
This document outlines the plan for implementing **Competitor Price Tracking** in PriceMe. The goal is to allow users to track competitor products from external sites (e.g., Etsy), analyze their pricing, materials, and quality using AI, and **compare them directly against their own products while editing pricing**.

## 2. Architecture
The system will consist of three main parts:
1.  **PriceMe Web App**:
    *   **Product Editor Integration**: Integrated sidebar/panel in the "Edit Product" page to view competitors while adjusting pricing.
    *   **Dashboard**: A high-level view of all tracked competitors (optional MVP).
2.  **PriceMe API**: Backend services for scraping (Jina AI), analysis (Gemini LLM), and scheduled price monitoring.
3.  **Chrome Extension**: A browser extension to quickly add products from the current tab and link them to existing PriceMe products.

### High-Level Flow
1.  **Input**: User provides a URL (via Product Page or Chrome Extension).
2.  **Scraping**: API calls **Jina AI Reader** to get clean markdown/text.
3.  **Analysis (AI/RAG)**:
    *   **Data Extraction**: Gemini LLM extracts Price, Title, Materials.
    *   **Qualitative Analysis**: Gemini LLM analyzes images (if URLs provided) and text to "rate" Quality Score (Image, Description, Overall).
4.  **Storage**: structured data is stored in Postgres, linked to a specific `Product`.
5.  **Display**:
    *   **Product Page**: Side-by-side comparison. "Your Price: $50 vs Competitor: $45".
    *   **Notifications**: Alert user if competitor price drops for an "On Sale" product.

## 3. Data Schema (PostgreSQL)

### `Competitor`
*   `id`: UUID
*   `name`: String (e.g., "Etsy Store X")
*   `url`: String (Shop URL)
*   `userId`: UUID (Foreign Key)

### `TrackedProduct`
*   `id`: UUID
*   `competitorId`: UUID
*   `linkedToProductId`: UUID (Foreign Key to `Product`)
*   `url`: String
*   `title`: String
*   `currentPrice`: Decimal
*   `currency`: String
*   `imageUrl`: String
*   `lastScrapedAt`: DateTime
*   `userId`: UUID
*   **Analysis Fields**:
    *   `materials`: JSONB (List of materials detected)
    *   `qualityScore`: Integer (1-10)
    *   `imageQualityScore`: Integer (1-10)
    *   `descriptionScore`: Integer (1-10)
    *   `aiAnalysis`: Text (Summary/Reasoning)

### `PriceHistory`
*   `id`: UUID
*   `trackedProductId`: UUID
*   `price`: Decimal
*   `recordedAt`: DateTime

## 4. Backend Implementation (`apps/api`)

### Services
*   **`scraper.service.ts`**: Handles Jina AI interactions.
*   **`ai.service.ts`**: Handles Gemini interactions for extraction and scoring.
*   **`priceMonitor.ts` (Cron Job)**:
    *   Runs daily (or configurable interval).
    *   Selects all `TrackedProduct`s linked to active/on-sale `Product`s.
    *   Re-scrapes URL.
    *   If current price != stored price:
        *   Add entry to `PriceHistory`.
        *   Update `TrackedProduct.currentPrice`.
        *   **Trigger Notification**.

### API Endpoints
*   `POST /competitors/track`: Track a new URL. Optional `linkedProductId`.
*   `GET /products/:id/competitors`: Get all competitors linked to a specific product.
*   `DELETE /competitors/:id`: Stop tracking.

## 5. Frontend Implementation (`apps/web`)

### Product Editor Integration
Instead of a separate "Competitor Dashboard", we will enhance the **Product Edit Page**:
*   **Layout**: Split view or Collapsible Sidebar.
*   **"Market Analysis" Section**:
    *   Input: "Add Competitor URL".
    *   List: Cards for each tracked competitor.
    *   **Comparison**:
        *   "My Price" vs "Avg. Competitor Price".
        *   "My Profit" vs "Estimated Competitor Profit" (if materials known).
        *   "Quality Score" comparison.

### Notifications
*   In-app notification system (toast or notification center) for "Price Alert: [Competitor] changed price from $X to $Y".

## 6. Chrome Extension

### functionality
*   **Popup**:
    *   "Track this Product".
    *   Dropdown: "Link to my product..." (Search/Select from PriceMe products).
    *   Button: "Track & Analyze".

## 7. AI Analysis Strategy

**Prompt for Gemini:**
> "Analyze this product listing from [URL].
> Extracted Markdown: [CONTENT]
>
> 1. Extract Price, Title, Materials.
> 2. Rate the **Image Quality** (1-10) based on professional lighting, composition, and detail.
> 3. Rate the **Description Quality** (1-10) based on clarity, details, and SEO.
> 4. Estimate the **Material Cost** if possible (rough guess based on materials).
> 5. Return JSON."

## 8. Implementation Steps

### Phase 1: Core API & Scraping
1.  BF/DB: Create Tables.
2.  Backend: Implement `ScraperService` & `AIService`.
3.  Backend: `POST /track` endpoint.

### Phase 2: Product Page Integration
1.  Frontend: Update `ProductEditor` layout.
2.  Frontend: specific "Market Analysis" component.
3.  Frontend: Integrate `GET /products/:id/competitors` and `POST /track`.

### Phase 3: Notifications & Monitoring
1.  Backend: Implement `PriceMonitor` job.
2.  Backend: Notification system (simple DB table or service).
3.  Frontend: Display notifications.

### Phase 4: Chrome Extension
1.  Build extension to allow tracking from external sites.
