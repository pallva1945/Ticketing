import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const report = readFileSync(resolve(projectRoot, 'src/components/comparisonReport.ts'), 'utf8');

// Read the source of truth, rather than duplicating a list of crest names in this check.
function logoMap(name) {
  const body = report.match(new RegExp(`(?:export )?const ${name}: Record<string, string> = \\{([\\s\\S]*?)\\n\\};`))?.[1];
  assert.ok(body, `Cannot find ${name} in the report`);
  const entries = [...body.matchAll(/(?:'([^']+)'|([\p{L}]+)):\s*'([^']+)'/gu)];
  assert.ok(entries.length > 0, `No images found in ${name}`);
  assert.equal(body.replace(/(?:'[^']+'|[\p{L}]+):\s*'[^']+'/gu, '').replace(/[\s,]/g, ''), '',
    `Could not parse all references in ${name}`);
  return entries.map(([, quotedKey, plainKey, filename]) => [quotedKey || plainKey, filename]);
}

function checkLocalImage(src) {
  assert.match(src, /^\/(?:report-logos\/[a-z0-9-]+\.(?:png|jpg|svg)|favicon\.png)$/,
    `Not a local report image: ${src}`);
  const file = resolve(projectRoot, 'public', src.slice(1));
  assert.ok(statSync(file, { throwIfNoEntry: false })?.isFile(), `Missing local report image: ${src}`);
}

test('all mapped opponent and league crests and the report brand image exist locally', () => {
  for (const [name, filename] of [...logoMap('opponentLogos'), ...logoMap('leagueLogos')]) {
    assert.ok(name, 'Image must have a corresponding text label');
    checkLocalImage(`/report-logos/${filename}`);
  }
  assert.match(report, /src="\/favicon\.png" alt="[^"]+"/);
  checkLocalImage('/favicon.png');
  assert.match(report, /opponentLogos\[name\].*`\/report-logos\/\$\{opponentLogos\[name\]\}`/);
  assert.match(report, /leagueLogos\[code\].*`\/report-logos\/\$\{leagueLogos\[code\]\}`/);
});

test('PDF markup retains names when a mapped image fails or no image is mapped', () => {
  // A decorative image can disappear on load error, but its visible text must remain.
  assert.match(report, /const image = logo \? `<img class="crest" src="\$\{logo\}" alt="" onerror="this\.remove\(\)">` : '';/);
  assert.match(report, /<div class="opponent">\$\{image\}<span>\$\{escapeHtml\(name\)\}<\/span><\/div>/);
  assert.match(report, /<img class="league-logo" src="\$\{leagueLogoSrc\(leagueCode\)\}" alt="\$\{leagueCode\} league logo" onerror="this\.nextElementSibling\.hidden=false;this\.remove\(\)"><span class="league-code" hidden>\$\{escapeHtml\(leagueCode\)\}<\/span>/);
  assert.match(report, /: leagueCode \? `<span class="league-code">\$\{escapeHtml\(leagueCode\)\}<\/span>` : ''/);
});