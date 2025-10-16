import { describe, it, expect, vi } from 'vitest';
import { getOrphanFiles } from '../../src/services/repository.service';

describe('repository.service.getOrphanFiles', () => {
  it('returns mapped orphan files from pool query', async () => {
    const fakeRows = [{ id: 'f1', file_name: 'a.jpg', file_type: 'Requisicao', file_path: 'uploads/a.jpg', orphaned_at: new Date() }];
    const mockPool: any = {
      query: vi.fn().mockResolvedValue({ rows: fakeRows })
    };
    const mockReq: any = {
      protocol: 'http',
      get: () => 'localhost:3333',
      user: { id: 'user1' }
    };

    const result = await getOrphanFiles(mockPool, mockReq as any);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result[0].id).toBe('f1');
    expect(result[0].url).toContain('uploads/a.jpg');
  });
});