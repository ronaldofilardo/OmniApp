import { Pool } from 'pg';

export type DetectConflictsArgs = {
  event_date: string;
  start_time: string;
  end_time: string;
  professional: string;
  excludeId?: string | null;
};

export async function detectConflicts(pool: Pool, userId: string, { event_date, start_time, end_time, professional, excludeId }: DetectConflictsArgs) {
  const buildMillis = (dateStr: string, timeStr: string) => {
    try {
      const datePart = dateStr.includes('T') ? dateStr.substring(0,10) : dateStr;
      return Date.parse(`${datePart}T${timeStr}`);
    } catch { return NaN; }
  };
  const newStart = buildMillis(event_date, start_time);
  const newEnd = buildMillis(event_date, end_time);
  if (isNaN(newStart) || isNaN(newEnd) || newEnd <= newStart) {
    return { error: 'invalid_datetime' };
  }

  const params: any[] = [userId];
  let q = 'SELECT id, type, professional, event_date, start_time, end_time FROM events WHERE user_id = $1 AND deleted_at IS NULL';
  if (excludeId) {
    q += ' AND id <> $2';
    params.push(excludeId);
  }
  const existingRes = await pool.query(q, params);
  const existing = existingRes.rows || [];

  const getAddress = async (profName: string) => {
    try {
      const r = await pool.query('SELECT address FROM professionals WHERE user_id = $1 AND name = $2 LIMIT 1', [userId, profName]);
      return r.rows[0]?.address || null;
    } catch { return null; }
  };

  const overlapConflicts: any[] = [];
  const travelConflicts: any[] = [];
  // Caller decides TRAVEL_GAP_MS via environment/config; keep logic independent
  // We'll default to 60 minutes if not provided by caller
  const GAP_MS = 60 * 60 * 1000;

  for (const ev of existing) {
    const evStart = (function() {
      try {
        const evDate = ev.event_date;
        let dpart: string | null = null;
        if (!evDate) return NaN;
        if (typeof evDate === 'string') {
          dpart = evDate.includes('T') ? evDate.substring(0,10) : evDate;
        } else if (evDate instanceof Date) {
          dpart = evDate.toISOString().substring(0,10);
        } else if (evDate && typeof evDate.toISOString === 'function') {
          dpart = evDate.toISOString().substring(0,10);
        } else {
          dpart = String(evDate).split('T')[0];
        }
        const startTime = String(ev.start_time || '').substring(0,5);
        if (!dpart || !startTime) return NaN;
        return Date.parse(`${dpart}T${startTime}`);
      } catch { return NaN; }
    })();
    const evEnd = (function() {
      try {
        const evDate = ev.event_date;
        let dpart: string | null = null;
        if (!evDate) return NaN;
        if (typeof evDate === 'string') {
          dpart = evDate.includes('T') ? evDate.substring(0,10) : evDate;
        } else if (evDate instanceof Date) {
          dpart = evDate.toISOString().substring(0,10);
        } else if (evDate && typeof evDate.toISOString === 'function') {
          dpart = evDate.toISOString().substring(0,10);
        } else {
          dpart = String(evDate).split('T')[0];
        }
        const endTime = String(ev.end_time || '').substring(0,5);
        if (!dpart || !endTime) return NaN;
        return Date.parse(`${dpart}T${endTime}`);
      } catch { return NaN; }
    })();
    if (isNaN(evStart) || isNaN(evEnd)) continue;

    if (newStart < evEnd && newEnd > evStart) {
      overlapConflicts.push({ id: ev.id, type: ev.type, professional: ev.professional, event_date: ev.event_date, start_time: ev.start_time, end_time: ev.end_time });
      continue;
    }

    const [addrA, addrB] = await Promise.all([getAddress(professional), getAddress(ev.professional)]);
    const normalizeAddr = (s: any) => {
      try {
        if (s === null || s === undefined) return '';
        return String(s).trim().toLowerCase();
      } catch { return ''; }
    };
    const na = normalizeAddr(addrA);
    const nb = normalizeAddr(addrB);
    const differentAddress = (na === '' || nb === '') ? true : (na !== nb);
    if (differentAddress) {
      const gapBefore = newStart >= (evEnd + GAP_MS);
      const gapAfter = newEnd <= (evStart - GAP_MS);
      if (!(gapBefore || gapAfter)) {
        travelConflicts.push({ id: ev.id, type: ev.type, professional: ev.professional, event_date: ev.event_date, start_time: ev.start_time, end_time: ev.end_time, address: addrB });
      }
    }
  }

  return { overlapConflicts, travelConflicts };
}

export default detectConflicts;
