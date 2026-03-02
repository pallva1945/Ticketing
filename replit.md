# PV Internal Portal

## Overview
The PV Internal Portal is a React-based application for Pallacanestro Varese, designed as a central hub for Revenue, Cost, and Verticals P&Ls. Its main purpose is to provide real-time data visualization for strategic decision-making, operational efficiency, and enhanced fan engagement. It consolidates diverse data sources into a single, intuitive platform to support business growth and market potential within the sports industry. The Revenue Center is currently active, offering executive overviews and detailed analytics for ticketing, game day, and various business operations.

## User Preferences
Not specified.

## System Architecture
The application uses a modern web stack: React 18 and TypeScript for the frontend, styled with Tailwind CSS, and Recharts for data visualization. The backend is an Express.js server acting as an API proxy.

**Key Architectural Decisions and Features:**

*   **Frontend Technologies**: React 18, TypeScript, Tailwind CSS (via CDN), Recharts.
*   **Backend Technologies**: Express.js server (port 5001) for data processing and API handling.
*   **Development & Build**: Vite (port 5000) for frontend serving and backend proxying.
*   **Data Handling**: Supports international number formats, normalizes headers, and deduplicates entries. Achieves parallel data loading using `Promise.all()`.
*   **Server-Side Processing**: Aggregates and caches critical CRM, corporate commercial value, demographics, and behavioral analytics data on the Express backend.
*   **Data Source Prioritization**: Firebase for detailed ticketing data (zone-level); BigQuery for aggregate data and other modules.
*   **UI/UX & Navigation**:
    *   Responsive design optimized for mobile devices.
    *   Full-page snap-scroll experience with quintic ease animation, sticky navigation, and section indicators for Internal Hub and VB Hub.
    *   Hash-based routing with a split landing page allowing users to choose between Pallacanestro Varese (PV) or Varese Basketball (VB) post-login.
    *   **Landing Page**: 3 cards — Pallacanestro Varese, Varese Basketball, Our Projects (coming soon).
    *   **InternalHub (PV)**: Card picker layout — 3 cards: "Us" (→ PVUsPage with 8 horizontal sub-slides), "Corp" (→ Financial Center), "BOps" (→ external link). PV logo, animated entrance, admin settings button.
    *   **VBHub (VB)**: Card picker layout — 2 cards: "Us" (→ VBUsPage with 4 fade sub-slides: VMV, About Us, Our Method, Our Team), "Youth Development" (→ VBDashboard). VB logo, orange theme, animated entrance.
    *   **VBUsPage**: Standalone page with 4 fade sub-slides (VMV, About Us, Our Method, Our Team) with scroll/touch/keyboard interception, sub-slide indicators, and nav bar.
    *   Color coding for scores (blue ≥100, emerald ≥80, amber ≥60, orange ≥40, red <40).
*   **Financial & Analytics Features**:
    *   **Financial Metric Adjustments**: Toggle for "Accounting" vs. "Realistic" views for corporate ticket reclassification (default: "Realistic").
    *   **Pacing Logic**: Variable (games-based) and absolute (percentage-based) season pacing, with prorated pacing for sponsorship revenue.
    *   **Deal Quality Metric**: In sponsorship analytics, calculated as `Delta` (Revenue Received - Value Given).
    *   **Cost Center CSV Upload**: Feature for updating cost data across verticals, with European number format parsing and storage in PostgreSQL.
    *   **Google Sheets Integration**: Direct synchronization for cost data and revenue modules via Replit's Google Sheets connector.
    *   **VB P&L Google Sheets Integration**: Dedicated `vb_pnl` module for syncing Varese Basketball P&L data. Parses Revenue (Sponsorship, BOps, Gameday, EBP), Cost of Sales (BOps, EBP), and SG&A with section grouping into: Team Operations, Labor & Professional Services (combined), Marketing, Office, Utilities & Maintenance (combined), Financial. Monthly breakdowns with `sgaSections` in `VbPnlData`. Data feeds dynamically into Revenue Executive Overview, Cost Center (CoS under "Varese Basketball" in CoS group, SG&A under "Varese Basketball" in SG&A group), and Verticals P&L.
    *   **Cost Control Center**: Dedicated section with Energy Consumption (LTM mode, YoY comparisons, facility breakdowns), Van Costs (season-based filtering, detailed metrics), and Transaction Search (Xero integration).
*   **Authentication & Access Control**:
    *   Dual authentication: Google OAuth for internal users (@pallacanestrovarese.it) and password-based for external invited users.
    *   JWT sessions with httpOnly cookies for security.
    *   Role-based access control (Internal, External users with varying access levels).
    *   Admin panel for user management, access requests, and invitation link generation.
    *   PostgreSQL stores user, permission, and invitation data.
*   **Youth Development (Varese Basketball - VB Dashboard)**:
    *   Player profiles, session data, progression tracking, and a scouting database using BigQuery.
    *   Server-side endpoints for profile and prospect data, including anthropometric calculations.
    *   **CAS (Composite Athleticism Score)**: NBA-benchmarked (100 = NBA Draft Combine Average) based on archetypes (Playmaker, 3&D, Center) and age factor.
    *   **APS (Anthropometric Potential Score)**: NBA-benchmarked (100 = NBA Draft Combine Average) using projected measurements and age factor.
    *   **PVB Potential Score**: Composite 5-pillar player evaluation (Size/APS, Athleticism/CAS, Work Ethic, Talent, Character) with weighted factors and age adjustment.
    *   **Search**: Compound query parser supports player name, date, month, season, category, role, and **week numbers** (e.g., `w28`, `scola prato w28 w29`). Weeks are relative to season start dates with player-specific overrides.
*   **Game Performance Dashboard**:
    *   Sources individual and team game statistics from BigQuery.
    *   Features Team Performance, Player Performance (with advanced stats like eFG%, TS%, USG%, PPP, Win Shares), and a powerful Stats Search engine.
    *   Includes a `Skill Score (Talent)` metric, NBA-benchmarked, derived from game stats (3PT%, FT%, AST/TO, USG%, Intensity, Win Shares per game), which feeds into the PVB Potential Score.
    *   Data fetched via `/api/vb/ind-games` with a 10-minute server-side cache.
*   **Community Intelligence Hub**: Integrates Shopify order history for behavioral insights, including RFM segmentation, gateway analysis, bundle analysis, and cohort retention heatmaps.

## External Dependencies
*   **Firebase**: Primary data source for ticketing, cloud storage.
*   **Google Gemini AI**: For potential AI functionalities.
*   **Replit App Storage**: For large file uploads, particularly CRM data.
*   **BigQuery**: Data source for Ticketing, CRM, Sponsorship, GameDay, and VB Dashboard.
*   **Shopify Admin API**: For merchandising analytics (orders, products, customers).
*   **Resend API**: For sending access request notification emails.
*   **Google OAuth**: For internal user authentication.
*   **`google-auth-library`**: Backend verification of Google ID tokens.
*   **Xero Integration**: OAuth 2.0 for live accounting data search and management.