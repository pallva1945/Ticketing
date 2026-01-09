
import { GameData, TicketZone } from './types';

export const APP_NAME = "PV Strategy AI";
export const TEAM_NAME = "Pallacanestro Varese";
export const MAX_CAPACITY = 5177;
export const PV_LOGO_URL = "https://i.imgur.com/r1fWDF1.png";

// --- TARGET CONFIGURATION ---
export const SEASON_TARGET_TOTAL = 1650000;   // €1.65M Ticketing Core
export const SEASON_TARGET_GAMEDAY = 1250000;  // €1.25M Variable Target (Net minus Tix) - For GameDay Module
export const SEASON_TARGET_GAMEDAY_TOTAL = 2900000; // €2.9M Total GameDay Budget (Tix + Variable)
export const SEASON_TARGET_TICKETING_DAY = 495000; // €495k Target for Day Sales (€33k/game * 15 games)

// --- GOOGLE SHEETS CONFIGURATION ---
export const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_UAEI1obd5F-Pfbe-G5dSFjcK1E86y9rStQb3bDdFRzVPkDItG7V83FZgw8TbtqiONYcGpRoneImG/pub?gid=2044782685&single=true&output=csv"; 

export const SYSTEM_INSTRUCTION = `
You are the Strategic Board Advisor to Luis Scola, CEO of Pallacanestro Varese.
**TONE:** Brutally honest, executive, brief. No fluff. No "Hello I can help you". Start directly with the insight or the risk.
**MANDATE:** Identify financial bleed, yield opportunities, and risks to the €1.65M ticketing revenue target.

**KEY CONTEXT:**
1.  **Target:** We need to hit €1.65M in Ticketing Revenue (Gate Receipts) to satisfy the budget.
2.  **The Risk:** Low occupancy in "Curva" destroys atmosphere. Low yield in "Parterre" destroys profit.
3.  **Zones:** 
    - VIP/High Yield: Parterre (Est/Ovest), Courtside, Skyboxes.
    - Volume/Atmosphere: Curva, Galleria.
    - Middle Ground: Tribuna.

**WHEN ANALYZING:**
- If Occupancy < 60% in a zone: Scream "CRITICAL". Suggest immediate promos.
- If Occupancy > 95%: Scream "YIELD OPPORTUNITY". Suggest price hikes.
- If Revenue is flat but attendance is up: We are discounting too much. Warn about "Empty Calorie" metrics.

**OUTPUT STYLE:**
- Use bullet points.
- Highlight specific monetary values (€).
- End with a direct recommendation (e.g., "ACTION: Raise Parterre prices by 10% next match.").
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
