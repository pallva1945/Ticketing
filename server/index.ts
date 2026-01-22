import express from "express";
import cors from "cors";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { syncTicketingToBigQuery, testBigQueryConnection, fetchTicketingFromBigQuery, fetchCRMFromBigQuery, fetchSponsorshipFromBigQuery, convertBigQueryRowsToSponsorCSV, fetchGameDayFromBigQuery, convertBigQueryRowsToGameDayCSV } from "../src/services/bigQueryService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction ? 5000 : Number(process.env.SERVER_PORT || 5001);

// Enable compression for all responses (helps with large CRM payloads)
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

registerObjectStorageRoutes(app);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const validateBigQueryRequest = (req: express.Request, res: express.Response): boolean => {
  const isInternalRequest = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip?.includes('127.0.0.1') || req.ip === '::ffff:127.0.0.1';
  
  if (isInternalRequest) {
    return true;
  }
  
  const adminSecret = process.env.BIGQUERY_ADMIN_SECRET;
  if (!adminSecret) {
    res.status(403).json({ success: false, message: 'BigQuery endpoints are only available for internal requests' });
    return false;
  }
  
  const authHeader = req.headers['x-admin-secret'] || req.headers['authorization'];
  if (authHeader !== adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    res.status(403).json({ success: false, message: 'Unauthorized: Invalid authentication' });
    return false;
  }
  
  return true;
};

