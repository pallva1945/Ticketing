import { test, expect } from '@playwright/test';

// Synthetic diagnostic metadata only. No real user, shop, or storage access.
const snapshotAt = '2026-10-11T10:00:00.000Z';
const failureReasons = {
  timeout: ['XShop timed out after automatic retries.', 'XShop non ha risposto entro il tempo previsto, anche dopo i tentativi automatici.'],
  connection: ['The connection to XShop was interrupted after automatic retries.', 'La connessione a XShop è stata interrotta, anche dopo i tentativi automatici.'],
  access: ['XShop rejected API access.', 'XShop ha rifiutato l’accesso API.'],
  blocked: ['The shop’s bot protection is blocking API calls.', 'La protezione anti-bot del negozio blocca le chiamate API.'],
  temporary: ['XShop is temporarily unavailable or limiting API requests.', 'XShop è temporaneamente non disponibile o sta limitando le richieste API.'],
  response: ['XShop returned an invalid API response.', 'XShop ha restituito una risposta API non valida.'],
  pagination: ['XShop changed during download; no partial snapshot was published.', 'I dati XShop sono cambiati durante il download; nessuna copia parziale è stata pubblicata.'],
  credentials: ['XShop API credentials are not configured.', 'Le credenziali API XShop non sono configurate.'],
  persistence: ['Download completed, but the private snapshot could not be saved.', 'Download completo, ma salvataggio della copia privata non riuscito.'],
  unknown: ['A complete snapshot could not be obtained.', 'Non è stato possibile ottenere uno snapshot completo.'],
};
const row = (id, overrides = {}) => ({
  id, startedAt: '2026-10-12T08:00:00.000Z',
  finishedAt: '2026-10-12T08:03:00.000Z', outcome: 'success',
  failureCode: null, lastSuccessfulSnapshotAt: snapshotAt,
  recognizedOrderCount: 137, ...overrides,
});
const attempts = [
  row('completed'),
  ...Object.keys(failureReasons).map(code => row(code, { outcome: 'failure', failureCode: code })),
  row('unfinished', { outcome: 'unfinished', finishedAt: null, failureCode: null, recognizedOrderCount: null }),
  row('zero-orders', { recognizedOrderCount: 0 }),
];
const users = {
  admin: { isAdmin: true, accessLevel: 'partial', permissions: ['revenue'] },
  full: { isAdmin: false, accessLevel: 'full', permissions: [] },
  merchandising: { isAdmin: false, accessLevel: 'partial', permissions: ['revenue', 'merchandising'] },
  restricted: { isAdmin: false, accessLevel: 'partial', permissions: ['revenue'] },
};

async function dashboard(page, { user = 'merchandising', module = 'home', language = 'en', rows = attempts } = {}) {
  const state = { historyRequests: 0, historyStatus: 200, verifyStatus: 200, rows };
  await page.addInitScript(({ module, language }) => {
    localStorage.clear();
    localStorage.setItem('activeModule', module);
    localStorage.setItem('pv-language', language);
  }, { module, language });
  await page.clock.install();
  // Block cloud persistence and unrelated third-party calls, not static UI assets.
  await page.route(/https:\/\/(firestore|identitytoolkit|securetoken)\.googleapis\.com\/.*/, route => route.abort());
  await page.route('https://accounts.google.com/**', route => route.abort());
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let status = 200;
    let body;
    if (path === '/api/auth/verify') {
      status = state.verifyStatus;
      body = { success: status === 200, email: 'history-fixture@example.invalid', name: 'History fixture', ...users[user] };
    } else if (path === '/api/merch/refresh-history') {
      state.historyRequests++;
      status = state.historyStatus;
      body = status === 200 ? { success: true, attempts: state.rows, persistenceUnavailable: true, refreshing: true }
        : { success: false };
    } else if (path === '/api/merch/season-revenue') {
      body = {
        success: true, source: 'XShop', complete: true, revenue: 0, lastUpdated: snapshotAt,
        snapshotStatus: {
          stale: true, restored: true, refreshing: true, refreshError: 'Fixed diagnostic',
          refreshErrorCode: 'blocked', persistenceError: 'Unavailable', historyPersistenceError: true,
        },
      };
    } else {
      // Do not forward an unrecognized request to live providers.
      status = 503;
      body = { success: false, error: 'Unrelated data intentionally unavailable in history UI tests' };
    }
    await route.fulfill({ status, json: body });
  });
  await page.goto('/#revenue');
  await expect(page.getByText(language === 'it' ? 'Gestione Dati' : 'Data Management', { exact: true })).toBeVisible();
  return state;
}

