# Materials Page Specification

## Overview
User material library management page with filtering and column visibility.

## Features

### Materials Table
- Displays all user materials
- Columns: Name, Width, Length, Unit, Price per Unit, Total Cost, Created, Updated
- Column visibility toggle
- Sortable columns
- Resizable columns

### Advanced Filtering
- Filter dropdown with column selection
- Filter operators: Contains, Equals, Not Contains, Starts With, Ends With
- Active filters displayed as badges
- Remove individual filters

### Global Search
- Search box searches material names
- Works with filters
- Real-time filtering

### Material Actions
- Add new material button
- Edit material (opens dialog)
- Delete material (with confirmation)

### Material Management
- Create materials with name, dimensions, unit, price
- Edit existing materials
- Delete materials
- Materials can be reused across products

## Data Requirements
- Fetches materials from `/api/materials`
- Creates/updates/deletes via `/api/materials` endpoints
- Materials linked to user account

## UI Components
- TanStack Table for data display
- EditMaterialDialog for editing
- ShadCN components: Table, Button, Input, Select, Badge, Dialog
- Consistent with Products page UI
