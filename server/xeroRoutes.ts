import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getSetting, setSetting } from './db.js';

const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID || '';
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET || '';
const XERO_AUTH_URL = 'https://login.xero.com/identity/connect/authorize';
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';
const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0';
const XERO_CONNECTIONS_URL = 'https://api.xero.com/connections';

const SCOPES = 'openid profile email accounting.transactions.read accounting.contacts.read offline_access';

function getRedirectUri(_req: express.Request): string {
  if (process.env.XERO_REDIRECT_URI) {
    return process.env.XERO_REDIRECT_URI;
  }
  return 'https://PVsales.replit.app/api/xero/callback';
}

function sanitizeXeroQuery(input: string): string {
  return input.replace(/["\\]/g, '').replace(/[^\w\s\-_.@&àèéìòùÀÈÉÌÒÙ]/g, '').trim().substring(0, 100);
}

function isValidDate(d: string): boolean {
  if (!d) return false;
  const parsed = new Date(d);
  return !isNaN(parsed.getTime());
}

interface XeroTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  tenant_id: string;
}

async function getStoredTokens(): Promise<XeroTokens | null> {
  const raw = await getSetting('xero_tokens');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.access_token) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function storeTokens(tokens: XeroTokens): Promise<void> {
  await setSetting('xero_tokens', JSON.stringify(tokens));
}

async function clearTokens(): Promise<void> {
  await setSetting('xero_tokens', '');
}

async function refreshAccessToken(currentTokens: XeroTokens): Promise<XeroTokens | null> {
  const resp = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentTokens.refresh_token,
    }),
  });

  if (!resp.ok) {
    console.error('Xero token refresh failed:', resp.status, await resp.text());
    return null;
  }

  const data = await resp.json() as any;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
    tenant_id: currentTokens.tenant_id,
  };
}

async function getValidToken(): Promise<{ token: string; tenantId: string } | null> {
  let tokens = await getStoredTokens();
  if (!tokens) return null;

  if (!tokens.tenant_id) {
    console.error('Xero tenant_id is empty — connection incomplete');
    return null;
  }

  if (Date.now() >= tokens.expires_at) {
    const refreshed = await refreshAccessToken(tokens);
    if (!refreshed) {
      await clearTokens();
      return null;
    }
    await storeTokens(refreshed);
    tokens = refreshed;
  }

  return { token: tokens.access_token, tenantId: tokens.tenant_id };
}

async function xeroGet(path: string, token: string, tenantId: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(`${XERO_API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const resp = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'xero-tenant-id': tenantId,
      'Accept': 'application/json',
    },
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Xero API ${resp.status}: ${errText}`);
  }

  return resp.json();
}

