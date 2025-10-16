import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import detectConflicts from '../services/conflicts';
import config from '../config';
import logger from '../logger';
import bcrypt from 'bcryptjs';

const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
const TRAVEL_GAP_ENABLED = config.travelGap.enabled;
const TRAVEL_GAP_MINUTES = config.travelGap.minutes;

// Funções utilitárias
function buildMillis(dateStr: string, timeStr: string) {
  try {
    const datePart = dateStr.includes('T') ? dateStr.substring(0, 10) : dateStr;
    return Date.parse(`${datePart}T${timeStr}`);
  } catch {
    return NaN;
  }
}

function padTime(t?: string) {
  return t && t.length === 5 ? t : (t ? t.padEnd(5, '0') : t);
}

function fixIsoDate(str?: string) {
  if (!str) return str;
  const idxT = str.indexOf('T');
  if (idxT !== -1) return str.substring(0, idxT) + 'T00:00:00.000Z';
  return str.substring(0, 10) + 'T00:00:00.000Z';
}

function fixIsoTime(str?: string) {
  if (!str) return str;
  let idx = str.indexOf('.000Z');
  if (idx !== -1) str = str.substring(0, idx + 5);
  str = str.replace(/:(\d{2})\.000Z$/, '.000Z');
  const match = str.match(/^1970-01-01T\d{2}:\d{2}:\d{2}\.000Z$/);
  if (match) return match[0];
  return '1970-01-01T' + str.substring(11, 16) + ':00.000Z';
}

