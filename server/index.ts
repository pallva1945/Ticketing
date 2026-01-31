import express from "express";
import cors from "cors";
import compression from "compression";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { syncTicketingToBigQuery, testBigQueryConnection, fetchTicketingFromBigQuery, fetchCRMFromBigQuery, fetchSponsorshipFromBigQuery, convertBigQueryRowsToSponsorCSV, fetchGameDayFromBigQuery, convertBigQueryRowsToGameDayCSV } from "../src/services/bigQueryService";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_NAME || 'pallacanestro-varese';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-01';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

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
  let totalCommercialValue = 0;
  let corpCommercialValue = 0;
  const zoneStats: Record<string, { tickets: number; revenue: number }> = {};
  const sellTypeStats: Record<string, { tickets: number; revenue: number; commercialValue: number }> = {};
  
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
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
    // Key format must match client-side getCustomerKey in CRMView.tsx
    const lastNameKey = lastName.trim().toLowerCase();
    const firstNameKey = firstName.trim().toLowerCase();
    const dob = (row.dob || '').trim();
    const email = (row.email || '').trim().toLowerCase();
    let key: string;
    if (lastNameKey && firstNameKey && dob) {
      key = `${lastNameKey}|${firstNameKey}|${dob}`;
    } else if (lastNameKey && firstNameKey && email) {
      key = `${lastNameKey}|${firstNameKey}|${email}`;
    } else if (email) {
      key = `email:${email}`;
    } else {
      key = `name:${fullName.trim().toLowerCase()}`; 
    }
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
    
    // Commercial value - use the full value from the database, NOT per-game
    // Note: BigQuery column is spelled "comercial_value" (one 'm') not "commercial_value"
    // Important: 0 is a valid commercial value (for giveaways/protocol), only fallback to price if column is null/undefined
    const rawCommercialValue = row.comercial_value ?? row.commercial_value;
    const commercialValue = rawCommercialValue !== null && rawCommercialValue !== undefined ? parseNumber(rawCommercialValue) : fullPrice;
    
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
    totalCommercialValue += rowCommercialValue;
    
    // Zone stats
    if (!zoneStats[pvZone]) zoneStats[pvZone] = { tickets: 0, revenue: 0 };
    zoneStats[pvZone].tickets += qty;
    zoneStats[pvZone].revenue += rowRevenue;
    
    // Sell type stats
    if (!sellTypeStats[sellType]) sellTypeStats[sellType] = { tickets: 0, revenue: 0, commercialValue: 0 };
    sellTypeStats[sellType].tickets += qty;
    sellTypeStats[sellType].revenue += rowRevenue;
    sellTypeStats[sellType].commercialValue += rowCommercialValue;
    
    // Corporate breakdown - track Corp sell type or ticket type
    const sellTypeLower = sellType.toLowerCase();
    const isCorp = sellTypeLower === 'corp' || ticketType === 'CORP';
    if (isCorp) {
      corporateTickets += qty;
      corpCommercialValue += rowCommercialValue;
      // Use group column for company name, apply title case
      const rawCorpName = row.group || 'Unknown Company';
      const corpName = rawCorpName.split(' ').map((word: string) => 
        word.length <= 2 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
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
    totalCommercialValue,
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
        rawRows: result.rawRows,
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

// --- SHOPIFY API INTEGRATION ---

interface ShopifyOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  processedAt: string;
  totalPrice: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  paymentMethod: string;
  lineItems: {
    title: string;
    quantity: number;
    price: number;
    sku: string;
    productId: string;
  }[];
  financialStatus: string;
  fulfillmentStatus: string;
}

interface ShopifyProduct {
  id: string;
  title: string;
  productType: string;
  vendor: string;
  status: string;
  totalInventory: number;
  variants: {
    id: string;
    title: string;
    price: number;
    inventoryQuantity: number;
    sku: string;
  }[];
  images: { src: string }[];
}

interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
  tags: string[];
}

