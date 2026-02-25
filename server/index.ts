import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { syncTicketingToBigQuery, testBigQueryConnection, fetchTicketingFromBigQuery, fetchCRMFromBigQuery, fetchSponsorshipFromBigQuery, convertBigQueryRowsToSponsorCSV, fetchGameDayFromBigQuery, convertBigQueryRowsToGameDayCSV, fetchVBDataFromBigQuery, fetchVBProfilesFromBigQuery, fetchVBProspectsFromBigQuery } from "../src/services/bigQueryService";
import { initDatabase, upsertUser, getUserByEmail, getUserPermissions, createAccessRequest, getAccessRequestByEmail } from "./db.js";
import { registerAdminRoutes } from "./adminRoutes.js";
import crypto from "crypto";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_NAME || 'pallacanestro-varese';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-01';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const ALLOWED_DOMAIN = 'pallacanestrovarese.it';
const JWT_EXPIRY = '7d';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(compression());
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

registerObjectStorageRoutes(app);
registerAdminRoutes(app);

const ADMIN_EMAIL = 'luisscola@pallacanestrovarese.it';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

async function sendAccessRequestEmail(userEmail: string, userName: string, approvalToken: string, req: express.Request) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email notification. Approval link logged below.');
    const baseUrl = req.headers.origin || `https://${req.headers.host}`;
    console.log(`[ACCESS REQUEST] ${userEmail} (${userName}) — Approval link: ${baseUrl}/#approve/${approvalToken}`);
    return;
  }

  const baseUrl = req.headers.origin || `https://${req.headers.host}`;
  const approvalLink = `${baseUrl}/#approve/${approvalToken}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'PV Portal <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: `🔐 Access Request: ${userName} (${userEmail})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="margin: 0; color: #1a1a1a; font-size: 20px;">New Access Request</h2>
            <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">PV Internal Portal</p>
          </div>
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #111;">${userName}</p>
            <p style="margin: 0; font-size: 13px; color: #6b7280;">${userEmail}</p>
          </div>
          <p style="font-size: 13px; color: #6b7280; margin-bottom: 16px;">Click below to review and customize their access level:</p>
          <div style="text-align: center;">
            <a href="${approvalLink}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Review & Approve</a>
          </div>
          <p style="font-size: 11px; color: #9ca3af; margin-top: 24px; text-align: center;">Or copy this link: ${approvalLink}</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Resend API error: ${response.status} — ${errBody}`);
  }
}

app.get("/api/auth/client-id", (_req, res) => {
  res.json({ clientId: GOOGLE_CLIENT_ID });
});

app.post("/api/auth/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google credential is required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google token' });
    }

    const email = payload.email.toLowerCase();
    const hd = payload.hd;

    if (hd !== ALLOWED_DOMAIN && !email.endsWith('@' + ALLOWED_DOMAIN)) {
      return res.status(403).json({ success: false, message: 'Access restricted to @pallacanestrovarese.it accounts' });
    }

    const isAdmin = email === 'luisscola@pallacanestrovarese.it';

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      if (existingUser.status === 'revoked') {
        return res.status(403).json({ success: false, message: 'Your access has been revoked. Contact the administrator.' });
      }
      if (existingUser.status === 'pending_approval') {
        return res.status(202).json({ success: false, pending: true, message: 'Your access request is pending approval by the administrator.' });
      }

      const { pool: dbPool } = await import('./db.js');
      await dbPool.query('UPDATE users SET name = COALESCE($1, name), picture = COALESCE($2, picture), last_login = NOW() WHERE id = $3', [payload.name, payload.picture, existingUser.id]);

      const permissions = await getUserPermissions(existingUser.id);

      const sessionToken = jwt.sign(
        {
          email,
          name: payload.name || email,
          picture: payload.picture || '',
          userId: existingUser.id,
          role: isAdmin ? 'admin' : 'user',
          accessLevel: existingUser.access_level || 'full',
          permissions: isAdmin ? [] : permissions
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      res.cookie('pv_auth', sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      return res.json({ success: true, email, name: payload.name || email });
    }

    if (isAdmin) {
      const user = await upsertUser(email, payload.name || email, payload.picture || '', 'google');
      const permissions = await getUserPermissions(user.id);
      const sessionToken = jwt.sign(
        { email, name: payload.name || email, picture: payload.picture || '', userId: user.id, role: 'admin', accessLevel: 'full', permissions: [] },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );
      res.cookie('pv_auth', sessionToken, {
        httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, path: '/'
      });
      return res.json({ success: true, email, name: payload.name || email });
    }

    const approvalToken = crypto.randomBytes(32).toString('hex');
    const accessRequest = await createAccessRequest(email, payload.name || email, payload.picture || '', approvalToken);
    const tokenToUse = accessRequest.approval_token;

    try {
      await sendAccessRequestEmail(email, payload.name || email, tokenToUse, req);
    } catch (emailErr: any) {
      console.error('Failed to send access request email:', emailErr.message);
    }

    return res.status(202).json({ success: false, pending: true, message: 'Your access request has been sent to the administrator. You will be notified once approved.' });
  } catch (error: any) {
    console.error('Google token verification failed:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid Google sign-in. Please try again.' });
  }
});

app.get("/api/auth/verify", async (req, res) => {
  const token = req.cookies?.pv_auth;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const { pool } = await import('./db.js');
    const userResult = await pool.query('SELECT id, status, access_level, expires_at FROM users WHERE email = $1', [decoded.email]);
    const dbUser = userResult.rows[0];

    if (!dbUser) {
      res.clearCookie('pv_auth', { path: '/', httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' as const : 'lax' as const });
      return res.status(401).json({ success: false, message: 'Account not found. Please sign in again.' });
    }

    if (dbUser.status === 'revoked') {
      res.clearCookie('pv_auth', { path: '/', httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' as const : 'lax' as const });
      return res.status(403).json({ success: false, message: 'Your access has been revoked. Contact the administrator.' });
    }
    if (dbUser.expires_at && new Date(dbUser.expires_at) < new Date()) {
      res.clearCookie('pv_auth', { path: '/', httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' as const : 'lax' as const });
      return res.status(403).json({ success: false, message: 'Your access has expired' });
    }

    const permResult = await pool.query('SELECT page_id FROM user_permissions WHERE user_id = $1', [dbUser.id]);
    const freshPermissions = permResult.rows.map((r: any) => r.page_id);

    return res.json({
      success: true,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      role: decoded.role || 'user',
      accessLevel: dbUser.access_level || 'full',
      permissions: freshPermissions,
      isAdmin: decoded.email === 'luisscola@pallacanestrovarese.it'
    });
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie('pv_auth', {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  return res.json({ success: true });
});

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
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache — refresh manually or daily

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
let crmCacheWarmingPromise: Promise<void> | null = null;
const CRM_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache — refresh manually or daily

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

// Slim down CRM rows to only essential fields for frontend (reduces ~38MB to ~4MB)
const slimCRMRows = (rawRows: any[]): any[] => {
  const essentialFields = [
    'event', 'Event', 'EVENT',
    'sell', 'Sell', 'SELL',
    'ticket_type', 'Ticket_Type', 'TICKET_TYPE',
    'pv_zone', 'PV_Zone', 'PV_ZONE', 'zone', 'Zone', 'ZONE',
    'game', 'Game', 'GAME', 'gm', 'Gm', 'GM',
    'price', 'Price', 'PRICE',
    'quantity', 'Quantity', 'QUANTITY', 'qty', 'Qty', 'QTY',
    'comercial_value', 'Comercial_Value', 'COMERCIAL_VALUE', 'commercial_value', 'Commercial_Value', 'COMMERCIAL_VALUE',
    'first_name', 'First_Name', 'FIRST_NAME', 'name', 'Name', 'NAME',
    'last_name', 'Last_Name', 'LAST_NAME',
    'full_name', 'Full_Name', 'FULL_NAME',
    'email', 'Email', 'EMAIL',
    'cell', 'Cell', 'CELL', 'phone', 'Phone', 'PHONE',
    'dob', 'DOB', 'Dob',
    'city', 'City', 'CITY',
    'province', 'Province', 'PROVINCE',
    'group', 'Group', 'GROUP',
    'customer_id', 'Customer_ID', 'CUSTOMER_ID',
    'purchase_date', 'Purchase_Date', 'PURCHASE_DATE',
    'advance_days', 'Advance_Days', 'ADVANCE_DAYS',
    'address', 'Address', 'ADDRESS',
    'age', 'Age', 'AGE',
    'area', 'Area', 'AREA',
    'seat', 'Seat', 'SEAT',
    'giveawaytype', 'Giveawaytype', 'GIVEAWAYTYPE', 'giveawayType', 'GiveawayType',
    'discount_type', 'Discount_Type', 'DISCOUNT_TYPE', 'discountType', 'DiscountType',
    'buy_date', 'Buy_Date', 'BUY_DATE', 'buyDate', 'BuyDate',
    'Gm_Date_time', 'gm_date_time', 'GM_DATE_TIME', 'gmDateTime', 'GmDateTime',
    'payment', 'Payment', 'PAYMENT', 'payment_method', 'Payment_Method', 'PAYMENT_METHOD'
  ];
  
  return rawRows.map(row => {
    const slimRow: any = {};
    for (const field of essentialFields) {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        slimRow[field] = row[field];
      }
    }
    return slimRow;
  });
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
    // Sales channel from "sell" column - check all case variations and normalize to UPPERCASE
    const rawSellType = row.sell || row.Sell || row.SELL || row.type || row.Type || 'Unknown';
    // Normalize sell types to uppercase: Abb/abb -> ABB, Corp/corp -> CORP, etc.
    const sellType = rawSellType.toUpperCase();
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
    const isCorp = sellType === 'CORP' || ticketType === 'CORP';
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
        company: row.group || '',
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
    if (!cust.company && row.group) cust.company = row.group;
    
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
      company: c.company || '',
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
    
    // Wait for cache warming to complete if in progress (prevents race condition on cold start)
    if (!forceRefresh && crmCacheWarmingPromise && !crmCache) {
      console.log('CRM API: Waiting for cache warming to complete...');
      await crmCacheWarmingPromise;
      console.log('CRM API: Cache warming complete, continuing');
    }
    
    console.log(`CRM API request: full=${fullData}, forceRefresh=${forceRefresh}, cacheValid=${crmCache && (now - crmCache.timestamp) < CRM_CACHE_TTL}`);
    
    if (!forceRefresh && crmCache && (now - crmCache.timestamp) < CRM_CACHE_TTL) {
      // If full data requested but cache has no rawRows, fetch fresh instead of returning empty
      if (fullData && (!crmCache.rawRows || crmCache.rawRows.length === 0)) {
        console.log('CRM API: Cache exists but no rawRows, fetching fresh data...');
        // Fall through to fresh fetch below
      } else {
        console.log(`CRM API: Returning from cache, rawRows=${fullData ? crmCache.rawRows?.length : 'not-requested'}`);
        return res.json({ 
          success: true, 
          stats: crmCache.processedStats,
          fixedStats: crmCache.fixedStats,
          flexibleStats: crmCache.flexibleStats,
          rawRows: fullData ? slimCRMRows(crmCache.rawRows) : undefined,
          cached: true,
          message: `Served CRM stats from cache (${crmCache.processedStats.totalRecords} records)` 
        });
      }
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
        rawRows: fullData ? slimCRMRows(result.rawRows) : undefined,
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
let sponsorshipCache: { csvContent: string; rawRows: any[]; rowCount: number; timestamp: number } | null = null;

app.get("/api/sponsorship/bigquery", async (req, res) => {
  try {
    const now = Date.now();
    const forceRefresh = req.query.refresh === 'true';

    if (!forceRefresh && sponsorshipCache && (now - sponsorshipCache.timestamp) < CACHE_TTL) {
      return res.json({
        success: true,
        csvContent: sponsorshipCache.csvContent,
        rawRows: sponsorshipCache.rawRows,
        rowCount: sponsorshipCache.rowCount,
        cached: true,
        cacheAge: now - sponsorshipCache.timestamp,
        message: `Served ${sponsorshipCache.rowCount} sponsorship records from cache`
      });
    }

    const result = await fetchSponsorshipFromBigQuery();
    
    if (result.success && result.rawRows) {
      const csvContent = convertBigQueryRowsToSponsorCSV(result.rawRows);
      sponsorshipCache = { csvContent, rawRows: result.rawRows, rowCount: result.rawRows.length, timestamp: now };
      res.json({ 
        success: true,
        csvContent,
        rawRows: result.rawRows,
        rowCount: result.rawRows.length,
        cached: false,
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
let gameDayCache: { csvContent: string; rawRows: any[]; rowCount: number; timestamp: number } | null = null;

app.get("/api/gameday/bigquery", async (req, res) => {
  try {
    const now = Date.now();
    const forceRefresh = req.query.refresh === 'true';

    if (!forceRefresh && gameDayCache && (now - gameDayCache.timestamp) < CACHE_TTL) {
      return res.json({
        success: true,
        csvContent: gameDayCache.csvContent,
        rawRows: gameDayCache.rawRows,
        rowCount: gameDayCache.rowCount,
        cached: true,
        cacheAge: now - gameDayCache.timestamp,
        message: `Served ${gameDayCache.rowCount} GameDay records from cache`
      });
    }

    const result = await fetchGameDayFromBigQuery();
    
    if (result.success && result.rawRows) {
      const csvContent = convertBigQueryRowsToGameDayCSV(result.rawRows);
      gameDayCache = { csvContent, rawRows: result.rawRows, rowCount: result.rawRows.length, timestamp: now };
      res.json({ 
        success: true,
        csvContent,
        rawRows: result.rawRows,
        rowCount: result.rawRows.length,
        cached: false,
        message: `Fetched ${result.rawRows.length} GameDay records from BigQuery`
      });
    } else {
      res.json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- VB (VARESE BASKETBALL) DATA ---

let vbCache: { data: any; rawCount: number; mergedCount: number; players: string[]; playerAttributes: any; timestamp: number } | null = null;
const VB_CACHE_TTL = 10 * 60 * 1000;

app.get("/api/vb-data", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const now = Date.now();
    
    if (vbCache && !forceRefresh && (now - vbCache.timestamp) < VB_CACHE_TTL) {
      return res.json({ success: true, ...vbCache, cached: true });
    }
    
    const result = await fetchVBDataFromBigQuery();
    if (result.success) {
      vbCache = { data: result.data, rawCount: result.rawCount, mergedCount: result.mergedCount, players: result.players, playerAttributes: result.playerAttributes, timestamp: now };
      res.json({ success: true, ...vbCache, cached: false });
    } else {
      res.json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

let vbProfileCache: { data: any; timestamp: number } | null = null;

app.get("/api/vb-profiles", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const now = Date.now();

    if (vbProfileCache && !forceRefresh && (now - vbProfileCache.timestamp) < VB_CACHE_TTL) {
      return res.json({ success: true, data: vbProfileCache.data, cached: true });
    }

    const result = await fetchVBProfilesFromBigQuery();
    if (result.success) {
      vbProfileCache = { data: result.data, timestamp: now };
      res.json({ success: true, data: result.data, cached: false });
    } else {
      res.json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

let vbProspectsCache: { data: any; timestamp: number } | null = null;

app.get("/api/vb-prospects", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const now = Date.now();

    if (vbProspectsCache && !forceRefresh && (now - vbProspectsCache.timestamp) < VB_CACHE_TTL) {
      return res.json({ success: true, data: vbProspectsCache.data, cached: true });
    }

    const result = await fetchVBProspectsFromBigQuery();
    if (result.success) {
      vbProspectsCache = { data: result.data, timestamp: now };
      res.json({ success: true, data: result.data, cached: false });
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
  sourceName: string;
  tags: string;
  totalTax: number;
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
let shopifyWarmingPromise: Promise<void> | null = null;
const SHOPIFY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache — refresh manually or daily

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


async function fetchShopifyAPI(endpoint: string, retries = 5): Promise<any> {
  if (!SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify access token not configured');
  }
  
  const url = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 429) {
      const retryAfter = parseFloat(response.headers.get('Retry-After') || '2');
      const waitMs = Math.max(retryAfter * 1000, 1000);
      console.log(`Shopify rate limited, waiting ${waitMs}ms (attempt ${attempt + 1}/${retries + 1})`);
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error (${response.status}): ${errorText}`);
    }
    
    return response.json();
  }
  
  throw new Error('Shopify API: max retries exceeded due to rate limiting');
}

