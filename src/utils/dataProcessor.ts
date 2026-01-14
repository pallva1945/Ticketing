import { GameData, GameDayData, CRMRecord, SalesChannel, SalesDataPoint, SponsorData, TicketTypeBreakdown, TicketZone } from '../types';

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
  // Remove thousands separators (dots or commas) and non-numeric except minus
  const clean = val.replace(/[.,]/g, '').replace(/[^0-9-]/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
};

const parseCurrency = (val: string | undefined): number => {
  if (!val) return 0;
  let clean = val.replace(/[€\s]/g, '');
  const isNegative = clean.includes('-');
  clean = clean.replace(/-/g, '');
  
  // Auto-detect format by finding the last punctuation mark
  // American: "88,521.99" - comma is thousands, dot is decimal
  // Italian: "88.521,99" - dot is thousands, comma is decimal
  const lastComma = clean.lastIndexOf(',');
  const lastDot = clean.lastIndexOf('.');
  
  let num: number;
  if (lastComma > lastDot) {
    // Italian format: comma is decimal separator, dots are thousands
    // e.g., "88.521,99" -> 88521.99
    clean = clean.replace(/\./g, '').replace(',', '.');
    num = parseFloat(clean);
  } else if (lastDot > lastComma) {
    // American format: dot is decimal separator, commas are thousands
    // e.g., "88,521.99" -> 88521.99
    clean = clean.replace(/,/g, '');
    num = parseFloat(clean);
  } else {
    // No punctuation or only one type - try parsing directly
    clean = clean.replace(/,/g, '').replace(/\./g, '');
    num = parseFloat(clean);
  }
  
  return isNaN(num) ? 0 : (isNegative ? -num : num);
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
    // Helper to extract value safely - handles both underscore and space formats
    const getValue = (possibleNames: string[]): string => {
      // Normalize both header and search names (convert underscores to spaces, lowercase)
      const normalize = (s: string) => s.toLowerCase().replace(/_/g, ' ');
      const normalizedHeaders = header.map(normalize);
      const idx = normalizedHeaders.findIndex(h => 
        possibleNames.map(n => normalize(n)).includes(h)
      );
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
    const corpRevenue = parseCurrency(getValue(['Corp Eur']));

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
    let protocolSum = 0;  // Protocol = fixed capacity, Total view only
    let freeSum = 0;      // Free = both GameDay and Total view
    
    // Calculate per-zone protocol quantities (fixed capacity - Total view only)
    Object.keys(zonePrefixes).forEach(prefix => {
      const protQty = parseInteger(getValue([`${prefix} Prot`]));
      if (protQty > 0) {
        giveawayDetails['Protocol'] = (giveawayDetails['Protocol'] || 0) + protQty;
        protocolSum += protQty;
      }
    });
    
    // Calculate per-zone free quantities (both views)
    Object.keys(zonePrefixes).forEach(prefix => {
      const freeQty = parseInteger(getValue([`${prefix} Free Num`]));
      if (freeQty > 0) {
        giveawayDetails['Free'] = (giveawayDetails['Free'] || 0) + freeQty;
        freeSum += freeQty;
      }
    });
    
    // Add Ospiti Free (both views)
    const ospitiFree = parseInteger(getValue(['Ospiti Free Num', 'Ospiti Free', 'Guests Free']));
    if (ospitiFree > 0) {
      giveawayDetails['Ospiti Free'] = ospitiFree;
      freeSum += ospitiFree;
    }
    
    // Add individual GA columns (these are also "free" type giveaways)
    Object.entries(giveawayMap).forEach(([label, keys]) => {
      const val = parseInteger(getValue(keys));
      if (val > 0) {
        giveawayDetails[label] = (giveawayDetails[label] || 0) + val;
        freeSum += val;
      }
    });
    
    // Total giveaway = protocol + free (for Total view)
    // GameDay giveaway = free only (no protocol)
    const giveawaySum = protocolSum + freeSum;

    // For GameDay view, ticket counts exclude protocol allocations
    // Full price and discount are the same in both views (they're paid tickets)
    // Only giveaways differ (protocol excluded in GameDay)
    const ticketTypeBreakdown: TicketTypeBreakdown = {
      // Total view (includes protocol)
      full: fullPrice,
      discount: discountSum,
      giveaway: giveawaySum,
      // GameDay view (excludes protocol)
      fullGameDay: fullPrice,        // Same as total
      discountGameDay: discountSum,  // Same as total
      giveawayGameDay: freeSum,      // Free only, no protocol
      // Protocol portion
      giveawayProtocol: protocolSum,
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
    
    // NEW LOGIC: Ospiti Free Num
    const ospitiFreeQty = parseInteger(getValue(['Ospiti Free Num', 'Ospiti Free', 'Guests Free']));
    if (ospitiFreeQty > 0) {
        salesBreakdown.push({ zone: TicketZone.OSPITI, channel: SalesChannel.GIVEAWAY, quantity: ospitiFreeQty, revenue: 0 });
    }

    // GameDay attendance = paid attendance + free giveaways (no protocol)
    // Total attendance = paid + protocol + free
    const gameDayAttendance = attendance + freeSum;  // paid + free
    const totalAttendanceCalc = totalAttendance || (attendance + protocolSum + freeSum);

    return {
      id, opponent, date, 
      attendance: totalAttendanceCalc,      // Total view: includes protocol
      attendanceGameDay: gameDayAttendance, // GameDay view: excludes protocol
      totalRevenue,                         // Same for both views
      revenueGameDay: totalRevenue,         // Same for both views (revenue is revenue)
      capacity: currentTotalCapacity, zoneCapacities, corpRevenue,
      salesBreakdown,
      league, season, oppRank, pvRank, tier, pnlBreakdown, ticketTypeBreakdown
    };
  });

  // Deduplicate games by ID - keep the last occurrence (most recent in CSV)
  const uniqueGamesMap = new Map<string, typeof games[0]>();
  games.forEach(game => {
    if (game.id && game.opponent !== 'Unknown') {
      uniqueGamesMap.set(game.id, game);
    }
  });
  const uniqueGames = Array.from(uniqueGamesMap.values());

  return uniqueGames.sort((a, b) => {
    const [da, ma, ya] = a.date.split('/').map(Number);
    const [db, mb, yb] = b.date.split('/').map(Number);
    const dateA = new Date(ya < 100 ? 2000 + ya : ya, ma - 1, da);
    const dateB = new Date(yb < 100 ? 2000 + yb : yb, mb - 1, db);
    return dateA.getTime() - dateB.getTime();
  });
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
  
  // Actually, header is "Sponsorship %,Sponsorship". So we want "Sponsorship".
  const sponsValIdx = header.indexOf('sponsorship'); // Strict match preferred if array logic fails
  
  const tvRevIdx = getIndex(['tv', 'tv $']);
  const expRevIdx = getIndex(['exp $', 'experience']);
  const totalNumIdx = getIndex(['total #', 'attendance']);
  const totalRevIdx = getIndex(['total', 'total revenue']);

  // Manual override for Sponsorship/TV if fuzzy match fails due to duplicate prefixes
  // The provided CSV has "Sponsorship %" then "Sponsorship".
  
  const gameDayEntries = rows.slice(1).map(row => {
      const getVal = (idx: number) => (idx >= 0 && row[idx]) ? row[idx] : '';
      
      const date = getVal(dateIdx);
      const opponent = getVal(gameIdx);
      
      return {
          date,
          season: getVal(seasonIdx),
          league: getVal(leagueIdx),
          opponent,
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

  // Deduplicate by date+opponent combination - keep the last occurrence
  const uniqueMap = new Map<string, typeof gameDayEntries[0]>();
  gameDayEntries.forEach(entry => {
    if (entry.date && entry.opponent) {
      const key = `${entry.date}-${entry.opponent}`;
      uniqueMap.set(key, entry);
    }
  });
  const uniqueEntries = Array.from(uniqueMap.values());

  return uniqueEntries.sort((a, b) => {
    const [da, ma, ya] = a.date.split('/').map(Number);
    const [db, mb, yb] = b.date.split('/').map(Number);
    const dateA = new Date(ya < 100 ? 2000 + ya : ya, ma - 1, da);
    const dateB = new Date(yb < 100 ? 2000 + yb : yb, mb - 1, db);
    return dateA.getTime() - dateB.getTime();
  });
};

export const processSponsorData = (csvContent: string): SponsorData[] => {
  const rows = parseCSV(csvContent);
  if (rows.length < 2) return [];

  const header = rows[0].map(h => h.trim().toLowerCase());
  
  const getIndex = (keys: string[]) => header.findIndex(h => keys.map(k => k.toLowerCase()).includes(h));
  
  const companyIdx = getIndex(['azienda', 'company']);
  const sectorIdx = getIndex(['settore', 'sector']);
  const dimensionIdx = getIndex(['dimensione', 'dimension']);
  const levelIdx = getIndex(['livello', 'level']);
  const contactIdx = getIndex(['contatto', 'contact']);
  const emailIdx = getIndex(['email']);
  const contractTypeIdx = getIndex(['tipo contratto', 'contract type']);
  const contractDurationIdx = getIndex(['durata contratto', 'contract duration']);
  const seasonIdx = getIndex(['season', 'stagione']);
  const commercialValueIdx = getIndex(['commercial value', 'valore commerciale']);
  const bonusPlayoffIdx = getIndex(['bonus playoff']);
  const netOfTicketingIdx = getIndex(['net of ticketing']);
  const gamedayIdx = getIndex(['gameday reconciliation']);
  const vbIdx = getIndex(['vb reconciliaiton', 'vb reconciliation']);
  const csrIdx = getIndex(['csr reconciliation']);
  const corpTixIdx = getIndex(['corp tix reconciliation']);
  const sponsorRecIdx = getIndex(['sponsor reconciliation']);
  const deltaIdx = getIndex(['delta']);
  
  const monthNames = ['july', 'august', 'september', 'october', 'november', 'december', 
                      'january', 'february', 'march', 'april', 'may', 'june'];
  const monthIndices: Record<string, number> = {};
  monthNames.forEach(m => {
    const idx = header.findIndex(h => h.toLowerCase() === m);
    if (idx >= 0) monthIndices[m] = idx;
  });

  return rows.slice(1).map((row, idx) => {
    const getVal = (colIdx: number) => (colIdx >= 0 && row[colIdx]) ? row[colIdx].trim() : '';
    
    const company = getVal(companyIdx);
    const season = getVal(seasonIdx);
    const contractType: 'CASH' | 'CM' = getVal(contractTypeIdx).toUpperCase() === 'CM' ? 'CM' : 'CASH';
    
    const monthlyPayments: Record<string, number> = {};
    Object.entries(monthIndices).forEach(([month, colIdx]) => {
      monthlyPayments[month] = parseCurrency(getVal(colIdx));
    });

    return {
      id: `${company}-${season}-${idx}`,
      company,
      sector: getVal(sectorIdx),
      dimension: getVal(dimensionIdx),
      level: getVal(levelIdx),
      contact: getVal(contactIdx),
      email: getVal(emailIdx),
      contractType,
      contractDuration: getVal(contractDurationIdx),
      season,
      commercialValue: parseCurrency(getVal(commercialValueIdx)),
      bonusPlayoff: parseCurrency(getVal(bonusPlayoffIdx)),
      netOfTicketing: parseCurrency(getVal(netOfTicketingIdx)),
      gamedayReconciliation: parseCurrency(getVal(gamedayIdx)),
      vbReconciliation: parseCurrency(getVal(vbIdx)),
      csrReconciliation: parseCurrency(getVal(csrIdx)),
      corpTixReconciliation: parseCurrency(getVal(corpTixIdx)),
      sponsorReconciliation: parseCurrency(getVal(sponsorRecIdx)),
      delta: parseCurrency(getVal(deltaIdx)),
      monthlyPayments
    };
  }).filter(s => s.company && s.commercialValue > 0);
};

export const processCRMData = (csvContent: string): CRMRecord[] => {
  const rows = parseCSV(csvContent);
  if (rows.length < 2) return [];

  const header = rows[0].map(h => h.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, '').toLowerCase());
  
  const getIdx = (names: string[]) => header.findIndex(h => names.includes(h));

  const lastNameIdx = getIdx(['last_name', 'lastname', 'cognome']);
  const nameIdx = getIdx(['name', 'nome', 'first_name', 'firstname']);
  const emailIdx = getIdx(['email', 'e-mail']);
  const dobIdx = getIdx(['dob', 'data_nascita', 'birth']);
  const pobIdx = getIdx(['pob', 'luogo_nascita', 'place_of_birth']);
  const nationalityIdx = getIdx(['nationality', 'nazionalita']);
  const provinceIdx = getIdx(['province', 'provincia']);
  const phoneIdx = getIdx(['phone', 'telefono']);
  const cellIdx = getIdx(['cell', 'cellulare', 'mobile']);
  const addressIdx = getIdx(['address', 'indirizzo']);
  const buyDateIdx = getIdx(['buy_date', 'data_acquisto']);
  const eventIdx = getIdx(['event', 'evento']);
  const zoneIdx = getIdx(['zone', 'zona']);
  const groupIdx = getIdx(['group', 'gruppo', 'company']);
  const seatIdx = getIdx(['seat', 'posto']);
  const typeIdx = getIdx(['type', 'tipo']);
  const netIdx = getIdx(['net', 'netto']);
  const ivaIdx = getIdx(['iva', 'vat']);
  const priceIdx = getIdx(['price', 'prezzo']);
  const paymentIdx = getIdx(['payment', 'pagamento']);
  const quantityIdx = getIdx(['quantity', 'quantita']);
  const pvZoneIdx = getIdx(['pv_zone', 'zona_pv']);
  const abbMpPriceIdx = getIdx(['abb_mp_price_gm']);
  const abbCorpPriceIdx = getIdx(['abb_corp_pvprice']);
  const gmIdx = getIdx(['gm', 'game', 'partita']);
  const gmDateTimeIdx = getIdx(['gm_date_time', 'data_ora_partita']);
  const commercialValueIdx = getIdx(['comercial_value', 'commercial_value', 'valore_commerciale']);
  const gameIdIdx = getIdx(['game_id', 'id_partita']);
  const sellIdx = getIdx(['sell', 'vendita', 'tipo_vendita']);
  const giveawayTypeIdx = getIdx(['giveawaytype', 'giveaway_type', 'tipo_omaggio']);
  const discountTypeIdx = getIdx(['discount_type', 'discounttype', 'tipo_sconto']);
  const seasonIdx = getIdx(['season', 'stagione']);

  const parseBuyDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const dateTimeParts = dateStr.split(' ');
    const datePart = dateTimeParts[0];
    const timePart = dateTimeParts[1] || '';
    
    const dateParts = datePart.split('/');
    if (dateParts.length >= 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);
      
      let hours = 0, minutes = 0;
      if (timePart) {
        const timeParts = timePart.split('.');
        hours = parseInt(timeParts[0], 10) || 0;
        minutes = parseInt(timeParts[1], 10) || 0;
      }
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day, hours, minutes);
      }
    }
    return null;
  };

  return rows.slice(1).map((row, idx) => {
    const getVal = (colIdx: number) => (colIdx >= 0 && row[colIdx]) ? row[colIdx].trim() : '';
    
    const lastName = getVal(lastNameIdx);
    const firstName = getVal(nameIdx);
    const fullName = [lastName, firstName].filter(Boolean).join(' ') || 'Unknown';
    const buyDateStr = getVal(buyDateIdx);

    return {
      id: `crm-${idx}`,
      lastName,
      firstName,
      fullName,
      email: getVal(emailIdx),
      dob: getVal(dobIdx),
      pob: getVal(pobIdx),
      nationality: getVal(nationalityIdx),
      province: getVal(provinceIdx),
      phone: getVal(phoneIdx),
      cell: getVal(cellIdx),
      address: getVal(addressIdx),
      buyDate: buyDateStr,
      buyTimestamp: parseBuyDate(buyDateStr),
      event: getVal(eventIdx),
      zone: getVal(zoneIdx),
      group: getVal(groupIdx),
      seat: getVal(seatIdx),
      ticketType: getVal(typeIdx),
      net: parseCurrency(getVal(netIdx)),
      iva: parseCurrency(getVal(ivaIdx)),
      price: parseCurrency(getVal(priceIdx)),
      payment: getVal(paymentIdx),
      quantity: parseInteger(getVal(quantityIdx)) || 1,
      pvZone: getVal(pvZoneIdx),
      abbMpPriceGm: parseCurrency(getVal(abbMpPriceIdx)),
      abbCorpPvPrice: parseCurrency(getVal(abbCorpPriceIdx)),
      game: getVal(gmIdx),
      gmDateTime: (() => {
        const raw = getVal(gmDateTimeIdx);
        if (!raw) return 0;
        
        // Handle date string format: "DD/MM/YYYY HH.MM.SS" or "DD/MM/YYYY HH.MM"
        if (raw.includes('/')) {
          const dateTimeParts = raw.split(' ');
          const datePart = dateTimeParts[0];
          const timePart = dateTimeParts[1] || '';
          
          const dateParts = datePart.split('/');
          if (dateParts.length >= 3) {
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const year = parseInt(dateParts[2], 10);
            
            let hours = 0, minutes = 0, seconds = 0;
            if (timePart) {
              const timeParts = timePart.split('.');
              hours = parseInt(timeParts[0], 10) || 0;
              minutes = parseInt(timeParts[1], 10) || 0;
              seconds = parseInt(timeParts[2], 10) || 0;
            }
            
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
              return new Date(year, month, day, hours, minutes, seconds).getTime();
            }
          }
        }
        
        // Fallback: Italian format Excel serial (45.941,7604 = 45941.7604)
        const cleaned = raw.replace(/\./g, '').replace(',', '.');
        const excelSerial = parseFloat(cleaned) || 0;
        if (excelSerial === 0) return 0;
        const unixMs = (excelSerial - 25569) * 86400 * 1000;
        return unixMs;
      })(),
      commercialValue: parseCurrency(getVal(commercialValueIdx)),
      gameId: getVal(gameIdIdx),
      sellType: getVal(sellIdx),
      giveawayType: getVal(giveawayTypeIdx),
      discountType: getVal(discountTypeIdx),
      season: getVal(seasonIdx)
    };
  }).filter(r => r.fullName || r.email || r.group);
};

