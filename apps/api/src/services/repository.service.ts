import { Pool } from 'pg';
import fs from 'fs';
import logger from '../logger';

const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

export interface OrphanFile {
  id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  orphaned_at: Date;
  url: string;
}

export interface RepositoryEvent {
  id: string;
  type: string;
  professional: string;
  event_date: string;
  start_time: string;
  end_time: string;
  notes: string;
  created_at: Date;
  deleted_at: Date | null;
}

export async function getOrphanFiles(pool: Pool, req: any): Promise<OrphanFile[]> {
  const result = await pool.query(
    'SELECT id, file_name, file_type, file_path, orphaned_at FROM event_files WHERE user_id = $1 AND is_orphan = true ORDER BY orphaned_at DESC',
    [MOCK_USER_ID]
  );

  return result.rows.map(file => ({
    ...file,
    url: `${req.protocol}://${req.get('host')}/${file.file_path.replace(/\\/g, '/')}`
  }));
}

export async function getRepositoryEvents(pool: Pool): Promise<RepositoryEvent[]> {
  const result = await pool.query(
    'SELECT id, type, professional, event_date, start_time, end_time, notes, created_at, deleted_at FROM events WHERE user_id = $1 ORDER BY created_at DESC',
    [MOCK_USER_ID]
  );

  return result.rows;
}

export async function confirmDeleteEvent(pool: Pool, eventId: string): Promise<{ message: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Buscar arquivos associados
    const filesRes = await client.query('SELECT id, file_path FROM event_files WHERE event_id = $1', [eventId]);
    const filePaths = filesRes.rows.map((r: any) => r.file_path);

    // Deletar registros de arquivos
    await client.query('DELETE FROM event_files WHERE event_id = $1', [eventId]);

    // Deletar o evento definitivamente
    const deleteEventRes = await client.query(
      'DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING id',
      [eventId, MOCK_USER_ID]
    );

    if (deleteEventRes.rowCount === 0) {
      await client.query('ROLLBACK');
      throw new Error('Evento não encontrado ou já removido.');
    }

    await client.query('COMMIT');

    // Remover arquivos do disco fora da transação
    for (const fp of filePaths) {
      try {
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      } catch (err) {
        logger.error({ err, filePath: fp }, `Falha ao remover arquivo do disco ${fp}`);
      }
    }

    return { message: 'Evento e arquivos removidos permanentemente.' };
  } finally {
    client.release();
  }
}

export async function restoreEvent(pool: Pool, eventId: string): Promise<{ message: string; event: any }> {
  const result = await pool.query(
    'UPDATE events SET deleted_at = NULL WHERE id = $1 AND user_id = $2 RETURNING *',
    [eventId, MOCK_USER_ID]
  );

  if (result.rowCount === 0) {
    throw new Error('Evento não encontrado ou não pertence ao usuário.');
  }

  return {
    message: 'Evento restaurado com sucesso.',
    event: result.rows[0]
  };
}