const historyDetails = page => page.locator('details').filter({ has: page.locator('summary', { hasText: /XShop/ }) });
async function openHistory(page, language = 'en') {
  await page.locator('summary').filter({ hasText: language === 'it' ? 'Storico aggiornamenti XShop' : 'XShop refresh history' }).click();
  return historyDetails(page);
}

for (const language of ['en', 'it']) {
  test(`${language}: outcomes, counts, unfinished attempts and both storage warnings`, async ({ page }) => {
    const state = await dashboard(page, { language });
    expect(state.historyRequests).toBe(0);
    const notice = page.getByRole('status').filter({ hasText: 'XShop' }).first();
    await expect(notice).toContainText(language === 'en' ? 'Last saved complete snapshot' : 'Ultima copia completa salvata');
    await expect(notice).toContainText(language === 'en' ? 'Updating in the background.' : 'Aggiornamento in corso in secondo piano.');
    await expect(notice).toContainText(language === 'en' ? 'Private storage is unavailable:' : 'Archiviazione privata non disponibile:');
    await expect(notice).toContainText(language === 'en' ? 'Refresh history could not be saved or read:' : 'Storico aggiornamenti non salvato o non leggibile:');
    await expect(notice).toContainText(failureReasons.blocked[language === 'en' ? 0 : 1]);
    const history = await openHistory(page, language);
    await expect(history.locator('li')).toHaveCount(attempts.length);
    expect(state.historyRequests).toBe(1);
    await expect(history).toContainText(language === 'en' ? 'Diagnostic metadata only, no customer data or amounts.' : 'Solo metadati diagnostici, nessun dato cliente o importo.');
    await expect(history.getByRole('alert')).toContainText(language === 'en' ? 'Private history storage is unavailable:' : 'Archiviazione privata non disponibile:');
    await expect(history.locator('li').first()).toContainText(language === 'en' ? 'Completed' : 'Completato');
    await expect(history.locator('li').first()).toContainText(language === 'en' ? 'Recognized orders in snapshot' : 'Ordini riconosciuti nello snapshot');
    await expect(history.locator('li').first().locator('dd').last()).toHaveText('137');
    await expect(history.locator('li').last().locator('dd').last()).toHaveText('0');
    await expect(history.locator('li').first()).toContainText('Europe/Rome');
    for (const [index, [code, reasons]] of Object.entries(failureReasons).entries()) {
      const failed = history.locator('li').nth(index + 1);
      await expect(failed).toContainText(language === 'en' ? 'Failed' : 'Non riuscito');
      await expect(failed).toContainText(code);
      await expect(failed).toContainText(reasons[language === 'en' ? 0 : 1]);
    }
    const unfinished = history.locator('li').nth(attempts.length - 2);
    await expect(unfinished).toContainText(language === 'en' ? 'No result recorded' : 'Senza esito registrato');
    await expect(unfinished).toContainText(language === 'en' ? 'The refresh may still be active' : 'L’aggiornamento potrebbe essere ancora attivo');
    await expect(unfinished.locator('dd').nth(1)).toHaveText('—');
    await expect(unfinished.locator('dd').last()).toHaveText('—');
    await expect(unfinished.locator('.font-mono')).toHaveCount(0);
    // Changing language while open must not request another copy.
    await page.getByTitle(language === 'en' ? 'Switch to Italian' : 'Passa a Inglese', { exact: true }).click();
    await expect(history.locator('li').first()).toContainText(language === 'en' ? 'Completato' : 'Completed');
    expect(state.historyRequests).toBe(1);
  });
}