export interface BigQueryTicketingRow {
  game_id: string;
  season: string;
  league: string;
  opponent: string;
  date: string;
  attendance: number;
  capacity: number;
  total_revenue: number;
  corp_revenue: number;
  tier: number;
  opp_rank: number | null;
  pv_rank: number | null;
  updated_at: string;
}

// Convert BigQuery raw rows to CSV format for processing
// BigQuery uses underscores in headers; this normalizes them to spaces
const convertBigQueryRowsToCSV = (rows: any[]): string => {
  if (!rows || rows.length === 0) return '';
  
  // Get all column names from first row
  const columns = Object.keys(rows[0]);
  
  // Convert underscore column names to space-separated for CSV compatibility
  // e.g., Par_O_Abb_Num -> Par O Abb Num
  const headerRow = columns.map(col => col.replace(/_/g, ' ')).join(',');
  
  // Format values properly for CSV
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    
    // Handle BigQuery date objects
    if (typeof val === 'object' && val.value) {
      let dateStr = val.value;
      // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY
      if (dateStr && dateStr.includes('-') && !dateStr.includes('/')) {
        const [year, month, day] = dateStr.split('-');
        dateStr = `${day}/${month}/${year}`;
      }
      return dateStr;
    }
    
    // Handle numbers - format consistently
    if (typeof val === 'number') {
      return val.toString();
    }
    
    // Handle strings that might contain commas (escape with quotes)
    const strVal = String(val);
    if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
      return `"${strVal.replace(/"/g, '""')}"`;
    }
    return strVal;
  };
  
  const dataRows = rows.map(row => 
    columns.map(col => formatValue(row[col])).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
};

