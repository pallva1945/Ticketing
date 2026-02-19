import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  getAllUsers, getUserByEmail, upsertUser, setUserPermissions,
  updateUserAccess, revokeUser, restoreUser, deleteUser,
  createInvitation, getAllInvitations, revokeInvitation,
  getInvitationByToken, acceptInvitation, getUserPermissions,
  getUserByEmailWithPassword,
  getAccessRequestByToken, getAllAccessRequests, updateAccessRequestStatus
} from './db.js';

const ADMIN_EMAIL = 'luisscola@pallacanestrovarese.it';

const ALL_PAGES = [
  'hub', 'revenue', 'cost', 'pnl',
  'home', 'ticketing', 'gameday', 'sponsorship',
  'merchandising', 'venue_ops', 'bops', 'sg'
];

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return secret;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function authenticateAdmin(req: express.Request, res: express.Response): any | null {
  const token = req.cookies?.pv_auth;
  if (!token) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return null;
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (decoded.email !== ADMIN_EMAIL) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return null;
    }
    return decoded;
  } catch {
    res.status(401).json({ success: false, message: 'Invalid session' });
    return null;
  }
}

function authenticateUser(req: express.Request): any | null {
  const token = req.cookies?.pv_auth;
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret()) as any;
  } catch {
    return null;
  }
}

