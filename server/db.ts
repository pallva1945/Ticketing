import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        auth_type VARCHAR(20) NOT NULL DEFAULT 'google',
        password_hash TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        access_level VARCHAR(20) NOT NULL DEFAULT 'full',
        is_external BOOLEAN NOT NULL DEFAULT false,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS user_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        page_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, page_id)
      );

      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        access_level VARCHAR(20) NOT NULL DEFAULT 'partial',
        is_temporary BOOLEAN NOT NULL DEFAULT false,
        expires_at TIMESTAMPTZ,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS invitation_pages (
        id SERIAL PRIMARY KEY,
        invitation_id INTEGER NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
        page_id VARCHAR(100) NOT NULL,
        UNIQUE(invitation_id, page_id)
      );

      CREATE TABLE IF NOT EXISTS access_requests (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        approval_token VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_at TIMESTAMPTZ
      );
    `);

    const adminEmail = 'luisscola@pallacanestrovarese.it';
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO users (email, name, auth_type, role, access_level, status)
         VALUES ($1, $2, 'google', 'admin', 'full', 'active')`,
        [adminEmail, 'Luis Scola']
      );
    } else {
      await client.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', adminEmail]);
    }

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

export async function upsertUser(email: string, name: string, picture: string, authType: string = 'google') {
  const result = await pool.query(
    `INSERT INTO users (email, name, picture, auth_type, status)
     VALUES ($1, $2, $3, $4, 'active')
     ON CONFLICT (email) DO UPDATE SET
       name = COALESCE(EXCLUDED.name, users.name),
       picture = COALESCE(EXCLUDED.picture, users.picture),
       last_login = NOW()
     RETURNING *`,
    [email, name, picture, authType]
  );
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function getUserPermissions(userId: number): Promise<string[]> {
  const result = await pool.query('SELECT page_id FROM user_permissions WHERE user_id = $1', [userId]);
  return result.rows.map(r => r.page_id);
}

export async function setUserPermissions(userId: number, pages: string[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);
    for (const page of pages) {
      await client.query('INSERT INTO user_permissions (user_id, page_id) VALUES ($1, $2)', [userId, page]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getAllUsers() {
  const result = await pool.query(`
    SELECT u.*, 
      COALESCE(
        (SELECT json_agg(page_id) FROM user_permissions WHERE user_id = u.id),
        '[]'::json
      ) as allowed_pages
    FROM users u
    ORDER BY u.role DESC, u.created_at ASC
  `);
  return result.rows;
}

export async function updateUserAccess(userId: number, accessLevel: string, expiresAt: string | null) {
  await pool.query(
    'UPDATE users SET access_level = $1, expires_at = $2 WHERE id = $3',
    [accessLevel, expiresAt, userId]
  );
}

export async function revokeUser(userId: number) {
  await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['revoked', userId]);
}

export async function restoreUser(userId: number) {
  await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['active', userId]);
}

export async function deleteUser(userId: number) {
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

export async function createInvitation(
  email: string,
  token: string,
  accessLevel: string,
  isTemporary: boolean,
  expiresAt: string | null,
  pages: string[],
  createdBy: number
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inv = await client.query(
      `INSERT INTO invitations (email, token, access_level, is_temporary, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [email, token, accessLevel, isTemporary, expiresAt, createdBy]
    );
    const invId = inv.rows[0].id;
    for (const page of pages) {
      await client.query('INSERT INTO invitation_pages (invitation_id, page_id) VALUES ($1, $2)', [invId, page]);
    }
    await client.query('COMMIT');
    return inv.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getInvitationByToken(token: string) {
  const result = await pool.query(
    `SELECT i.*, 
      COALESCE(
        (SELECT json_agg(page_id) FROM invitation_pages WHERE invitation_id = i.id),
        '[]'::json
      ) as pages
    FROM invitations i WHERE i.token = $1`,
    [token]
  );
  return result.rows[0] || null;
}

export async function getAllInvitations() {
  const result = await pool.query(
    `SELECT i.*, 
      COALESCE(
        (SELECT json_agg(page_id) FROM invitation_pages WHERE invitation_id = i.id),
        '[]'::json
      ) as pages
    FROM invitations i ORDER BY i.created_at DESC`
  );
  return result.rows;
}

export async function revokeInvitation(invId: number) {
  await pool.query('UPDATE invitations SET status = $1 WHERE id = $2', ['revoked', invId]);
}

export async function acceptInvitation(token: string) {
  await pool.query('UPDATE invitations SET status = $1 WHERE token = $2', ['accepted', token]);
}

export async function getUserByEmailWithPassword(email: string) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1 AND auth_type = $2', [email, 'password']);
  return result.rows[0] || null;
}

export async function createAccessRequest(email: string, name: string, picture: string, approvalToken: string) {
  const existing = await pool.query('SELECT * FROM access_requests WHERE email = $1 AND status = $2', [email, 'pending']);
  if (existing.rows.length > 0) {
    await pool.query('UPDATE access_requests SET name = COALESCE($1, name), picture = COALESCE($2, picture) WHERE id = $3', [name, picture, existing.rows[0].id]);
    return existing.rows[0];
  }
  const result = await pool.query(
    `INSERT INTO access_requests (email, name, picture, approval_token)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [email, name, picture, approvalToken]
  );
  return result.rows[0];
}

export async function getAccessRequestByToken(token: string) {
  const result = await pool.query('SELECT * FROM access_requests WHERE approval_token = $1', [token]);
  return result.rows[0] || null;
}

export async function getAccessRequestByEmail(email: string) {
  const result = await pool.query('SELECT * FROM access_requests WHERE email = $1 ORDER BY created_at DESC LIMIT 1', [email]);
  return result.rows[0] || null;
}

export async function getAllAccessRequests() {
  const result = await pool.query('SELECT * FROM access_requests ORDER BY created_at DESC');
  return result.rows;
}

export async function updateAccessRequestStatus(id: number, status: string) {
  await pool.query('UPDATE access_requests SET status = $1, reviewed_at = NOW() WHERE id = $2', [status, id]);
}

export { pool };
