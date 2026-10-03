import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processSponsorData } from '../src/utils/dataProcessor.ts';
import { convertBigQueryRowsToSponsorCSV } from '../src/services/bigQueryService.ts';
import { splitSponsorGameDay, totalSponsorGameDaySplit } from '../src/utils/sponsorReconciliation.ts';

const raw = (extra = {}) => ({
  Azienda: 'Synthetic Sponsor', Season: '26/27', Commercial_Value: 30000,
  Gameday_Reconciliation: 1000, Sponsor_Reconciliation: 10000,
  European_competition_bygame: 2000, European_Competition_reconciliation: 6123,
  ...extra,
});
const parsed = (rows) => processSponsorData(convertBigQueryRowsToSponsorCSV(rows));

test('BigQuery-to-CSV ingestion retains both European fields despite header case and underscores', () => {
  const [sponsor] = parsed([raw()]);
  assert.equal(sponsor.europeanCompetitionByGame, 2000);
  assert.equal(sponsor.europeanCompetitionReconciliation, 6123);
  assert.equal(sponsor.gamedayReconciliation, 1000);
  assert.equal(sponsor.commercialValue, 30000);
});

test('direct CSV imports accept the exact new column names', () => {
  const [sponsor] = processSponsorData(
    'Company,Season,Commercial Value,European_competition_bygame,European_Competition_reconciliation\n' +
    'Synthetic Sponsor,26/27,30000,2000,6123',
  );
  assert.equal(sponsor.europeanCompetitionByGame, 2000);
  assert.equal(sponsor.europeanCompetitionReconciliation, 6123);
});

test('European Competition is separated from the existing GameDay total, never added twice', () => {
  const [sponsor] = parsed([raw()]);
  const split = splitSponsorGameDay(sponsor);
  assert.deepEqual(split, { total: 15000, lba: 8877, european: 6123 });
  assert.equal(split.lba + split.european, sponsor.gamedayReconciliation * 15);
  assert.equal(split.european, 6123, 'annual reconciliation is authoritative, not per-game times an inferred count');
});

test('base and CM allocations remain additive without changing commercial or pure sponsorship totals', () => {
  const sponsors = parsed([
    raw({ European_Competition_reconciliation: 6000 }),
    raw({ Azienda: 'Synthetic Sponsor_CM', Commercial_Value: 5000, Gameday_Reconciliation: 100,
      Sponsor_Reconciliation: 1000, European_competition_bygame: 333, European_Competition_reconciliation: 1000 }),
  ]);
  const total = totalSponsorGameDaySplit(sponsors);
  assert.deepEqual(total, { total: 16500, lba: 9500, european: 7000 });
  assert.equal(total.lba + total.european, total.total);
  assert.equal(sponsors.reduce((sum, s) => sum + s.commercialValue, 0), 35000);
  assert.equal(sponsors.reduce((sum, s) => sum + s.sponsorReconciliation, 0), 11000);
  assert.equal(total.total + sponsors.reduce((sum, s) => sum + s.sponsorReconciliation, 0), 27500);
});

test('historical CSVs and older cached records without the new fields stay entirely LBA', () => {
  const [sponsor] = processSponsorData(
    'Company,Season,Commercial Value,Gameday Reconciliation\nLegacy Sponsor,25/26,10000,200',
  );
  assert.equal(sponsor.europeanCompetitionReconciliation, 0);
  assert.deepEqual(splitSponsorGameDay(sponsor), { total: 3000, lba: 3000, european: 0 });
  assert.deepEqual(splitSponsorGameDay({ gamedayReconciliation: 200 }), { total: 3000, lba: 3000, european: 0 });
});

test('null European values and zero GameDay allocations do not fabricate allocations', () => {
  const [sponsor] = parsed([raw({ Gameday_Reconciliation: 0,
    European_competition_bygame: null, European_Competition_reconciliation: null })]);
  assert.deepEqual(splitSponsorGameDay(sponsor), { total: 0, lba: 0, european: 0 });
  assert.deepEqual(totalSponsorGameDaySplit([]), { total: 0, lba: 0, european: 0 });
});

test('invalid subset amounts are not silently clamped or used to inflate totals', () => {
  assert.deepEqual(splitSponsorGameDay({ gamedayReconciliation: 100, europeanCompetitionReconciliation: 2000 }),
    { total: 1500, lba: -500, european: 2000 });
});