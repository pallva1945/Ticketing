
import { GameData, TicketZone } from './types';

export const APP_NAME = "PV Strategy AI";
export const TEAM_NAME = "Pallacanestro Varese";
export const MAX_CAPACITY = 5177;
export const PV_LOGO_URL = "https://i.imgur.com/r1fWDF1.png";

// --- TARGET CONFIGURATION ---
export const SEASON_TARGET_TOTAL = 1650000;   // €1.65M Ticketing Core
export const SEASON_TARGET_GAMEDAY = 1650000;  // €1.65M Variable Target (Net minus Tix) - For GameDay Module
export const SEASON_TARGET_GAMEDAY_TOTAL = 3300000; // €3.3M Total GameDay Budget (Tix + Variable)
export const SEASON_TARGET_TICKETING_DAY = 495000; // €495k Target for Day Sales (€33k/game * 15 games)

// --- GOOGLE SHEETS CONFIGURATION ---
export const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_UAEI1obd5F-Pfbe-G5dSFjcK1E86y9rStQb3bDdFRzVPkDItG7V83FZgw8TbtqiONYcGpRoneImG/pub?gid=2044782685&single=true&output=csv"; 

export const SYSTEM_INSTRUCTION = `
Role: Senior Revenue Analyst & Sales Strategist for Pallacanestro Varese.
Goal: Maximize Yield (Revenue per Seat) and Inventory Efficiency.

**Persona Guidelines:**
1.  **Be Direct:** No fluff. Start with the most critical insight.
2.  **Focus on Money:** Occupancy is vanity, Revenue is sanity. Focus on Yield.
3.  **Identify Distress:** Highlight zones with <60% occupancy as "Distressed Inventory".
4.  **Identify Opportunity:** Highlight zones with >90% occupancy as "Yield Opportunities" (Price increase candidates).

**Response Structure:**
- **The Verdict:** One sentence summary of performance.
- **Key Risks:** Bullet points of revenue leakage.
- **Strategic Action:** Concrete recommendation (e.g., "Launch 48h Flash Sale for Curva", "Increase Courtside price by €10").

**Context:**
- LBA = Lega Basket Serie A (Italian Top League).
- Budget Target: €1.65M Ticketing.
`;

// PRE-SOLD CAPACITY (Summer Sales: Abb + Corp + Protocol)
// Used to calculate "Game Day Availability"
// Formula: Fixed = Full Capacity - Game Day Capacity
export const FIXED_CAPACITY_25_26: Record<string, number> = {
  [TicketZone.PAR_O]: 223,    // Total 373 - Gameday 150 = 223 Fixed
  [TicketZone.PAR_E]: 94,     // Total 200 - Gameday 106 = 94 Fixed
  [TicketZone.TRIB_G]: 1230,  // Total 2209 - Gameday 979 = 1230 Fixed
  [TicketZone.TRIB_S]: 261,   // Total 367 - Gameday 106 = 261 Fixed
  [TicketZone.GALL_G]: 282,   // Total 389 - Gameday 107 = 282 Fixed
  [TicketZone.GALL_S]: 70,    // Total 669 - Gameday 599 = 70 Fixed
  [TicketZone.CURVA]: 314,    // Total 458 - Gameday 144 = 314 Fixed
  [TicketZone.COURTSIDE]: 38, // Total 44 - Gameday 6 = 38 Fixed
  [TicketZone.SKYBOX]: 60,    // Total 60 - Gameday 0 = 60 Fixed
  [TicketZone.OSPITI]: 0,     // Total 233 - Gameday 233 = 0 Fixed
  [TicketZone.PAR_EX]: 68     // Total 75 - Gameday 7 = 68 Fixed
};

// Initial empty state, data is loaded from CSV in App.tsx
export const MOCK_GAMES: GameData[] = [];
