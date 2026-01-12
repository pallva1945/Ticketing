# PV Ticketing Dashboard

## Overview
A React-based ticketing dashboard for Pallacanestro Varese, providing executive overview, ticketing analytics, game day data, and various business operations metrics.

## Project Architecture
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (via CDN)
- **Charts**: Recharts
- **Backend Services**: Firebase, Google Gemini AI

## Directory Structure
```
src/
├── components/       # React components (ArenaMap, ChatInterface, DashboardChart, etc.)
├── data/            # Data files (csvData, gameDayData, crmData, sponsorData)
├── services/        # Service integrations (dbService, geminiService)
├── utils/           # Utility functions (dataProcessor)
├── App.tsx          # Main application component
├── index.tsx        # Application entry point
├── types.ts         # TypeScript type definitions
├── constants.ts     # Application constants
└── firebaseConfig.ts # Firebase configuration
```

## Development Setup
- Dev server runs on port 5000
- Uses Vite for hot module replacement
- Configured to allow all hosts for Replit proxy compatibility

## Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Recent Changes
- January 12, 2026: CRM Data Loading on Startup
  - Added CRM fallback data file (src/data/crmData.ts) with sample customer records
  - CRM data now loads automatically on app startup using processCRMData function
  - Sample data includes ~24 representative customer records with all fields populated
  - Users can still upload their own CRM CSV files to override the default data

- January 12, 2026: 3-Season Revenue Trend - Corp Tickets Toggle
  - Added Accounting/Realistic view toggle to switch corp tickets between Ticketing and Sponsorship
  - **Realistic view is now the default** - Corp tickets moved from Ticketing → Sponsorship
  - Accounting view: Corp tickets counted in Ticketing (standard financial reporting)
  - Corp ticket revenue calculated from ticketing CSV "Corp Eur" aggregate column
  - Improved formatCompact function for cleaner negative number display (-€542k instead of €-542k)
  - Mobile-optimized toggle with responsive layout
  - YoY percentages recalculate based on adjusted values when toggle is switched

- January 12, 2026: 3-Season Revenue Trend Mobile Optimization
  - Grid stacks to single column on mobile (grid-cols-1 sm:grid-cols-3)
  - Legend wraps on small screens
  - Chart containers centered with max-width for mobile
  - Responsive padding and spacing

- January 10, 2026: Executive Overview YoY Comparison & Ticketing Improvements
  - Added Year-over-Year Comparison section below Strategic Signals
  - YoY cards for Ticketing, GameDay, and Sponsorship showing current vs previous season
  - Each card displays: total revenue, game count, YoY percentage change
  - Ticketing card includes avg attendance comparison
  - GameDay card includes per-game average
  - Sponsorship card includes net change amount
  - Added 6th score card "Avg Attendance" to Ticketing dashboard (always shows total view, not affected by GameDay filter)
  - Removed Action Required banner from Ticketing dashboard

- January 12, 2026: Deal Quality Fix - Now Using Delta Column
  - Deal Quality now reads the "Delta" column directly from sponsorship CSV
  - Delta = Revenue Received - Value Given (positive = good deal, negative = bad deal)
  - Falls back to calculated delta if Delta column is missing from CSV
  - Fixed formatCompactCurrency to display negative values correctly (-€25k format)
  - Poor and Below deals now properly detected and displayed

- January 10, 2026: Sponsor Tiers & Deal Quality Analytics
  - Sponsor Tiers: Platinum (€200k+), Gold (€100k-200k), Silver (€50k-100k), Bronze (€10k-50k), Micro (€0-10k)
  - Deal Quality metric based on Delta (Revenue Received - Value Given back in LED, jersey, tickets, etc.)
  - Quality ratings: Excellent (20%+ margin), Good (5-20%), Fair (-5% to 5%), Below (-20% to -5%), Poor (<-20%)
  - Tier breakdown card showing count, total value, and average deal quality per tier
  - Deal Quality Overview card with portfolio net delta, average score (1-5), and distribution by rating
  - Updated portfolio table with Tier badges and Deal Quality indicators with hover tooltips showing delta amount and margin %

- January 10, 2026: Executive Overview Redesign
  - 7 revenue vertical score cards (Sponsorship, Ticketing, GameDay, VB, BOps, Venue Ops, Merchandising)
  - Actual data integration for Ticketing, GameDay, and Sponsorship (Sponsor Rec + CSR)
  - Verticals without data (VB, BOps, Venue Ops, Merch) show "Coming Soon" with dashed borders
  - Season pacing only accounts for verticals with actual data (Sponsorship + Ticketing + GameDay = €5.0M target)
  - Variable vs Absolute pacing logic: Ticketing/GameDay use games-based pacing; others use percentage-based
  - Sponsorship uses PRORATED pacing: signed contracts represent full-year value, recognized YTD = signed × seasonProgress
  - Comprehensive tooltips on all pacing bars showing YTD, target, achievement, pace, and projections
  - Sponsorship tooltips show both "Signed (Full Year)" and "Recognized YTD" values
  - 4 strategic signal cards: Projected Finish, Variable Run Rate, Fixed Revenue Secured, Attention Required
  - Stacked progress bar showing contribution by vertical with hover tooltips

- January 10, 2026: Sponsorship Season Target Widget
  - Added €2.1M season target for Sponsorship + CSR only
  - Excludes Corp Tickets, GameDay, and VB from target calculation
  - Dark themed pacing widget showing progress bar, variance %, and breakdown

- January 10, 2026: Interactive Click-to-Filter on Sponsorship Dashboard
  - Click any bar in Top Sponsors chart to filter by company
  - Click pie slices in Sector/Contract Type charts to filter
  - Click sector/type badges in portfolio table to filter
  - Active filter indicator with individual and bulk clear options
  - Portfolio table shows filtered results when filters active

- January 10, 2026: Data Processing & Number Format Standardization
  - Standardized all CSV parsing to Italian number format (dots as thousand separators, commas as decimal separators)
  - Added deduplication logic to ticketing and GameDay data processors
  - Updated fallback sponsor data with comprehensive multi-season sponsor database (420 entries across seasons 22/23 to 27/28)

- January 10, 2026: Sponsorship Analytics Module
  - Added SponsorshipDashboard component with full analytics views
  - Top sponsors chart, sector breakdown, contract type analysis
  - Revenue reconciliation comparison and monthly cash flow tracking
  - CSV upload functionality with Firebase cloud sync support
  - Toggles to exclude Corp Tickets and GameDay from calculations

- January 10, 2026: Initial Replit setup
  - Configured Vite for port 5000 with allowedHosts
  - Set up development workflow
