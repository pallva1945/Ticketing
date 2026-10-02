import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareCRMRecords, getCRMSeason, normalizeCRMSeason, crmGameDate } from '../src/utils/crmGames.ts';
import { processCRMData } from '../src/utils/dataProcessor.ts';

const record = (gm, season, date, gameId, quantity = 1) => ({
  gm, game: gm, season, gmDateTime: date ? new Date(`${date}T12:00:00`).getTime() : 0,
  gameId, event: '', quantity, commercialValue: quantity * 20,
});

test('Bologna and Trieste fixtures remain separate across seasons, with correct totals', () => {
  const rows = [
    record('Bologna', '25/26', '2025-10-12', 'bologna-25', 2),
    record('Bologna', '25/26', '2025-10-12', 'bologna-25', 3),
    record('Bologna', '26-27', '2026-10-11', 'bologna-26', 4),
    record('Trieste', '2025/2026', '2025-11-16', 'trieste-25', 5),
    record('Trieste', '26/27', '2026-11-15', 'trieste-26', 6),
  ];
  const prepared = prepareCRMRecords(rows);
  const totals = new Map();
  prepared.forEach(r => totals.set(r.gm, (totals.get(r.gm) || 0) + r.quantity));
  assert.equal(totals.size, 4);
  assert.deepEqual([...totals.values()], [5, 4, 5, 6]);
  assert.equal(prepared.filter(r => r.season === '26-27').reduce((sum, r) => sum + r.quantity, 0), 10);
  assert.equal(prepared.filter(r => r.season === '25-26').reduce((sum, r) => sum + r.quantity, 0), 10);
  assert.equal(rows[0].gm, 'Bologna', 'source records must not be modified');
});

test('same-season repeats and fixtures without dates are disambiguated', () => {
  const rows = prepareCRMRecords([
    record('Bologna', '26/27', '2026-10-11', '1'),
    record('Bologna', '26/27', '2027-01-10', '2'),
    record('Trieste', '26/27', '', '3'),
    record('Trieste', '26/27', '', '4'),
    record('Trieste', '26/27', '2026-11-15', '5'),
    record('Trieste', '26/27', '2026-11-15', '6'),
  ]);
  assert.equal(new Set(rows.map(r => r.gm)).size, 6);
});

test('season normalization and fallback use match dates, not purchase dates', () => {
  assert.equal(normalizeCRMSeason('2026/2027'), '26-27');
  assert.equal(getCRMSeason(record('Bologna', '', '2026-10-11', '1')), '26-27');
  assert.equal(getCRMSeason(record('Bologna', '', '2026-05-11', '1')), '25-26');
  assert.equal(getCRMSeason({ ...record('', '', '', ''), event: 'ABBONAMENTO LBA 2026/27' }), '26-27');
  assert.equal(getCRMSeason(record('Bologna', '', '', '1')), 'Unknown');
  assert.equal(getCRMSeason(record('Bologna', '#VALUE!', '2026-10-11', '1')), '26-27');
  assert.equal(getCRMSeason(record('Bologna', '#VALUE!', '', '1')), 'Unknown');
  assert.equal(crmGameDate('11/10/2026 12.00'), '2026-10-11');
});

test('CSV ingestion retains season, game ID and both Italian and ISO match dates', () => {
  const parsed = processCRMData('gm,season,game_id,gm_date_time,quantity\nBologna,25/26,b25,12/10/2025 12.00,2\nBologna,26/27,b26,2026-10-11T12:00:00,4');
  const rows = prepareCRMRecords(parsed);
  assert.equal(rows[0].season, '25-26');
  assert.equal(rows[1].season, '26-27');
  assert.equal(rows[1].gameId, 'b26');
  assert.match(rows[1].gm, /11\/10\/2026/);
  assert.notEqual(rows[0].gm, rows[1].gm);
});