import type express from 'express';
import { authenticateAdmin, authenticateUser } from './adminRoutes.js';
import { getSetting, setSetting, getUserByEmail, getUserPermissions } from './db.js';
import { getUncachableGoogleSheetClient } from './googleSheets.js';
import { normalizeBopsSheetConfig, parseBopsCostSheet } from '../src/utils/bopsCostSheet.js';

const CONFIG_KEY = 'bops_cost_sheet_config';
const DATA_KEY = 'bops_cost_sheet_snapshot';
const defaultDependencies = {
  authenticateAdmin, authenticateUser, getSetting, setSetting, getUserByEmail, getUserPermissions,
  readRows: async (config: { sheetId: string; sheetName: string }) => {
    const sheets = await getUncachableGoogleSheetClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.sheetId, range: `'${config.sheetName.replace(/'/g, "''")}'`,
    });
    return response.data.values || [];
  },
};
export function registerBopsCostRoutes(app: express.Application, overrides: Partial<typeof defaultDependencies> = {}) {
  const deps = { ...defaultDependencies, ...overrides };
  app.get('/api/costs/bops/data', async (req, res) => {
    const auth = deps.authenticateUser(req);
    if (!auth) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }
    try {
      const user = await deps.getUserByEmail(auth.email);
      if (!user || user.status !== 'active' || (user.expires_at && new Date(user.expires_at) < new Date())) {
        res.status(403).json({ success: false, message: 'Your access is not active' }); return;
      }
      if (user.access_level !== 'full' && !(await deps.getUserPermissions(user.id)).includes('cost')) {
        res.status(403).json({ success: false, message: 'Cost Center access required' }); return;
      }
      const saved = await deps.getSetting(DATA_KEY);
      res.json({ success: true, ...(saved ? JSON.parse(saved) : { data: null, updatedAt: null }) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Could not load BOps costs.' });
    }
  });
  app.get('/api/costs/bops/sheet-config', async (req, res) => {
    if (!deps.authenticateAdmin(req, res)) return;
    try {
      const saved = await deps.getSetting(CONFIG_KEY);
      res.json({ success: true, ...(saved ? JSON.parse(saved) : { sheetId: '', sheetName: '' }) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Could not load sheet configuration.' });
    }
  });
  app.post('/api/costs/bops/sheet-config', async (req, res) => {
    if (!deps.authenticateAdmin(req, res)) return;
    let config;
    try { config = normalizeBopsSheetConfig(req.body?.sheetId, req.body?.sheetName); }
    catch (error: any) { res.status(400).json({ success: false, message: error.message }); return; }
    try {
      await deps.setSetting(CONFIG_KEY, JSON.stringify(config));
      res.json({ success: true, ...config });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Could not save sheet configuration.' });
    }
  });
  app.post('/api/costs/bops/sync-sheet', async (req, res) => {
    if (!deps.authenticateAdmin(req, res)) return;
    try {
      const saved = await deps.getSetting(CONFIG_KEY);
      if (!saved) { res.status(400).json({ success: false, message: 'Configure the BOps cost sheet first.' }); return; }
      const config = JSON.parse(saved);
      const rows = await deps.readRows(config);
      let data;
      try { data = parseBopsCostSheet(rows); }
      catch (error: any) { res.status(422).json({ success: false, message: error.message }); return; }
      const snapshot = { data, updatedAt: new Date().toISOString() };
      // Validate everything before replacing the saved snapshot. A failed refresh
      // must leave the last successfully imported financial figures intact.
      await deps.setSetting(DATA_KEY, JSON.stringify(snapshot));
      res.json({ success: true, ...snapshot });
    } catch (error: any) {
      console.error('BOps cost sheet sync failed:', error.message);
      res.status(500).json({ success: false, message: 'Could not read the BOps cost sheet. Check its sharing permissions, tab name and Google Sheets connection.' });
    }
  });
}