import { GameData, GameDayData, SalesChannel, SalesDataPoint, TicketTypeBreakdown, TicketZone } from '../types';

// --- HELPERS ---

const parseCSV = (str: string): string[][] => {
    const arr: string[][] = [];
    let quote = false;
    let row = 0, col = 0;

    for (let c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c+1];
        arr[row] = arr[row] || [];
        arr[row][col] = arr[row][col] || '';

        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
        if (cc == '"') { quote = !quote; continue; }
        if (cc == ',' && !quote) { ++col; continue; }
        if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }
        if (cc == '\r' && !quote) { ++row; col = 0; continue; }

        arr[row][col] += cc;
    }
    return arr;
};

const parseInteger = (val: string | undefined): number => {
  if (!val) return 0;
  // Remove dots (thousands separators) and non-numeric except minus
  const clean = val.replace(/\./g, '').replace(/[^0-9-]/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
};

const parseCurrency = (val: string | undefined): number => {
  if (!val) return 0;
  // Standardize format: "€ 1.234,56" -> 1234.56
  // Remove € and whitespace
  let clean = val.replace(/[€\s]/g, '');
  // Remove thousands separator (dots)
  clean = clean.replace(/\./g, '');
  // Replace decimal separator (comma) with dot
  clean = clean.replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// --- SEASONAL CAPACITY CONFIGURATIONS ---

// Gall 1058 total split estimated as 389 Gold / 669 Silver based on 25-26 data
const CAPACITIES_23_24: Record<TicketZone, number> = {
  [TicketZone.PAR_O]: 465,
  [TicketZone.PAR_E]: 220,
  [TicketZone.TRIB_G]: 1815,
  [TicketZone.TRIB_S]: 705,
  [TicketZone.CURVA]: 458,
  [TicketZone.GALL_G]: 389, 
  [TicketZone.GALL_S]: 669,
  [TicketZone.COURTSIDE]: 32,
  [TicketZone.OSPITI]: 233,
  [TicketZone.PAR_EX]: 0, 
  [TicketZone.SKYBOX]: 0
};

const CAPACITIES_24_25: Record<TicketZone, number> = {
  [TicketZone.PAR_O]: 465,
  [TicketZone.PAR_E]: 220,
  [TicketZone.TRIB_G]: 1815,
  [TicketZone.TRIB_S]: 735,
  [TicketZone.CURVA]: 458,
  [TicketZone.GALL_G]: 389,
  [TicketZone.GALL_S]: 669,
  [TicketZone.COURTSIDE]: 42,
  [TicketZone.OSPITI]: 233,
  [TicketZone.PAR_EX]: 0,
  [TicketZone.SKYBOX]: 60
};

// FULL CAPACITY 25-26 (Hardcoded per request)
// TOTAL: 5177
const CAPACITIES_25_26: Record<TicketZone, number> = {
  [TicketZone.PAR_O]: 373,
  [TicketZone.PAR_EX]: 75, // New: Parterre Executive
  [TicketZone.PAR_E]: 200,
  [TicketZone.TRIB_G]: 2209,
  [TicketZone.TRIB_S]: 367,
  [TicketZone.GALL_G]: 389,
  [TicketZone.GALL_S]: 669,
  [TicketZone.CURVA]: 458,
  [TicketZone.COURTSIDE]: 44,
  [TicketZone.OSPITI]: 233,
  [TicketZone.SKYBOX]: 60
};

export const processGameData = (csvContent: string): GameData[] => {
  const rows = parseCSV(csvContent);
  if (rows.length < 2) return [];

  // 1. DYNAMIC HEADER DETECTION
  let headerRowIndex = 0;
  const keywords = ['season', 'stagione', 'opponent', 'contro', 'date', 'data', 'league', 'liga'];
  
  for(let i=0; i<Math.min(rows.length, 20); i++) {
     const rowStr = rows[i].join(' ').toLowerCase();
     const matchCount = keywords.filter(k => rowStr.includes(k)).length;
     if (matchCount >= 3) {
        headerRowIndex = i;
        break;
     }
  }

  // Normalize header: trim, remove quotes, remove BOM, lowercase
  const header = rows[headerRowIndex].map(h => 
      h.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, '').toLowerCase()
  );
  
  const dataRows = rows.slice(headerRowIndex + 1);

  const zonePrefixes: Record<string, TicketZone> = {
    'Par O': TicketZone.PAR_O,
    'Par EX': TicketZone.PAR_EX, // Updated to separate zone
    'Par E': TicketZone.PAR_E,
    'Trib G': TicketZone.TRIB_G,
    'Trib S': TicketZone.TRIB_S,
    'Gall G': TicketZone.GALL_G,
    'Gall S': TicketZone.GALL_S,
    'Curva': TicketZone.CURVA,
    'Courtside': TicketZone.COURTSIDE,
    'SkyBoxes': TicketZone.SKYBOX,
  };

  const seasonGameCounters: Record<string, number> = {};

  // Columns for Ticket Types (Paid Discounts)
  const discountCols = ['Sponsor', 'Disabili', 'LBA', 'Promotion', 'Special', 'Staff', 'Team', 'Under 18', 'Under 30', 'VNC'];
  
  // Giveaway Mapping: Label -> Possible CSV Column Names
  const giveawayMap: Record<string, string[]> = {
    'Institutional': ['InstitutionalGA'],
    'VIP': ['VIPGA'],
    'Team': ['TeamGA'],
    'Sponsor': ['SponsorGA'],
    'Disabili': ['DisabileGA', 'DisabiliGA'],
    'Staff': ['StaffGA'],
    'Authorities': ['AutoritiesGA', 'AuthoritiesGA'],
    'Agent': ['Agent/SponsorGA', 'AgentGA', 'Agent'], // Explicitly mapping Agent/SponsorGA to "Agent"
    'Promotion': ['PromotionGA']
  };

  const games: GameData[] = dataRows.map(row => {
    // Helper to extract value safely
    const getValue = (possibleNames: string[]): string => {
      const idx = header.findIndex(h => possibleNames.map(n => n.toLowerCase()).includes(h));
      if (idx === -1 || !row[idx]) return '';
      let val = row[idx].trim();
      if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
      }
      return val;
    };

    // --- CORE FIELDS ---
    const league = getValue(['Liga', 'League']) || 'LBA';
    const season = getValue(['Season', 'Stagione']) || 'Unknown';
    const date = getValue(['Data', 'Date', 'Match Date', 'Giorno']) || '';
    const time = getValue(['Time', 'Ora']) || '';
    const opponent = getValue(['Contro', 'Opponent', 'Team B', 'Avversario']) || 'Unknown';
    
    // --- NUMERIC FIELDS ---
    const oppRank = parseInteger(getValue(['Opp Rank', 'Ranking Opp', 'Opponent Rank']));
    const pvRank = parseInteger(getValue(['PV Rank', 'Ranking PV']));
    const tier = parseInteger(getValue(['Tier']));
    
    // ID Construction
    let isoDate = date;
    if (date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3) isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const cleanTime = time.replace('.', ':');
    const id = `${isoDate}-${cleanTime.replace(':', '')}-${opponent.replace(/\s+/g, '')}`;

    const attendance = parseInteger(getValue(['Tot pay Num', 'Total Pay Num'])); 
    const totalAttendance = parseInteger(getValue(['Total num', 'Total Attendance']));
    const totalRevenue = parseCurrency(getValue(['Tot Eur', 'Total Revenue']));

    // --- PnL Data (Columns 1-12) ---
    const pnlBreakdown: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
        // Look for headers like "1", "€ 1,00", "€ 1.00"
        pnlBreakdown[m] = parseCurrency(getValue([
            String(m), 
            `€ ${m},00`, 
            `€ ${m}.00`,
            `€${m},00`
        ]));
    }

    // --- Ticket Type Breakdown Logic ---
    const fullPrice = parseInteger(getValue(['Full Price']));
    
    const discountDetails: Record<string, number> = {};
    let discountSum = 0;
    discountCols.forEach(col => {
      const val = parseInteger(getValue([col]));
      if (val > 0) {
        discountDetails[col] = val;
        discountSum += val;
      }
    });

    const giveawayDetails: Record<string, number> = {};
    let giveawaySum = 0;
    
    Object.entries(giveawayMap).forEach(([label, keys]) => {
      const val = parseInteger(getValue(keys));
      if (val > 0) {
        giveawayDetails[label] = (giveawayDetails[label] || 0) + val;
        giveawaySum += val;
      }
    });

    const ticketTypeBreakdown: TicketTypeBreakdown = {
      full: fullPrice,
      discount: discountSum,
      giveaway: giveawaySum,
      discountDetails,
      giveawayDetails
    };

    // --- LOGIC ---
    if (!seasonGameCounters[season]) seasonGameCounters[season] = 0;
    seasonGameCounters[season]++;
    const gameIndex = seasonGameCounters[season];

    // Determine Season Capacity
    let zoneCapacities = { ...CAPACITIES_25_26 }; // Default to latest
    if (season === '23-24') {
        zoneCapacities = { ...CAPACITIES_23_24 };
        // Specific override: Skybox was 0 for early games in 23-24
        if (gameIndex < 6) zoneCapacities[TicketZone.SKYBOX] = 0;
    } else if (season === '24-25') {
        zoneCapacities = { ...CAPACITIES_24_25 };
    }

    const currentTotalCapacity = Object.values(zoneCapacities).reduce((acc, cap) => acc + cap, 0);

    const salesBreakdown: SalesDataPoint[] = [];

    Object.entries(zonePrefixes).forEach(([prefix, zone]) => {
      const channels = [
        { key: 'Abb', type: SalesChannel.ABB },
        { key: 'Corp', type: SalesChannel.CORP },
        { key: 'VB', type: SalesChannel.VB },
        { key: 'MP', type: SalesChannel.MP },
        { key: 'Tix', type: SalesChannel.TIX },
      ];

      channels.forEach(ch => {
        const qty = parseInteger(getValue([`${prefix} ${ch.key} Num`]));
        const rev = parseCurrency(getValue([`${prefix} ${ch.key} Eur`]));
        if (qty > 0 || rev > 0) {
          salesBreakdown.push({ zone, channel: ch.type, quantity: qty, revenue: rev });
        }
      });

      // Protocol (Fixed Giveaway)
      const protQty = parseInteger(getValue([`${prefix} Prot`]));
      if (protQty > 0) salesBreakdown.push({ zone, channel: SalesChannel.PROTOCOL, quantity: protQty, revenue: 0 });
      
      // Free (Dynamic Giveaway)
      const freeQty = parseInteger(getValue([`${prefix} Free Num`]));
      if (freeQty > 0) salesBreakdown.push({ zone, channel: SalesChannel.GIVEAWAY, quantity: freeQty, revenue: 0 });
    });

    const ospitiQty = parseInteger(getValue(['Ospiti Tix Num', 'Guests Num']));
    const ospitiRev = parseCurrency(getValue(['Ospiti Tix Eur', 'Guests Rev']));
    if (ospitiQty > 0 || ospitiRev > 0) {
      salesBreakdown.push({ zone: TicketZone.OSPITI, channel: SalesChannel.TIX, quantity: ospitiQty, revenue: ospitiRev });
    }

    return {
      id, opponent, date, attendance: totalAttendance || attendance,
      capacity: currentTotalCapacity, zoneCapacities, totalRevenue,
      salesBreakdown,
      league, season, oppRank, pvRank, tier, pnlBreakdown, ticketTypeBreakdown
    };
  });

  return games;
};