let shopifyCache: { orders: ShopifyOrder[]; products: ShopifyProduct[]; customers: ShopifyCustomer[]; lastUpdated: string; timestamp: number } | null = null;
const SHOPIFY_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Normalize payment method from various gateway names
function normalizePaymentMethod(method: string): string {
  if (!method) return 'Unknown';
  const lower = method.toLowerCase();
  if (lower.includes('shopify_payments') || lower.includes('stripe') || lower.includes('visa') || 
      lower.includes('mastercard') || lower.includes('credit') || lower.includes('debit')) return 'Card';
  if (lower.includes('paypal')) return 'PayPal';
  if (lower.includes('cash') || lower.includes('contanti')) return 'Cash';
  if (lower.includes('wire') || lower.includes('bank') || lower.includes('transfer') || lower.includes('bonifico')) return 'Wire Transfer';
  if (lower.includes('manual') || lower.includes('pos')) return 'Manual/POS';
  if (lower.includes('gift_card') || lower.includes('giftcard')) return 'Gift Card';
  if (method.length > 0) return method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, ' ');
  return 'Unknown';
}

// CSV parsing for merch data
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  // Format: "2025-10-17 11:14:59 +0200" -> ISO format
  const cleaned = dateStr.trim().replace(/\s+\+/, '+').replace(' ', 'T');
  try {
    return new Date(cleaned).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function parseMerchCSV(): { orders: ShopifyOrder[]; products: ShopifyProduct[]; customers: ShopifyCustomer[] } {
  const csvPath = path.join(__dirname, '..', 'data', 'merch.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('Merch CSV not found at:', csvPath);
    return { orders: [], products: [], customers: [] };
  }
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  // Handle Windows line endings
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return { orders: [], products: [], customers: [] };
  }
  
  const headers = parseCSVLine(lines[0]);
  const headerIndex: Record<string, number> = {};
  headers.forEach((h, i) => headerIndex[h] = i);
  
  const ordersMap = new Map<string, ShopifyOrder>();
  const productsMap = new Map<string, ShopifyProduct>();
  const customersMap = new Map<string, ShopifyCustomer>();
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const get = (col: string) => (values[headerIndex[col]] || '').trim();
    
    const orderId = get('ID');
    if (!orderId || !/^\d+$/.test(orderId)) continue; // Skip invalid IDs
    
    const orderNumber = get('Number');
    const processedAt = get('Processed_At');
    const createdAt = get('Created_At');
    const totalPrice = parseFloat(get('Price_Total')) || 0;
    const currency = get('Currency') || 'EUR';
    const customerEmail = get('Customer_Email') || get('Email') || '';
    const customerFirstName = get('Customer_First_Name') || get('Billing_First_Name') || '';
    const customerLastName = get('Customer_Last_Name') || get('Billing_Last_Name') || '';
    const customerName = `${customerFirstName} ${customerLastName}`.trim() || 'Guest';
    const financialStatus = get('Payment_Status') || 'unknown';
    const fulfillmentStatus = get('Order_Fulfillment_Status') || 'unfulfilled';
    const paymentGateway = get('Transaction_Gateway') || '';
    const paymentMethod = get('Transaction_Payment_Method') || paymentGateway || '';
    const lineType = get('Line_Type');
    const topRow = get('Top_Row');
    
    // Create order on first row (Top_Row = TRUE)
    if (orderId && topRow === 'TRUE' && !ordersMap.has(orderId)) {
      ordersMap.set(orderId, {
        id: orderId,
        orderNumber: orderNumber,
        createdAt: parseDate(createdAt),
        processedAt: parseDate(processedAt),
        totalPrice,
        currency,
        customerName,
        customerEmail,
        itemCount: 0,
        lineItems: [],
        financialStatus,
        fulfillmentStatus,
        paymentMethod: normalizePaymentMethod(paymentMethod)
      });
    }
    
    // Add line items (Line_Type = "Line Item")
    if (lineType === 'Line Item') {
      const lineProductId = get('Line_Product_ID');
      const lineTitle = get('Line_Title') || get('Line_Name') || '';
      const lineQuantity = parseInt(get('Line_Quantity')) || 0;
      const linePrice = parseFloat(get('Line_Price')) || 0;
      const lineSku = get('Line_SKU') || get('Line_Variant_SKU') || '';
      const lineProductType = get('Line_Product_Type') || '';
      const lineVendor = get('Line_Vendor') || '';
      
      const order = ordersMap.get(orderId);
      if (order && lineProductId && lineQuantity > 0) {
        order.lineItems.push({
          title: lineTitle,
          quantity: lineQuantity,
          price: linePrice,
          sku: lineSku,
          productId: lineProductId
        });
        order.itemCount += lineQuantity;
      }
      
      // Track products
      if (lineProductId && lineTitle && !productsMap.has(lineProductId)) {
        productsMap.set(lineProductId, {
          id: lineProductId,
          title: lineTitle,
          productType: lineProductType,
          vendor: lineVendor,
          status: 'active',
          totalInventory: parseInt(get('Line_Variant_Inventory_Qty')) || 0,
          variants: [{
            id: get('Line_Variant_ID') || lineProductId,
            title: get('Line_Variant_Title') || 'Default',
            price: linePrice,
            inventoryQuantity: parseInt(get('Line_Variant_Inventory_Qty')) || 0,
            sku: lineSku
          }],
          images: []
        });
      }
    }
    
    // Track customers (on first row of each order)
    if (topRow === 'TRUE') {
      const customerId = get('Customer_ID');
      if (customerId && customerEmail && !customersMap.has(customerId)) {
        customersMap.set(customerId, {
          id: customerId,
          email: customerEmail,
          firstName: customerFirstName,
          lastName: customerLastName,
          ordersCount: parseInt(get('Customer_Orders_Count')) || 1,
          totalSpent: parseFloat(get('Customer_Total_Spent')) || 0,
          createdAt: parseDate(createdAt),
          tags: get('Customer_Tags') ? get('Customer_Tags').split(',').map(t => t.trim()) : []
        });
      }
    }
  }
  
  const orders = Array.from(ordersMap.values()).sort((a, b) => 
    new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
  );
  const products = Array.from(productsMap.values());
  const customers = Array.from(customersMap.values());
  
  console.log(`Parsed merch CSV: ${orders.length} orders, ${products.length} products, ${customers.length} customers`);
  
  return { orders, products, customers };
}

