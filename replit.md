# PV Ticketing Dashboard

## Overview
The PV Ticketing Dashboard is a React-based application designed for Pallacanestro Varese. Its primary purpose is to provide an executive overview, detailed ticketing analytics, game day data, and various business operations metrics. The project aims to offer a comprehensive, real-time data visualization tool for strategic decision-making, improving operational efficiency, and enhancing fan engagement. It consolidates diverse data sources into a single, intuitive platform to support business growth and market potential within the sports industry.

## User Preferences
Not specified.

## System Architecture
The application uses a modern web stack with React 18 and TypeScript for the frontend, styled with Tailwind CSS (via CDN) and charting capabilities provided by Recharts. The backend is an Express.js server running on port 5001. Vite serves the frontend on port 5000 and acts as a proxy for backend API calls. Data is processed to handle international number formats (Italian and American), normalize headers, and deduplicate entries. Key architectural decisions include:
- **Parallel Data Loading**: All data modules (Ticketing, GameDay, Sponsorship, CRM) fetch data in parallel using `Promise.all()` for faster initial render times.
- **Server-Side Processing**: Critical data processing and aggregation for CRM, corporate commercial value, demographics, and behavioral analytics are performed on the Express backend and cached for performance.
- **Data Source Prioritization**: Cloud storage (Firebase) is the primary source for detailed ticketing data, especially for zone-level information, with BigQuery used for aggregate data and other modules.
- **Dynamic Filtering**: Interactive click-to-filter functionality is implemented across dashboards, allowing users to filter data by categories such as sponsors, sectors, and contract types.
- **Responsive Design**: The UI is optimized for mobile devices with responsive layouts, stacking grids, and wrapping legends.
- **Financial Metric Adjustments**: The dashboard includes a toggle for "Accounting" vs. "Realistic" views, allowing corporate tickets to be shifted between Ticketing and Sponsorship revenue calculations, with "Realistic" as the default.
- **Pacing Logic**: Season pacing incorporates variable (games-based) and absolute (percentage-based) logic, with prorated pacing for sponsorship revenue.
- **Deal Quality Metric**: Sponsorship analytics include a "Deal Quality" metric based on the `Delta` column (Revenue Received - Value Given) to categorize deals.

## External Dependencies
- **Firebase**: Used for cloud storage, serving as the primary data source for ticketing and persistence for other modules.
- **Google Gemini AI**: Integrated for potential AI-driven insights or functionalities.
- **Replit App Storage**: Utilized for large file uploads, particularly for CRM data, bypassing size limitations of other services.
- **BigQuery**: Serves as a data source for Ticketing, CRM, Sponsorship, and GameDay modules, providing comprehensive dataset access.
- **Shopify Admin API**: Integrated for merchandising analytics. Fetches orders, products, and customers from the Pallacanestro Varese store (pallacanestro-varese.myshopify.com). Uses API version 2024-01 with 15-minute cache for performance. Required secret: `SHOPIFY_ACCESS_TOKEN` (Admin API token starting with `shpat_`).

## CRM Data Structure
- **Sales Channel ("Sell" column)**: Exactly 5 types - ABB, Tix, CORP, MP, VB
- **Ticket Types (separate column)**: Includes categories like "promotion", "ridotto", "staff" - these are NOT sales channels
- Sales channel breakdown in CRM analytics uses only the "Sell" column values