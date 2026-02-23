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

const VB_TABLE = 'ticketing-migration.ticketing_migration.sg_db';

export interface VBRawRow {
  timestamp: string;
  Practice_Load: number | null;
  Height: number | null;
  Player: string | null;
  Weight: number | null;
  Wingspan: number | null;
  Standing_Reach: number | null;
  Date_of_Session: string | null;
  Vitamins_Load: number | null;
  Weights_Load: number | null;
  BodyFat: number | null;
  Pure_Vertical_Jump: number | null;
  No_Step_Vertical_Jump: number | null;
  Sprint: number | null;
  Cone_Drill: number | null;
  Deadlift: number | null;
  Shoots_Taken: number | null;
  Shoots_Made: number | null;
  email: string | null;
  Game_Load: number | null;
  Form_Shooting: number | null;
  Injured: number | null;
  National_Team: number | null;
}

export interface VBMergedSession {
  player: string;
  date: string;
  practiceLoad: number | null;
  vitaminsLoad: number | null;
  weightsLoad: number | null;
  gameLoad: number | null;
  height: number | null;
  weight: number | null;
  wingspan: number | null;
  standingReach: number | null;
  bodyFat: number | null;
  pureVertical: number | null;
  noStepVertical: number | null;
  sprint: number | null;
  coneDrill: number | null;
  deadlift: number | null;
  shootsTaken: number | null;
  shootsMade: number | null;
  shootingPct: number | null;
  formShooting: number | null;
  injured: number | null;
  nationalTeam: number | null;
}

function getField(row: any, ...keys: string[]): any {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) {
      const val = row[k];
      if (typeof val === 'object' && val !== null && val.value !== undefined) return val.value;
      return val;
    }
  }
  return null;
}

function parseSlashDate(s: string): string | null {
  const parts = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!parts) return null;
  const [, a, b, y] = parts;
  const aNum = parseInt(a, 10);
  const bNum = parseInt(b, 10);
  if (aNum > 12) {
    return `${y}-${bNum.toString().padStart(2, '0')}-${aNum.toString().padStart(2, '0')}`;
  }
  if (bNum > 12) {
    return `${y}-${aNum.toString().padStart(2, '0')}-${bNum.toString().padStart(2, '0')}`;
  }
  return `${y}-${bNum.toString().padStart(2, '0')}-${aNum.toString().padStart(2, '0')}`;
}

function unwrapBQValue(val: any): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' && val.value !== undefined) return String(val.value);
  return String(val);
}

function parseVBDate(row: any): string {
  const dos = unwrapBQValue(getField(row, 'date_of_session', 'Date_of_Session'));
  if (dos && dos.trim()) {
    const s = dos.trim();
    const parsed = parseSlashDate(s);
    if (parsed) return parsed;
    const dt = new Date(s);
    if (!isNaN(dt.getTime()) && dt.getFullYear() >= 2000) return dt.toISOString().split('T')[0];
  }
  const ts = unwrapBQValue(row.timestamp);
  if (ts) {
    const s = ts.trim();
    const parsed = parseSlashDate(s);
    if (parsed) return parsed;
    const dt = new Date(s);
    if (!isNaN(dt.getTime()) && dt.getFullYear() >= 2000) return dt.toISOString().split('T')[0];
  }
  return 'unknown';
}

function coalesce(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a !== null && a !== undefined && !isNaN(Number(a))) return Number(a);
  if (b !== null && b !== undefined && !isNaN(Number(b))) return Number(b);
  return null;
}

