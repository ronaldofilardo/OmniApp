import { describe, it, expect } from 'vitest';
import detectConflicts from '../../src/services/conflicts';

// Mock minimal Pool with query method
class MockPool {
  queries: any[] = [];
  constructor(private rows: any[]) {}
  async query(query: string, params?: any[]) {
    // very naive: return configured rows for events select
    if (query.includes('FROM events')) {
      return { rows: this.rows };
    }
    // professionals address lookup
    if (query.includes('FROM professionals')) {
      return { rows: [{ address: 'Rua A, 123' }] };
    }
    return { rows: [] };
  }
}

describe('detectConflicts service', () => {
  it('returns overlap when times intersect', async () => {
    const existingEvent = [{ id: 'e1', type: 'consult', professional: 'Dr X', event_date: '2025-09-26', start_time: '10:00', end_time: '11:00' }];
    const pool = new MockPool(existingEvent) as any;
    const result = await detectConflicts(pool, 'user1', { event_date: '2025-09-26', start_time: '10:30', end_time: '11:30', professional: 'Dr X' });
  expect(result.overlapConflicts).toBeDefined();
  expect(result.overlapConflicts!.length).toBeGreaterThan(0);
  });

  it('returns no conflicts when times do not intersect and same address', async () => {
    const existingEvent = [{ id: 'e1', type: 'consult', professional: 'Dr X', event_date: '2025-09-26', start_time: '08:00', end_time: '09:00' }];
    const pool = new MockPool(existingEvent) as any;
    const result = await detectConflicts(pool, 'user1', { event_date: '2025-09-26', start_time: '10:00', end_time: '11:00', professional: 'Dr X' });
  expect(result.overlapConflicts).toBeDefined();
  expect(result.overlapConflicts!.length).toBe(0);
  });
});
