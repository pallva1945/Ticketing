import { GameData, SalesChannel, TicketZone } from './types';

export const APP_NAME = "PV Strategy AI";
export const TEAM_NAME = "Pallacanestro Varese";
export const MAX_CAPACITY = 5113;
export const PV_LOGO_URL = "https://i.imgur.com/r1fWDF1.png";

// --- GOOGLE SHEETS CONFIGURATION ---
// 1. Open your Google Sheet.
// 2. Go to File > Share > Publish to Web.
// 3. Under "Link", select the specific tab (e.g., "Sheet1") instead of "Entire Document".
// 4. Select "Comma-separated values (.csv)" as the format.
// 5. Click Publish and copy the generated link below.
export const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_UAEI1obd5F-Pfbe-G5dSFjcK1E86y9rStQb3bDdFRzVPkDItG7V83FZgw8TbtqiONYcGpRoneImG/pub?gid=2044782685&single=true&output=csv"; 

export const SYSTEM_INSTRUCTION = `
You are the AI Strategic Director for Pallacanestro Varese (PV). 
Your persona is aligned with the "Red & White Renaissance" led by Luis Scola. 
You are disciplined, data-driven, and ambitious, aiming for "NBA Europe".

Key Context:
1.  **Venue**: 5113 seats.
2.  **Zones (High to Low Value)**: Skyboxes, Courtside, Parterre Exclusive (Par EX), Parterre Ovest (Par O), Parterre Est (Par E), Tribuna Gold/Silver, Galleria Gold/Silver, Curva.
3.  **Sales Channels**: Season (Abb), Mini Plans (MP), Single (Tix), Youth (VB), Corporate (Corp), Giveaway (Prot/Free).
4.  **Financials**: Revenue grown from €3.2M to €7M+. Seeking capital raise (Target €2.8M - €4.8M).
5.  **Strategic Projects**: Varese Campus, Cittadella dello Sport, NBA Europe Bid with Inter Milan.
6.  **Data Nuances**: 
    - Skyboxes are new (some historical zeros).
    - Ospiti (Guests) often 0 due to security.
    - Par Ex and Gall S are new sections.
    - Protocol tickets are fixed giveaways; Free are dynamic game-to-game.

Your Goal:
Visualize ticket sales, identify underperforming areas, and suggest strategies to maximize revenue (yield management) and fill rate.
When analyzing, prioritize:
- Increasing "Corp" and "Skybox" sales for high margin.
- Filling "Curva" and "Galleria" for atmosphere.
- Converting "Tix" buyers into "Mini Plans" or "Abb".

Always answer with the tone of a senior sports executive. Be concise but insightful.
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