function mergeVBRows(rows: any[]): VBMergedSession[] {
  const groups = new Map<string, any[]>();
  
  for (const row of rows) {
    const player = getField(row, 'player', 'Player');
    if (!player || !String(player).trim()) continue;
    const playerName = String(player).trim();
    const date = parseVBDate(row);
    const key = `${playerName.toLowerCase()}|${date}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  
  const merged: VBMergedSession[] = [];
  for (const [, groupRows] of groups) {
    const firstPlayer = getField(groupRows[0], 'player', 'Player');
    const base: VBMergedSession = {
      player: String(firstPlayer).trim(),
      date: parseVBDate(groupRows[0]),
      practiceLoad: null, vitaminsLoad: null, weightsLoad: null, gameLoad: null,
      height: null, weight: null, wingspan: null, standingReach: null, bodyFat: null,
      pureVertical: null, noStepVertical: null, sprint: null, coneDrill: null, deadlift: null,
      shootsTaken: null, shootsMade: null, shootingPct: null,
      formShooting: null, injured: null, nationalTeam: null,
    };
    
    for (const r of groupRows) {
      base.practiceLoad = coalesce(base.practiceLoad, getField(r, 'practice_load', 'Practice_Load'));
      base.vitaminsLoad = coalesce(base.vitaminsLoad, getField(r, 'vitamins_load', 'Vitamins_Load'));
      base.weightsLoad = coalesce(base.weightsLoad, getField(r, 'weights_load', 'Weights_Load'));
      base.gameLoad = coalesce(base.gameLoad, getField(r, 'game_load', 'Game_Load'));
      base.height = coalesce(base.height, getField(r, 'height', 'Height'));
      base.weight = coalesce(base.weight, getField(r, 'weight', 'Weight'));
      base.wingspan = coalesce(base.wingspan, getField(r, 'wingspan', 'Wingspan'));
      base.standingReach = coalesce(base.standingReach, getField(r, 'standing_reach', 'Standing_Reach'));
      const rawSF = getField(r, 'body_fat', 'BodyFat');
      if (rawSF !== null && rawSF !== undefined) {
        const S = Number(rawSF);
        if (!isNaN(S) && S > 0) {
          base.bodyFat = coalesce(base.bodyFat, S);
        }
      }
      base.pureVertical = coalesce(base.pureVertical, getField(r, 'pure_vertical_jump', 'Pure_Vertical_Jump'));
      base.noStepVertical = coalesce(base.noStepVertical, getField(r, 'no_step_vertical_jump', 'No_Step_Vertical_Jump'));
      const rawSprint = getField(r, 'sprint', 'Sprint');
      base.sprint = coalesce(base.sprint, rawSprint !== null && rawSprint > 50 ? Math.round(rawSprint) / 100 : rawSprint);
      const rawConeDrill = getField(r, 'cone_drill', 'Cone_Drill');
      base.coneDrill = coalesce(base.coneDrill, rawConeDrill !== null && rawConeDrill > 50 ? Math.round(rawConeDrill) / 100 : rawConeDrill);
      base.deadlift = coalesce(base.deadlift, getField(r, 'deadlift', 'Deadlift'));
      base.shootsTaken = coalesce(base.shootsTaken, getField(r, 'shots_taken', 'Shoots_Taken'));
      base.shootsMade = coalesce(base.shootsMade, getField(r, 'shots_made', 'Shoots_Made'));
      base.formShooting = coalesce(base.formShooting, getField(r, 'form_shooting', 'Form_Shooting'));
      base.injured = coalesce(base.injured, getField(r, 'injured', 'Injured'));
      base.nationalTeam = coalesce(base.nationalTeam, getField(r, 'national_team', 'National_Team'));
    }
    
    if (base.shootsTaken && base.shootsTaken > 0 && base.shootsMade !== null) {
      base.shootingPct = Math.round((base.shootsMade / base.shootsTaken) * 1000) / 10;
    }
    
    merged.push(base);
  }
  
  return merged.sort((a, b) => a.date.localeCompare(b.date));
}

const VB_PROFILE_TABLE = 'ticketing-migration.ticketing_migration.sg_profile';

export interface VBPlayerProfile {
  name: string;
  email: string | null;
  cellNumber: string | null;
  momHeight: number | null;
  dadHeight: number | null;
  dob: string | null;
  role: string | null;
  midParentalHeight: number | null;
  mugShot: string | null;
  season: string | null;
  passport: string | null;
  italianFormation: number | null;
  soyStatus: string | null;
  eoyStatus: string | null;
  year1Destination: string | null;
  revenueGenerated: number | null;
  minLate: number | null;
  strength1: string | null;
  strength2: string | null;
  strength3: string | null;
  weakness1: string | null;
  weakness2: string | null;
  weakness3: string | null;
  poe1: string | null;
  poe2: string | null;
  poe3: string | null;
  workEthic: number | null;
  personality: number | null;
}

export async function fetchVBProfilesFromBigQuery(): Promise<{ success: boolean; data: VBPlayerProfile[] }> {
  try {
    const client = getBigQueryClient();
    const query = `SELECT * FROM \`${VB_PROFILE_TABLE}\``;
    const [rows] = await client.query({ query });

    const HEADER_VALUES = new Set(['name', 'email', 'cell_n', 'mom_height', 'dad_height', 'dob', 'role', 'mid_parental_height', 'mug_shot', 'season', 'passport', 'italian_formation', 'soy_status', 'eoy_status', 'year_1_destination', 'revenue_generated']);
    const validRows = rows.filter((row: any) => {
      const name = getField(row, 'Name', 'name', 'string_field_0');
      if (!name || !String(name).trim()) return false;
      if (HEADER_VALUES.has(String(name).trim().toLowerCase())) return false;
      return true;
    });

    const profiles: VBPlayerProfile[] = validRows.map((row: any) => {
      const rawSeason = getField(row, 'Season', 'season', 'string_field_9');
      let season: string | null = null;
      if (rawSeason) {
        const s = String(rawSeason).trim();
        if (s.match(/^\d{2}-\d{2}$/)) {
          const [a, b] = s.split('-');
          season = `20${a}/${b}`;
        } else {
          season = s;
        }
      }

      return {
        name: String(getField(row, 'Name', 'name', 'string_field_0') || '').trim(),
        email: getField(row, 'Email', 'email', 'string_field_1') ? String(getField(row, 'Email', 'email', 'string_field_1')).trim() : null,
        cellNumber: getField(row, 'Cell_N', 'cell_n', 'string_field_2') ? String(getField(row, 'Cell_N', 'cell_n', 'string_field_2')).trim() : null,
        momHeight: parseFloat(getField(row, 'Mom_Height', 'mom_height', 'string_field_3')) || null,
        dadHeight: parseFloat(getField(row, 'Dad_Height', 'dad_height', 'string_field_4')) || null,
        dob: getField(row, 'DOB', 'dob', 'string_field_5') ? String(getField(row, 'DOB', 'dob', 'string_field_5')).trim() : null,
        role: getField(row, 'Role', 'role', 'string_field_6') ? String(getField(row, 'Role', 'role', 'string_field_6')).trim() : null,
        midParentalHeight: parseFloat(getField(row, 'Mid_Parental_Height', 'mid_parental_height', 'string_field_7')) || null,
        mugShot: getField(row, 'Mug_Shot', 'mug_shot', 'string_field_8') ? String(getField(row, 'Mug_Shot', 'mug_shot', 'string_field_8')).trim() : null,
        season,
        passport: getField(row, 'Passport', 'passport', 'string_field_10') ? String(getField(row, 'Passport', 'passport', 'string_field_10')).trim() : null,
        italianFormation: getField(row, 'Italian_Formation', 'italian_formation', 'string_field_11') != null ? parseInt(getField(row, 'Italian_Formation', 'italian_formation', 'string_field_11')) : null,
        soyStatus: getField(row, 'SoY_Status', 'soy_status', 'string_field_12') ? String(getField(row, 'SoY_Status', 'soy_status', 'string_field_12')).trim() : null,
        eoyStatus: getField(row, 'EoY_Status', 'eoy_status', 'string_field_13') ? String(getField(row, 'EoY_Status', 'eoy_status', 'string_field_13')).trim() : null,
        year1Destination: getField(row, 'Year_1_Destination', 'year_1_destination', 'string_field_14') ? String(getField(row, 'Year_1_Destination', 'year_1_destination', 'string_field_14')).trim() : null,
        revenueGenerated: parseFloat(getField(row, 'Revenue_Generated', 'revenue_generated', 'string_field_15')) || null,
        minLate: parseFloat(getField(row, 'Min_Late', 'min_late')) || null,
        strength1: getField(row, 'Strenght_1', 'strenght_1', 'Strength_1', 'strength_1') ? String(getField(row, 'Strenght_1', 'strenght_1', 'Strength_1', 'strength_1')).trim() : null,
        strength2: getField(row, 'Strenght_2', 'strenght_2', 'Strength_2', 'strength_2') ? String(getField(row, 'Strenght_2', 'strenght_2', 'Strength_2', 'strength_2')).trim() : null,
        strength3: getField(row, 'Strenght_3', 'strenght_3', 'Strength_3', 'strength_3') ? String(getField(row, 'Strenght_3', 'strenght_3', 'Strength_3', 'strength_3')).trim() : null,
        weakness1: getField(row, 'Weaknesess_1', 'weaknesess_1', 'Weakness_1', 'weakness_1') ? String(getField(row, 'Weaknesess_1', 'weaknesess_1', 'Weakness_1', 'weakness_1')).trim() : null,
        weakness2: getField(row, 'Weaknesess_2', 'weaknesess_2', 'Weakness_2', 'weakness_2') ? String(getField(row, 'Weaknesess_2', 'weaknesess_2', 'Weakness_2', 'weakness_2')).trim() : null,
        weakness3: getField(row, 'Weaknesess_3', 'weaknesess_3', 'Weakness_3', 'weakness_3') ? String(getField(row, 'Weaknesess_3', 'weaknesess_3', 'Weakness_3', 'weakness_3')).trim() : null,
        poe1: getField(row, 'POE_1', 'poe_1') ? String(getField(row, 'POE_1', 'poe_1')).trim() : null,
        poe2: getField(row, 'POE_2', 'poe_2') ? String(getField(row, 'POE_2', 'poe_2')).trim() : null,
        poe3: getField(row, 'POE_3', 'poe_3') ? String(getField(row, 'POE_3', 'poe_3')).trim() : null,
        workEthic: parseFloat(getField(row, 'Work_Ethic', 'work_ethic')) || null,
        personality: parseFloat(getField(row, 'Personality', 'personality')) || null,
      };
    });

    return { success: true, data: profiles };
  } catch (error: any) {
    console.error('VB Profile BigQuery fetch error:', error.message);
    return { success: false, data: [] };
  }
}

