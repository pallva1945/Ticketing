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
    const [rows] = await client.query({ query, location: 'US' });
    
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

export async function fetchTicketingFromBigQuery(): Promise<{ success: boolean; data: TicketingRow[]; message: string }> {
  try {
    const client = getBigQueryClient();
    
    const query = `
      SELECT 
        game_id,
        season,
        league,
        opponent,
        date,
        attendance,
        capacity,
        total_revenue,
        corp_revenue,
        tier,
        opp_rank,
        pv_rank,
        updated_at
      FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
      ORDER BY date DESC
    `;
    
    const [rows] = await client.query({ query, location: 'US' });
    
    const ticketingData: TicketingRow[] = (rows as any[]).map(row => ({
      game_id: row.game_id || '',
      season: row.season || '',
      league: row.league || 'LBA',
      opponent: row.opponent || '',
      date: row.date || '',
      attendance: Number(row.attendance) || 0,
      capacity: Number(row.capacity) || 4068,
      total_revenue: Number(row.total_revenue) || 0,
      corp_revenue: Number(row.corp_revenue) || 0,
      tier: Number(row.tier) || 1,
      opp_rank: row.opp_rank ? Number(row.opp_rank) : null,
      pv_rank: row.pv_rank ? Number(row.pv_rank) : null,
      updated_at: row.updated_at || new Date().toISOString()
    }));
    
    return {
      success: true,
      data: ticketingData,
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
