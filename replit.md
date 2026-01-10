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
├── data/            # Data files (csvData, gameDayData)
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