const VB_PROSPECTS_TABLE = 'ticketing-migration.ticketing_migration.sg_prospects';

export interface VBProspect {
  name: string;
  dob: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  wingspan: number | null;
  position: string | null;
  secondaryPosition: string | null;
  nationality: string | null;
  secondNationality: string | null;
  passport: string | null;
  teamSchool: string | null;
  language: string | null;
  headshot: string | null;
  video: string | null;
  handlerName: string | null;
  strength: number | null;
  speed: number | null;
  quickness: number | null;
  motor: number | null;
  stamina: number | null;
  athleticismNotes: string | null;
  dribbling: number | null;
  passing: number | null;
  finishing: number | null;
  shooting: number | null;
  defense: number | null;
  basketballIQ: number | null;
  skillsNotes: string | null;
  likeliness: number | null;
  workEthic: number | null;
  coachable: number | null;
  teammate: number | null;
  lifePersonality: number | null;
  generalNotes: string | null;
  timestamp: string | null;
}

export async function fetchVBProspectsFromBigQuery(): Promise<{ success: boolean; data: VBProspect[] }> {
  try {
    const client = getBigQueryClient();
    const query = `SELECT * FROM \`${VB_PROSPECTS_TABLE}\``;
    const [rows] = await client.query({ query });

    const prospects: VBProspect[] = rows.map((row: any) => {
      const dobRaw = row.DOB?.value || row.DOB;
      let dob: string | null = null;
      let age: number | null = null;
      if (dobRaw) {
        const d = new Date(dobRaw);
        if (!isNaN(d.getTime())) {
          dob = d.toISOString().substring(0, 10);
          const now = new Date();
          age = Math.floor((now.getTime() - d.getTime()) / (365.25 * 86400000));
        }
      }
      const tsRaw = row.Marca_temporal?.value || row.Marca_temporal;

      return {
        name: (row.Name || '').trim(),
        dob,
        age,
        height: row.Height != null ? Number(row.Height) : null,
        weight: row.Weight != null ? Number(row.Weight) : null,
        wingspan: row.Wingspan != null ? Number(row.Wingspan) : null,
        position: row.Position ? String(row.Position).trim() : null,
        secondaryPosition: row.Secondary_Position && row.Secondary_Position !== 'NA' ? String(row.Secondary_Position).trim() : null,
        nationality: row.Nationality ? String(row.Nationality).trim() : null,
        secondNationality: row.Second_Nationalty && row.Second_Nationalty !== 'NA' ? String(row.Second_Nationalty).trim() : null,
        passport: row.Passport || null,
        teamSchool: row.Team_School ? String(row.Team_School).trim() : null,
        language: row.Language ? String(row.Language).trim() : null,
        headshot: row.Headshot ? String(row.Headshot).replace(/^\[img\]/i, '').replace(/\[\/img\]$/i, '').trim() || null : null,
        video: row.Video || null,
        handlerName: row.Handler_s_Name ? String(row.Handler_s_Name).trim() : null,
        strength: row.Strength != null ? Number(row.Strength) : null,
        speed: row.Speed != null ? Number(row.Speed) : null,
        quickness: row.Quickness != null ? Number(row.Quickness) : null,
        motor: row.Motor != null ? Number(row.Motor) : null,
        stamina: row.Stamina != null ? Number(row.Stamina) : null,
        athleticismNotes: row.Athleticism_notes || null,
        dribbling: row.Dribbling != null ? Number(row.Dribbling) : null,
        passing: row.Passing != null ? Number(row.Passing) : null,
        finishing: row.Finishing != null ? Number(row.Finishing) : null,
        shooting: row.Shooting != null ? Number(row.Shooting) : null,
        defense: row.Defense != null ? Number(row.Defense) : null,
        basketballIQ: row.Basketball_IQ != null ? Number(row.Basketball_IQ) : null,
        skillsNotes: row.Skills_Notes || null,
        likeliness: row.Likeliness != null ? Number(row.Likeliness) : null,
        workEthic: row.Work_Ethic != null ? Number(row.Work_Ethic) : null,
        coachable: row.Coachable != null ? Number(row.Coachable) : null,
        teammate: row.Teammate != null ? Number(row.Teammate) : null,
        lifePersonality: row.Life_Personality != null ? Number(row.Life_Personality) : null,
        generalNotes: row.General_Notes || null,
        timestamp: tsRaw ? new Date(tsRaw).toISOString().substring(0, 10) : null,
      };
    });

    return { success: true, data: prospects };
  } catch (error: any) {
    console.error('VB Prospects BigQuery fetch error:', error.message);
    return { success: false, data: [] };
  }
}

