# PV Financial Center

## Overview
The PV Financial Center is a React-based application designed for Pallacanestro Varese. It serves as the top-level hub with three sections: Revenue Center (active), Cost Center (placeholder), and Verticals P&Ls (placeholder). The Revenue Center provides an executive overview, detailed ticketing analytics, game day data, and various business operations metrics. The project aims to offer a comprehensive, real-time data visualization tool for strategic decision-making, improving operational efficiency, and enhancing fan engagement. It consolidates diverse data sources into a single, intuitive platform to support business growth and market potential within the sports industry.

## Authentication
- **Google Sign-In** (`LoginPage.tsx` + `AuthContext.tsx`): Google OAuth login restricted to @pallacanestrovarese.it domain
- **Server Auth** (`server/index.ts`): Google ID token verification via `google-auth-library`, then JWT session with httpOnly cookies, 7-day expiry
- **Endpoints**: POST /api/auth/google (Google token verification + domain check + JWT), GET /api/auth/verify (session check), POST /api/auth/logout (cookie clear), GET /api/auth/client-id (serves Google Client ID to frontend)
- **Sign Out**: User avatar dropdown in Revenue Center header shows Google profile picture, name, email, and sign-out option
- **Security**: JWT_SECRET required (no fallback), GOOGLE_CLIENT_ID env var required, cookie secure flag adapts to production/dev, server-side Google token verification with `hd` (hosted domain) check

## Navigation Architecture
- **Login Page** (`LoginPage.tsx`): Corporate access gate — email-only login for @pallacanestrovarese.it
- **Welcome Page** (`WelcomePage.tsx`): Animated intro with logo fade, title, and Enter button
- **Internal Hub** (`InternalHub.tsx`): Full-page snap-scroll experience with 4 sections — Vision/Mission/Values, About Us, Our Team, then Corp + BOps (Departments). Quintic ease animation (1.8s). Sticky nav with section indicators and side dots.
- **Financial Center** (`FinancialCenter.tsx`): Entry point for Corp with 3 cards — Revenue Center, Cost Center, Verticals P&Ls
- **Revenue Center** (`App.tsx`): The full revenue dashboard with all modules
- **Cost Center** (`CostCenter.tsx`): Cost dashboard with 7 modules (GameDay, Sponsorship, BOps, Venue Ops, Merchandising, EBP, Varese Basketball) — all placeholders
- **Verticals P&Ls** (`VerticalsPnL.tsx`): P&L dashboard with 5 verticals — GameDay, Sponsorship, Merchandising, Venue Ops, Varese Basketball
- Hash-based routing: Welcome (empty/#welcome) → Hub (#hub) → Financial Center (#landing) → Revenue (#revenue) / Cost (#cost) / P&L (#pnl)
- PV logo navigates back one level: Revenue→Financial Center, Financial Center→Hub, Hub→Welcome

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

## Community Intelligence Hub
- **Location**: "Community" tab within MerchandisingView (next to Inventory tab)
- **Data Scope**: Analyzes all 3 years of Shopify order history (all seasons) for behavioral insights
- **Sidebar**: When on Merchandising module, sidebar shows Shopify source + refresh button (not BigQuery/Latest Game)
- **RFM Segmentation**: Champions (3+ orders, 100+ EUR), At Risk (2+ orders, no purchase in 6+ months), New Blood (first-time buyers in last 30 days)
- **Gateway Analysis**: Identifies top entry products (most common first-purchase items) using horizontal bar chart
- **Bundle Analysis**: Frequently bought together pairs based on co-occurrence in orders
- **Cohort Retention Heatmap**: Groups customers by first-purchase month, tracks return rates across subsequent months (up to 12 months)
- **Styling**: Matches MerchandisingView exactly (white rounded-xl cards, border-gray-100, shadow-sm, orange accent, same typography)
- **Revenue**: All monetary values exclude IVA (Italian VAT)

## BOps (Serie A) Module
- **Location**: `src/components/BOpsDashboard.tsx`
- **Accounting**: 4/10 month basis to match gameday revenue recognition
- **H1 Budget**: €180,000 (4/10 months) · **Season Budget**: €525,000
- **H1 Actual**: €173,508 split across:
  - Buy Out (Elisée Assui): €80,000
  - U23–U26: €18,500
  - LBA Shared Revenue: €75,008
- **Key Note**: Under 26 is in budget but club doesn't qualify due to 5+5 → 6+6 roster status change (Aucap fund decision)
- **Data Management**: Hidden (no CSV uploads needed)

## CRM Data Structure
- **Sales Channel ("Sell" column)**: Exactly 5 types - ABB, Tix, CORP, MP, VB
- **Ticket Types (separate column)**: Includes categories like "promotion", "ridotto", "staff" - these are NOT sales channels
- Sales channel breakdown in CRM analytics uses only the "Sell" column values

## Verticals P&L
- **Location**: `src/components/VerticalsPnL.tsx`
- **Period**: H1 2025/26 (Jul–Dec 2025)
- **5 Verticals**: GameDay, Sponsorship, Merchandising, Venue Ops, Varese Basketball
- **GameDay Vertical**: Sales = Ticketing (€1,177,289) + BOps (€173,508); COS = GameDay (€206,015) + BOps (€1,691,290)
- **Sponsorship**: Sales €1,097,254; COS €30,854
- **Merchandising**: Sales €91,742; COS €81,849
- **Venue Ops**: Sales €85,486; COS €49,877
- **Varese Basketball**: Sales €386,020; COS €260,635; dedicated SG&A €148,459
- **SG&A Allocation**: Total €837,843 = VB dedicated (€148,459) + Shared (€689,384). Shared split: GameDay 60%, Sponsorship 30%, Merchandising 5%, Venue Ops 5%
- **Features**: Summary KPI cards, net income bar chart, individual vertical P&L cards, consolidated table with margins