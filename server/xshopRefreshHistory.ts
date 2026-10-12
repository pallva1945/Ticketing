import type { MerchRefreshAttempt, MerchHistoryFailureCode } from '../src/types/merchandising';

export const XSHOP_HISTORY_LIMIT = 50;
export const XSHOP_HISTORY_VERSION = 1;
const codes: MerchHistoryFailureCode[] = [
  'timeout', 'connection', 'access', 'blocked', 'temporary', 'response',
  'pagination', 'credentials', 'persistence', 'unknown',
];
export function safeXShopHistoryCode(value: unknown): MerchHistoryFailureCode {
  return codes.includes(value as MerchHistoryFailureCode) ? value as MerchHistoryFailureCode : 'unknown';
}

// Explicit projection prevents extra properties from entering storage or API output.
export function sanitizeXShopHistory(value: unknown): MerchRefreshAttempt[] {
  if (!Array.isArray(value)) throw new Error('Invalid XShop history');
  return value.slice(-XSHOP_HISTORY_LIMIT).map(row => {
    const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));
    if (!row || !date(row.startedAt)
      || !(row.finishedAt === null || date(row.finishedAt))
      || !(row.lastSuccessfulSnapshotAt === null || date(row.lastSuccessfulSnapshotAt))
      || !(row.recognizedOrderCount === null || (Number.isSafeInteger(row.recognizedOrderCount) && row.recognizedOrderCount >= 0))
      || !['success', 'failure', 'unfinished'].includes(row.outcome)
      || (row.outcome === 'unfinished') !== (row.finishedAt === null)
      || (row.finishedAt && Date.parse(row.finishedAt) < Date.parse(row.startedAt))) {
      throw new Error('Invalid XShop history');
    }
    return {
      // Timestamp fallback reads the initial schema without dropping saved attempts.
      id: typeof row.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id)
        ? row.id : new Date(row.startedAt).toISOString(),
      startedAt: new Date(row.startedAt).toISOString(),
      finishedAt: row.finishedAt === null ? null : new Date(row.finishedAt).toISOString(),
      outcome: row.outcome,
      failureCode: row.outcome === 'failure' ? safeXShopHistoryCode(row.failureCode) : null,
      lastSuccessfulSnapshotAt: row.lastSuccessfulSnapshotAt === null ? null : new Date(row.lastSuccessfulSnapshotAt).toISOString(),
      recognizedOrderCount: row.recognizedOrderCount,
    };
  });
}

export function mergeXShopHistory(saved: unknown, incoming: unknown): MerchRefreshAttempt[] {
  const rows = new Map<string, MerchRefreshAttempt>();
  for (const row of [...sanitizeXShopHistory(saved), ...sanitizeXShopHistory(incoming)]) {
    // A delayed start write must not erase the already recorded terminal result.
    if (!rows.get(row.id)?.finishedAt) rows.set(row.id, row);
  }
  return [...rows.values()].sort((a, b) => a.startedAt.localeCompare(b.startedAt) || a.id.localeCompare(b.id))
    .slice(-XSHOP_HISTORY_LIMIT);
}
