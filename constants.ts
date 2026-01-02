import { GameData, SalesChannel, TicketZone } from './types';

export const APP_NAME = "PV Strategy AI";
export const TEAM_NAME = "Pallacanestro Varese";
export const MAX_CAPACITY = 5113;
export const PV_LOGO_URL = "https://i.imgur.com/r1fWDF1.png";

// --- TARGET CONFIGURATION ---
export const SEASON_TARGET_TOTAL = 1650000;   // €1.65M Total Budget (Ticketing Core)
export const SEASON_TARGET_GAMEDAY = 1650000;  // €1.65M Variable Target (Ancillary)
export const SEASON_TARGET_GAMEDAY_TOTAL = 3300000; // €3.3M Total GameDay (Tix + Variable)

// --- GOOGLE SHEETS CONFIGURATION ---
// 1. Open your Google Sheet.
// 2. Go to File > Share > Publish to Web.
// 3. Under "Link", select the specific tab (e.g., "Sheet1") instead of "Entire Document".
// 4. Select "Comma-separated values (.csv)" as the format.
// 5. Click Publish and copy the generated link below.
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
// Galleria total 352 split estimated 37/63 based on capacity ratio
export const FIXED_CAPACITY_25_26: Record<string, number> = {
  [TicketZone.PAR_O]: 309,
  [TicketZone.PAR_E]: 94,
  [TicketZone.TRIB_G]: 1230,
  [TicketZone.TRIB_S]: 261,
  [TicketZone.GALL_G]: 130, // Estimated split of 352
  [TicketZone.GALL_S]: 222, // Estimated split of 352
  [TicketZone.CURVA]: 314,
  [TicketZone.COURTSIDE]: 38,
  [TicketZone.SKYBOX]: 60,
  [TicketZone.OSPITI]: 0, // Usually 0 fixed
  [TicketZone.PAR_EX]: 0 // Assuming included in Par O number or 0 for now
};

// Initial empty state, data is loaded from CSV in App.tsx
export const MOCK_GAMES: GameData[] = [];