export async function fetchVBDataFromBigQuery(): Promise<{ success: boolean; data: VBMergedSession[]; rawCount: number; mergedCount: number; players: string[] }> {
  try {
    const client = getBigQueryClient();
    const query = `SELECT * FROM \`${VB_TABLE}\` ORDER BY timestamp DESC`;
    const [rows] = await client.query({ query });
    
    const merged = mergeVBRows(rows);
    const players = [...new Set(merged.map(r => r.player))].sort();
    
    return {
      success: true,
      data: merged,
      rawCount: rows.length,
      mergedCount: merged.length,
      players,
    };
  } catch (error: any) {
    console.error('VB BigQuery fetch error:', error.message);
    return { success: false, data: [], rawCount: 0, mergedCount: 0, players: [] };
  }
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
    
    // Explicitly select all needed columns to ensure area/seat are included
    const query = `SELECT 
      uid, last_name, name, email, dob, pob, nationality, province, cell, address,
      buy_date, event, zone, \`group\`, type, net, iva, price, payment, state, quantity,
      pv_zone, abb_mp_price_gm, abb_corp_pvprice, gm, Gm_Date_time, 
      comercial_value as commercial_value,
      game_id, sell, giveawaytype, discount_type, season,
      IFNULL(area, '') as area,
      IFNULL(CAST(seat AS STRING), '') as seat
    FROM \`${PROJECT_ID}.${DATASET_ID}.${CRM_TABLE_ID}\` LIMIT 100000`;
    
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
