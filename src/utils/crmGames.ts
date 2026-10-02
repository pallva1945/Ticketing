import type { CRMRecord } from '../types';

export const normalizeCRMSeason = (value: string): string => {
  const match = (value || '').match(/(?:20)?(\d{2})\s*[-/]\s*(?:20)?(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : (value || '').trim();
};

export const crmGameDate = (value: number | string): string => {
  if (!value) return '';
  if (typeof value === 'string') {
    const italian = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (italian) return `${italian[3]}-${italian[2]}-${italian[1]}`;
    const iso = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (iso) return iso[1];
  }
  const date = new Date(typeof value === 'number' && value < 1e11 ? value * 1000 : value);
  if (!Number.isFinite(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getCRMSeason = (record: CRMRecord): string => {
  const explicit = normalizeCRMSeason(record.season);
  if (/^\d{2}-\d{2}$/.test(explicit)) return explicit;
  const subscriptionSeason = /abbonamento|stagione|season/i.test(record.event || '') ? normalizeCRMSeason(record.event) : '';
  if (/^\d{2}-\d{2}$/.test(subscriptionSeason)) return subscriptionSeason;
  const date = crmGameDate(record.gmDateTime);
  if (!date) return 'Unknown';
  const [year, month] = date.split('-').map(Number);
  const start = month >= 7 ? year : year - 1;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
};

// Give every encounter a season/date label, including in customer and corporate
// breakdowns. Only use an ID in the label when the date cannot disambiguate it.
export const prepareCRMRecords = (records: CRMRecord[]): CRMRecord[] => {
  const baseLabel = (record: CRMRecord) => {
    const name = (record.gm || record.game || '').trim();
    if (!name) return '';
    const date = crmGameDate(record.gmDateTime);
    const displayDate = date ? date.split('-').reverse().join('/') : '';
    return [name, getCRMSeason(record), displayDate && !name.includes(displayDate) ? displayDate : ''].filter(Boolean).join(' · ');
  };
  const idsByLabel = new Map<string, Set<string>>();
  records.forEach(record => {
    const label = baseLabel(record);
    if (label && record.gameId) {
      if (!idsByLabel.has(label)) idsByLabel.set(label, new Set());
      idsByLabel.get(label)!.add(record.gameId);
    }
  });
  return records.map(record => {
    const base = baseLabel(record);
    const needsId = record.gameId && (!crmGameDate(record.gmDateTime) || (idsByLabel.get(base)?.size ?? 0) > 1);
    const label = base && needsId ? `${base} · ID ${record.gameId}` : base;
    return { ...record, season: getCRMSeason(record), gm: label, game: label };
  });
};