export function registerXeroRoutes(app: express.Application) {
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = (req as any).cookies?.pv_auth;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      (req as any).user = decoded;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid session' });
    }
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

  app.get('/api/xero/status', requireAuth, async (_req, res) => {
    try {
      const tokens = await getStoredTokens();
      if (!tokens) {
        return res.json({ connected: false });
      }
      const valid = await getValidToken();
      res.json({ connected: !!valid });
    } catch {
      res.json({ connected: false });
    }
  });

  app.get('/api/xero/authorize', requireAuth, async (req, res) => {
    if (!XERO_CLIENT_ID) {
      return res.status(500).json({ error: 'XERO_CLIENT_ID not configured' });
    }

    const state = crypto.randomBytes(24).toString('hex');
    await setSetting('xero_oauth_state', JSON.stringify({ state, created: Date.now() }));

    const redirectUri = getRedirectUri(req);
    console.log('[Xero] Authorize redirect URI:', redirectUri);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: XERO_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: SCOPES,
      state,
    });

    const authUrl = `${XERO_AUTH_URL}?${params.toString()}`;
    console.log('[Xero] Authorization URL generated, redirecting user to Xero');
    res.json({ url: authUrl });
  });

  app.get('/api/xero/callback', async (req, res) => {
    const { code, error, state } = req.query;

    let storedState = '';
    try {
      const raw = await getSetting('xero_oauth_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.created < 10 * 60 * 1000) {
          storedState = parsed.state;
        }
      }
      await setSetting('xero_oauth_state', '');
    } catch {}

    console.log('[Xero] Callback received. code:', !!code, 'error:', error || 'none', 'state match:', state === storedState);

    if (error) {
      console.error('[Xero] Callback error from Xero:', error);
      return res.redirect('/#cost-control?xero=error&msg=' + encodeURIComponent(String(error)));
    }

    if (!code) {
      return res.redirect('/#cost-control?xero=error&msg=no_code');
    }

    if (!state || !storedState || state !== storedState) {
      console.error('[Xero] State mismatch. Received:', state, 'Stored:', storedState || 'empty');
    }

    try {
      const redirectUri = getRedirectUri(req);
      console.log('[Xero] Token exchange with redirect URI:', redirectUri);
      const tokenResp = await fetch(XERO_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString('base64'),
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: String(code),
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResp.ok) {
        const errText = await tokenResp.text();
        console.error('[Xero] Token exchange failed:', tokenResp.status, errText);
        return res.redirect('/#cost-control?xero=error&msg=token_exchange_failed');
      }

      const tokenData = await tokenResp.json() as any;
      console.log('[Xero] Token exchange successful, fetching connections...');

      const connResp = await fetch(XERO_CONNECTIONS_URL, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      });

      let tenantId = '';
      if (connResp.ok) {
        const connections = await connResp.json() as any[];
        console.log('[Xero] Found', connections.length, 'connection(s)');
        if (connections.length > 0) {
          tenantId = connections[0].tenantId;
          console.log('[Xero] Using tenant:', connections[0].tenantName || tenantId);
        }
      } else {
        console.error('[Xero] Connections fetch failed:', connResp.status);
      }

      if (!tenantId) {
        console.error('[Xero] No tenant found after OAuth');
        return res.redirect('/#cost-control?xero=error&msg=no_tenant');
      }

      await storeTokens({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Date.now() + (tokenData.expires_in - 60) * 1000,
        tenant_id: tenantId,
      });

      console.log('[Xero] Connection complete! Tokens stored successfully.');
      res.redirect('/#cost-control?xero=success');
    } catch (err: any) {
      console.error('[Xero] Callback error:', err);
      res.redirect('/#cost-control?xero=error&msg=' + encodeURIComponent(err.message));
    }
  });

  app.post('/api/xero/disconnect', requireAuth, async (_req, res) => {
    try {
      await clearTokens();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/xero/search', requireAuth, async (req, res) => {
    try {
      const auth = await getValidToken();
      if (!auth) {
        return res.status(401).json({ error: 'Not connected to Xero' });
      }

      const { q, type, dateFrom, dateTo, page } = req.query;
      const searchType = String(type || 'all');
      const pageNum = Math.max(1, parseInt(String(page || '1'), 10) || 1);
      const results: any[] = [];

      const sanitizedQ = q ? sanitizeXeroQuery(String(q)) : '';

      const buildWhere = () => {
        const clauses: string[] = [];
        if (sanitizedQ) {
          clauses.push(`(Contact.Name.Contains("${sanitizedQ}") || Reference.Contains("${sanitizedQ}") || InvoiceNumber.Contains("${sanitizedQ}"))`);
        }
        if (dateFrom && isValidDate(String(dateFrom))) {
          const d = new Date(String(dateFrom));
          clauses.push(`Date >= DateTime(${d.getFullYear()}, ${d.getMonth() + 1}, ${d.getDate()})`);
        }
        if (dateTo && isValidDate(String(dateTo))) {
          const d = new Date(String(dateTo));
          clauses.push(`Date <= DateTime(${d.getFullYear()}, ${d.getMonth() + 1}, ${d.getDate()})`);
        }
        return clauses.length > 0 ? clauses.join(' && ') : undefined;
      };

      const buildPaymentWhere = () => {
        const clauses: string[] = [];
        if (dateFrom && isValidDate(String(dateFrom))) {
          const d = new Date(String(dateFrom));
          clauses.push(`Date >= DateTime(${d.getFullYear()}, ${d.getMonth() + 1}, ${d.getDate()})`);
        }
        if (dateTo && isValidDate(String(dateTo))) {
          const d = new Date(String(dateTo));
          clauses.push(`Date <= DateTime(${d.getFullYear()}, ${d.getMonth() + 1}, ${d.getDate()})`);
        }
        return clauses.length > 0 ? clauses.join(' && ') : undefined;
      };

      if (searchType === 'all' || searchType === 'invoices') {
        try {
          const params: Record<string, string> = { page: String(pageNum), order: 'Date DESC' };
          const w = buildWhere();
          if (w) params.where = w;
          const data = await xeroGet('/Invoices', auth.token, auth.tenantId, params);
          const invoices = (data.Invoices || []).map((inv: any) => ({
            id: inv.InvoiceID,
            type: inv.Type === 'ACCPAY' ? 'Bill' : 'Invoice',
            number: inv.InvoiceNumber || '',
            reference: inv.Reference || '',
            contact: inv.Contact?.Name || '',
            date: inv.Date ? inv.Date.replace('/Date(', '').replace('+0000)/', '') : '',
            dueDate: inv.DueDate ? inv.DueDate.replace('/Date(', '').replace('+0000)/', '') : '',
            status: inv.Status || '',
            total: inv.Total || 0,
            amountDue: inv.AmountDue || 0,
            amountPaid: inv.AmountPaid || 0,
            currency: inv.CurrencyCode || 'EUR',
            lineItems: (inv.LineItems || []).map((li: any) => ({
              description: li.Description || '',
              quantity: li.Quantity || 0,
              unitAmount: li.UnitAmount || 0,
              lineAmount: li.LineAmount || 0,
              accountCode: li.AccountCode || '',
              taxType: li.TaxType || '',
            })),
          }));
          results.push(...invoices);
        } catch (err: any) {
          console.error('Xero invoices fetch error:', err.message);
        }
      }

      if (searchType === 'all' || searchType === 'payments') {
        try {
          const params: Record<string, string> = { page: String(pageNum), order: 'Date DESC' };
          const w = buildPaymentWhere();
          if (w) params.where = w;
          const data = await xeroGet('/Payments', auth.token, auth.tenantId, params);
          const payments = (data.Payments || []).filter((p: any) => {
            if (!sanitizedQ) return true;
            const search = sanitizedQ.toLowerCase();
            return (p.Invoice?.Contact?.Name || '').toLowerCase().includes(search) ||
              (p.Invoice?.InvoiceNumber || '').toLowerCase().includes(search) ||
              (p.Reference || '').toLowerCase().includes(search);
          }).map((p: any) => ({
            id: p.PaymentID,
            type: 'Payment',
            number: p.Reference || '',
            reference: p.Invoice?.InvoiceNumber || '',
            contact: p.Invoice?.Contact?.Name || '',
            date: p.Date ? p.Date.replace('/Date(', '').replace('+0000)/', '') : '',
            dueDate: '',
            status: p.Status || '',
            total: p.Amount || 0,
            amountDue: 0,
            amountPaid: p.Amount || 0,
            currency: p.CurrencyCode || 'EUR',
            lineItems: [],
          }));
          results.push(...payments);
        } catch (err: any) {
          console.error('Xero payments fetch error:', err.message);
        }
      }

      results.forEach(r => {
        if (r.date && /^\d+$/.test(r.date)) {
          r.date = new Date(parseInt(r.date)).toISOString().split('T')[0];
        }
        if (r.dueDate && /^\d+$/.test(r.dueDate)) {
          r.dueDate = new Date(parseInt(r.dueDate)).toISOString().split('T')[0];
        }
      });

      results.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      res.json({ results, page: pageNum, hasMore: results.length >= 100 });
    } catch (err: any) {
      console.error('Xero search error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/xero/contacts', requireAuth, async (req, res) => {
    try {
      const auth = await getValidToken();
      if (!auth) return res.status(401).json({ error: 'Not connected' });

      const { q } = req.query;
      const params: Record<string, string> = { order: 'Name ASC' };
      if (q) {
        const sanitized = sanitizeXeroQuery(String(q));
        if (sanitized) params.where = `Name.Contains("${sanitized}")`;
      }

      const data = await xeroGet('/Contacts', auth.token, auth.tenantId, params);
      const contacts = (data.Contacts || []).slice(0, 50).map((c: any) => ({
        id: c.ContactID,
        name: c.Name,
        email: c.EmailAddress || '',
        isSupplier: c.IsSupplier || false,
        isCustomer: c.IsCustomer || false,
      }));

      res.json({ contacts });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
