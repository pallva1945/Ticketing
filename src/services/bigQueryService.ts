import { BigQuery } from '@google-cloud/bigquery';

const PROJECT_ID = process.env.BIGQUERY_PROJECT_ID || 'ticketing-migration';
const DATASET_ID = process.env.BIGQUERY_DATASET_ID || 'ticketing_migration';
const TABLE_ID = process.env.BIGQUERY_TABLE_ID || 'extended_db_final';

let bigquery: BigQuery | null = null;

function getBigQueryClient(): BigQuery {
  if (!bigquery) {
    const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS;
    if (!credentials) {
      throw new Error('GOOGLE_CLOUD_CREDENTIALS environment variable is not set');
    }
    
    try {
      const parsedCredentials = JSON.parse(credentials);
      bigquery = new BigQuery({
        projectId: PROJECT_ID,
        credentials: parsedCredentials
      });
    } catch (error) {
      throw new Error('Failed to parse GOOGLE_CLOUD_CREDENTIALS JSON');
    }
  }
  return bigquery;
}

export interface TicketingRow {
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

export async function syncTicketingToBigQuery(csvContent: string): Promise<{ success: boolean; rowCount: number; message: string }> {
  try {
    const client = getBigQueryClient();
    const rows = parseCSVToRows(csvContent);
    
    if (rows.length === 0) {
      return { success: false, rowCount: 0, message: 'No valid rows found in CSV' };
    }

    const dataset = client.dataset(DATASET_ID);
    const table = dataset.table(TABLE_ID);

    await table.insert(rows, {
      skipInvalidRows: true,
      ignoreUnknownValues: true
    });

    return { 
      success: true, 
      rowCount: rows.length, 
      message: `Successfully synced ${rows.length} rows to BigQuery` 
    };
  } catch (error: any) {
    if (error.name === 'PartialFailureError') {
      const failedRows = error.errors?.length || 0;
      const errorMessages = error.errors?.slice(0, 3).map((e: any) => 
        e.errors?.map((err: any) => err.message).join(', ')
      ).join('; ') || 'Unknown validation errors';
      
      console.error('BigQuery partial failure:', errorMessages);
      return {
        success: false,
        rowCount: 0,
        message: `${failedRows} rows failed validation: ${errorMessages}`
      };
    }
    console.error('BigQuery sync error:', error);
    return { 
      success: false, 
      rowCount: 0, 
      message: error.message || 'Unknown error during BigQuery sync' 
    };
  }
}

function parseCSVToRows(csvContent: string): TicketingRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  const normalize = (str: string) => str.toLowerCase().replace(/[_\s]+/g, ' ').trim();
  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => { headerMap[normalize(h)] = i; });

  const getValue = (row: string[], keys: string[]): string => {
    for (const key of keys) {
      const idx = headerMap[normalize(key)];
      if (idx !== undefined && row[idx] !== undefined) {
        return row[idx].trim();
      }
    }
    return '';
  };

  const parseCurrency = (val: string): number => {
    if (!val || val === '-' || val === '') return 0;
    let cleaned = val.replace(/[€$£\s]/g, '');
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const parseInteger = (val: string): number => {
    if (!val || val === '-' || val === '') return 0;
    const cleaned = val.replace(/[.,\s]/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  };

  const rows: TicketingRow[] = [];
  const now = new Date().toISOString();

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 5) continue;

    const season = getValue(values, ['Season', 'Stagione']);
    const opponent = getValue(values, ['Opponent', 'Avversario', 'Opp']);
    const dateStr = getValue(values, ['Date', 'Data', 'Gm Date']);
    
    if (!season || !opponent) continue;

    const gameId = `${season}-${opponent.replace(/\s+/g, '_')}-${dateStr.replace(/\//g, '')}`;

    rows.push({
      game_id: gameId,
      season,
      league: getValue(values, ['League', 'Lega', 'Comp']) || 'LBA',
      opponent,
      date: dateStr,
      attendance: parseInteger(getValue(values, ['Total Att', 'Tot Att', 'Attendance', 'Tot Num'])),
      capacity: parseInteger(getValue(values, ['Capacity', 'Cap', 'Stadium Cap'])) || 4068,
      total_revenue: parseCurrency(getValue(values, ['Total Eur', 'Tot Eur', 'Total Revenue', 'Revenue'])),
      corp_revenue: parseCurrency(getValue(values, ['Corp Eur', 'Corp Revenue'])),
      tier: parseInteger(getValue(values, ['Tier'])) || 1,
      opp_rank: parseInteger(getValue(values, ['Opp Rank', 'Opponent Rank'])) || null,
      pv_rank: parseInteger(getValue(values, ['PV Rank', 'Our Rank'])) || null,
      updated_at: now
    });
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result.map(s => s.replace(/^"|"$/g, '').trim());
}

