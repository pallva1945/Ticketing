import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { syncTicketingToBigQuery, testBigQueryConnection, fetchTicketingFromBigQuery } from "../src/services/bigQueryService";

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
