import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as filesService from '../../src/services/files.service';
import fs from 'fs';

describe('files.service - behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploadFile should persist a file via prisma and return the created record', async () => {
    const fakePrisma: any = {
      event_files: {
        create: vi.fn().mockResolvedValue({ id: 'f1', file_name: 'file-1.pdf', file_path: 'uploads/file-1.pdf' })
      }
    };

    const fakeFile = {
      filename: 'file-1.pdf',
      mimetype: 'application/pdf',
      path: 'uploads\\file-1.pdf',
      originalname: 'original.pdf',
      size: 1234
    };

    const created = await filesService.uploadFile(fakePrisma, 'event-1', fakeFile, 'report');
    expect(created).toBeDefined();
    expect(created.id).toBe('f1');
    expect(fakePrisma.event_files.create).toHaveBeenCalledOnce();
  });

  it('getFilesForEvent should format urls and return files list', async () => {
    process.env.BASE_URL = 'http://test.example';
    const fakePrisma: any = {
      event_files: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'f1', file_name: 'a.pdf', file_type: 'pdf', file_path: 'uploads\\a.pdf' }
        ])
      }
    };

    const res = await filesService.getFilesForEvent(fakePrisma, 'event-xyz');
    expect(res).toHaveLength(1);
    expect(res[0].url).toContain('http://test.example');
    expect(res[0].file_name).toBe('a.pdf');
  });

  it('markFileAsViewed should set viewed_at when updateMany returns count 1', async () => {
    const fakePrisma: any = {
      event_files: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      }
    };
    const r = await filesService.markFileAsViewed(fakePrisma, 'file-1');
    expect(r).toEqual({ message: 'Arquivo marcado como visto.' });
  });

  it('markFileAsViewed should throw when nothing updated', async () => {
    const fakePrisma: any = {
      event_files: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 })
      }
    };
    await expect(filesService.markFileAsViewed(fakePrisma, 'file-1')).rejects.toThrow();
  });

  it('deleteFile should remove db record and attempt to unlink file', async () => {
    const fakeFileRecord = { id: 'f1', file_path: 'uploads\\to-delete.pdf', user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' };
    const fakePrisma: any = {
      event_files: {
        findUnique: vi.fn().mockResolvedValue(fakeFileRecord),
        delete: vi.fn().mockResolvedValue({})
      }
    };

    const unlinkSpy = vi.spyOn(fs, 'unlink').mockImplementation((path: any, cb: any) => { if (typeof cb === 'function') cb(null); });

    const res = await filesService.deleteFile(fakePrisma, 'f1');
    expect(res).toEqual({ message: 'Arquivo deletado com sucesso.' });
    expect(fakePrisma.event_files.delete).toHaveBeenCalledOnce();
    expect(unlinkSpy).toHaveBeenCalled();
  });

  it('deleteFile should throw when file not found or not owned', async () => {
    const fakePrisma: any = {
      event_files: {
        findUnique: vi.fn().mockResolvedValue(null)
      }
    };
    await expect(filesService.deleteFile(fakePrisma, 'missing')).rejects.toThrow();
  });
});