export async function testBigQueryConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const client = getBigQueryClient();
    
    const query = `SELECT 1 as test`;
    const [rows] = await client.query({ query });
    
    return { 
      success: true, 
      message: `Connected to BigQuery! Project: ${PROJECT_ID}` 
    };
  } catch (error: any) {
    console.error('BigQuery connection test error:', error);
    return { 
      success: false, 
      message: error.message || 'Connection failed' 
    };
  }
}

// Fetch ALL columns from BigQuery and return as raw rows
// This allows downstream processing to extract zone data
export async function fetchTicketingFromBigQuery(): Promise<{ success: boolean; data: TicketingRow[]; rawRows?: any[]; message: string }> {
  try {
    const client = getBigQueryClient();
    
    // Fetch all columns - don't limit fields, disable cache for fresh data
    const query = `SELECT * FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\` ORDER BY Data DESC LIMIT 1000`;
    
    const [rows] = await client.query({ query, useQueryCache: false });
    
    const parseNumeric = (val: any): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (typeof val === 'string') {
        // American format: comma thousands, dot decimal
        let cleaned = val.replace(/[€$£\s]/g, '').replace(/,/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };
    
    // Basic TicketingRow for backward compat (aggregate data)
    const ticketingData: TicketingRow[] = (rows as any[]).map(row => {
      let dateValue = '';
      if (row.Data) {
        if (typeof row.Data === 'object' && row.Data.value) {
          dateValue = row.Data.value;
        } else if (typeof row.Data === 'string') {
          dateValue = row.Data;
        }
      }
      // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY
      if (dateValue && dateValue.includes('-') && !dateValue.includes('/')) {
        const [year, month, day] = dateValue.split('-');
        dateValue = `${day}/${month}/${year}`;
      }
      
      return {
        game_id: row.Game_ID || row.game_id || `${row.Season || row.season}-${row.Contro || row.opponent}`,
        season: row.Season || row.season || '',
        league: row.Liga || row.league || 'LBA',
        opponent: row.Contro || row.opponent || '',
        date: dateValue || row.date || '',
        attendance: parseNumeric(row.Total_num || row.Tot_Att || row.attendance),
        capacity: 4068,
        total_revenue: parseNumeric(row.Tot_Eur || row.total_revenue),
        corp_revenue: parseNumeric(row.Corp_Eur || row.corp_revenue),
        tier: parseNumeric(row.Tier || row.tier) || 1,
        opp_rank: row.Opp_Rank ? parseNumeric(row.Opp_Rank) : null,
        pv_rank: row.PV_Rank ? parseNumeric(row.PV_Rank) : null,
        updated_at: new Date().toISOString()
      };
    });
    
    // Filter out incomplete rows (no opponent or date)
    const validData = ticketingData.filter(row => row.opponent && row.date);
    
    return {
      success: true,
      data: validData,
      rawRows: rows as any[], // Return raw rows for full zone data processing
      message: `Fetched ${ticketingData.length} games from BigQuery`
    };
  } catch (error: any) {
    console.error('BigQuery fetch error:', error);
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to fetch from BigQuery'
    };
  }
}

// Fetch CRM data from BigQuery
const CRM_TABLE_ID = process.env.BIGQUERY_CRM_TABLE_ID || 'CRM_2526';

export async function fetchCRMFromBigQuery(): Promise<{ success: boolean; rawRows?: any[]; message: string }> {
  try {
    const client = getBigQueryClient();
    
    // Fetch all columns from CRM table - enable cache for faster subsequent loads
    const query = `SELECT * FROM \`${PROJECT_ID}.${DATASET_ID}.${CRM_TABLE_ID}\` LIMIT 100000`;
    
    const [rows] = await client.query({ query, useQueryCache: true });
    
    if (!rows || rows.length === 0) {
      return {
        success: false,
        message: 'No CRM data found in BigQuery'
      };
    }
    
    return {
      success: true,
      rawRows: rows as any[],
      message: `Fetched ${rows.length} CRM records from BigQuery`
    };
  } catch (error: any) {
    console.error('BigQuery CRM fetch error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch CRM from BigQuery'
    };
  }
}

