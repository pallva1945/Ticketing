export interface BopsCostCategory {
  name: string;
  salaries: number;
  taxes: number;
  agents: number;
  relatedCost: number;
  total: number;
}
export interface BopsCostSeasonData {
  season: string;
  players: BopsCostCategory;
  coaches: BopsCostCategory;
  management: BopsCostCategory;
  staff: BopsCostCategory;
  anr: { personnel: number; softServices: number; total: number };
  luxuryTax: number;
  totalBops: number;
  netSalaryRatio: number;
}
const labelKey = (value: unknown) => String(value ?? '').trim().toLowerCase()
  .replace(/managment/g, 'management').replace(/[^a-z0-9]/g, '');
const isBlank = (value: unknown) => value === undefined || value === null || String(value).trim() === '';
function numeric(value: unknown, field: string, season: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (isBlank(value)) throw new Error(`Missing ${field} in ${season}. Previous data has not been replaced.`);
  let text = String(value).trim().replace(/[€\s\u00a0]/g, '');
  const percent = text.endsWith('%');
  if (percent) text = text.slice(0, -1);
  if (/^\(.*\)$/.test(text)) text = `-${text.slice(1, -1)}`;
  if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(?:\.\d{3})+$/.test(text)) text = text.replace(/\./g, '');
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(text) || !Number.isFinite(Number(text))) {
    throw new Error(`Invalid number for ${field} in ${season}. Previous data has not been replaced.`);
  }
  if (percent && field !== 'netSalaryRatio') throw new Error(`Expected an amount, not a percentage, for ${field} in ${season}.`);
  return Number(text) / (percent ? 100 : 1);
}
/** Reads the existing Financial Format: cost sections down rows, seasons across columns. */
export function parseBopsCostSheet(rows: unknown[][]): BopsCostSeasonData[] {
  if (!Array.isArray(rows)) throw new Error('Invalid Google Sheet data.');
  const headerIndex = rows.findIndex(row => Array.isArray(row) &&
    row.some(cell => /^(?:20)?\d{2}\s*\/\s*(?:20)?\d{2}\*?$/.test(String(cell ?? '').trim())));
  if (headerIndex < 0) throw new Error('No season columns found. Expected Financial Format columns such as 25/26 and 26/27.');
  const columns = rows[headerIndex].flatMap((cell, column) => {
    const match = String(cell ?? '').trim().match(/^(?:20)?(\d{2})\s*\/\s*(?:20)?(\d{2})\*?$/);
    if (!match) return [];
    if ((Number(match[1]) + 1) % 100 !== Number(match[2])) throw new Error(`Invalid season ${String(cell)}.`);
    return [{ column, season: `${match[1]}/${match[2]}` }];
  });
  if (new Set(columns.map(item => item.season)).size !== columns.length) throw new Error('Duplicate season columns.');
  const fields = new Map<string, unknown[]>();
  let section = '';
  for (const row of rows.slice(headerIndex + 1)) {
    if (!Array.isArray(row)) continue;
    const label = labelKey(row[0]);
    if (['players', 'coaches', 'management', 'staff', 'anr'].includes(label)) { section = label; continue; }
    let field = '';
    if (label === 'totalbops') field = 'totalBops';
    else if (label === 'netsalarytobopsratio') field = 'netSalaryRatio';
    else if (label === 'luxurytax' && columns.some(({ column }) => !isBlank(row[column]))) field = 'luxuryTax';
    else if (section === 'anr') {
      if (label === 'personnel') field = 'anr.personnel';
      else if (['softandservices', 'softservices'].includes(label)) field = 'anr.softServices';
      else if (label === 'totalanr') field = 'anr.total';
    } else if (['players', 'coaches', 'management', 'staff'].includes(section)) {
      if (['salaries', 'taxes', 'agents'].includes(label)) field = `${section}.${label}`;
      else if (label.endsWith('relatedcost')) field = `${section}.relatedCost`;
      else if (label.startsWith('total')) field = `${section}.total`;
    }
    if (field) {
      if (fields.has(field)) throw new Error(`Duplicate ${field} row.`);
      fields.set(field, row);
    }
  }
  const result = columns.flatMap(({ column, season }) => {
    if (![...fields.values()].some(row => !isBlank(row[column]))) return [];
    const value = (field: string) => numeric(fields.get(field)?.[column], field, season);
    const category = (key: string, name: string): BopsCostCategory => ({
      name, salaries: value(`${key}.salaries`), taxes: value(`${key}.taxes`),
      agents: value(`${key}.agents`), relatedCost: value(`${key}.relatedCost`), total: value(`${key}.total`),
    });
    return [{
      season, players: category('players', 'Players'), coaches: category('coaches', 'Coaches'),
      management: category('management', 'Management'), staff: category('staff', 'Staff'),
      anr: { personnel: value('anr.personnel'), softServices: value('anr.softServices'), total: value('anr.total') },
      luxuryTax: value('luxuryTax'), totalBops: value('totalBops'), netSalaryRatio: value('netSalaryRatio'),
    }];
  });
  if (!result.length) throw new Error('No complete BOps cost seasons found in the sheet.');
  return result.sort((a, b) => a.season.localeCompare(b.season));
}
export function normalizeBopsSheetConfig(sheetId: unknown, sheetName: unknown) {
  if (typeof sheetId !== 'string' || typeof sheetName !== 'string') throw new Error('Sheet URL or ID and tab name are required.');
  let id = sheetId.trim();
  if (/^https?:\/\//i.test(id)) {
    const url = new URL(id);
    const match = url.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
    if (url.hostname !== 'docs.google.com' || !match) throw new Error('Use a Google Sheets URL or spreadsheet ID.');
    id = match[1];
  }
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(id)) throw new Error('Invalid Google spreadsheet ID.');
  const name = sheetName.trim();
  if (!name || name.length > 100) throw new Error('Enter the exact sheet tab name (up to 100 characters).');
  return { sheetId: id, sheetName: name };
}