import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
import { getSponsorshipSeasonTarget } from '../src/utils/sponsorshipTargets.ts';

test('2026/27 Sponsorship goal is 2.4m while historical goals remain unchanged', () => {
  for (const season of ['26/27', '26-27', '2026-2027', '2026-27']) {
    assert.equal(getSponsorshipSeasonTarget(season), 2400000);
  }
  for (const season of ['25/26', '25-26', '24/25']) {
    assert.equal(getSponsorshipSeasonTarget(season), 2100000);
  }
});

test('Executive actual sponsorship excludes corporate tickets, GameDay and VB', () => {
  const source = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const block = source.match(/const sponsorshipStats = useMemo\([\s\S]*?\}, \[[^\]]*\]\);/);
  assert.ok(block, 'Render the actual sponsorship aggregation, not a duplicated implementation');
  const compiled = ts.transpileModule(`${block[0]}\nreturn sponsorshipStats;`, {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const aggregate = new Function('useMemo', 'sponsorData', 'selectedSeasons', compiled);
  const sponsorData = [{
    season: '26/27', sponsorReconciliation: 2000000, csrReconciliation: 100000,
    corpTixReconciliation: 500000, gamedayReconciliation: 300000,
    vbReconciliation: 200000, commercialValue: 3100000,
  }, {
    season: '25/26', sponsorReconciliation: 1500000, csrReconciliation: 50000,
    corpTixReconciliation: 700000, gamedayReconciliation: 400000,
    vbReconciliation: 300000, commercialValue: 2950000,
  }];
  assert.equal(aggregate(fn => fn(), sponsorData, ['26-27']).pureSponsorship, 2100000);
  assert.equal(aggregate(fn => fn(), sponsorData, ['25-26']).pureSponsorship, 1550000);
});

test('Sponsorship goal card uses the selected season and only Sponsorship plus CSR revenue', () => {
  const source = fs.readFileSync(new URL('../src/components/SponsorshipDashboard.tsx', import.meta.url), 'utf8');
  assert.match(source, /const seasonTarget = getSponsorshipSeasonTarget\(selectedSeason\)/);
  assert.match(source, /const pureSponsorship = totalSponsorRec \+ totalCSR/);
  const card = source.slice(source.indexOf('{/* Season Target Pacing Widget */}'), source.indexOf('{/* Sponsor Tiers & Deal Quality Section */}'));
  assert.match(card, /stats\.pureSponsorship \/ seasonTarget/);
  assert.match(card, /formatCompactCurrency\(seasonTarget\)/);
  assert.doesNotMatch(card, /stats\.(totalCommercial|adjustedCommercial|totalCorpTix|totalGameday|totalVB)/);
});
