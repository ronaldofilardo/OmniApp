import { Pool } from 'pg';
import archiver from 'archiver';
import fs from 'fs';

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface BackupData {
  exportedAt: string;
  events: any[];
  professionals: any[];
}

export async function generateDataBackup(pool: Pool, includeDeleted: boolean = false): Promise<BackupData> {
  const client = await pool.connect();
  try {
    const eventsQuery = includeDeleted
      ? 'SELECT * FROM events WHERE user_id = $1'
      : 'SELECT * FROM events WHERE user_id = $1 AND deleted_at IS NULL';
    const eventsResult = await client.query(eventsQuery, [MOCK_USER_ID]);

    const professionalsQuery = includeDeleted
      ? 'SELECT * FROM professionals WHERE user_id = $1'
      : 'SELECT * FROM professionals WHERE user_id = $1 AND deleted_at IS NULL';
    const professionalsResult = await client.query(professionalsQuery, [MOCK_USER_ID]);

    return {
      exportedAt: new Date().toISOString(),
      events: eventsResult.rows,
      professionals: professionalsResult.rows
    };
  } finally {
    client.release();
  }
}

export async function generateFilesBackup(pool: Pool, fileTypes: string[], res: any): Promise<void> {
  const query = `SELECT file_path, file_name FROM event_files WHERE user_id = $1 AND file_type = ANY($2::text[])`;
  const result = await pool.query(query, [MOCK_USER_ID, fileTypes]);

  if (result.rows.length === 0) {
    throw new Error('Nenhum arquivo encontrado para os tipos selecionados.');
  }

  const archive = archiver('zip', { zlib: { level: 9 } });
  const zipFileName = `omni-saude-arquivos-${new Date().toISOString().split('T')[0]}.zip`;
  res.attachment(zipFileName);
  archive.pipe(res);

  for (const file of result.rows) {
    if (fs.existsSync(file.file_path)) {
      archive.file(file.file_path, { name: file.file_name });
    }
  }

  await archive.finalize();
}