// Convert BigQuery CRM rows to CSV format for processing by processCRMData
const convertBigQueryRowsToCRMCSV = (rows: any[]): string => {
  if (!rows || rows.length === 0) return '';
  
  const columns = Object.keys(rows[0]);
  
  // Convert column names to lowercase for CSV compatibility
  const headerRow = columns.map(col => col.toLowerCase()).join(',');
  
  const formatDateValue = (val: any): string => {
    if (!val) return '';
    
    // Handle BigQuery timestamp objects with value property
    if (typeof val === 'object' && val.value) {
      const d = new Date(val.value);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        const secs = String(d.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
      }
      return String(val.value);
    }
    
    // Handle Date objects
    if (val instanceof Date && !isNaN(val.getTime())) {
      const day = String(val.getDate()).padStart(2, '0');
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const year = val.getFullYear();
      const hours = String(val.getHours()).padStart(2, '0');
      const mins = String(val.getMinutes()).padStart(2, '0');
      const secs = String(val.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
    }
    
    // Handle ISO date strings (2024-01-15T10:30:00.000Z)
    if (typeof val === 'string' && val.includes('T') && val.includes('-')) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        const secs = String(d.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
      }
    }
    
    return String(val);
  };
  
  const formatValue = (val: any, colName: string): string => {
    if (val === null || val === undefined) return '';
    
    // Handle date columns specially
    const lowerCol = colName.toLowerCase();
    if (lowerCol.includes('date') || lowerCol.includes('time') || lowerCol === 'buy_date' || lowerCol === 'gm_date_time') {
      return formatDateValue(val);
    }
    
    // Handle BigQuery date/timestamp objects
    if (typeof val === 'object' && val.value) {
      return String(val.value);
    }
    
    // Handle numbers
    if (typeof val === 'number') {
      return val.toString();
    }
    
    const strVal = String(val);
    if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
      return `"${strVal.replace(/"/g, '""')}"`;
    }
    return strVal;
  };
  
  const dataRows = rows.map(row => 
    columns.map(col => formatValue(row[col], col)).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
};