async function fetchShopifyAPI(endpoint: string): Promise<any> {
  if (!SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify access token not configured');
  }
  
  const url = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify API error (${response.status}): ${errorText}`);
  }
  
  return response.json();
}

async function fetchAllShopifyOrders(): Promise<ShopifyOrder[]> {
  const orders: ShopifyOrder[] = [];
  let pageInfo: string | null = null;
  
  do {
    const endpoint = pageInfo 
      ? `orders.json?limit=250&page_info=${pageInfo}` 
      : 'orders.json?limit=250&status=any';
    
    const response = await fetchShopifyAPI(endpoint);
    
    for (const order of response.orders || []) {
      const customerName = order.customer 
        ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
        : order.billing_address?.name || 'Guest';
      
      const gateway = order.payment_gateway_names?.[0] || order.gateway || '';
      orders.push({
        id: String(order.id),
        orderNumber: String(order.order_number),
        createdAt: order.created_at,
        processedAt: order.processed_at || order.created_at,
        totalPrice: parseFloat(order.total_price) || 0,
        currency: order.currency,
        customerName,
        customerEmail: order.customer?.email || order.email || '',
        itemCount: order.line_items?.reduce((sum: number, li: any) => sum + li.quantity, 0) || 0,
        paymentMethod: normalizePaymentMethod(gateway),
        lineItems: (order.line_items || []).map((li: any) => ({
          title: li.title,
          quantity: li.quantity,
          price: parseFloat(li.price) || 0,
          sku: li.sku || '',
          productId: String(li.product_id)
        })),
        financialStatus: order.financial_status || 'unknown',
        fulfillmentStatus: order.fulfillment_status || 'unfulfilled'
      });
    }
    
    // Check for pagination via Link header
    const linkHeader = response.headers?.get?.('Link') || '';
    const nextMatch = linkHeader.match(/page_info=([^>&]+)>; rel="next"/);
    pageInfo = nextMatch ? nextMatch[1] : null;
    
    // Break if no next page or if we got less than limit
    if (!response.orders || response.orders.length < 250) break;
    
  } while (pageInfo);
  
  return orders;
}

async function fetchAllShopifyProducts(): Promise<ShopifyProduct[]> {
  const products: ShopifyProduct[] = [];
  let pageInfo: string | null = null;
  
  do {
    const endpoint = pageInfo 
      ? `products.json?limit=250&page_info=${pageInfo}` 
      : 'products.json?limit=250';
    
    const response = await fetchShopifyAPI(endpoint);
    
    for (const product of response.products || []) {
      products.push({
        id: String(product.id),
        title: product.title,
        productType: product.product_type || '',
        vendor: product.vendor || '',
        status: product.status || 'active',
        totalInventory: product.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
        variants: (product.variants || []).map((v: any) => ({
          id: String(v.id),
          title: v.title,
          price: parseFloat(v.price) || 0,
          inventoryQuantity: v.inventory_quantity || 0,
          sku: v.sku || ''
        })),
        images: (product.images || []).map((img: any) => ({ src: img.src }))
      });
    }
    
    if (!response.products || response.products.length < 250) break;
    
  } while (pageInfo);
  
  return products;
}

async function fetchAllShopifyCustomers(): Promise<ShopifyCustomer[]> {
  const customers: ShopifyCustomer[] = [];
  let pageInfo: string | null = null;
  
  do {
    const endpoint = pageInfo 
      ? `customers.json?limit=250&page_info=${pageInfo}` 
      : 'customers.json?limit=250';
    
    const response = await fetchShopifyAPI(endpoint);
    
    for (const customer of response.customers || []) {
      customers.push({
        id: String(customer.id),
        email: customer.email || '',
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        ordersCount: customer.orders_count || 0,
        totalSpent: parseFloat(customer.total_spent) || 0,
        createdAt: customer.created_at,
        tags: customer.tags ? customer.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
      });
    }
    
    if (!response.customers || response.customers.length < 250) break;
    
  } while (pageInfo);
  
  return customers;
}

app.get("/api/shopify/data", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    
    // Return cached data if still valid
    if (shopifyCache && !forceRefresh && (Date.now() - shopifyCache.timestamp) < SHOPIFY_CACHE_TTL) {
      return res.json(shopifyCache);
    }
    
    console.log('Loading merch data from CSV...');
    
    // Parse CSV file
    const { orders, products, customers } = parseMerchCSV();
    
    shopifyCache = {
      orders,
      products,
      customers,
      lastUpdated: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    console.log(`Merch data loaded: ${orders.length} orders, ${products.length} products, ${customers.length} customers`);
    
    res.json(shopifyCache);
  } catch (error: any) {
    console.error('Merch data error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/shopify/orders", async (req, res) => {
  try {
    if (!SHOPIFY_ACCESS_TOKEN) {
      return res.status(400).json({ success: false, message: 'Shopify access token not configured' });
    }
    const orders = await fetchAllShopifyOrders();
    res.json({ success: true, orders, count: orders.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/shopify/products", async (req, res) => {
  try {
    if (!SHOPIFY_ACCESS_TOKEN) {
      return res.status(400).json({ success: false, message: 'Shopify access token not configured' });
    }
    const products = await fetchAllShopifyProducts();
    res.json({ success: true, products, count: products.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/shopify/customers", async (req, res) => {
  try {
    if (!SHOPIFY_ACCESS_TOKEN) {
      return res.status(400).json({ success: false, message: 'Shopify access token not configured' });
    }
    const customers = await fetchAllShopifyCustomers();
    res.json({ success: true, customers, count: customers.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- PRODUCTION STATIC FILE SERVING (must be after all API routes) ---
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