export function registerAdminRoutes(app: express.Application) {
  app.get('/api/admin/users', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    try {
      const users = await getAllUsers();
      res.json({ success: true, users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/admin/users/internal', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    try {
      const { email, accessLevel, pages } = req.body;
      if (!email || !email.endsWith('@pallacanestrovarese.it')) {
        return res.status(400).json({ success: false, message: 'Must be a @pallacanestrovarese.it email' });
      }
      const user = await upsertUser(email.toLowerCase(), '', '', 'google');
      await updateUserAccess(user.id, accessLevel || 'full', null);
      if (accessLevel === 'partial' && pages?.length) {
        await setUserPermissions(user.id, pages);
      } else if (accessLevel === 'full') {
        await setUserPermissions(user.id, ALL_PAGES);
      }
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put('/api/admin/users/:id/access', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    try {
      const userId = parseInt(req.params.id);
      const { accessLevel, pages, expiresAt } = req.body;
      await updateUserAccess(userId, accessLevel, expiresAt || null);
      if (accessLevel === 'partial' && pages?.length) {
        await setUserPermissions(userId, pages);
      } else if (accessLevel === 'full') {
        await setUserPermissions(userId, ALL_PAGES);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/admin/users/:id/revoke', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    try {
      const userId = parseInt(req.params.id);
      await revokeUser(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/admin/users/:id/restore', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    try {
      const userId = parseInt(req.params.id);
      await restoreUser(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/admin/users/:id', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    try {
      const userId = parseInt(req.params.id);
      await deleteUser(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/admin/invite', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    try {
      const { email, accessLevel, pages, isTemporary, expiresAt } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const admin = await getUserByEmail(ADMIN_EMAIL);

      const selectedPages = accessLevel === 'full' ? ALL_PAGES : (pages || []);

      const invitation = await createInvitation(
        email.toLowerCase(),
        token,
        accessLevel || 'partial',
        isTemporary || false,
        expiresAt || null,
        selectedPages,
        admin?.id
      );

      const baseUrl = req.headers.origin || `https://${req.headers.host}`;
      const inviteLink = `${baseUrl}/#invite/${token}`;

      res.json({ success: true, invitation, inviteLink });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/admin/invitations', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    try {
      const invitations = await getAllInvitations();
      res.json({ success: true, invitations });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/admin/invitations/:id/revoke', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    try {
      await revokeInvitation(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/invite/:token', async (req, res) => {
    try {
      const invitation = await getInvitationByToken(req.params.token);
      if (!invitation) {
        return res.status(404).json({ success: false, message: 'Invitation not found' });
      }
      if (invitation.status === 'revoked') {
        return res.status(410).json({ success: false, message: 'This invitation has been revoked' });
      }
      if (invitation.status === 'accepted') {
        return res.status(410).json({ success: false, message: 'This invitation has already been used' });
      }
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        return res.status(410).json({ success: false, message: 'This invitation has expired' });
      }
      res.json({
        success: true,
        email: invitation.email,
        accessLevel: invitation.access_level,
        pages: invitation.pages
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/invite/:token/accept', async (req, res) => {
    try {
      const { password, name } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      const invitation = await getInvitationByToken(req.params.token);
      if (!invitation || invitation.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Invalid or expired invitation' });
      }
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        return res.status(410).json({ success: false, message: 'This invitation has expired' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await upsertUser(invitation.email, name || invitation.email, '', 'password');

      const { pool } = await import('./db.js');
      await pool.query(
        'UPDATE users SET password_hash = $1, is_external = true, access_level = $2, expires_at = $3 WHERE id = $4',
        [passwordHash, invitation.access_level, invitation.is_temporary ? invitation.expires_at : null, user.id]
      );

      const pages = invitation.pages || [];
      if (pages.length > 0) {
        await setUserPermissions(user.id, pages);
      }

      await acceptInvitation(req.params.token);

      const permissions = await getUserPermissions(user.id);
      const sessionToken = jwt.sign(
        { email: user.email, name: name || user.email, picture: '', userId: user.id, role: 'user', accessLevel: invitation.access_level, permissions },
        getJwtSecret(),
        { expiresIn: '7d' }
      );

      res.cookie('pv_auth', sessionToken, {
        httpOnly: true,
        secure: isProduction(),
        sameSite: isProduction() ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.json({ success: true, email: user.email, name: name || user.email });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/auth/password', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const user = await getUserByEmailWithPassword(email.toLowerCase());
      if (!user || !user.password_hash) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (user.status === 'revoked') {
        return res.status(403).json({ success: false, message: 'Your access has been revoked' });
      }

      if (user.expires_at && new Date(user.expires_at) < new Date()) {
        return res.status(403).json({ success: false, message: 'Your access has expired' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const { pool } = await import('./db.js');
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

      const permissions = await getUserPermissions(user.id);
      const sessionToken = jwt.sign(
        { email: user.email, name: user.name || user.email, picture: user.picture || '', userId: user.id, role: user.role, accessLevel: user.access_level, permissions },
        getJwtSecret(),
        { expiresIn: '7d' }
      );

      res.cookie('pv_auth', sessionToken, {
        httpOnly: true,
        secure: isProduction(),
        sameSite: isProduction() ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.json({ success: true, email: user.email, name: user.name || user.email });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/auth/permissions', (req, res) => {
    const decoded = authenticateUser(req);
    if (!decoded) {
      return res.status(401).json({ success: false });
    }
    res.json({
      success: true,
      role: decoded.role || 'user',
      accessLevel: decoded.accessLevel || 'full',
      permissions: decoded.permissions || [],
      isAdmin: decoded.email === ADMIN_EMAIL
    });
  });

  app.get('/api/admin/access-requests', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    try {
      const requests = await getAllAccessRequests();
      res.json({ success: true, requests });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/approve/:token', async (req, res) => {
    try {
      const request = await getAccessRequestByToken(req.params.token);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Access request not found' });
      }
      if (request.status !== 'pending') {
        return res.status(410).json({ success: false, message: `This request has already been ${request.status}` });
      }
      res.json({
        success: true,
        email: request.email,
        name: request.name,
        picture: request.picture,
        createdAt: request.created_at
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/approve/:token', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    try {
      const request = await getAccessRequestByToken(req.params.token);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Access request not found' });
      }
      if (request.status !== 'pending') {
        return res.status(410).json({ success: false, message: `This request has already been ${request.status}` });
      }

      const { accessLevel, pages } = req.body;
      const selectedPages = accessLevel === 'full' ? ALL_PAGES : (pages || ['hub']);

      const user = await upsertUser(request.email, request.name || request.email, request.picture || '', 'google');
      await updateUserAccess(user.id, accessLevel || 'full', null);
      await setUserPermissions(user.id, selectedPages);

      await updateAccessRequestStatus(request.id, 'approved');

      res.json({ success: true, message: `Access granted to ${request.email}` });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/approve/:token/deny', async (req, res) => {
    if (!authenticateAdmin(req, res)) return;
    try {
      const request = await getAccessRequestByToken(req.params.token);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Access request not found' });
      }
      if (request.status !== 'pending') {
        return res.status(410).json({ success: false, message: `This request has already been ${request.status}` });
      }
      await updateAccessRequestStatus(request.id, 'denied');
      res.json({ success: true, message: `Access denied for ${request.email}` });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
}
