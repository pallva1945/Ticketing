import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { syncTicketingToBigQuery, testBigQueryConnection, fetchTicketingFromBigQuery, fetchCRMFromBigQuery, fetchSponsorshipFromBigQuery, convertBigQueryRowsToSponsorCSV, fetchGameDayFromBigQuery, convertBigQueryRowsToGameDayCSV } from "../src/services/bigQueryService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction ? 5000 : Number(process.env.SERVER_PORT || 5001);

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
const CACHE_TTL = 60 * 1000;

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
let crmCache: { rawRows: any[]; processedStats: any; timestamp: number } | null = null;
const CRM_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

// Server-side CRM stats computation
const computeCRMStats = (rawRows: any[]) => {
  const customerMap: Record<string, any> = {};
  let totalTickets = 0;
  let totalRevenue = 0;
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
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (const row of rawRows) {
    const lastName = row.last_name || '';
    const firstName = row.name || '';
    const fullName = [lastName, firstName].filter(Boolean).join(' ') || 'Unknown';
    const key = `${lastName.toLowerCase()}_${firstName.toLowerCase()}_${row.dob || row.email || ''}`;
    const qty = Number(row.quantity) || 1;
    const price = Number(row.price) || 0;
    const pvZone = row.pv_zone || row.zone || 'Unknown';
    const sellType = row.sell || row.type || 'Unknown';
    
    totalTickets += qty;
    totalRevenue += price;
    
    // Zone stats
    if (!zoneStats[pvZone]) zoneStats[pvZone] = { tickets: 0, revenue: 0 };
    zoneStats[pvZone].tickets += qty;
    zoneStats[pvZone].revenue += price;
    
    // Sell type stats
    if (!sellTypeStats[sellType]) sellTypeStats[sellType] = { tickets: 0, revenue: 0 };
    sellTypeStats[sellType].tickets += qty;
    sellTypeStats[sellType].revenue += price;
    
    // Age breakdown
    const ageGroup = getAgeGroup(row.dob || '');
    if (!ageBreakdown[ageGroup]) ageBreakdown[ageGroup] = { count: 0, value: 0 };
    ageBreakdown[ageGroup].count += qty;
    ageBreakdown[ageGroup].value += price;
    
    // Location breakdown
    const location = row.province || row.pob || 'Unknown';
    if (!locationBreakdown[location]) locationBreakdown[location] = { count: 0, value: 0 };
    locationBreakdown[location].count += qty;
    locationBreakdown[location].value += price;
    
    // Zone by age
    if (!zoneByAge[pvZone]) zoneByAge[pvZone] = {};
    zoneByAge[pvZone][ageGroup] = (zoneByAge[pvZone][ageGroup] || 0) + qty;
    
    // Zone by location
    if (!zoneByLocation[pvZone]) zoneByLocation[pvZone] = {};
    zoneByLocation[pvZone][location] = (zoneByLocation[pvZone][location] || 0) + qty;
    
    // Zone stats detailed
    if (!zoneStatsDetailed[pvZone]) zoneStatsDetailed[pvZone] = { totalValue: 0, totalTickets: 0, totalAdvanceDays: 0, advanceCount: 0 };
    zoneStatsDetailed[pvZone].totalValue += price;
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
    paymentBreakdown[payment].revenue += price;
    
    // Purchase time breakdown
    const buyDateStr = row.buy_date || '';
    if (buyDateStr && buyDateStr.includes('/')) {
      const timePart = buyDateStr.split(' ')[1] || '';
      const hourMatch = timePart.match(/^(\d{1,2})/);
      if (hourMatch) {
        const hour = `${hourMatch[1].padStart(2, '0')}:00`;
        if (!purchaseHourBreakdown[hour]) purchaseHourBreakdown[hour] = { count: 0, value: 0 };
        purchaseHourBreakdown[hour].count += qty;
        purchaseHourBreakdown[hour].value += price;
      }
      
      // Day of week
      const datePart = buyDateStr.split(' ')[0];
      const [d, m, y] = datePart.split('/').map(Number);
      const buyDate = new Date(y, m - 1, d);
      if (!isNaN(buyDate.getTime())) {
        const dayName = dayNames[buyDate.getDay()];
        if (!purchaseDayBreakdown[dayName]) purchaseDayBreakdown[dayName] = { count: 0, value: 0 };
        purchaseDayBreakdown[dayName].count += qty;
        purchaseDayBreakdown[dayName].value += price;
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
        location: row.province || row.pob || '',
        advanceDays: [] as number[]
      };
    }
    
    const cust = customerMap[key];
    cust.tickets += qty;
    cust.value += price;
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
          advanceBookingBreakdown[bucket].value += price;
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
  
  return {
    totalRecords: rawRows.length,
    totalTickets,
    totalRevenue,
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
    paymentBreakdown
  };
};

app.get("/api/crm/bigquery", async (req, res) => {
  try {
    const now = Date.now();
    const forceRefresh = req.query.refresh === 'true';
    const fullData = req.query.full === 'true'; // Only return full rawRows if explicitly requested
    
    if (!forceRefresh && crmCache && (now - crmCache.timestamp) < CRM_CACHE_TTL) {
      return res.json({ 
        success: true, 
        stats: crmCache.processedStats,
        rawRows: fullData ? crmCache.rawRows : undefined,
        cached: true,
        message: `Served CRM stats from cache (${crmCache.processedStats.totalRecords} records)` 
      });
    }
    
    const result = await fetchCRMFromBigQuery();
    
    if (result.success && result.rawRows) {
      const processedStats = computeCRMStats(result.rawRows);
      crmCache = { 
        rawRows: result.rawRows,
        processedStats,
        timestamp: now 
      };
      
      res.json({ 
        success: true,
        stats: processedStats,
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
});
