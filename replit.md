# PV Internal Portal

## Overview
The PV Internal Portal is a React-based application designed for Pallacanestro Varese. It serves as the top-level hub with three sections: Revenue Center (active), Cost Center (placeholder), and Verticals P&Ls (placeholder). The Revenue Center provides an executive overview, detailed ticketing analytics, game day data, and various business operations metrics. The project aims to offer a comprehensive, real-time data visualization tool for strategic decision-making, improving operational efficiency, and enhancing fan engagement. It consolidates diverse data sources into a single, intuitive platform to support business growth and market potential within the sports industry.

## Authentication
- **Dual Auth**: Google OAuth for @pallacanestrovarese.it internal users + password-based auth for external invited users
- **Google Sign-In** (`LoginPage.tsx` + `AuthContext.tsx`): Google OAuth login restricted to @pallacanestrovarese.it domain
- **Password Login** (`LoginPage.tsx`): External users log in with email + password (set during invite acceptance)
- **Server Auth** (`server/index.ts`): Google ID token verification via `google-auth-library`, then JWT session with httpOnly cookies, 7-day expiry
- **Endpoints**: POST /api/auth/google (Google token verification + domain check + JWT), POST /api/auth/password (password login for external users), GET /api/auth/verify (session check), POST /api/auth/logout (cookie clear), GET /api/auth/client-id (serves Google Client ID to frontend)
- **Sign Out**: User avatar dropdown in Revenue Center header shows Google profile picture, name, email, and sign-out option
- **Security**: JWT_SECRET required (no fallback), GOOGLE_CLIENT_ID env var required, cookie httpOnly+secure, server-side Google token verification with `hd` (hosted domain) check

## Access Management
- **Admin**: Only luisscola@pallacanestrovarese.it has admin access (hardcoded ADMIN_EMAIL in server/adminRoutes.ts)
- **Admin Panel** (`AdminPanel.tsx`): Accessible from Internal Hub departments section via "Access Management" button (visible only to admin)
- **Database** (`server/db.ts`): PostgreSQL tables — users, user_permissions, invitations, invitation_pages
- **User Types**: Internal (Google OAuth, auto-created on first login) and External (password-based, created via invitation)
- **Access Levels**: full (all pages/modules) or partial (only permitted pages/modules)
- **Page Permissions**: hub, revenue, cost, pnl (route-level); home, ticketing, gameday, sponsorship, merchandising, venue_ops, bops, sg (module-level within Revenue Center)
- **Access Request Flow**: New @pallacanestrovarese.it users don't get immediate access. Instead: User signs in with Google → access request created → admin gets email (via Resend) with approval link → admin clicks link (#approve/{token}) → selects access preset and approves → user account created with chosen permissions → user can now log in
- **Access Presets**: Full Access, Coaches (hub only), Corp Read Only, Finance, Custom — admin selects a preset when approving requests or managing users
- **Invitation Flow** (for external users): Admin generates invite link → copies to clipboard → sends manually (email/WhatsApp) → recipient opens link → sets name + password → account created with specified permissions
- **Invitation Validation**: Token checked for existence, status (pending only), and expiry before acceptance; marked accepted after use
- **Access Control**: Enforced in index.tsx (route-level canAccessPage) and App.tsx (module filtering); partial access with no permissions = no access
- **Email**: Resend API used for sending access request notification emails to admin (RESEND_API_KEY secret required); graceful fallback to console logging if not configured

## Navigation Architecture
- **Login Page** (`LoginPage.tsx`): Corporate access gate — email-only login for @pallacanestrovarese.it
- **Welcome Page** (`WelcomePage.tsx`): Animated intro with logo fade, title, and Enter button
- **Internal Hub** (`InternalHub.tsx`): Full-page snap-scroll experience with 4 sections — Vision/Mission/Values, About Us, Our Team, then Departments (Corp, BOps·PV, BOps·VB). Quintic ease animation (1.8s). Sticky nav with section indicators and side dots.
  - **BOps Split**: Section 4 has 3 cards — Corp (navigates to Financial Center), BOps·PV (links externally to basket.pallacanestrovarese.club), BOps·VB (Varese Basketball, placeholder/coming soon)
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

## VB Dashboard (Varese Basketball Youth Development)
- **Location**: `src/components/VBDashboard.tsx`
- **Navigation**: InternalHub → BOps · VB card → hash route `#vb`
- **Data Sources**: BigQuery `sg_db` table for session data, `sg_profile` table for player profiles (role, demographics, mug shot URLs)
- **Profile Data**: Fetched via `/api/vb-profiles` endpoint with 10-minute cache. BigQuery uses generic column names (string_field_0..15) mapped to: Name, Email, Cell_N, Mom_Height, Dad_Height, DOB (Excel serial), Role, Mid_Parental_Height, Mug_Shot, Season (format "25-26" → "2025/26"), Passport, Italian_Formation, SoY_Status, EoY_Status, Year_1_Destination, Revenue_Generated
- **Position Filter**: Uses Role field from profiles (values: Playmaker, 3nD, Center). Profile name matched to session player via fuzzy matching.
- **Body Fat Conversion**: Raw column stores 3-skinfold sum (S in mm). Converted to BF% using Jackson-Pollock/Siri formula: BD = 1.10938 - (0.0008267 × S) + (0.0000016 × S²) - (0.0002574 × age), then BF% = (495/BD) - 450. Age calculated from DOB (Excel serial) in player profile relative to session date.
- **Data Structure**: `VBSession` interface — player, date, practiceLoad, vitaminsLoad, weightsLoad, gameLoad, height, weight, wingspan, standingReach, bodyFat (raw skinfold sum), pureVertical, noStepVertical, sprint, coneDrill, deadlift, shootsTaken, shootsMade, shootingPct, injured
- **Date Format**: Italian D/M/YYYY parsed to YYYY-MM-DD
- **Season Dates**: 2024/25: Aug 23 → Jun 28; 2025/26: Aug 11 → Jun 26; 2026/27: Aug 3 → TBD. Days outside these bounds are vacation and excluded from all calculations (days off, season days, getSeason filter)
- **Column Mapping**: BigQuery returns lowercase (player, practice_load, shots_taken) → camelCase via getField() helper; sg_profile uses string_field_0..15
- **Tabs**:
  - **Overview**: Season filter, KPI cards (players/sessions/avg 3PT%/injury rate), session distribution bar chart, Player Roster table
  - **Player Profile**: Player selector, anthropometric + athletic stat cards, progression chart (4 metric groups), availability log, shooting history
  - **Compare**: Multi-player selector (max 4), radar chart (normalized 0–100), side-by-side metric table with best-value highlighting
  - **Progression**: Metric selector, multi-player line chart over time, delta cards (first→last measurement change)
- **Player Roster Table**: Sortable columns (click to toggle asc/desc), Total/Per Day toggle (Per Day divides by season calendar days, not session count)
- **Season Days Calculation**: `getSeasonDays()` — for selected season, calculates days from July 1 to current date (or season end for past seasons)
- **Features**: Dark mode support, English/Italian translations, responsive design, data refresh button