app.get("/api/bigquery/test", async (req, res) => {
  if (!validateBigQueryRequest(req, res)) return;
  
  try {
    const result = await testBigQueryConnection();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/bigquery/sync", async (req, res) => {
  if (!validateBigQueryRequest(req, res)) return;
  
  try {
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ success: false, message: 'csvContent is required' });
    }
    const result = await syncTicketingToBigQuery(csvContent);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

let ticketingCache: { data: any[]; rawRows: any[]; timestamp: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache for faster loads

app.get("/api/ticketing", async (req, res) => {
  try {
    const now = Date.now();
    const forceRefresh = req.query.refresh === 'true';
    
    if (!forceRefresh && ticketingCache && (now - ticketingCache.timestamp) < CACHE_TTL) {
      return res.json({ 
        success: true, 
        data: ticketingCache.data,
        rawRows: ticketingCache.rawRows,
        cached: true,
        message: `Served ${ticketingCache.data.length} games from cache` 
      });
    }
    
    const result = await fetchTicketingFromBigQuery();
    
    if (result.success) {
      ticketingCache = { 
        data: result.data, 
        rawRows: result.rawRows || [],
        timestamp: now 
      };
    }
    
    // Return both aggregate data and raw rows for full zone processing
    res.json({ 
      ...result, 
      rawRows: result.rawRows || [],
      cached: false 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, data: [], rawRows: [], message: error.message });
  }
});

// CRM BigQuery endpoint with server-side processing for faster loads
let crmCache: { rawRows: any[]; processedStats: any; fixedStats: any; flexibleStats: any; timestamp: number } | null = null;
const CRM_CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache for faster loads

// Parse European number format (1.234,56) and American format (1,234.56)
const parseNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[€\s]/g, '');
  if (!str) return 0;
  
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');
  
  let clean = str;
  if (lastComma > lastDot) {
    // European format: 1.234,56 -> 1234.56
    clean = str.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // American format: 1,234.56 -> 1234.56
    clean = str.replace(/,/g, '');
  }
  
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// Helper to determine if a row is fixed capacity
const isRowFixedCapacity = (row: any): boolean => {
  const eventRaw = (row.event || row.Event || row.EVENT || '').trim().toLowerCase();
  return eventRaw === 'abbonamento lba 2025/26';
};

// Server-side CRM stats computation
const computeCRMStats = (rawRows: any[]) => {
  const customerMap: Record<string, any> = {};
  let totalTickets = 0;
  let totalRevenue = 0;
  let corpCommercialValue = 0;
  const zoneStats: Record<string, { tickets: number; revenue: number }> = {};
  const sellTypeStats: Record<string, { tickets: number; revenue: number }> = {};
  
  // Demographics & behavior breakdowns
  const ageBreakdown: Record<string, { count: number; value: number }> = {};
  const locationBreakdown: Record<string, { count: number; value: number }> = {};
  const purchaseHourBreakdown: Record<string, { count: number; value: number }> = {};
  const purchaseDayBreakdown: Record<string, { count: number; value: number }> = {};
  const advanceBookingBreakdown: Record<string, { count: number; value: number }> = {};
  const zoneByAge: Record<string, Record<string, number>> = {};
  const zoneByLocation: Record<string, Record<string, number>> = {};
  const zoneStatsDetailed: Record<string, { totalValue: number; totalTickets: number; totalAdvanceDays: number; advanceCount: number }> = {};
  const paymentBreakdown: Record<string, { count: number; revenue: number }> = {};
  
  // Corporate breakdown
  const corpBreakdown: Record<string, { count: number; revenue: number; value: number; zones: Record<string, number> }> = {};
  let corporateTickets = 0;
  
  // Fixed vs Flexible breakdown (for fix/flex filter)
  const capacityBreakdown = {
    fixed: { tickets: 0, revenue: 0 },
    flexible: { tickets: 0, revenue: 0 }
  };
  
  const getAgeGroup = (dob: string) => {
    if (!dob || !dob.includes('/')) return 'Unknown';
    const parts = dob.split('/');
    const year = parseInt(parts[2]);
    if (isNaN(year)) return 'Unknown';
    const fullYear = year < 100 ? (year > 30 ? 1900 + year : 2000 + year) : year;
    const age = new Date().getFullYear() - fullYear;
    if (age < 25) return 'Under 25';
    if (age < 45) return '25-44';
    if (age < 65) return '45-64';
    return '65+';
  };
  
  // Location normalization: convert province codes to full names
  const provinceCodeMap: Record<string, string> = {
    'VA': 'Varese', 'MI': 'Milano', 'CO': 'Como', 'NO': 'Novara', 'MB': 'Monza',
    'BG': 'Bergamo', 'BS': 'Brescia', 'CR': 'Cremona', 'LC': 'Lecco', 'LO': 'Lodi',
    'MN': 'Mantova', 'PV': 'Pavia', 'SO': 'Sondrio', 'RM': 'Roma', 'TO': 'Torino',
    'GE': 'Genova', 'VE': 'Venezia', 'PD': 'Padova', 'VR': 'Verona', 'BO': 'Bologna',
    'FI': 'Firenze', 'NA': 'Napoli', 'BA': 'Bari', 'PA': 'Palermo', 'CT': 'Catania',
    'RO': 'Rovigo', 'VB': 'Verbano', 'VC': 'Vercelli', 'BI': 'Biella', 'AL': 'Alessandria',
    'AT': 'Asti', 'CN': 'Cuneo', 'SV': 'Savona', 'IM': 'Imperia', 'SP': 'La Spezia',
    'PR': 'Parma', 'RE': 'Reggio Emilia', 'MO': 'Modena', 'FE': 'Ferrara', 'RA': 'Ravenna',
    'FC': 'Forli-Cesena', 'RN': 'Rimini', 'PU': 'Pesaro-Urbino', 'AN': 'Ancona',
    'UD': 'Udine', 'PN': 'Pordenone', 'GO': 'Gorizia', 'TS': 'Trieste', 'TN': 'Trento',
    'BZ': 'Bolzano', 'BL': 'Belluno', 'TV': 'Treviso', 'VI': 'Vicenza'
  };
  
  const normalizeLocation = (loc: string): string => {
    if (!loc || loc === 'Unknown' || loc === 'null') return 'Unknown';
    const trimmed = loc.trim().toUpperCase();
    
    // If it's a 2-letter province code, convert to full name
    if (trimmed.length === 2 && provinceCodeMap[trimmed]) {
      return provinceCodeMap[trimmed];
    }
    
    // Otherwise process as before - clean up duplicates, etc.
    const parts = loc.trim().split(/\s+/);
    const filtered = parts.filter(p => !(p.length === 2 && p === p.toUpperCase() && /^[A-Z]{2}$/.test(p)));
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const p of filtered) {
      const lower = p.toLowerCase();
      if (!seen.has(lower) && p.length > 0) {
        seen.add(lower);
        unique.push(p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
      }
    }
    return unique.length > 0 ? unique.join(' ') : 'Unknown';
  };
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (const row of rawRows) {
    const lastName = row.last_name || '';
    const firstName = row.name || '';
    const fullName = [lastName, firstName].filter(Boolean).join(' ') || 'Unknown';
    const key = `${lastName.toLowerCase()}_${firstName.toLowerCase()}_${row.dob || row.email || ''}`;
    // Check both quantity and Quantity (BigQuery column casing varies)
    // Allow negative values for returns (-1 = return)
    const rawQty = row.quantity ?? row.Quantity ?? row.QUANTITY ?? 1;
    const qty = Number(rawQty) || 1;
    
    // For season tickets/packs, use per-game price instead of full bundle price
    const eventLower = (row.event || '').toLowerCase();
    const isSeasonOrPack = eventLower.includes('abbonamento') || eventLower.includes('pack');
    const perGamePrice = parseNumber(row.abb_mp_price_gm);
    const fullPrice = parseNumber(row.price);
    // Use per-game price if available for season/pack tickets, otherwise use full price
    const price = (isSeasonOrPack && perGamePrice > 0) ? perGamePrice : fullPrice;
    
    // Commercial value - use per-game for season/packs too
    // Note: BigQuery column is spelled "comercial_value" (one 'm') not "commercial_value"
    const fullCommercialValue = parseNumber(row.comercial_value) || parseNumber(row.commercial_value) || price;
    const commercialValue = (isSeasonOrPack && perGamePrice > 0) ? perGamePrice : fullCommercialValue;
    
    const pvZone = row.pv_zone || row.Pv_Zone || row.PV_Zone || row.zone || row.Zone || 'Unknown';
    // Sales channel from "sell" column - check all case variations and normalize
    const rawSellType = row.sell || row.Sell || row.SELL || row.type || row.Type || 'Unknown';
    // Normalize sell types: Corp/CORP -> Corp, Abb/ABB -> Abb, etc.
    const sellType = rawSellType.charAt(0).toUpperCase() + rawSellType.slice(1).toLowerCase();
    const ticketType = (row.ticket_type || row.Ticket_Type || row.TICKET_TYPE || '').toUpperCase();
    
    // Calculate revenue = price * qty for proper totals
    const rowRevenue = price * qty;
    const rowCommercialValue = commercialValue * qty;
    
    totalTickets += qty;
    totalRevenue += rowRevenue;
    
    // Zone stats
    if (!zoneStats[pvZone]) zoneStats[pvZone] = { tickets: 0, revenue: 0 };
    zoneStats[pvZone].tickets += qty;
    zoneStats[pvZone].revenue += rowRevenue;
    
    // Sell type stats
    if (!sellTypeStats[sellType]) sellTypeStats[sellType] = { tickets: 0, revenue: 0 };
    sellTypeStats[sellType].tickets += qty;
    sellTypeStats[sellType].revenue += rowRevenue;
    
    // Corporate breakdown - track Corp sell type or ticket type
    const sellTypeLower = sellType.toLowerCase();
    const isCorp = sellTypeLower === 'corp' || ticketType === 'CORP';
    if (isCorp) {
      corporateTickets += qty;
      corpCommercialValue += rowCommercialValue;
      const corpName = row.group || fullName || 'Unknown';
      if (!corpBreakdown[corpName]) corpBreakdown[corpName] = { count: 0, revenue: 0, value: 0, zones: {} };
      corpBreakdown[corpName].count += qty;
      corpBreakdown[corpName].revenue += rowRevenue;
      corpBreakdown[corpName].value += rowCommercialValue;
      corpBreakdown[corpName].zones[pvZone] = (corpBreakdown[corpName].zones[pvZone] || 0) + qty;
    }
    
    // Fixed vs Flexible capacity breakdown
    // Fixed = event equals "ABBONAMENTO LBA 2025/26" (case-insensitive)
    // Flexible = everything else
    const eventRaw = (row.event || row.Event || row.EVENT || '').trim().toLowerCase();
    const isFixedCapacity = eventRaw === 'abbonamento lba 2025/26';
    if (isFixedCapacity) {
      capacityBreakdown.fixed.tickets += qty;
      capacityBreakdown.fixed.revenue += rowRevenue;
    } else {
      capacityBreakdown.flexible.tickets += qty;
      capacityBreakdown.flexible.revenue += rowRevenue;
    }
    
    // Age breakdown
    const ageGroup = getAgeGroup(row.dob || '');
    if (!ageBreakdown[ageGroup]) ageBreakdown[ageGroup] = { count: 0, value: 0 };
    ageBreakdown[ageGroup].count += qty;
    ageBreakdown[ageGroup].value += rowRevenue;
    
    // Location breakdown - use only province (not pob which is place of birth)
    // pob can be international cities like Buenos Aires, Tokyo, etc.
    // Check multiple column name variations
    const rawLocation = row.province || row.provincia || row.Province || row.Provincia || 'Unknown';
    const location = normalizeLocation(rawLocation);
    if (!locationBreakdown[location]) locationBreakdown[location] = { count: 0, value: 0 };
    locationBreakdown[location].count += qty;
    locationBreakdown[location].value += rowRevenue;
    
    // Zone by age
    if (!zoneByAge[pvZone]) zoneByAge[pvZone] = {};
    zoneByAge[pvZone][ageGroup] = (zoneByAge[pvZone][ageGroup] || 0) + qty;
    
    // Zone by location (normalized)
    if (!zoneByLocation[pvZone]) zoneByLocation[pvZone] = {};
    zoneByLocation[pvZone][location] = (zoneByLocation[pvZone][location] || 0) + qty;
    
    // Zone stats detailed
    if (!zoneStatsDetailed[pvZone]) zoneStatsDetailed[pvZone] = { totalValue: 0, totalTickets: 0, totalAdvanceDays: 0, advanceCount: 0 };
    zoneStatsDetailed[pvZone].totalValue += rowRevenue;
    zoneStatsDetailed[pvZone].totalTickets += qty;
    
    // Payment breakdown
    let payment = row.payment || 'Unknown';
    const paymentLower = (payment || '').toLowerCase().replace(/[^a-z]/g, '');
    if (paymentLower.includes('visa') || paymentLower.includes('mastercard') || paymentLower.includes('master') ||
        paymentLower.includes('cartadicredito') || paymentLower.includes('bancomat') || paymentLower.includes('amex') ||
        paymentLower.includes('americanexpress') || paymentLower === 'pos') {
      payment = 'Credit Card';
    }
    if (!paymentBreakdown[payment]) paymentBreakdown[payment] = { count: 0, revenue: 0 };
    paymentBreakdown[payment].count += qty;
    paymentBreakdown[payment].revenue += rowRevenue;
    
    // Purchase time breakdown (skip 00:00 as it indicates missing time data)
    const buyDateStr = row.buy_date || '';
    if (buyDateStr && buyDateStr.includes('/')) {
      const timePart = buyDateStr.split(' ')[1] || '';
      const hourMatch = timePart.match(/^(\d{1,2})/);
      if (hourMatch) {
        const hourNum = parseInt(hourMatch[1]);
        // Skip hour 0 (midnight) times - they indicate missing time data, not actual midnight purchases
        // This catches 00:00, 0:00, 00:00:00, 0.00, etc.
        if (hourNum !== 0) {
          const hour = `${hourMatch[1].padStart(2, '0')}:00`;
          if (!purchaseHourBreakdown[hour]) purchaseHourBreakdown[hour] = { count: 0, value: 0 };
          purchaseHourBreakdown[hour].count += qty;
          purchaseHourBreakdown[hour].value += rowRevenue;
        }
      }
      
      // Day of week
      const datePart = buyDateStr.split(' ')[0];
      const [d, m, y] = datePart.split('/').map(Number);
      const buyDate = new Date(y, m - 1, d);
      if (!isNaN(buyDate.getTime())) {
        const dayName = dayNames[buyDate.getDay()];
        if (!purchaseDayBreakdown[dayName]) purchaseDayBreakdown[dayName] = { count: 0, value: 0 };
        purchaseDayBreakdown[dayName].count += qty;
        purchaseDayBreakdown[dayName].value += rowRevenue;
      }
    }
    
    // Customer aggregation
    if (!customerMap[key]) {
      customerMap[key] = {
        key,
        name: fullName,
        email: row.email || '',
        tickets: 0,
        value: 0,
        zones: {} as Record<string, number>,
        sellTypes: {} as Record<string, number>,
        games: new Set<string>(),
        transactions: 0,
        age: row.dob || '',
        location: location,
        advanceDays: [] as number[]
      };
    }
    
    const cust = customerMap[key];
    cust.tickets += qty;
    cust.value += rowRevenue;
    cust.transactions += 1;
    cust.zones[pvZone] = (cust.zones[pvZone] || 0) + qty;
    cust.sellTypes[sellType] = (cust.sellTypes[sellType] || 0) + qty;
    if (row.game_id) cust.games.add(row.game_id);
    
    // Advance days calculation
    const gmDateTimeStr = row.Gm_Date_time || row.gm_date_time || '';
    if (buyDateStr && gmDateTimeStr && buyDateStr.includes('/') && gmDateTimeStr.includes('/')) {
      const parseDT = (s: string) => {
        const [datePart, timePart] = s.split(' ');
        const [d, m, y] = datePart.split('/').map(Number);
        const [h = 0, min = 0] = (timePart || '').split('.').map(Number);
        return new Date(y, m - 1, d, h || 0, min || 0);
      };
      const buyDate2 = parseDT(buyDateStr);
      const gameDate = parseDT(gmDateTimeStr);
      if (!isNaN(buyDate2.getTime()) && !isNaN(gameDate.getTime())) {
        const diffDays = Math.floor((gameDate.getTime() - buyDate2.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          cust.advanceDays.push(diffDays);
          
          // Add to zone stats
          zoneStatsDetailed[pvZone].totalAdvanceDays += diffDays;
          zoneStatsDetailed[pvZone].advanceCount += 1;
          
          // Advance booking breakdown
          let bucket: string;
          if (diffDays === 0) bucket = 'Same Day';
          else if (diffDays <= 3) bucket = '1-3 Days';
          else if (diffDays <= 7) bucket = '4-7 Days';
          else if (diffDays <= 14) bucket = '1-2 Weeks';
          else if (diffDays <= 28) bucket = '2-4 Weeks';
          else bucket = '1+ Month';
          
          if (!advanceBookingBreakdown[bucket]) advanceBookingBreakdown[bucket] = { count: 0, value: 0 };
          advanceBookingBreakdown[bucket].count += qty;
          advanceBookingBreakdown[bucket].value += rowRevenue;
        }
      }
    }
  }
  
  // Convert customer map to sorted array with computed fields
  const allCustomers = Object.values(customerMap).map((c: any) => {
    const sortedZones = Object.entries(c.zones).sort((a: any, b: any) => b[1] - a[1]);
    const principalZone = sortedZones[0]?.[0] || '—';
    const secondaryZone = sortedZones[1]?.[0] || '—';
    const topSellType = Object.entries(c.sellTypes).sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'Unknown';
    const avgAdvance = c.advanceDays.length > 0 ? Math.round(c.advanceDays.reduce((a: number, b: number) => a + b, 0) / c.advanceDays.length) : null;
    const gameCount = c.games.size;
    const avgPerGame = gameCount > 0 ? c.value / gameCount : 0;
    const avgPerTxn = c.transactions > 0 ? c.value / c.transactions : 0;
    
    return {
      key: c.key,
      name: c.name,
      email: c.email,
      tickets: c.tickets,
      value: c.value,
      principalZone,
      secondaryZone,
      topSellType,
      avgAdvance,
      gameCount,
      avgPerGame,
      avgPerTxn,
      age: c.age,
      location: c.location
    };
  }).sort((a, b) => b.value - a.value);
  
  // Build topCorps array
  const topCorps = Object.entries(corpBreakdown)
    .map(([name, val]) => {
      const sortedZones = Object.entries(val.zones).sort((a, b) => b[1] - a[1]);
      return {
        name,
        count: val.count,
        revenue: val.revenue,
        value: val.value,
        principalZone: sortedZones[0]?.[0] || '—',
        secondaryZone: sortedZones[1]?.[0] || '—'
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 50);
  
  // Count unique corps
  const uniqueCorps = Object.keys(corpBreakdown).length;

  return {
    totalRecords: rawRows.length,
    totalTickets, // Net tickets (purchases minus returns)
    totalRevenue,
    corpCommercialValue,
    uniqueCustomers: allCustomers.length,
    topCustomers: allCustomers.slice(0, 100),
    zoneBreakdown: Object.entries(zoneStats).map(([zone, stats]) => ({ zone, ...stats })).sort((a, b) => b.revenue - a.revenue),
    sellTypeBreakdown: Object.entries(sellTypeStats).map(([type, stats]) => ({ type, ...stats })).sort((a, b) => b.revenue - a.revenue),
    ageBreakdown,
    locationBreakdown,
    purchaseHourBreakdown,
    purchaseDayBreakdown,
    advanceBookingBreakdown,
    zoneByAge,
    zoneByLocation,
    zoneStats: zoneStatsDetailed,
    paymentBreakdown,
    topCorps,
    uniqueCorps,
    corporateTickets,
    capacityBreakdown
  };
};

app.get("/api/crm/bigquery", async (req, res) => {
  try {
    const now = Date.now();
    const forceRefresh = req.query.refresh === 'true';
    const fullData = req.query.full === 'true'; // Only return full rawRows if explicitly requested
    
    console.log(`CRM API request: full=${fullData}, forceRefresh=${forceRefresh}, cacheValid=${crmCache && (now - crmCache.timestamp) < CRM_CACHE_TTL}`);
    
    if (!forceRefresh && crmCache && (now - crmCache.timestamp) < CRM_CACHE_TTL) {
      console.log(`CRM API: Returning from cache, rawRows=${fullData ? crmCache.rawRows?.length : 'not-requested'}`);
      return res.json({ 
        success: true, 
        stats: crmCache.processedStats,
        fixedStats: crmCache.fixedStats,
        flexibleStats: crmCache.flexibleStats,
        rawRows: fullData ? crmCache.rawRows : undefined,
        cached: true,
        message: `Served CRM stats from cache (${crmCache.processedStats.totalRecords} records)` 
      });
    }
    
    const result = await fetchCRMFromBigQuery();
    
    if (result.success && result.rawRows) {
      // Compute stats for all data
      const processedStats = computeCRMStats(result.rawRows);
      // Compute stats for fixed capacity only (event = "ABBONAMENTO LBA 2025/26")
      const fixedRows = result.rawRows.filter(isRowFixedCapacity);
      const fixedStats = computeCRMStats(fixedRows);
      // Compute stats for flexible capacity (everything else)
      const flexibleRows = result.rawRows.filter((row: any) => !isRowFixedCapacity(row));
      const flexibleStats = computeCRMStats(flexibleRows);
      
      crmCache = { 
        rawRows: result.rawRows,
        processedStats,
        fixedStats,
        flexibleStats,
        timestamp: now 
      };
      
      res.json({ 
        success: true,
        stats: processedStats,
        fixedStats,
        flexibleStats,
        rawRows: fullData ? result.rawRows : undefined,
        cached: false,
        message: `Processed ${result.rawRows.length} CRM records`
      });
    } else {
      res.json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, rawRows: [], message: error.message });
  }
});

// Sponsorship BigQuery endpoint
app.get("/api/sponsorship/bigquery", async (req, res) => {
  try {
    const result = await fetchSponsorshipFromBigQuery();
    
    if (result.success && result.rawRows) {
      const csvContent = convertBigQueryRowsToSponsorCSV(result.rawRows);
      res.json({ 
        success: true,
        csvContent,
        rowCount: result.rawRows.length,
        message: `Fetched ${result.rawRows.length} sponsorship records from BigQuery`
      });
    } else {
      res.json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GameDay BigQuery endpoint
app.get("/api/gameday/bigquery", async (req, res) => {
  try {
    const result = await fetchGameDayFromBigQuery();
    
    if (result.success && result.rawRows) {
      const csvContent = convertBigQueryRowsToGameDayCSV(result.rawRows);
      res.json({ 
        success: true,
        csvContent,
        rowCount: result.rawRows.length,
        message: `Fetched ${result.rawRows.length} GameDay records from BigQuery`
      });
    } else {
      res.json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  
  // Pre-warm CRM cache in background for faster first load
  console.log('Pre-warming CRM cache in background...');
  fetchCRMFromBigQuery().then(result => {
    if (result.success && result.rawRows) {
      const processedStats = computeCRMStats(result.rawRows);
      const fixedRows = result.rawRows.filter(isRowFixedCapacity);
      const fixedStats = computeCRMStats(fixedRows);
      const flexibleRows = result.rawRows.filter((row: any) => !isRowFixedCapacity(row));
      const flexibleStats = computeCRMStats(flexibleRows);
      
      crmCache = { 
        rawRows: result.rawRows,
        processedStats,
        fixedStats,
        flexibleStats,
        timestamp: Date.now() 
      };
      console.log(`CRM cache pre-warmed: ${result.rawRows.length} records ready`);
    } else {
      console.log('CRM pre-warm failed:', result.message);
    }
  }).catch(err => {
    console.log('CRM pre-warm error:', err.message);
  });
});
