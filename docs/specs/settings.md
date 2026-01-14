# Settings Page Specification

## Overview
User settings management page for currency, units, tax, and labor costs.

## Features

### Currency Settings
- Currency selection dropdown
- Supported currencies: USD, EUR, GBP, etc.
- Applied across all pages for price display

### Unit Management
- List of available units
- Add custom units
- Remove units (with validation if in use)
- Default units: ml, L, g, kg, oz, lb, pcs, etc.

### Tax Settings
- Tax percentage input
- Applied to calculations (if configured)

### Labor Cost Settings
- Default hourly labor cost
- Used as default in product creation

### Revenue Goal
- Optional revenue goal setting
- For future analytics/forecasting

## Data Requirements
- Fetches settings from `/api/settings`
- Updates via `/api/settings` (PUT)
- Settings linked to user account

## UI Components
- ShadCN Form components
- Input fields for each setting
- Dropdown for currency selection
- Save button with loading state
- Success/error toast notifications
