import { PrismaClient } from '@prisma/client';
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

export async function getOrphanFiles(prisma: PrismaClient, userId: string, req: any): Promise<OrphanFile[]> {
  // Development helper: when REPO_DEV_SHOW_ALL_ORPHANS is set, return all orphan files
  const showAll = process.env.REPO_DEV_SHOW_ALL_ORPHANS === 'true';

  // Using Prisma raw query since we need raw SQL for this complex query
  const result = showAll
    ? await prisma.$queryRaw`SELECT id, file_name, file_type, file_path, file_content, mime_type, orphaned_at, user_id FROM event_files WHERE is_orphan = true ORDER BY orphaned_at DESC`
    : await prisma.$queryRaw`SELECT id, file_name, file_type, file_path, file_content, mime_type, orphaned_at FROM event_files WHERE user_id = ${userId} AND is_orphan = true ORDER BY orphaned_at DESC`;

  return (result as any[]).map((file: any) => {
    let url = null;
    // Prefer filesystem path if present
    if (file.file_path && req && req.get) {
      url = `${req.protocol}://${req.get('host')}/${file.file_path.replace(/\\/g, '/')}`;
    } else if (file.file_content && file.mime_type) {
      // If file content is stored as base64 in DB, expose as data URL for frontend
      url = `data:${file.mime_type};base64,${file.file_content}`;
    }

    return {
      ...file,
      url
    };
  });
}

export async function getRepositoryEvents(prisma: PrismaClient, userId: string): Promise<RepositoryEvent[]> {
  const result = await prisma.$queryRaw`SELECT id, type, professional, event_date, start_time, end_time, notes, created_at, deleted_at FROM events WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return result as RepositoryEvent[];
}

export async function confirmDeleteEvent(prisma: PrismaClient, eventId: string, userId: string): Promise<{ message: string }> {
  // Using transaction
  return await prisma.$transaction(async (tx) => {
    // Buscar arquivos associados
    const files = await tx.event_files.findMany({
      where: { event_id: eventId },
      select: { id: true, file_path: true }
    });

    // Deletar registros de arquivos
    await tx.event_files.deleteMany({
      where: { event_id: eventId }
    });

    // Deletar o evento definitivamente
    const deleteEvent = await tx.events.deleteMany({
      where: { id: eventId, user_id: userId }
    });

    if (deleteEvent.count === 0) {
      throw new Error('Evento não encontrado ou já removido.');
    }

    // Remover arquivos do disco (simplified - would need fs operations)
    // This would require additional implementation for file system operations

    return { message: 'Evento e arquivos removidos permanentemente.' };
  });
}

export async function restoreEvent(prisma: PrismaClient, eventId: string, userId: string): Promise<{ message: string; event: any }> {
  const result = await prisma.events.updateMany({
    where: { id: eventId, user_id: userId },
    data: { deleted_at: null }
  });

  if (result.count === 0) {
    throw new Error('Evento não encontrado ou não pertence ao usuário.');
  }

  const event = await prisma.events.findUnique({
    where: { id: eventId }
  });

  return {
    message: 'Evento restaurado com sucesso.',
    event
  };
}