import { GameData, SalesDataPoint, TicketZone, SalesChannel } from '../types';

// Helper to clean currency string and parse to float
const parseCurrency = (val: string): number => {
  if (!val || val === '#DIV/0!' || val.trim() === '') return 0;
  // Remove "€", remove thousands separator ".", replace decimal "," with "."
  const clean = val.replace(/€/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// Helper to parse integer
const parseInteger = (val: string): number => {
  if (!val || val === '#DIV/0!' || val.trim() === '') return 0;
  // Handle case where int might have thousands separator or similar junk
  const clean = val.replace(/\./g, '').trim();
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
};

// Simple CSV parser that handles quoted fields containing commas
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
        inQuotes = !inQuotes;
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

// Standard capacities (defaults)
const BASE_ZONE_CAPACITIES: Record<TicketZone, number> = {
  [TicketZone.PAR_O]: 465,
  [TicketZone.PAR_E]: 220,
  [TicketZone.TRIB_G]: 2209,
  [TicketZone.TRIB_S]: 367,
  [TicketZone.GALL_S]: 669,
  [TicketZone.GALL_G]: 389,
  [TicketZone.CURVA]: 458,
  [TicketZone.OSPITI]: 233,
  [TicketZone.PAR_EX]: 128,
  // These vary:
  [TicketZone.COURTSIDE]: 44, 
  [TicketZone.SKYBOX]: 60,
};

export const processGameData = (csvContent: string): GameData[] => {
  const rows = parseCSV(csvContent);
  if (rows.length < 2) return [];

  const header = rows[0].map(h => h.trim());
  const dataRows = rows.slice(1);

  // Map zone names to their prefix in CSV
  const zonePrefixes: Record<string, TicketZone> = {
    'Par O': TicketZone.PAR_O,
    'Par EX': TicketZone.PAR_EX,
    'Par E': TicketZone.PAR_E,
    'Trib G': TicketZone.TRIB_G,
    'Trib S': TicketZone.TRIB_S,
    'Gall G': TicketZone.GALL_G,
    'Gall S': TicketZone.GALL_S,
    'Curva': TicketZone.CURVA,
    'Courtside': TicketZone.COURTSIDE,
    'SkyBoxes': TicketZone.SKYBOX,
  };

  // Helper to track game index per season for "Game 6" rule
  const seasonGameCounters: Record<string, number> = {};

  const games: GameData[] = dataRows.map(row => {
    const getValue = (colName: string): string => {
      const idx = header.indexOf(colName);
      return idx !== -1 ? row[idx] : '';
    };

    // Basic Info
    const league = getValue('Liga') || 'LBA';
    const season = getValue('Season') || 'Unknown';
    const date = getValue('Data') || '';
    const time = getValue('Time') || '';
    const opponent = getValue('Contro') || 'Unknown';
    
    // New Fields
    const oppRank = parseInteger(getValue('Opp Rank'));
    const pvRank = parseInteger(getValue('PV Rank'));
    const tier = parseInteger(getValue('Tier'));
    
    // Construct simplified ID: YYYYMMDD-Opponent
    const dateParts = date.split('/'); // DD/MM/YYYY
    const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : date;
    const cleanTime = time.replace('.', ':');
    const id = `${isoDate}-${cleanTime.replace(':', '')}-${opponent.replace(/\s+/g, '')}`;

    const attendance = parseInteger(getValue('Tot pay Num')); 
    const totalAttendance = parseInteger(getValue('Total num'));
    const totalRevenue = parseCurrency(getValue('Tot Eur'));

    // --- Dynamic Capacity Logic ---
    if (!seasonGameCounters[season]) seasonGameCounters[season] = 0;
    seasonGameCounters[season]++;
    const gameIndex = seasonGameCounters[season]; // 1-based index

    const zoneCapacities = { ...BASE_ZONE_CAPACITIES };

    // Rule 1: Skyboxes not available until game 6 of last season (23-24)
    if (season === '23-24') {
      if (gameIndex < 6) {
        zoneCapacities[TicketZone.SKYBOX] = 0;
      } else {
        zoneCapacities[TicketZone.SKYBOX] = 60;
      }
    } else {
        // Assume available for future seasons
        zoneCapacities[TicketZone.SKYBOX] = 60;
    }

    // Rule 2: Courtside only 32 until last season (23-24), then 44 (24-25+)
    if (season === '23-24') {
      zoneCapacities[TicketZone.COURTSIDE] = 32;
    } else {
      zoneCapacities[TicketZone.COURTSIDE] = 44;
    }

    // Calculate total capacity for this specific game
    const currentTotalCapacity = Object.values(zoneCapacities).reduce((acc, cap) => acc + cap, 0);

    const salesBreakdown: SalesDataPoint[] = [];

    // Process standard zones
    Object.entries(zonePrefixes).forEach(([prefix, zone]) => {
      // Channels
      const channels = [
        { key: 'Abb', type: SalesChannel.ABB },
        { key: 'Corp', type: SalesChannel.CORP },
        { key: 'VB', type: SalesChannel.VB },
        { key: 'MP', type: SalesChannel.MP },
        { key: 'Tix', type: SalesChannel.TIX },
      ];

      channels.forEach(ch => {
        const qty = parseInteger(getValue(`${prefix} ${ch.key} Num`));
        const rev = parseCurrency(getValue(`${prefix} ${ch.key} Eur`));
        if (qty > 0 || rev > 0) {
          salesBreakdown.push({ zone, channel: ch.type, quantity: qty, revenue: rev });
        }
      });

      // Giveaways / Protocol (Revenue usually 0)
      const protQty = parseInteger(getValue(`${prefix} Prot`));
      if (protQty > 0) {
        salesBreakdown.push({ zone, channel: SalesChannel.GIVEAWAY, quantity: protQty, revenue: 0 });
      }
      
      const freeQty = parseInteger(getValue(`${prefix} Free Num`));
      if (freeQty > 0) {
        salesBreakdown.push({ zone, channel: SalesChannel.GIVEAWAY, quantity: freeQty, revenue: 0 });
      }
    });

    // Process Ospiti (Guests) - Only Tix usually
    const ospitiQty = parseInteger(getValue('Ospiti Tix Num'));
    const ospitiRev = parseCurrency(getValue('Ospiti Tix Eur'));
    if (ospitiQty > 0 || ospitiRev > 0) {
      salesBreakdown.push({ zone: TicketZone.OSPITI, channel: SalesChannel.TIX, quantity: ospitiQty, revenue: ospitiRev });
    }

    return {
      id,
      opponent,
      date,
      attendance: totalAttendance || attendance,
      capacity: currentTotalCapacity,
      zoneCapacities,
      totalRevenue,
      salesBreakdown,
      league,
      season,
      oppRank,
      pvRank,
      tier
    };
  });

  // Filter out invalid rows
  return games.filter(g => g.opponent && g.opponent !== 'Unknown');
};