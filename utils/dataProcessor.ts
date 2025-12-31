
import { GameData, SalesDataPoint, TicketZone, SalesChannel } from '../types';

// Helper to clean currency string and parse to float
const parseCurrency = (val: string): number => {
  if (!val || val === '#DIV/0!' || val.trim() === '') return 0;
  
  // Remove currency symbols, whitespace, and non-breaking spaces
  let clean = val.replace(/[€$£\s\u00A0]/g, '');
  
  // Heuristic: If it contains "," and the part after comma is 2 digits, assume Euro format (1.000,00)
  // If it contains "." and the part after dot is 2 digits, assume US format (1,000.00)
  // Be careful with "1,000" (US) vs "1,000" (Euro 1.0) -> usually Euro uses 1.000,00
  
  if (clean.includes(',') && !clean.includes('.')) {
      // Ambiguous: 100,50 (Euro float) or 100,000 (US int)
      // If comma is near the end (2 chars), assume decimal
      const parts = clean.split(',');
      if (parts[parts.length-1].length === 2) {
          clean = clean.replace(',', '.');
      } else {
          // Assume thousand separator if 3 digits, but typically currency has decimals.
          // Let's assume Euro format default for this specific Italian context if ambiguous
          clean = clean.replace(',', '.'); // Treat 1,23 as 1.23
      }
  } else if (clean.includes('.') && !clean.includes(',')) {
      // US style simple: 100.50 -> No change
  } else if (clean.includes(',') && clean.includes('.')) {
      // Mixed: Determine which is last
      const lastComma = clean.lastIndexOf(',');
      const lastDot = clean.lastIndexOf('.');
      if (lastComma > lastDot) {
          // Euro style: 1.000,00
          clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
          // US style: 1,000.00
          clean = clean.replace(/,/g, '');
      }
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// Helper to parse integer
const parseInteger = (val: string): number => {
  if (!val || val === '#DIV/0!' || val.trim() === '') return 0;
  // Remove potential thousands separators and decimals
  // Simply remove non-digits (except maybe minus)
  const clean = val.replace(/[^\d-]/g, ''); 
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
};

// Simple CSV parser
const parseCSV = (text: string): string[][] => {
  const result: string[][] = [];
  const lines = text.split(/\r?\n/);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i+1] === '"') {
            current += '"';
            i++;
        } else {
            inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current);
    result.push(row);
  }
  return result;
};

const BASE_ZONE_CAPACITIES: Record<TicketZone, number> = {
  [TicketZone.PAR_O]: 465,
  [TicketZone.PAR_E]: 220,
  [TicketZone.TRIB_G]: 2209,
  [TicketZone.TRIB_S]: 367,
  [TicketZone.GALL_S]: 669,
  [TicketZone.GALL_G]: 389,
  [TicketZone.CURVA]: 458,
  [TicketZone.OSPITI]: 233,
  [TicketZone.PAR_EX]: 0, 
  [TicketZone.COURTSIDE]: 44,
  [TicketZone.SKYBOX]: 60,
};

export const processGameData = (csvContent: string): GameData[] => {
  const rows = parseCSV(csvContent);
  if (rows.length < 2) return [];

  // 1. DYNAMIC HEADER DETECTION
  // Look for a row that looks like a header (contains key columns)
  // This handles cases where there are title rows or metadata before the table.
  let headerRowIndex = 0;
  const keywords = ['season', 'stagione', 'opponent', 'contro', 'date', 'data', 'league', 'liga'];
  
  for(let i=0; i<Math.min(rows.length, 20); i++) {
     const rowStr = rows[i].join(' ').toLowerCase();
     // Count matches of keywords
     const matchCount = keywords.filter(k => rowStr.includes(k)).length;
     if (matchCount >= 3) { // Require at least 3 matches to be confident
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
    'Par EX': TicketZone.PAR_O, 
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

  const games: GameData[] = dataRows.map(row => {
    // Helper to extract value safely by checking multiple possible header names
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
    // Support 'Data', 'Date', 'Match Date', 'Giorno'
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

    // --- LOGIC ---
    if (!seasonGameCounters[season]) seasonGameCounters[season] = 0;
    seasonGameCounters[season]++;
    const gameIndex = seasonGameCounters[season];

    const zoneCapacities = { ...BASE_ZONE_CAPACITIES };
    if (season === '23-24' && gameIndex < 6) {
        zoneCapacities[TicketZone.SKYBOX] = 0;
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

      const protQty = parseInteger(getValue([`${prefix} Prot`]));
      if (protQty > 0) salesBreakdown.push({ zone, channel: SalesChannel.GIVEAWAY, quantity: protQty, revenue: 0 });
      
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
      salesBreakdown, league, season, oppRank, pvRank, tier
    };
  });

  // Filter out truly invalid rows
  // If opponent is unknown AND date is empty, it's likely an empty row.
  return games.filter(g => g.date && g.date.length > 5);
};