export const processGameDayData = (csvContent: string): GameDayData[] => {
  const rows = parseCSV(csvContent);
  if (rows.length < 2) return [];

  // Simple column index mapping (based on provided CSV structure)
  // Date,Season,League,Game,Game ID,Tix %,Tix Avg,Tix $,Merch %,Merch Avg,Merch $,Hospitality %,Hospitality Avg,Hospitality $,Park %,Park Avg,Park $,F&B %,F&B Avg,F&B $,Sponsorship %,Sponsorship,TV %,TV,Exp %,Exp Avg,Exp $,Total #,Total
  
  // To make it robust, let's map headers to indices
  const header = rows[0].map(h => h.trim().toLowerCase());
  
  const getIndex = (keys: string[]) => header.findIndex(h => keys.includes(h));
  
  const dateIdx = getIndex(['date', 'data']);
  const seasonIdx = getIndex(['season']);
  const leagueIdx = getIndex(['league', 'liga']);
  const gameIdx = getIndex(['game', 'contro']);
  
  const tixRevIdx = getIndex(['tix $', 'tix revenue']);
  const merchRevIdx = getIndex(['merch $', 'merchandising']);
  const hospRevIdx = getIndex(['hospitality $', 'hospitality']);
  const parkRevIdx = getIndex(['park $', 'parking']);
  const fbRevIdx = getIndex(['f&b $', 'f&b']);
  const sponsRevIdx = getIndex(['sponsorship', 'sponsorship %', 'sponsorship $']); // Careful, 'Sponsorship' might be the amount column if % is separate
  // Actually, header is "Sponsorship %,Sponsorship". So we want "Sponsorship".
  const sponsValIdx = header.indexOf('sponsorship'); // Strict match preferred if array logic fails
  
  const tvRevIdx = getIndex(['tv', 'tv $']);
  const expRevIdx = getIndex(['exp $', 'experience']);
  const totalNumIdx = getIndex(['total #', 'attendance']);
  const totalRevIdx = getIndex(['total', 'total revenue']);

  // Manual override for Sponsorship/TV if fuzzy match fails due to duplicate prefixes
  // The provided CSV has "Sponsorship %" then "Sponsorship".
  
  return rows.slice(1).map(row => {
      // Helper to get raw string
      const getVal = (idx: number) => (idx >= 0 && row[idx]) ? row[idx] : '';
      
      return {
          date: getVal(dateIdx),
          season: getVal(seasonIdx),
          league: getVal(leagueIdx),
          opponent: getVal(gameIdx),
          attendance: parseInteger(getVal(totalNumIdx)),
          totalRevenue: parseCurrency(getVal(totalRevIdx)),
          tixRevenue: parseCurrency(getVal(tixRevIdx)),
          merchRevenue: parseCurrency(getVal(merchRevIdx)),
          hospitalityRevenue: parseCurrency(getVal(hospRevIdx)),
          parkingRevenue: parseCurrency(getVal(parkRevIdx)),
          fbRevenue: parseCurrency(getVal(fbRevIdx)),
          sponsorshipRevenue: parseCurrency(getVal(sponsValIdx)),
          tvRevenue: parseCurrency(getVal(tvRevIdx)),
          expRevenue: parseCurrency(getVal(expRevIdx)),
      };
  });
};