// Convert BigQuery CRM data to CRMRecord array
export const convertBigQueryToCRMData = (rawRows: any[]): CRMRecord[] => {
  if (!rawRows || rawRows.length === 0) return [];
  
  const csvContent = convertBigQueryRowsToCRMCSV(rawRows);
  if (!csvContent) return [];
  
  const crmData = processCRMData(csvContent);
  console.log(`Processed ${crmData.length} CRM records from BigQuery`);
  return crmData;
};

// Convert BigQuery data to GameData - supports both legacy aggregate data and full raw rows
export const convertBigQueryToGameData = (
  aggregateRows: BigQueryTicketingRow[], 
  rawRows?: any[]
): GameData[] => {
  // If we have raw rows with zone data, use full CSV processing
  if (rawRows && rawRows.length > 0) {
    const csvContent = convertBigQueryRowsToCSV(rawRows);
    if (csvContent) {
      const fullData = processGameData(csvContent);
      if (fullData.length > 0) {
        console.log(`Processed ${fullData.length} games from BigQuery with full zone data`);
        return fullData;
      }
    }
  }
  
  // Fallback to aggregate-only processing (no zone breakdown)
  console.warn('BigQuery: Using aggregate data only (no zone breakdown)');
  return aggregateRows.map(row => {
    const getSeasonCapacity = (season: string): Record<TicketZone, number> => {
      if (season.includes('25-26') || season.includes('25/26')) return CAPACITIES_25_26;
      if (season.includes('24-25') || season.includes('24/25')) return CAPACITIES_24_25;
      return CAPACITIES_23_24;
    };
    
    const capacities = getSeasonCapacity(row.season);
    const totalCapacity = Object.values(capacities).reduce((sum, v) => sum + v, 0);
    
    return {
      id: row.game_id,
      opponent: row.opponent,
      date: row.date,
      attendance: row.attendance,
      capacity: row.capacity || totalCapacity,
      zoneCapacities: capacities as unknown as Record<string, number>,
      totalRevenue: row.total_revenue,
      corpRevenue: row.corp_revenue,
      salesBreakdown: [],
      league: row.league,
      season: row.season,
      oppRank: row.opp_rank || 0,
      pvRank: row.pv_rank || 0,
      tier: row.tier,
      pnlBreakdown: {}
    };
  });
};