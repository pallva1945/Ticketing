import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { getCapacityBucket, isFixedCapacityEvent, isRowFixedCapacity } from '../src/utils/crmCapacity.ts';
import { prepareCRMRecords } from '../src/utils/crmGames.ts';
import { processCRMData } from '../src/utils/dataProcessor.ts';

// Exercise the real server calculations without booting Express, authenticating,
// or warming unrelated external services. Extract declarations using the TS AST,
// not a copy of the implementation.
const serverSource = readFileSync(new URL('../server/index.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('index.ts', serverSource, ts.ScriptTarget.Latest, true);
const declarations = ['parseNumber', 'slimCRMRows', 'computeCRMStats'].map(name => {
  const statement = ast.statements.find(s => ts.isVariableStatement(s)
    && s.declarationList.declarations.some(d => d.name.getText(ast) === name));
  assert.ok(statement, `Server declaration missing: ${name}`);
  return statement.getText(ast);
}).join('\n');
const compiled = ts.transpileModule(`${declarations}\nglobalThis.crm = { computeCRMStats, slimCRMRows };`, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText;
const loadServerFunctions = (predicate = isRowFixedCapacity) => {
  const context = vm.createContext({ isRowFixedCapacity: predicate });
  vm.runInContext(compiled, context);
  return context.crm;
};
const { computeCRMStats, slimCRMRows } = loadServerFunctions();
const legacyFixed = row => (row.event || row.Event || row.EVENT || '').trim().toLowerCase() === 'abbonamento lba 2025/26';
const legacyStats = loadServerFunctions(legacyFixed).computeCRMStats;
const plain = value => JSON.parse(JSON.stringify(value));

const currentSubscriptions = [
  'Abbonamento 2026/27', 'Abbonamento 2026/27.', 'Abbonamento 2026/27..',
  'Abbonamento 2026/27 - Prelazione', 'Abbonamento 2026/27 - Prelazione.',
  'Abbonamento 2026/27 - Prelazione..',
];
const flexibleEvents = [
  '3 Games Pack', '2 Game Pack', 'Spring Pack', 'Final Pack',
  'Black and White Pack', 'Christmas pack', '3 Games Pack - Final Rush', '4 Game Pack',
  'ABBONAMENTO LBA 2025/26 7eventi', 'Abbonamento Girone di Ritorno',
  'Pallacanestro Openjobmetis Varese vs Pallacanestro Virtus Bologna',
  'Pallacanestro Openjobmetis Varese - Pallacanestro Virtus Bologna',
  'Itelyum Varese vs Peristeri Betsson',
];
const row = (event, season, quantity = 1) => ({
  event, season, quantity, price: 300, abb_mp_price_gm: 20, commercial_value: 25,
  sell: 'ABB', ticket_type: 'CORP', gm: 'Bologna', Gm_Date_time: '11/10/2026 12.00',
  name: 'Test', last_name: 'Customer',
});

test('all observed complete subscriptions and future seasons are Fixed', () => {
  for (const event of [
    'ABBONAMENTO LBA 2025/26', 'ABBONAMENTO LBA 2024/25', 'ABBONAMENTO LBA 2026/27',
    ...currentSubscriptions, 'Abbonamento 2027/28', 'Abbonamento 2028/29 - Prelazione.',
    '  abbonamento lba 2025/26  ', '  ABBONAMENTO 2026/27 - PRELAZIONE..  ',
  ]) {
    assert.equal(isFixedCapacityEvent(event), true, event);
    for (const key of ['event', 'Event', 'EVENT']) {
      assert.equal(isRowFixedCapacity({ [key]: event }), true, `${key}: ${event}`);
      assert.equal(getCapacityBucket({ [key]: event }), 'fixed');
    }
  }
});

test('packs, partial subscriptions, matches and malformed names remain Flexible', () => {
  for (const event of [
    ...flexibleEvents, '', undefined, null, 123,
    'Abbonamento 2026/28', 'Abbonamento 2026/27 - Pack', 'Abbonamento',
    'Mini Abbonamento 2026/27', 'Abbonamento 2026/27 - Girone di Ritorno',
    'Match - Abbonamento 2026/27', 'Abbonamento LBA 2025/26 7eventi.',
  ]) {
    assert.equal(isFixedCapacityEvent(event), false, String(event));
    assert.equal(getCapacityBucket({ event, sell: 'ABB', ticketType: 'CORP' }), 'flexible');
  }
});

test('season and Fixed/Flexible filters compose after CSV ingestion without using purchase date', () => {
  const csv = [
    'event,season,buy_date,gm,gm_date_time,quantity,sell',
    'ABBONAMENTO LBA 2025/26,25-26,01/06/2025 12.00,Bologna,12/10/2025 12.00,2,ABB',
    'Abbonamento 2026/27 - Prelazione.,26-27,01/06/2026 12.00,Bologna,11/10/2026 12.00,3,ABB',
    'Abbonamento 2027/28,,01/06/2027 12.00,,,4,ABB',
    '3 Games Pack,26-27,01/06/2026 12.00,Bologna,11/10/2026 12.00,5,ABB',
    'Pallacanestro Openjobmetis Varese - Pallacanestro Virtus Bologna,26-27,01/06/2026 12.00,Bologna,11/10/2026 12.00,6,ABB',
  ].join('\n');
  const input = processCRMData(csv);
  const before = JSON.stringify(input);
  const prepared = prepareCRMRecords(input);
  const total = (season, bucket) => prepared
    .filter(r => r.season === season && getCapacityBucket(r) === bucket)
    .reduce((sum, r) => sum + r.quantity, 0);
  assert.equal(total('25-26', 'fixed'), 2);
  assert.equal(total('26-27', 'fixed'), 3);
  assert.equal(total('27-28', 'fixed'), 4);
  assert.equal(total('26-27', 'flexible'), 11);
  assert.equal(total('25-26', 'flexible'), 0);
  assert.equal(JSON.stringify(input), before, 'source history must not be mutated');
});

test('server breakdown, precomputed subsets and local buckets agree, including returns', () => {
  const rows = [
    row('ABBONAMENTO LBA 2025/26', '25-26', 2),
    ...currentSubscriptions.map(event => row(event, '26-27', 3)),
    row('Abbonamento 2026/27', '26-27', -1),
    row('3 Games Pack', '26-27', 4),
    row(flexibleEvents[11], '26-27', 5),
    { ...row('', '26-27', 2), Event: 'Abbonamento 2026/27.' },
  ];
  const stats = computeCRMStats(rows);
  for (const bucket of ['fixed', 'flexible']) {
    const subset = rows.filter(r => getCapacityBucket(r) === bucket);
    const precomputed = computeCRMStats(subset);
    assert.equal(stats.capacityBreakdown[bucket].tickets, precomputed.totalTickets);
    assert.equal(stats.capacityBreakdown[bucket].revenue, precomputed.totalRevenue);
    assert.equal(precomputed.totalTickets, subset.reduce((sum, r) => sum + r.quantity, 0));
  }
  assert.equal(stats.capacityBreakdown.fixed.tickets, 21);
  assert.equal(stats.capacityBreakdown.flexible.tickets, 9);
  assert.equal(stats.capacityBreakdown.fixed.tickets + stats.capacityBreakdown.flexible.tickets, stats.totalTickets);
  assert.equal(stats.capacityBreakdown.fixed.revenue + stats.capacityBreakdown.flexible.revenue, stats.totalRevenue);
  const ingested = processCRMData('event,quantity,season\n'
    + slimCRMRows(rows).map(r => `${r.event || r.Event},${r.quantity},${r.season}`).join('\n'));
  assert.deepEqual(ingested.map(getCapacityBucket), rows.map(getCapacityBucket));
});

test('historical metrics remain identical to the legacy computation', () => {
  const rows = [
    row('ABBONAMENTO LBA 2025/26', '25-26', 3),
    row('ABBONAMENTO LBA 2025/26', '25-26', -1),
    ...flexibleEvents.map(event => row(event, '25-26', 2)),
  ];
  assert.deepEqual(plain(computeCRMStats(rows)), plain(legacyStats(rows)));
  const historicalCSV = readFileSync(new URL('../src/data/crmData.csv', import.meta.url), 'utf8');
  const parsed = processCRMData(historicalCSV);
  assert.ok(parsed.length > 0);
  for (const r of parsed) assert.equal(isRowFixedCapacity(r), legacyFixed(r), r.event);
});

test('CRM and both server cache paths use the shared classifier', () => {
  const view = readFileSync(new URL('../src/components/CRMView.tsx', import.meta.url), 'utf8');
  assert.match(view, /import \{ getCapacityBucket \} from '\.\.\/utils\/crmCapacity'/);
  assert.match(view, /getCapacityBucket\(r\) === capacityView/);
  assert.match(serverSource, /import \{ isRowFixedCapacity \} from "\.\.\/src\/utils\/crmCapacity"/);
  assert.equal((serverSource.match(/\.filter\(isRowFixedCapacity\)/g) || []).length, 2);
  assert.equal((serverSource.match(/!isRowFixedCapacity\(row\)/g) || []).length, 2);
});

test('live CRM history is unchanged and observed current subscriptions are Fixed', {
  skip: process.env.CHECK_LIVE_CRM !== '1',
}, async () => {
  const { fetchCRMFromBigQuery } = await import('../src/services/bigQueryService.ts');
  const result = await fetchCRMFromBigQuery();
  assert.equal(result.success, true, result.message);
  const history = result.rawRows.filter(r => r.season === '25-26');
  assert.ok(history.length > 0);
  assert.deepEqual(plain(computeCRMStats(history)), plain(legacyStats(history)));
  const current = result.rawRows.filter(r => r.season === '26-27');
  const fixed = current.filter(isRowFixedCapacity);
  assert.ok(fixed.length > 0);
  assert.ok(currentSubscriptions.every(event => fixed.some(r => r.event === event)));
  const stats = computeCRMStats(current);
  assert.equal(stats.capacityBreakdown.fixed.tickets, computeCRMStats(fixed).totalTickets);
  assert.ok(current.filter(r => /pack/i.test(r.event)).every(r => !isRowFixedCapacity(r)));
  assert.ok(current.filter(r => /varese/i.test(r.event)).every(r => !isRowFixedCapacity(r)));
  console.log(`Live CRM: ${history.length} historical rows unchanged; ${fixed.length} current full-subscription rows recognized.`);
});