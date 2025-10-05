import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sharingService from '../../src/services/sharing.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('sharing.service - behavior', () => {
  it('generateSharingSession should insert a session and return token + code', async () => {
    const pool: any = {
      query: vi.fn()
        // first call: gen_random_uuid
        .mockResolvedValueOnce({ rows: [{ token: 'uuid-1234' }] })
        // second call: insert - no rows expected
        .mockResolvedValueOnce({})
    };

    const res = await sharingService.generateSharingSession(pool, ['f1', 'f2']);
    expect(res).toBeDefined();
    expect(res.shareToken).toBe('uuid-1234');
    expect(res.accessCode).toHaveLength(6);
    expect(pool.query).toHaveBeenCalled();
  });

  it('verifySharingSession should throw when session not found', async () => {
    const pool: any = { query: vi.fn().mockResolvedValueOnce({ rows: [] }) };
    await expect(sharingService.verifySharingSession(pool, 'missing', '000000')).rejects.toThrow();
  });

  it('verifySharingSession should return access token when code matches', async () => {
    const pool: any = { query: vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: 's1', access_code_hash: 'storedHash', file_ids: ['f1'] }] })
      .mockResolvedValueOnce({})
    };
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
    vi.spyOn(jwt, 'sign').mockReturnValue('signed-token' as any);

    const token = await sharingService.verifySharingSession(pool, 'token-1', '123456');
    expect(token).toBe('signed-token');
  });

  it('getSharedFiles should return file rows decoded from token', async () => {
    vi.spyOn(jwt, 'verify').mockReturnValue({ fileIds: ['f1'] } as any);
    const pool: any = { query: vi.fn().mockResolvedValueOnce({ rows: [{ id: 'f1', file_name: 'a.pdf', file_path: 'uploads/a.pdf' }] }) };
    const rows = await sharingService.getSharedFiles(pool, 'any-token');
    expect(rows).toHaveLength(1);
    expect(pool.query).toHaveBeenCalled();
  });
});
