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
- January 10, 2026: Initial Replit setup
  - Configured Vite for port 5000 with allowedHosts
  - Set up development workflow
