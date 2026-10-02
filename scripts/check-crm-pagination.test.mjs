import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { readCompleteCRMQuery, CRM_PAGE_SIZE } from '../src/services/crmPagination.ts';
import { assertCompleteCRMResponse } from '../src/utils/crmResponse.ts';
import { isRowFixedCapacity, getCapacityBucket } from '../src/utils/crmCapacity.ts';
import { convertBigQueryToCRMData } from '../src/utils/dataProcessor.ts';
import { prepareCRMRecords } from '../src/utils/crmGames.ts';

const source = readFileSync(new URL('../server/index.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('index.ts', source, ts.ScriptTarget.Latest, true);
const declarations = ['parseNumber', 'slimCRMRows', 'computeCRMStats', 'loadCRMCache'].map(name =>
  ast.statements.find(s => ts.isVariableStatement(s)
    && s.declarationList.declarations.some(d => d.name.getText(ast) === name)).getText(ast)).join('\n');
const compiled = ts.transpileModule(`
let crmCache = null, crmCacheWarmingPromise = null;
${declarations}
globalThis.api = { computeCRMStats, slimCRMRows, loadCRMCache, cache: () => crmCache };
`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
function server(fetchCRMFromBigQuery = async () => { throw new Error('unused'); }) {
  const context = vm.createContext({ isRowFixedCapacity, fetchCRMFromBigQuery });
  vm.runInContext(compiled, context);
  return context.api;
}
function pagedJob(rows, { failPage, total = rows.length, stopPage, repeated = false } = {}) {
  const calls = [];
  return {
    calls,
    async getQueryResults(options) {
      calls.push(options);
      assert.equal(options.autoPaginate, false);
      assert.equal(options.maxResults, CRM_PAGE_SIZE);
      const start = Number(options.pageToken || 0);
      if (calls.length === failPage) throw new Error('Page unavailable');
      const page = rows.slice(start, start + CRM_PAGE_SIZE);
      const end = start + page.length;
      const next = end < rows.length && calls.length !== stopPage
        ? { pageToken: String(repeated ? CRM_PAGE_SIZE : end), location: 'EU' } : null;
      return [page, next, { totalRows: String(total), jobComplete: true }];
    },
  };
}

test('125,007 rows survive every page, duplicate identifiers, season and capacity filters, and late customer search', async () => {
  const count = 125007;
  const input = Array.from({ length: count }, (_, i) => Object.freeze({
    uid: String(i % 100), // Not a unique key: never deduplicate by UID.
    name: i === count - 1 ? 'BeyondLimit' : 'Test', last_name: 'Customer',
    email: 'synthetic@example.invalid', dob: '', season: i % 3 === 0 ? '25-26' : '26-27',
    event: i % 2 === 0 ? 'Abbonamento 2026/27 - Prelazione.' : '3 Games Pack',
    gm: 'Bologna', Gm_Date_time: i % 3 === 0 ? '12/10/2025 12.00' : '11/10/2026 12.00',
    buy_date: '01/06/2025 12.00', quantity: i % 7 === 0 ? -1 : 2,
    price: 20, commercial_value: 20, sell: 'ABB',
  }));
  const startHeap = process.memoryUsage().heapUsed;
  const job = pagedJob(input);
  const result = await readCompleteCRMQuery(job);
  assert.equal(result.complete, true);
  assert.equal(result.totalRows, count);
  assert.equal(result.rawRows.length, count);
  assert.equal(job.calls.length, Math.ceil(count / CRM_PAGE_SIZE));
  assert.equal(job.calls[1].location, 'EU');
  for (let i = 0; i < count; i++) assert.equal(result.rawRows[i], input[i]);
  const api = server();
  const stats = api.computeCRMStats(result.rawRows);
  const fixed = api.computeCRMStats(result.rawRows.filter(isRowFixedCapacity));
  const flexible = api.computeCRMStats(result.rawRows.filter(r => !isRowFixedCapacity(r)));
  assert.equal(stats.totalRecords, count);
  assert.equal(fixed.totalRecords + flexible.totalRecords, count);
  assert.equal(fixed.totalTickets + flexible.totalTickets, stats.totalTickets);
  assert.equal(fixed.totalRevenue + flexible.totalRevenue, stats.totalRevenue);
  const prepared = prepareCRMRecords(convertBigQueryToCRMData(api.slimCRMRows(result.rawRows)));
  assert.equal(prepared.length, count);
  assert.equal(prepared.find(r => r.firstName === 'BeyondLimit')?.fullName, 'Customer BeyondLimit');
  for (const season of ['25-26', '26-27']) {
    const seasonRows = result.rawRows.filter(r => r.season === season);
    const seasonStats = api.computeCRMStats(seasonRows);
    let records = 0, tickets = 0;
    for (const bucket of ['fixed', 'flexible']) {
      const subset = prepared.filter(r => r.season === season && getCapacityBucket(r) === bucket);
      const rawSubset = seasonRows.filter(r => getCapacityBucket(r) === bucket);
      const subsetStats = api.computeCRMStats(rawSubset);
      assert.equal(subset.length, subsetStats.totalRecords);
      assert.equal(subset.reduce((sum, r) => sum + r.quantity, 0), subsetStats.totalTickets);
      records += subset.length;
      tickets += subsetStats.totalTickets;
    }
    assert.equal(records, seasonStats.totalRecords);
    assert.equal(tickets, seasonStats.totalTickets);
  }
  assert.equal(input[count - 1].name, 'BeyondLimit', 'source rows are not modified');
  const heapDeltaMiB = (process.memoryUsage().heapUsed - startHeap) / 1048576;
  console.log(`125,007-row regression: ${job.calls.length} pages, ${(result.loadedBytes / 1048576).toFixed(1)} MiB payload, ${heapDeltaMiB.toFixed(1)} MiB heap delta including UI conversion and stats.`);
  assert.ok(heapDeltaMiB < 450, 'synthetic end-to-end load must remain within a bounded heap');
});

test('page failures, early termination, missing/wrong totals and repeated tokens cannot return success', async () => {
  const rows = Array.from({ length: 10001 }, (_, uid) => ({ uid }));
  await assert.rejects(readCompleteCRMQuery(pagedJob(rows, { failPage: 2 })), /Page unavailable/);
  await assert.rejects(readCompleteCRMQuery(pagedJob(rows, { stopPage: 1 })), /Incomplete CRM/);
  await assert.rejects(readCompleteCRMQuery(pagedJob(rows, { total: 10002 })), /Incomplete CRM/);
  await assert.rejects(readCompleteCRMQuery(pagedJob(rows, { total: 'invalid' })), /invalid/);
  await assert.rejects(readCompleteCRMQuery(pagedJob(rows, { repeated: true })), /repeated/);
  const job = { async getQueryResults() { return [[], null, {}]; } };
  await assert.rejects(readCompleteCRMQuery(job), /Incomplete CRM/);
});

test('memory and row budgets fail explicitly, while a complete empty snapshot is valid', async () => {
  await assert.rejects(readCompleteCRMQuery(pagedJob([{ text: 'x'.repeat(100) }]),
    { maxRows: 5, maxBytes: 10 }), /budget/);
  await assert.rejects(readCompleteCRMQuery(pagedJob([{}, {}]),
    { maxRows: 1, maxBytes: 100 }), /budget/);
  assert.deepEqual(await readCompleteCRMQuery(pagedJob([])), {
    rawRows: [], complete: true, totalRows: 0, loadedBytes: 0,
  });
});

test('query polling is not a result page and inconsistent snapshot totals are rejected', async () => {
  let calls = 0;
  const pending = {
    async getQueryResults(options) {
      calls++;
      if (calls < 3) return [[], options, { jobComplete: false }];
      return [[{ uid: 'last' }], null, { jobComplete: true, totalRows: '1' }];
    },
  };
  assert.equal((await readCompleteCRMQuery(pending)).totalRows, 1);
  const job = pagedJob(Array.from({ length: 5001 }, (_, uid) => ({ uid })));
  const original = job.getQueryResults;
  job.getQueryResults = async options => {
    const result = await original(options);
    if (options.pageToken) result[2].totalRows = '5002';
    return result;
  };
  await assert.rejects(readCompleteCRMQuery(job), /inconsistent/);
});

test('cache warming and refresh share one fetch; failed refresh keeps the complete previous snapshot', async () => {
  let calls = 0;
  let fail = false;
  const api = server(async () => {
    calls++;
    await new Promise(resolve => setTimeout(resolve, 5));
    if (fail) return { success: false, complete: false, message: 'Page unavailable' };
    return { success: true, complete: true, totalRows: 2, rawRows: [
      { event: 'Abbonamento 2026/27', quantity: 2, commercial_value: 10 },
      { event: '3 Games Pack', quantity: 3, commercial_value: 10 },
    ] };
  });
  const [first, concurrent] = await Promise.all([api.loadCRMCache(), api.loadCRMCache()]);
  assert.equal(calls, 1);
  assert.equal(first, concurrent);
  assert.equal(first.totalRows, 2);
  assert.equal(first.fixedStats.totalRecords, 1);
  assert.equal(first.flexibleStats.totalRecords, 1);
  fail = true;
  await assert.rejects(api.loadCRMCache(), /Page unavailable/);
  assert.equal(api.cache(), first);
  fail = false;
  await api.loadCRMCache();
  assert.equal(calls, 3, 'failed single-flight promise is cleared for retry');
});

test('frontend accepts only complete, coherent stats and details', () => {
  const response = { success: true, complete: true, totalRows: 100001,
    stats: { totalRecords: 100001 }, fixedStats: { totalRecords: 50000 },
    flexibleStats: { totalRecords: 50001 } };
  assert.doesNotThrow(() => assertCompleteCRMResponse(response));
  assert.throws(() => assertCompleteCRMResponse({ ...response, complete: false }));
  assert.throws(() => assertCompleteCRMResponse({ ...response, rawRows: [{}] }, true));
  assert.throws(() => assertCompleteCRMResponse({ ...response, flexibleStats: { totalRecords: 50000 } }));
  assert.doesNotThrow(() => assertCompleteCRMResponse({
    ...response, rawRows: Array(100001).fill({}),
  }, true));
  assert.ok(!source.includes('slimCRMRows(crmCache.rawRows)'), 'cache response must not clone all rows on every request');
  const bq = readFileSync(new URL('../src/services/bigQueryService.ts', import.meta.url), 'utf8');
  const crmFetch = bq.slice(bq.indexOf('export async function fetchCRMFromBigQuery'), bq.indexOf('// Convert BigQuery CRM'));
  assert.doesNotMatch(crmFetch, /LIMIT|OFFSET|INSERT|UPDATE|DELETE/);
  assert.match(crmFetch, /createQueryJob/);
});