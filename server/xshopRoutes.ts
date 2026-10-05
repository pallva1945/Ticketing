import type express from 'express';
import { authenticateUser } from './adminRoutes';
import { loadXShopData } from './xshopApi';
import { getMerchSeason, isMerchSale } from '../src/types/merchandising';

export function registerXShopRoutes(app: express.Application) {
  app.get('/api/merch/data', async (req, res) => {
    const user = authenticateUser(req);
    if (!user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    if (user.role !== 'admin' && user.accessLevel !== 'full' && !user.permissions?.includes('merchandising')) {
      res.status(403).json({ success: false, message: 'Merchandising access required' });
      return;
    }
    try {
      res.setHeader('Cache-Control', 'private, no-store');
      res.json(await loadXShopData(req.query.refresh === 'true'));
    } catch (error) {
      res.status(502).json({ success: false, message: error instanceof Error ? error.message : 'XShop data is unavailable' });
    }
  });
  app.get('/api/merch/season-revenue', async (req, res) => {
    if (!authenticateUser(req)) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    try {
      const season = typeof req.query.season === 'string' ? req.query.season.replace('-', '/') : '26/27';
      if (!/^\d{2}\/\d{2}$/.test(season)) {
        res.status(400).json({ success: false, message: 'Invalid merchandising season' });
        return;
      }
      const data = await loadXShopData(req.query.refresh === 'true');
      const orders = data.orders.filter(order => isMerchSale(order) && getMerchSeason(order.processedAt) === season);
      res.setHeader('Cache-Control', 'private, no-store');
      res.json({ success: true, source: data.source, complete: data.complete,
        revenue: Math.round(orders.reduce((sum, order) => sum + order.totalPrice - order.totalTax, 0) * 100) / 100,
        orderCount: orders.length, season, lastUpdated: data.lastUpdated, snapshotStatus: data.snapshotStatus });
    } catch (error) {
      res.status(502).json({ success: false, revenue: 0, message: error instanceof Error ? error.message : 'XShop data is unavailable' });
    }
  });
}