export async function getTimeline(pool: Pool, prisma: PrismaClient, startDate: string, endDate: string, user_id?: string) {
  const EFFECTIVE_USER_ID = user_id || MOCK_USER_ID;
  // Lógica de getTimeline
  const client = await pool.connect();
  try {
  const eventsResult = await client.query('SELECT * FROM events WHERE user_id = $1 AND deleted_at IS NULL', [EFFECTIVE_USER_ID]);
    const eventMasters = eventsResult.rows;

    const timelineItems: any[] = [];

    for (const event of eventMasters) {
      const eventDate = event.event_date ? new Date(event.event_date) : null;
      if (eventDate && eventDate >= new Date(startDate) && eventDate <= new Date(endDate)) {
        const dateIso = eventDate.toISOString();
        timelineItems.push({
          ...event,
          event_date: dateIso.substring(0, 10),
          item_type: 'event',
          date: dateIso,
        });
      }
    }

    const reminders = await prisma.reminders.findMany({
      where: {
        user_id: EFFECTIVE_USER_ID,
        due_date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });
    reminders.forEach((reminder: any) => {
      const baseDate = reminder.due_date || reminder.related_event_id ? reminder.due_date : reminder.created_at || new Date();
      const dateIso = baseDate ? new Date(baseDate).toISOString() : new Date().toISOString();
      timelineItems.push({
        ...reminder,
        item_type: 'reminder',
        date: dateIso,
      });
    });

    timelineItems.sort((a, b) =>
      new Date(a.date || a.occurrence_timestamp || a.due_date).getTime() - new Date(b.date || b.occurrence_timestamp || b.due_date).getTime()
    );

    return timelineItems;
  } finally {
    client.release();
  }
}

export async function checkConflicts(pool: Pool, event_date: string, start_time: string, end_time: string, professional: string, excludeId?: string, user_id?: string) {
  const EFFECTIVE_USER_ID = user_id || MOCK_USER_ID;
  return await detectConflicts(pool, EFFECTIVE_USER_ID, { event_date, start_time, end_time, professional, excludeId });
}

export async function createEvent(
  pool: Pool,
  prisma: PrismaClient,
  eventData: any,
  override_travel_conflict: boolean = false,
  user_id?: string,
) {
  const EFFECTIVE_USER_ID = user_id || MOCK_USER_ID;
  const { type, professional, event_date, start_time, end_time, notes, treatment_total_doses, treatment_alert_threshold, stock_quantity, schedule_return_reminder = false } = eventData;

  const today = new Date();
  const eventDateObj = event_date ? new Date(event_date + 'T00:00:00') : null;
  const isPastEvent = eventDateObj && eventDateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (!isPastEvent) {
    const newStart = buildMillis(event_date, start_time);
    const newEnd = buildMillis(event_date, end_time);
    if (isNaN(newStart) || isNaN(newEnd) || newEnd <= newStart) {
      throw new Error('Datas/horários inválidos.');
    }

    const conflictsResult = await detectConflicts(pool, EFFECTIVE_USER_ID, { event_date, start_time, end_time, professional });
    if (conflictsResult.error === 'invalid_datetime') {
      throw new Error('Datas/horários inválidos.');
    }
    const { overlapConflicts, travelConflicts } = conflictsResult;
    if (overlapConflicts && overlapConflicts.length > 0) {
      throw { conflictType: 'overlap', conflicts: overlapConflicts, message: 'Existe sobreposição de horários com outro(s) evento(s).' };
    }
    if (travelConflicts && travelConflicts.length > 0 && TRAVEL_GAP_ENABLED) {
      if (!override_travel_conflict) {
        throw { conflictType: 'travel_gap', conflicts: travelConflicts, message: `Conflito de deslocamento detectado (menos de ${TRAVEL_GAP_MINUTES} minutos).` };
      }
      try {
        await pool.query(`INSERT INTO event_conflict_overrides (user_id, event_id, overridden_conflicts) VALUES ($1, $2, $3)`, [EFFECTIVE_USER_ID, null, JSON.stringify(travelConflicts)]);
      } catch (err) {
        logger.warn({ err }, 'Failed to persist override audit');
      }
      logger.info({ user: EFFECTIVE_USER_ID, conflicts: (travelConflicts || []).map((c: any) => c.id) }, 'Override de conflito de deslocamento aceito');
    }
  }

  const eventDataForPrisma: any = {
    user_id: EFFECTIVE_USER_ID,
    type,
    professional,
    event_date: event_date ? `${event_date}T00:00:00.000Z` : undefined,
    start_time: start_time ? `1970-01-01T${padTime(start_time)}:00.000Z` : undefined,
    end_time: end_time ? `1970-01-01T${padTime(end_time)}:00.000Z` : undefined,
    notes,
    instructions: eventData.instructions || null,
    schedule_return_reminder,
  };
  if (treatment_total_doses !== undefined) eventDataForPrisma.treatment_total_doses = treatment_total_doses || null;
  if (treatment_alert_threshold !== undefined) eventDataForPrisma.treatment_alert_threshold = treatment_alert_threshold || null;
  if (stock_quantity !== undefined) eventDataForPrisma.stock_quantity = stock_quantity || null;

  const newEvent = await prisma.events.create({ data: eventDataForPrisma });
  return newEvent;
}

export async function getEvents(prisma: PrismaClient, user_id?: string) {
  const EFFECTIVE_USER_ID = user_id || MOCK_USER_ID;
  return await prisma.events.findMany({
    where: { user_id: EFFECTIVE_USER_ID, deleted_at: null },
    orderBy: { created_at: 'desc' }
  });
}

export async function getEventsByPeriod(pool: Pool, prisma: PrismaClient, startDate: string, endDate: string, user_id?: string) {
  const EFFECTIVE_USER_ID = user_id || MOCK_USER_ID;
  const eventMasters = await prisma.events.findMany({
    where: { user_id: EFFECTIVE_USER_ID, deleted_at: null }
  });

  const items: any[] = [];

  const professionalsList = await prisma.professionals.findMany({ where: { user_id: EFFECTIVE_USER_ID } });
  const profMap = new Map<string, any>();
  for (const p of professionalsList) {
    profMap.set(String(p.name), { address: p.address || null, contact: p.contact || null, specialty: p.specialty || null });
  }

  const normalizeTime = (t?: any) => {
    if (!t) return null;
    try {
      if (typeof t === 'string') {
        const m = t.match(/T(\d{2}:\d{2})/);
        if (m && m[1]) return m[1];
        const m2 = t.match(/(\d{2}:\d{2})/);
        if (m2 && m2[1]) return m2[1];
        return null;
      }
      if (t instanceof Date) {
        const hh = String(t.getHours()).padStart(2, '0');
        const mm = String(t.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      const s = String(t);
      const m3 = s.match(/(\d{2}:\d{2})/);
      return m3 ? m3[1] : null;
    } catch { return null; }
  };

  for (const event of eventMasters) {
    const eventDate = new Date(event.event_date);
    if (eventDate >= new Date(startDate) && eventDate <= new Date(endDate)) {
      const prof = profMap.get(String(event.professional)) || {};
      items.push({
        ...event,
        item_type: 'event',
        start_time: normalizeTime(event.start_time) || null,
        end_time: normalizeTime(event.end_time) || null,
        professional_address: prof.address || null,
        professional_contact: prof.contact || null,
        professional_specialty: prof.specialty || null,
      });
    }
  }

  items.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  return items;
}

export async function updateEvent(pool: Pool, prisma: PrismaClient, id: string, eventData: any, override_travel_conflict: boolean = false, user_id?: string) {
  const { type, professional, event_date, start_time, end_time, notes, treatment_total_doses, treatment_alert_threshold, stock_quantity, schedule_return_reminder = false } = eventData;

  const EFFECTIVE_USER_ID = user_id || MOCK_USER_ID;
  const conflictsResult = await detectConflicts(pool, EFFECTIVE_USER_ID, { event_date, start_time, end_time, professional, excludeId: id });
  if (conflictsResult.error === 'invalid_datetime') {
    throw new Error('Datas/horários inválidos.');
  }
  const { overlapConflicts, travelConflicts } = conflictsResult;
  if (overlapConflicts && overlapConflicts.length > 0) {
    throw { conflictType: 'overlap', conflicts: overlapConflicts, message: 'Existe sobreposição de horários com outro(s) evento(s).' };
  }
  if (travelConflicts && travelConflicts.length > 0 && TRAVEL_GAP_ENABLED) {
    if (!override_travel_conflict) {
      throw { conflictType: 'travel_gap', conflicts: travelConflicts, message: `Conflito de deslocamento detectado (menos de ${TRAVEL_GAP_MINUTES} minutos).` };
    }
    try {
      await pool.query(`INSERT INTO event_conflict_overrides (user_id, event_id, overridden_conflicts) VALUES ($1, $2, $3)`, [EFFECTIVE_USER_ID, id, JSON.stringify(travelConflicts)]);
    } catch (err) {
      logger.warn({ err }, 'Failed to persist override audit');
    }
    logger.info({ user: EFFECTIVE_USER_ID, conflicts: (travelConflicts || []).map((c: any) => c.id) }, 'Override de conflito de deslocamento aceito');
  }

  const eventDateISO = event_date ? `${event_date}T00:00:00.000Z` : undefined;
  const startTimeISO = start_time ? `1970-01-01T${padTime(start_time)}:00.000Z` : undefined;
  const endTimeISO = end_time ? `1970-01-01T${padTime(end_time)}:00.000Z` : undefined;

  const eventDateFinal = fixIsoDate(eventDateISO);
  const startTimeFinal = fixIsoTime(startTimeISO);
  const endTimeFinal = fixIsoTime(endTimeISO);

  const updatedEvent = await prisma.events.update({
    where: { id, user_id: EFFECTIVE_USER_ID },
    data: {
      type,
      professional,
      event_date: eventDateFinal,
      start_time: startTimeFinal,
      end_time: endTimeFinal,
      notes,
      instructions: eventData.instructions || null,
      treatment_total_doses: treatment_total_doses || null,
      treatment_alert_threshold: treatment_alert_threshold || null,
      stock_quantity: stock_quantity || null,
      schedule_return_reminder
    }
  });
  if (!updatedEvent) throw new Error('Evento não encontrado ou não pertence ao usuário.');
  return updatedEvent;
}

export async function getEventById(pool: Pool, id: string, user_id?: string) {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidV4Regex.test(id)) {
    throw new Error('ID inválido. Esperado UUID v4.');
  }
  const EFFECTIVE_USER_ID = user_id || MOCK_USER_ID;
  const result = await pool.query('SELECT * FROM events WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [id, EFFECTIVE_USER_ID]);
  if (result.rows.length === 0) throw new Error('Evento não encontrado.');
  return result.rows[0];
}

export async function deleteEvent(pool: Pool, id: string, user_id?: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const filesRes = await client.query('SELECT id, file_path FROM event_files WHERE event_id = $1', [id]);
    if (filesRes.rows.length > 0) {
      const fileIds = filesRes.rows.map((r: any) => r.id);
      try {
        await client.query('UPDATE event_files SET is_orphan = true, orphaned_at = NOW() WHERE id = ANY($1::uuid[])', [fileIds]);
      } catch (e) {
        logger.warn({ err: e }, 'Falha ao marcar arquivos como órfãos');
      }
    }

    const EFFECTIVE_USER_ID = user_id || MOCK_USER_ID;
    const updateRes = await client.query('UPDATE events SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id', [id, EFFECTIVE_USER_ID]);
    if (updateRes.rowCount === 0) {
      await client.query('ROLLBACK');
      throw new Error('Evento não encontrado ou já deletado.');
    }

    await client.query('COMMIT');
    return { message: 'Evento marcado como deletado. Arquivos foram movidos para o repositório como órfãos.' };
  } finally {
    client.release();
  }
}

export async function generateUploadCode(pool: Pool, prisma: PrismaClient, id: string, fileType: string, user_id?: string) {
  const EFFECTIVE_USER_ID = user_id || MOCK_USER_ID;
  const event = await prisma.events.findUnique({
    where: { id, user_id: EFFECTIVE_USER_ID, deleted_at: null }
  });
  if (!event) {
    throw new Error('Evento não encontrado.');
  }

  // Check if code already exists for this event and fileType
  const existing = await prisma.upload_codes.findUnique({
    where: { event_id_file_type: { event_id: id, file_type: fileType } }
  });
  if (existing && existing.status === 'active') {
    // If exists but no plain_code, overwrite with new one
    if (!existing.plain_code) {
      // Overwrite
    } else {
      throw new Error('Código já existe para este tipo de arquivo.');
    }
  }

  const uploadCode = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = await bcrypt.genSalt(10);
  const codeHash = await bcrypt.hash(uploadCode, salt);
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const upsertResult = await prisma.upload_codes.upsert({
    where: { event_id_file_type: { event_id: id, file_type: fileType } },
    update: {
      code_hash: codeHash,
      plain_code: uploadCode,
      expires_at: expiresAt,
      status: 'active'
    },
    create: {
      event_id: id,
      user_id: EFFECTIVE_USER_ID,
      file_type: fileType,
      code_hash: codeHash,
      plain_code: uploadCode,
      expires_at: expiresAt,
      status: 'active'
    }
  });
  logger.info({ eventId: id, fileType, upsertId: upsertResult?.id }, 'Upload code upserted');

  return { uploadCode, eventId: id, fileType };
}

export async function getUploadCodeForEvent(pool: Pool, prisma: PrismaClient, id: string, fileType: string) {
  // Return the plain_code if present and active
  const code = await prisma.upload_codes.findFirst({
    where: { event_id: id, file_type: fileType, status: 'active', expires_at: { gt: new Date() } }
  }) as any;
  if (!code) return null;
  // If plain_code exists return it, otherwise return null (can't recover from hash)
  return (code && code.plain_code) ? code.plain_code : null;
}

export async function getUploadCodesForEvent(pool: Pool, prisma: PrismaClient, id: string) {
  const codes = await prisma.upload_codes.findMany({
    where: { event_id: id, status: 'active', expires_at: { gt: new Date() } }
  }) as any[];
  // Map file_type -> plain_code (if available)
  const map: Record<string, string | null> = {};
  for (const c of codes) {
    map[c.file_type] = c.plain_code || null;
  }
  return map;
}