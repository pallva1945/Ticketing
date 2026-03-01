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
  return 'https://pallva.it/api/xero/callback';
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
    console.error('[Xero] Token refresh failed:', resp.status, await resp.text());
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
    console.error('[Xero] tenant_id is empty');
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

function parseXeroDate(d: string | undefined | null): string {
  if (!d) return '';
  const match = d.match(/\/Date\((\d+)/);
  if (match) {
    return new Date(parseInt(match[1])).toISOString().split('T')[0];
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.split('T')[0];
  return d;
}

let transactionsCache: { data: any[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

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
    console.log('[Xero] Authorization URL generated');
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
      console.error('[Xero] Callback error:', error);
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

      console.log('[Xero] Connection complete! Tokens stored.');
      res.redirect('/#cost-control?xero=success');
    } catch (err: any) {
      console.error('[Xero] Callback error:', err);
      res.redirect('/#cost-control?xero=error&msg=' + encodeURIComponent(err.message));
    }
  });

  app.post('/api/xero/disconnect', requireAuth, async (_req, res) => {
    try {
      await clearTokens();
      transactionsCache = null;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/xero/transactions', requireAuth, async (_req, res) => {
    try {
      const auth = await getValidToken();
      if (!auth) {
        return res.status(401).json({ error: 'Not connected to Xero' });
      }

      if (transactionsCache && Date.now() - transactionsCache.fetchedAt < CACHE_TTL) {
        return res.json({ transactions: transactionsCache.data });
      }

      const allTransactions: any[] = [];

      let accountsMap: Record<string, { name: string; type: string }> = {};
      try {
        const acctData = await xeroGet('/Accounts', auth.token, auth.tenantId);
        for (const a of (acctData.Accounts || [])) {
          accountsMap[a.Code] = { name: a.Name || '', type: a.Type || '' };
        }
        console.log('[Xero] Loaded', Object.keys(accountsMap).length, 'accounts');
      } catch (err: any) {
        console.error('[Xero] Accounts fetch error:', err.message);
      }

      for (let page = 1; page <= 10; page++) {
        try {
          const data = await xeroGet('/Invoices', auth.token, auth.tenantId, {
            page: String(page),
            order: 'Date DESC',
            statuses: 'AUTHORISED,PAID,SUBMITTED',
          });
          const invoices = data.Invoices || [];
          if (invoices.length === 0) break;

          for (const inv of invoices) {
            const invDate = parseXeroDate(inv.Date);
            const invType = inv.Type === 'ACCPAY' ? 'Bill' : 'Invoice';
            const contact = inv.Contact?.Name || '';

            for (const li of (inv.LineItems || [])) {
              const acctCode = li.AccountCode || '';
              const acct = accountsMap[acctCode];
              allTransactions.push({
                id: `${inv.InvoiceID}-${li.LineItemID || Math.random()}`,
                date: invDate,
                category: contact || invType,
                subcategory: acct?.name || acctCode,
                detail: li.Description || `${inv.InvoiceNumber || ''}`,
                cost: li.LineAmount || 0,
                contact,
                invoiceNumber: inv.InvoiceNumber || '',
                reference: inv.Reference || '',
                status: inv.Status || '',
                type: invType,
                accountCode: acctCode,
              });
            }

            if (!inv.LineItems || inv.LineItems.length === 0) {
              allTransactions.push({
                id: inv.InvoiceID,
                date: invDate,
                category: contact || invType,
                subcategory: '',
                detail: `${inv.InvoiceNumber || ''} ${inv.Reference || ''}`.trim(),
                cost: inv.Total || 0,
                contact,
                invoiceNumber: inv.InvoiceNumber || '',
                reference: inv.Reference || '',
                status: inv.Status || '',
                type: invType,
                accountCode: '',
              });
            }
          }
        } catch (err: any) {
          console.error('[Xero] Invoices page', page, 'error:', err.message);
          break;
        }
      }

      allTransactions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      transactionsCache = { data: allTransactions, fetchedAt: Date.now() };
      console.log('[Xero] Loaded', allTransactions.length, 'transaction line items');

      res.json({ transactions: allTransactions });
    } catch (err: any) {
      console.error('[Xero] Transactions error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/xero/refresh-transactions', requireAuth, async (_req, res) => {
    transactionsCache = null;
    res.json({ success: true });
  });
}