// Convert BigQuery CRM rows to CSV format for processing by processCRMData
export function convertBigQueryRowsToCRMCSV(rows: any[]): string {
  if (!rows || rows.length === 0) return '';
  
  // Collect ALL unique column names from sample of rows (not just first row)
  // Some fields like 'group' only exist on certain records
  const columnSet = new Set<string>();
  const sampleSize = Math.min(rows.length, 1000);
  for (let i = 0; i < sampleSize; i++) {
    Object.keys(rows[i]).forEach(key => columnSet.add(key));
  }
  const columns = Array.from(columnSet);
  
  // Convert underscore column names to lowercase for CSV compatibility
  const headerRow = columns.map(col => col.toLowerCase()).join(',');
  
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    
    // Handle BigQuery date/timestamp objects
    if (typeof val === 'object' && val.value) {
      return String(val.value);
    }
    
    // Handle numbers - convert American format (dot decimal) to plain number
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
    columns.map(col => formatValue(row[col])).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
}

// Fetch GameDay data from BigQuery
const GAMEDAY_TABLE_ID = process.env.BIGQUERY_GAMEDAY_TABLE_ID || 'gameday_db';

export async function fetchGameDayFromBigQuery(): Promise<{ success: boolean; rawRows?: any[]; message: string }> {
  try {
    const client = getBigQueryClient();
    
    // Fetch all columns from gameday table - disable cache for fresh data
    const query = `SELECT * FROM \`${PROJECT_ID}.${DATASET_ID}.${GAMEDAY_TABLE_ID}\` LIMIT 50000`;
    
    const [rows] = await client.query({ query, useQueryCache: false });
    
    if (!rows || rows.length === 0) {
      return {
        success: false,
        message: 'No GameDay data found in BigQuery'
      };
    }
    
    return {
      success: true,
      rawRows: rows as any[],
      message: `Fetched ${rows.length} GameDay records from BigQuery`
    };
  } catch (error: any) {
    console.error('BigQuery GameDay fetch error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch GameDay from BigQuery'
    };
  }
}

// Convert BigQuery GameDay rows to CSV format for processing by processGameDayData
// BigQuery format: underscores in headers, Eur instead of $, Num instead of #, Pct instead of %
// US number format (dot decimal, comma thousands)
export function convertBigQueryRowsToGameDayCSV(rows: any[]): string {
  if (!rows || rows.length === 0) return '';
  
  const columns = Object.keys(rows[0]);
  
  // Convert column names: special patterns first, then underscore to space, then symbols
  const headerRow = columns.map(col => {
    let header = col;
    // Handle special patterns before general underscore replacement
    header = header.replace(/F_B/gi, 'F&B');  // F_B → F&B
    header = header.replace(/_/g, ' ');        // remaining underscores to spaces
    header = header.replace(/\bEur\b/gi, '$'); // Eur → $
    header = header.replace(/\bNum\b/gi, '#'); // Num → #
    header = header.replace(/\bPct\b/gi, '%'); // Pct → %
    return header;
  }).join(',');
  
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    
    // Handle BigQuery date/timestamp objects
    if (typeof val === 'object' && val.value) {
      let dateStr = val.value;
      // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY
      if (dateStr && dateStr.includes('-') && !dateStr.includes('/')) {
        const [year, month, day] = dateStr.split('-');
        dateStr = `${day}/${month}/${year}`;
      }
      return dateStr;
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
    columns.map(col => formatValue(row[col])).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
}

// Fetch Sponsorship data from BigQuery
const SPONSOR_TABLE_ID = process.env.BIGQUERY_SPONSOR_TABLE_ID || 'sponsor_db';

export async function fetchSponsorshipFromBigQuery(): Promise<{ success: boolean; rawRows?: any[]; message: string }> {
  try {
    const client = getBigQueryClient();
    
    // Fetch all columns from sponsor table - disable cache for fresh data
    const query = `SELECT * FROM \`${PROJECT_ID}.${DATASET_ID}.${SPONSOR_TABLE_ID}\` LIMIT 50000`;
    
    const [rows] = await client.query({ query, useQueryCache: false });
    
    if (!rows || rows.length === 0) {
      return {
        success: false,
        message: 'No sponsorship data found in BigQuery'
      };
    }
    
    return {
      success: true,
      rawRows: rows as any[],
      message: `Fetched ${rows.length} sponsorship records from BigQuery`
    };
  } catch (error: any) {
    console.error('BigQuery Sponsorship fetch error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch Sponsorship from BigQuery'
    };
  }
}

// Convert BigQuery Sponsorship rows to CSV format for processing by processSponsorData
export function convertBigQueryRowsToSponsorCSV(rows: any[]): string {
  if (!rows || rows.length === 0) return '';
  
  const columns = Object.keys(rows[0]);
  
  // Convert column names for CSV compatibility
  const headerRow = columns.map(col => col.replace(/_/g, ' ')).join(',');
  
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    
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
    columns.map(col => formatValue(row[col])).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
}

// Convert BigQuery raw rows to CSV format for processing by processGameData
// BigQuery uses underscores in headers; this normalizes them to spaces
export function convertBigQueryRowsToCSV(rows: any[]): string {
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
}