async function fetchAllShopifyOrders(): Promise<ShopifyOrder[]> {
  const orders: ShopifyOrder[] = [];
  let sinceId: string = '0'; // Start from ID 0 to get all orders
  const maxPages = 50; // Safety limit
  let pageCount = 0;
  
  do {
    // Use since_id for pagination (works better than created_at_min for getting all orders)
    const params = new URLSearchParams({
      limit: '250',
      status: 'any',
      since_id: sinceId,
      fields: 'id,name,order_number,created_at,processed_at,total_price,current_total_price,subtotal_price,total_discounts,total_tax,total_shipping_price_set,currency,financial_status,fulfillment_status,cancelled_at,source_name,tags,customer,email,billing_address,line_items,payment_gateway_names,gateway,transactions,refunds'
    });
    
    const endpoint = `orders.json?${params.toString()}`;
    const response = await fetchShopifyAPI(endpoint);
    const batchOrders = response.orders || [];
    
    if (batchOrders.length === 0) break;
    
    for (const order of batchOrders) {
      if (order.cancelled_at) continue;
      
      const customerName = order.customer 
        ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
        : order.billing_address?.name || 'Guest';
      
      const transactionGateway = order.transactions?.[0]?.gateway || '';
      const gateway = order.payment_gateway_names?.[0] || order.gateway || transactionGateway || '';
      
      const totalPrice = parseFloat(order.total_price) || 0;
      const totalTax = parseFloat(order.total_tax) || 0;
      const refundAmount = (order.refunds || []).reduce((sum: number, r: any) => {
        return sum + (r.transactions || []).reduce((s: number, t: any) => {
          if (t.kind === 'refund') {
            return s + parseFloat(t.amount || '0');
          }
          return s;
        }, 0);
      }, 0);
      const netPrice = Math.max(0, totalPrice - refundAmount);
      const netTax = totalPrice > 0 ? Math.max(0, totalTax * (netPrice / totalPrice)) : 0;
      
      orders.push({
        id: String(order.id),
        orderNumber: String((order.name || order.order_number || '').replace(/^#/, '')),
        createdAt: order.created_at,
        processedAt: order.processed_at || order.created_at,
        totalPrice: netPrice,
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
        fulfillmentStatus: order.fulfillment_status || 'unfulfilled',
        sourceName: order.source_name || '',
        tags: order.tags || '',
        totalTax: netTax
      });
    }
    
    // Get the highest ID for next pagination
    sinceId = String(batchOrders[batchOrders.length - 1].id);
    
    pageCount++;
    console.log(`Shopify orders page ${pageCount}: fetched ${batchOrders.length}, total ${orders.length}`);
    
    // Stop if we got less than a full page
    if (batchOrders.length < 250) break;
    
  } while (pageCount < maxPages);
  
  // Log date range for debugging
  if (orders.length > 0) {
    const dates = orders.map(o => new Date(o.processedAt).getTime());
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    console.log(`Shopify orders date range: ${earliest.toISOString().split('T')[0]} to ${latest.toISOString().split('T')[0]} (${orders.length} total)`);
  }
  
  return orders;
}

async function fetchAllShopifyProducts(): Promise<ShopifyProduct[]> {
  const products: ShopifyProduct[] = [];
  let sinceId: string = '0';
  const maxPages = 50;
  let pageCount = 0;
  
  do {
    const params = new URLSearchParams({
      limit: '250',
      since_id: sinceId
    });
    
    const endpoint = `products.json?${params.toString()}`;
    const response = await fetchShopifyAPI(endpoint);
    const batchProducts = response.products || [];
    
    if (batchProducts.length === 0) break;
    
    for (const product of batchProducts) {
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
    
    sinceId = String(batchProducts[batchProducts.length - 1].id);
    pageCount++;
    console.log(`Shopify products page ${pageCount}: fetched ${batchProducts.length}, total ${products.length}`);
    
    if (batchProducts.length < 250) break;
    
  } while (pageCount < maxPages);
  
  return products;
}

async function fetchAllShopifyCustomers(): Promise<ShopifyCustomer[]> {
  const customers: ShopifyCustomer[] = [];
  let sinceId: string = '0';
  const maxPages = 50;
  let pageCount = 0;
  
  do {
    const params = new URLSearchParams({
      limit: '250',
      since_id: sinceId
    });
    
    const endpoint = `customers.json?${params.toString()}`;
    const response = await fetchShopifyAPI(endpoint);
    const batchCustomers = response.customers || [];
    
    if (batchCustomers.length === 0) break;
    
    for (const customer of batchCustomers) {
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
    
    sinceId = String(batchCustomers[batchCustomers.length - 1].id);
    pageCount++;
    console.log(`Shopify customers page ${pageCount}: fetched ${batchCustomers.length}, total ${customers.length}`);
    
    if (batchCustomers.length < 250) break;
    
  } while (pageCount < maxPages);
  
  return customers;
}

app.get("/api/merch/season-revenue", async (req, res) => {
  try {
    if (!forceRefresh(req) && shopifyWarmingPromise && !shopifyCache) {
      const timeout = new Promise<null>(r => setTimeout(() => r(null), 15000));
      await Promise.race([shopifyWarmingPromise, timeout]);
    }

    if (shopifyCache) {
      const getSeasonFromDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth();
        if (month >= 6) return `${String(year).slice(2)}/${String(year + 1).slice(2)}`;
        return `${String(year - 1).slice(2)}/${String(year).slice(2)}`;
      };
      const seasonOrders = shopifyCache.orders.filter(o => 
        getSeasonFromDate(o.processedAt) === '25/26' && 
        !(o.sourceName === 'shopify_draft_order' && o.totalPrice === 0)
      );
      const revenueWithTax = seasonOrders.reduce((sum, o) => sum + o.totalPrice, 0);
      const tax = seasonOrders.reduce((sum, o) => sum + (o.totalTax || 0), 0);
      return res.json({ success: true, revenue: revenueWithTax - tax, orderCount: seasonOrders.length });
    }

    return res.json({ success: false, revenue: 0, message: 'Shopify data not yet available' });
  } catch (error: any) {
    res.status(500).json({ success: false, revenue: 0, message: error.message });
  }
});

function forceRefresh(req: express.Request): boolean {
  return req.query.refresh === 'true';
}

app.get("/api/shopify/data", async (req, res) => {
  try {
    const isForceRefresh = req.query.refresh === 'true';
    
    if (!isForceRefresh && shopifyWarmingPromise && !shopifyCache) {
      console.log('Waiting for Shopify pre-warm to complete...');
      const timeout = new Promise<null>(r => setTimeout(() => r(null), 30000));
      await Promise.race([shopifyWarmingPromise, timeout]);
    }
    
    // Return cached data if still valid
    if (shopifyCache && !isForceRefresh && (Date.now() - shopifyCache.timestamp) < SHOPIFY_CACHE_TTL) {
      console.log(`Returning cached Shopify data: ${shopifyCache.orders.length} orders`);
      return res.json(shopifyCache);
    }
    
    // Check if Shopify API is available
    if (SHOPIFY_ACCESS_TOKEN) {
      console.log('Fetching live data from Shopify API...');
      
      // Fetch all data from Shopify API in parallel
      const [orders, products, customers] = await Promise.all([
        fetchAllShopifyOrders(),
        fetchAllShopifyProducts(),
        fetchAllShopifyCustomers()
      ]);
      
      shopifyCache = {
        orders,
        products,
        customers,
        lastUpdated: new Date().toISOString(),
        timestamp: Date.now()
      };
      
      console.log(`Shopify live data loaded: ${orders.length} orders, ${products.length} products, ${customers.length} customers`);
      
      return res.json(shopifyCache);
    }
    
    // No Shopify token - return error
    console.log('No Shopify access token configured');
    return res.status(400).json({ success: false, message: 'Shopify access token not configured' });
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

const FULLFIELD_API_BASE = 'https://api.fullfield.info/api/basketball-ffb';
const FULLFIELD_TOKEN = process.env.FULLFIELD_API_TOKEN || '';

const FULLFIELD_TEAMS: Record<string, number> = {
  'Varese U19': 49897,
  'PV U19': 49897,
  'Campus Varese': 56097,
  'Varese Basketball': 56097,
  'Robur e Fides U17': 56119,
  'ReF U17': 56119,
  'Varese U17': 56121,
  'PV U17': 56121,
  'Robur e Fides U19': 49893,
  'ReF U19': 49893
};

const FULLFIELD_PLAYERS: Record<string, number> = {
  'Ivan Prato': 35989,
  'Tomas Scola': 52890,
  'Marco Bergamin': 15042,
  'Bruno Farias': 212406,
  'Tomás Fernández Lang': 53452,
  'Hassane Coulibaly': 65577,
  'Juan Dollberg': 32455,
  'Lautaro Basualdo': 32461,
  'Robert Kangur': 32861,
  'Pietro Lazzati': 65571,
  'Tommaso Bada': 65573,
  'Francesco Tornese': 65589,
  'Pietro Balzarotti': 65593,
  'Angelo Modanese': 21155,
  'Martino Risi': 22937
};

async function fullfieldFetch(endpoint: string, params: Record<string, string> = {}) {
  if (!FULLFIELD_TOKEN) throw new Error('FullField API token not configured');
  const url = new URL(`${FULLFIELD_API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const resp = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${FULLFIELD_TOKEN}`,
      'Accept': 'application/json'
    }
  });
  if (!resp.ok) throw new Error(`FullField API error: ${resp.status}`);
  return resp.json();
}

app.get("/api/fullfield/teams", (_req, res) => {
  res.json({ success: true, teams: FULLFIELD_TEAMS });
});

app.get("/api/fullfield/players", (_req, res) => {
  res.json({ success: true, players: FULLFIELD_PLAYERS });
});

app.get("/api/fullfield/team/:teamId/seasons", async (req, res) => {
  try {
    const data = await fullfieldFetch(`team/get-seasons/${req.params.teamId}`);
    res.json({ success: true, data: data.data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/fullfield/team/:teamId/profile", async (req, res) => {
  try {
    const data = await fullfieldFetch(`team/getMainData/teamid/${req.params.teamId}`);
    res.json({ success: true, data: data.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/fullfield/team/:teamId/stats", async (req, res) => {
  try {
    const seasonId = req.query.season_id as string;
    if (!seasonId) return res.status(400).json({ success: false, message: 'season_id required' });
    const params: Record<string, string> = { season_id: seasonId };
    if (req.query.competition_id) params.competition_id = req.query.competition_id as string;
    const data = await fullfieldFetch(`team/get-main-stat/${req.params.teamId}`, params);
    res.json({ success: true, data: data.data, meta: data.meta });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/fullfield/team/:teamId/gamelog", async (req, res) => {
  try {
    const seasonId = req.query.season_id as string;
    if (!seasonId) return res.status(400).json({ success: false, message: 'season_id required' });
    const params: Record<string, string> = { season_id: seasonId };
    if (req.query.competition_id) params.competition_id = req.query.competition_id as string;
    const data = await fullfieldFetch(`team/get-gamelog/${req.params.teamId}`, params);
    res.json({ success: true, data: data.data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/fullfield/player/:playerId/seasons", async (req, res) => {
  try {
    const data = await fullfieldFetch(`player/get-seasons/${req.params.playerId}`);
    res.json({ success: true, data: data.data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/fullfield/player/:playerId/stats", async (req, res) => {
  try {
    const seasonId = req.query.season_id as string;
    if (!seasonId) return res.status(400).json({ success: false, message: 'season_id required' });
    const params: Record<string, string> = { season_id: seasonId };
    if (req.query.competition_id) params.competition_id = req.query.competition_id as string;
    const data = await fullfieldFetch(`player/get-main-stat/${req.params.playerId}`, params);
    res.json({ success: true, data: data.data, meta: data.meta });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/fullfield/player/:playerId/gamelog", async (req, res) => {
  try {
    const seasonId = req.query.season_id as string;
    if (!seasonId) return res.status(400).json({ success: false, message: 'season_id required' });
    const params: Record<string, string> = { season_id: seasonId };
    if (req.query.competition_id) params.competition_id = req.query.competition_id as string;
    const data = await fullfieldFetch(`player/get-gamelog/${req.params.playerId}`, params);
    res.json({ success: true, data: data.data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/fullfield/player/:playerId/career", async (req, res) => {
  try {
    const seasonId = req.query.season_id as string;
    if (!seasonId) return res.status(400).json({ success: false, message: 'season_id required' });
    const data = await fullfieldFetch(`player/get-career-stat/${req.params.playerId}`, { season_id: seasonId });
    res.json({ success: true, data: data.data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/cache/clear", (req, res) => {
  ticketingCache = null;
  crmCache = null;
  sponsorshipCache = null;
  gameDayCache = null;
  shopifyCache = null;
  console.log('All server caches cleared by user request');
  res.json({ success: true, message: 'All caches cleared' });
});

app.get("/api/cache/status", (req, res) => {
  const now = Date.now();
  const status = {
    ticketing: ticketingCache ? { age: now - ticketingCache.timestamp, stale: (now - ticketingCache.timestamp) > CACHE_TTL } : null,
    crm: crmCache ? { age: now - crmCache.timestamp, stale: (now - crmCache.timestamp) > CRM_CACHE_TTL } : null,
    sponsorship: sponsorshipCache ? { age: now - sponsorshipCache.timestamp, stale: (now - sponsorshipCache.timestamp) > CACHE_TTL } : null,
    gameday: gameDayCache ? { age: now - gameDayCache.timestamp, stale: (now - gameDayCache.timestamp) > CACHE_TTL } : null,
    shopify: shopifyCache ? { age: now - shopifyCache.timestamp, stale: (now - shopifyCache.timestamp) > SHOPIFY_CACHE_TTL } : null,
  };
  res.json({ success: true, caches: status });
});

if (isProduction) {
  app.set('trust proxy', 1);
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

initDatabase().catch(err => {
  console.error('Database initialization failed:', err.message);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  
  // Pre-warm CRM cache in background for faster first load
  console.log('Pre-warming CRM cache in background...');
  crmCacheWarmingPromise = fetchCRMFromBigQuery().then(result => {
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

  if (SHOPIFY_ACCESS_TOKEN) {
    console.log('Pre-warming Shopify cache in background...');
    shopifyWarmingPromise = (async () => {
      const orders = await fetchAllShopifyOrders();
      const products = await fetchAllShopifyProducts();
      const customers = await fetchAllShopifyCustomers();
      shopifyCache = {
        orders,
        products,
        customers,
        lastUpdated: new Date().toISOString(),
        timestamp: Date.now()
      };
      console.log(`Shopify cache pre-warmed: ${orders.length} orders, ${products.length} products, ${customers.length} customers`);
    })().catch(err => {
      console.log('Shopify pre-warm error:', err.message);
    });
  }
});