for (const user of ['admin', 'full', 'merchandising']) {
  test(`${user}: authorized merchandising dashboard can open history`, async ({ page }) => {
    const state = await dashboard(page, { user, module: 'merchandising' });
    expect(state.historyRequests).toBe(0);
    const history = await openHistory(page);
    await expect(history.locator('li')).toHaveCount(attempts.length);
    expect(state.historyRequests).toBe(1);
  });
}

for (const module of ['home', 'merchandising']) {
test(`${module}: restricted user cannot see or request history, including refresh events and polling`, async ({ page }) => {
  const state = await dashboard(page, { user: 'restricted', module });
  await expect(historyDetails(page)).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event('merchandising-refresh')));
  await page.clock.runFor(11000);
  await expect(historyDetails(page)).toHaveCount(0);
  expect(state.historyRequests).toBe(0);
});
}

for (const language of ['en', 'it']) {
for (const status of [401, 403]) {
  test(`${language} ${status}: clear already displayed history and stop automatic requests`, async ({ page }) => {
    const state = await dashboard(page, { language });
    const history = await openHistory(page, language);
    await expect(history.locator('li')).toHaveCount(attempts.length);
    state.historyStatus = status;
    await page.clock.runFor(10001);
    await expect(history.getByRole('alert')).toHaveText(status === 401
      ? (language === 'en' ? 'Your session has expired. Sign in again.' : 'Sessione scaduta. Accedi nuovamente.')
      : (language === 'en' ? 'Your account does not have access to Merchandising data.' : 'Il tuo account non ha accesso ai dati Merchandising.'));
    await expect(history.locator('li')).toHaveCount(0);
    await expect(history).not.toContainText('137');
    const requestsAtDenial = state.historyRequests;
    await page.evaluate(() => window.dispatchEvent(new Event('merchandising-refresh')));
    await page.clock.runFor(20001);
    expect(state.historyRequests).toBe(requestsAtDenial);
  });
}
}

test('temporary history failure clears stale records and recovers on the next poll', async ({ page }) => {
  const state = await dashboard(page);
  const history = await openHistory(page);
  await expect(history.locator('li')).toHaveCount(attempts.length);
  state.historyStatus = 503;
  await page.clock.runFor(10001);
  await expect(history.getByRole('alert')).toHaveText('History is unavailable. Please retry later.');
  await expect(history.locator('li')).toHaveCount(0);
  state.historyStatus = 200;
  await page.clock.runFor(10001);
  await expect(history.locator('li')).toHaveCount(attempts.length);
});

test('expired auth verification removes the signed-in dashboard and its history', async ({ page }) => {
  const state = await dashboard(page);
  await openHistory(page);
  await expect(historyDetails(page).locator('li')).toHaveCount(attempts.length);
  state.verifyStatus = 401;
  await page.clock.runFor(60001);
  await expect(page.getByText('Data Management', { exact: true })).toHaveCount(0);
  await expect(historyDetails(page)).toHaveCount(0);
  const requestsAfterExpiry = state.historyRequests;
  await page.evaluate(() => window.dispatchEvent(new Event('merchandising-refresh')));
  await page.clock.runFor(10001);
  expect(state.historyRequests).toBe(requestsAfterExpiry);
});

test('closing history cancels polling; empty history is explicit on reopen', async ({ page }) => {
  const state = await dashboard(page);
  const history = await openHistory(page);
  await expect(history.locator('li')).toHaveCount(attempts.length);
  await history.locator('summary').click();
  await expect(history.locator('li')).toHaveCount(0);
  const requestsBeforeClose = state.historyRequests;
  await page.clock.runFor(10001);
  await page.evaluate(() => window.dispatchEvent(new Event('merchandising-refresh')));
  expect(state.historyRequests).toBe(requestsBeforeClose);
  state.rows = [];
  await openHistory(page);
  await expect(history).toContainText('No attempts recorded yet.');
});
