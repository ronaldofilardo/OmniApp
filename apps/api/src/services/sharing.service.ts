import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';
const JWT_SHARING_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-sharing';

export interface SharingSession {
  shareToken: string;
  accessCode: string;
}

export interface AccessTokenPayload {
  sessionId: string;
  fileIds: string[];
}

export async function generateSharingSession(pool: Pool, fileIds: string[]): Promise<SharingSession> {
  const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = await bcrypt.genSalt(10);
  const accessCodeHash = await bcrypt.hash(accessCode, salt);
  const sessionToken = (await pool.query('SELECT gen_random_uuid() as token')).rows[0].token;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await pool.query(
    `INSERT INTO sharing_sessions (user_id, token, access_code_hash, file_ids, expires_at) VALUES ($1, $2, $3, $4, $5)`,
    [MOCK_USER_ID, sessionToken, accessCodeHash, fileIds, expiresAt]
  );

  return { shareToken: sessionToken, accessCode };
}

export async function verifySharingSession(pool: Pool, shareToken: string, accessCode: string): Promise<string> {
  console.log('🔍 DEBUG: Buscando sessão com token:', shareToken);
  
  // Primeiro, vamos ver se existe a sessão independente do status
  const debugResult = await pool.query(
    'SELECT token, status, expires_at, access_code_hash FROM sharing_sessions WHERE token = $1',
    [shareToken]
  );
  console.log('🔍 DEBUG: Sessões encontradas:', debugResult.rows);
  
  const result = await pool.query(
    'SELECT * FROM sharing_sessions WHERE token = $1 AND status = \'pending\' AND expires_at > NOW()',
    [shareToken]
  );
  console.log('🔍 DEBUG: Sessões válidas:', result.rows.length);

  if (result.rows.length === 0) {
    throw new Error('Sessão de compartilhamento inválida ou expirada.');
  }

  const session = result.rows[0];
  const isMatch = await bcrypt.compare(accessCode, session.access_code_hash);

  if (!isMatch) {
    throw new Error('Código de acesso incorreto.');
  }

  // Mark session as active
  await pool.query('UPDATE sharing_sessions SET status = \'active\' WHERE id = $1', [session.id]);

  // Generate access token
  const accessToken = jwt.sign(
    { sessionId: session.id, fileIds: session.file_ids },
    JWT_SHARING_SECRET,
    { expiresIn: '15m' }
  );

  return accessToken;
}

export async function getSharedFiles(pool: Pool, accessToken: string): Promise<any[]> {
  console.log('🔐 DEBUG: Verificando JWT token...');
  const decoded = jwt.verify(accessToken, JWT_SHARING_SECRET) as AccessTokenPayload;
  console.log('✅ DEBUG: JWT decodificado, sessionId:', decoded.sessionId, 'fileIds:', decoded.fileIds);
  const fileIds = decoded.fileIds;

  console.log('🔍 DEBUG: Buscando arquivos no banco, IDs:', fileIds);
  const result = await pool.query(
    'SELECT id, file_name, file_path, file_content, mime_type FROM event_files WHERE id = ANY($1::uuid[])',
    [fileIds]
  );
  console.log('📄 DEBUG: Arquivos encontrados no banco:', result.rows.length);

  return result.rows;
}

export async function getSharingSessionsForDebug(pool: Pool): Promise<any[]> {
  const query = `SELECT id, token, status, expires_at, file_ids, created_at FROM sharing_sessions ORDER BY created_at DESC LIMIT 50`;
  const result = await pool.query(query);

  return result.rows.map(r => ({
    id: r.id,
    token: r.token,
    status: r.status,
    expires_at: r.expires_at,
    file_ids: r.file_ids,
    created_at: r.created_at
  }));
}