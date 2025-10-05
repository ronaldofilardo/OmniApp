import { Pool } from 'pg';

const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

export interface SharingSessionDebug {
  id: string;
  token: string;
  status: string;
  expires_at: Date;
  file_ids: string[];
  created_at: Date;
}

export async function getSharingSessionsForDebug(pool: Pool): Promise<SharingSessionDebug[]> {
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