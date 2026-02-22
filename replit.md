# PV Internal Portal

## Overview
The PV Internal Portal is a React-based application for Pallacanestro Varese, serving as a central hub with sections for Revenue, Cost, and Verticals P&Ls. Its primary purpose is to provide a comprehensive, real-time data visualization tool for strategic decision-making, operational efficiency, and enhanced fan engagement by consolidating diverse data sources into a single, intuitive platform to support business growth and market potential within the sports industry. The Revenue Center is currently active, offering executive overviews, detailed analytics for ticketing, game day, and various business operations.

## User Preferences
Not specified.

## System Architecture
The application leverages a modern web stack, utilizing React 18 and TypeScript for the frontend, styled with Tailwind CSS, and employing Recharts for charting. The backend is an Express.js server, acting as a proxy for API calls. Key architectural decisions include:

-   **Frontend**: React 18, TypeScript, Tailwind CSS (via CDN), Recharts.
-   **Backend**: Express.js server (port 5001) for data processing and API handling.
-   **Build/Dev**: Vite (port 5000) for frontend serving and backend proxying.
-   **Data Handling**: Supports international number formats, normalizes headers, and deduplicates entries.
-   **Parallel Data Loading**: Achieved using `Promise.all()` for modules like Ticketing, GameDay, Sponsorship, and CRM to ensure faster initial renders.
-   **Server-Side Processing**: Critical data aggregation for CRM, corporate commercial value, demographics, and behavioral analytics is processed and cached on the Express backend.
-   **Data Source Prioritization**: Firebase is the primary source for detailed ticketing data (zone-level), while BigQuery is used for aggregate data and other modules.
-   **Dynamic Filtering**: Interactive click-to-filter functionality across dashboards (e.g., by sponsors, sectors, contract types).
-   **Responsive Design**: UI is optimized for mobile devices with responsive layouts.
-   **Financial Metric Adjustments**: A toggle exists for "Accounting" vs. "Realistic" views, allowing corporate tickets to be reclassified between Ticketing and Sponsorship revenue. "Realistic" is the default.
-   **Pacing Logic**: Season pacing includes variable (games-based) and absolute (percentage-based) logic, with prorated pacing for sponsorship revenue.
-   **Deal Quality Metric**: Sponsorship analytics feature a "Deal Quality" metric based on `Delta` (Revenue Received - Value Given).
-   **Authentication**: Dual authentication system supporting Google OAuth for internal users (@pallacanestrovarese.it domain) and password-based login for external invited users. JWT sessions with httpOnly cookies are used for security.
-   **Access Management**: Role-based access control with different user types (Internal, External) and access levels (full, partial). An admin panel allows managing users, approving access requests, and generating invitation links. PostgreSQL is used for user, permission, and invitation data.
-   **Navigation**: Hash-based routing with split landing page. After login, users choose between Pallacanestro Varese (PV) or Varese Basketball (VB). PV leads to InternalHub (Vision/Mission/Values, About Us, Our Team, Departments with Corp + BOps). VB leads to VBHub (Vision/Mission/Values, About Us, Our Team, BOps → VBDashboard). Routes: welcome → hub/vb-hub → landing/vb → revenue/cost/pnl.
-   **UI/UX**: Full-page snap-scroll experience for both Internal Hub and VB Hub with quintic ease animation, sticky navigation, and section indicators.
-   **Community Intelligence Hub**: Integrates Shopify order history for behavioral insights, including RFM segmentation, gateway analysis (top entry products), bundle analysis, and cohort retention heatmaps.
-   **VB Dashboard (Varese Basketball Youth Development)**: Features player profiles, session data, progression tracking, and a scouting database. Utilizes BigQuery for data, with server-side endpoints for profile and prospect data, and includes anthropometric calculations (e.g., body fat conversion).

## External Dependencies
-   **Firebase**: Cloud storage, primary data source for ticketing, persistence for other modules.
-   **Google Gemini AI**: Integrated for potential AI-driven functionalities.
-   **Replit App Storage**: Used for large file uploads, particularly CRM data.
-   **BigQuery**: Data source for Ticketing, CRM, Sponsorship, GameDay, and VB Dashboard modules.
-   **Shopify Admin API**: Integrated for merchandising analytics (orders, products, customers) from pallacanestro-varese.myshopify.com.
-   **Resend API**: Used for sending access request notification emails to the admin.
-   **Google OAuth**: For internal user authentication.
-   **`google-auth-library`**: Backend verification of Google ID tokens.