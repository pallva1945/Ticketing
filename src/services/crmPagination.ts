import type { Job, QueryResultsOptions } from '@google-cloud/bigquery';

export const CRM_PAGE_SIZE = 5000;
// Bound both the payload and object count: tiny rows also consume heap memory.
export const CRM_MAX_BYTES = 256 * 1024 * 1024;
export const CRM_MAX_ROWS = 1_000_000;

export interface CompleteCRMResult {
  rawRows: any[];
  complete: true;
  totalRows: number;
  loadedBytes: number;
}

/** Read a single query-job snapshot, never LIMIT/OFFSET against a changing table. */
export async function readCompleteCRMQuery(
  job: Pick<Job, 'getQueryResults'>,
  limits = { maxBytes: CRM_MAX_BYTES, maxRows: CRM_MAX_ROWS },
): Promise<CompleteCRMResult> {
  const rawRows: any[] = [];
  let expectedRows: number | undefined;
  let loadedBytes = 0;
  let options: QueryResultsOptions = { autoPaginate: false, maxResults: CRM_PAGE_SIZE };
  const tokens = new Set<string>();
  const deadline = Date.now() + 10 * 60 * 1000;

  do {
    if (Date.now() > deadline) throw new Error('CRM query timed out; no partial data was published');
    const [page, next, response] = await job.getQueryResults(options);
    // The SDK may return a polling continuation while the query is still running.
    // It is not a result page and must not count as a repeated pagination token.
    if (response?.jobComplete === false) {
      if (!next) throw new Error('CRM query did not complete');
      options = { ...next, autoPaginate: false, maxResults: CRM_PAGE_SIZE };
      continue;
    }
    if (response?.totalRows !== undefined) {
      const count = Number(response.totalRows);
      if (!Number.isSafeInteger(count) || count < 0 || (expectedRows !== undefined && count !== expectedRows)) {
        throw new Error('CRM query returned an invalid or inconsistent total row count');
      }
      expectedRows = count;
      if (count > limits.maxRows) throw new Error('CRM exceeds the safe in-memory row budget; no partial data was published');
    }
    for (const row of page) {
      loadedBytes += Buffer.byteLength(JSON.stringify(row), 'utf8');
      if (loadedBytes > limits.maxBytes || rawRows.length >= limits.maxRows) {
        throw new Error('CRM exceeds the safe in-memory load budget; no partial data was published');
      }
      rawRows.push(row);
    }
    if (!next) break;
    if (next.pageToken) {
      if (tokens.has(next.pageToken)) throw new Error('CRM pagination repeated a page token');
      tokens.add(next.pageToken);
    }
    // Preserve job/location/token options, but never enable SDK auto-pagination.
    options = { ...next, autoPaginate: false, maxResults: CRM_PAGE_SIZE };
  } while (true);

  if (expectedRows === undefined || rawRows.length !== expectedRows) {
    throw new Error(`Incomplete CRM query: loaded ${rawRows.length} of ${expectedRows ?? 'unknown'} rows; no partial data was published`);
  }
  return { rawRows, complete: true, totalRows: expectedRows, loadedBytes };
}