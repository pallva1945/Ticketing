import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { formatMerchDate } from '../src/utils/merchandisingDate.ts';

test('Merchandising dates and snapshot timestamps follow the selected language', () => {
  const date = '2026-10-05T16:50:07Z';
  assert.equal(formatMerchDate(date, 'en'), '05 Oct 2026');
  assert.equal(formatMerchDate(date, 'it'), '05 ott 2026');
  assert.match(formatMerchDate(date, 'en', true), /05 Oct 2026.*18:50/);
  assert.match(formatMerchDate(date, 'it', true), /05 ott 2026.*18:50/);
  assert.equal(formatMerchDate('', 'en'), '—');
});

test('dates consistently use Europe/Rome at day boundaries', () => {
  assert.equal(formatMerchDate('2026-10-04T22:30:00Z', 'en'), '05 Oct 2026');
});

test('XShop snapshot status appears only in sidebar Data Management, never above the analytics header', () => {
  const app = fs.readFileSync('src/App.tsx', 'utf8');
  const view = fs.readFileSync('src/components/MerchandisingView.tsx', 'utf8');
  assert.equal((app.match(/<MerchSnapshotNotice/g) || []).length, 1);
  assert.match(app, /Data Management[\s\S]{0,500}<MerchSnapshotNotice compact/);
  assert.doesNotMatch(view, /<MerchSnapshotNotice|toLocaleDateString\('it-IT'/);
  assert.match(view, /formatMerchDate\(dateStr, language\)/);
});
