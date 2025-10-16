import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import multer from 'multer';
import { filesRouter } from '../../src/routes/files.router';
import { createMockPrisma } from '../helpers/mocks';
import * as filesService from '../../src/services/files.service';

describe('files.router', () => {
  let app: express.Application;
  let mockPrisma: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    
    // Create mock Prisma
    mockPrisma = createMockPrisma();
    
    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Inject mock Prisma into app.locals
    app.locals.prisma = mockPrisma;

    // Mock do pool para simular query do upload_code
    app.locals.pool = {
      query: vi.fn(async (sql: string, params: any[]) => {
        // Simula busca de evento para upload_code
        if (sql.includes('SELECT upload_code_hash')) {
          if (params[0] === 'event1' && params[1] === 'a1b2c3d4-e5f6-7890-1234-567890abcdef') {
            return {
              rows: [{
                upload_code_hash: '$2a$10$hash',
                upload_code_expires_at: new Date(Date.now() + 10000),
                upload_code_status: 'active'
              }]
            };
          }
          return { rows: [] };
        }
        // Simula update do status do código
        if (sql.includes('UPDATE events SET upload_code_status')) {
          return { rowCount: 1 };
        }
        return { rows: [] };
      })
    };

    // Use only the router (rotas já aplicam upload.single internamente)
    app.use('/files', filesRouter);

    // Middleware global de tratamento de erros do multer (igual ao app real)
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (err && (err instanceof Error || err.name === 'MulterError')) {
        let message = err.message || 'Erro ao processar arquivo.';
        if (err.code === 'LIMIT_FILE_SIZE') {
          message = 'Arquivo muito grande. Máximo permitido: 2KB.';
        } else if (err.message && err.message.includes('imagem')) {
          message = 'Apenas arquivos do tipo imagem são permitidos';
        }
        return res.status(400).json({ message });
      }
      next(err);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /files/events/:eventId/files', () => {
    it('should upload file successfully', async () => {
      const fakeFile = { id: 'file1', file_name: 'test.jpg' };

      // Mock filesService.uploadFile diretamente
      vi.spyOn(filesService, 'uploadFile').mockResolvedValue(fakeFile as any);

      const response = await request(app)
        .post('/files/events/event1/files')
        .field('file_type', 'report')
        .attach('file', Buffer.from('fake file content'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(fakeFile);
      expect(filesService.uploadFile).toHaveBeenCalled();
    });

    it('should reject when no file is provided', async () => {
      const response = await request(app)
        .post('/files/events/event1/files')
        .field('file_type', 'report');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Nenhum arquivo enviado.');
    });

    it('should reject when file_type is not provided', async () => {
      const response = await request(app)
        .post('/files/events/event1/files')
        .attach('file', Buffer.from('fake file content'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined(); // mensagem de erro esperada
    });

    it('should handle upload with upload_code validation', async () => {
      const fakeFile = { id: 'file1', file_name: 'test.jpg' };

      // Mock filesService.uploadFile diretamente
      vi.spyOn(filesService, 'uploadFile').mockResolvedValue(fakeFile as any);

      // Mock bcrypt
      vi.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      const response = await request(app)
        .post('/files/events/event1/files')
        .field('file_type', 'report')
        .field('upload_code', 'validcode')
        .attach('file', Buffer.from('fake file content'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(fakeFile);
    });

    it('should reject invalid upload_code', async () => {
      // Mock bcrypt to return false
      vi.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false);

      const response = await request(app)
        .post('/files/events/event1/files')
        .field('file_type', 'report')
        .field('upload_code', 'invalidcode')
        .attach('file', Buffer.from('fake file content'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Código de envio incorreto.');
    });
  });

  describe('POST /files/upload-by-code', () => {
    it('should upload file by code successfully', async () => {
      const fakeResult = { message: 'Arquivo enviado com sucesso.' };

      // Mock filesService.uploadFileByCode diretamente
      vi.spyOn(filesService, 'uploadFileByCode').mockResolvedValue(fakeResult as any);

      const response = await request(app)
        .post('/files/upload-by-code')
        .field('upload_code', 'validcode')
        .attach('file', Buffer.from('fake image'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Arquivo enviado com sucesso.');
    });

    it('should reject non-JPG files', async () => {
      const response = await request(app)
        .post('/files/upload-by-code')
        .field('upload_code', 'validcode')
        .attach('file', Buffer.from('fake text'), { filename: 'test.txt', contentType: 'text/plain' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Apenas arquivos do tipo imagem são permitidos');
    });

    it('should reject files larger than 2KB', async () => {
      const largeBuffer = Buffer.alloc(3000, 'x'); // 3KB

      const response = await request(app)
        .post('/files/upload-by-code')
        .field('upload_code', 'validcode')
        .attach('file', largeBuffer, { filename: 'large.jpg', contentType: 'image/jpeg' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Arquivo muito grande. Máximo permitido: 2KB.');
    });
  });

  describe('GET /files/:fileId/view', () => {
    it('should return file content for valid file', async () => {
      const fakeFile = {
        id: 'file1',
        file_name: 'test.jpg',
        file_content: Buffer.from('fake image data').toString('base64'),
        mime_type: 'image/jpeg',
        user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
      };

      // Mock prisma call
      vi.spyOn(mockPrisma.event_files, 'findUnique').mockResolvedValue(fakeFile as any);

      const response = await request(app)
        .get('/files/file1/view');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['content-disposition']).toContain('test.jpg');
    });

    it('should return 404 for non-existent file', async () => {
      // Mock prisma call
      vi.spyOn(mockPrisma.event_files, 'findUnique').mockResolvedValue(null);

      const response = await request(app)
        .get('/files/nonexistent/view');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Arquivo não encontrado.');
    });
  });

  describe('DELETE /files/:fileId', () => {
    it('should delete file successfully', async () => {
      const fakeFile = {
        id: 'file1',
        file_path: null,
        user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
      };

      // Mock prisma calls
      vi.spyOn(mockPrisma.event_files, 'findUnique').mockResolvedValue(fakeFile as any);
      vi.spyOn(mockPrisma.event_files, 'delete').mockResolvedValue({} as any);

      const response = await request(app)
        .delete('/files/file1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Arquivo deletado com sucesso.');
    });
  });
});
