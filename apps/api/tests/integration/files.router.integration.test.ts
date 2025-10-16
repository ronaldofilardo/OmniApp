import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { createApp } from '../../src/app/createApp';
import { pool } from '../../src/infra/db/pg';
import { createTestUser, createTestEvent, createTestFile } from '../helpers/database';
import { prisma } from '../setup';

const app = createApp(pool, prisma);

describe('Files Router - Integration Tests', () => {
  let testUserId: string;
  let testEventId: string;

  beforeEach(async () => {
    const user = await createTestUser(prisma);
    testUserId = user.id;
    const event = await createTestEvent(prisma, testUserId, 'Dr. Teste');
    testEventId = event.id;
  });

  describe('GET /events/:eventId/files', () => {
    it('should return files for an event', async () => {
      // Arrange
      await createTestFile(prisma, testEventId, testUserId);

      // Act
      const response = await request(app)
        .get(`/events/${testEventId}/files`)
        .expect(200);

      // Assert
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('file_name');
      expect(response.body[0]).toHaveProperty('url');
    });

    it('should return empty array when no files exist', async () => {
      // Act
      const response = await request(app)
        .get(`/events/${testEventId}/files`)
        .expect(200);

      // Assert
      expect(response.body).toHaveLength(0);
    });
  });

  describe('POST /events/:eventId/files', () => {
    it('should upload file successfully', async () => {
      // Arrange
      const fileBuffer = Buffer.from('fake image content');

      // Act
      const response = await request(app)
        .post(`/events/${testEventId}/files`)
        .field('file_type', 'LaudoResultado')
        .attach('file', fileBuffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        })
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('id');
      expect(response.body.file_name).toBe('test.jpg');
      expect(response.body.file_type).toBe('LaudoResultado');
    });

    it('should reject file without type', async () => {
      // Arrange
      const fileBuffer = Buffer.from('test content');

      // Act
      await request(app)
        .post(`/events/${testEventId}/files`)
        .attach('file', fileBuffer, 'test.pdf')
        .expect(400);
    });

    it('should reject request without file', async () => {
      // Act
      await request(app)
        .post(`/events/${testEventId}/files`)
        .field('file_type', 'LaudoResultado')
        .expect(400);
    });
  });

  describe('GET /files/:fileId/view', () => {
    it('should return file content', async () => {

      // Arrange
      const file = await createTestFile(prisma, testEventId, testUserId, {
        mime_type: 'image/jpeg',
        file_name: 'test.jpg',
        file_content: Buffer.from('fake image content').toString('base64')
      });

      // Act
      const response = await request(app)
        .get(`/files/${file.id}/view`)
        .expect(200);

      // Assert
      expect(response.headers['content-type']).toContain('image/jpeg');
    });

    it('should return 404 for non-existent file', async () => {
      // Act
      await request(app)
        .get(`/files/${randomUUID()}/view`)
        .expect(404);
    });
  });

  describe('POST /files/:fileId/mark-as-viewed', () => {
    it('should mark file as viewed', async () => {
      // Arrange
      const file = await createTestFile(prisma, testEventId, testUserId);

      // Act
      await request(app)
        .post(`/files/${file.id}/mark-as-viewed`)
        .expect(200);

      // Assert
      const updatedFile = await prisma.event_files.findUnique({
        where: { id: file.id }
      });
      expect(updatedFile?.viewed_at).toBeTruthy();
    });
  });

  describe('DELETE /files/:fileId', () => {
    it('should delete file', async () => {
      // Arrange
      const file = await createTestFile(prisma, testEventId, testUserId);

      // Act
      await request(app)
        .delete(`/files/${file.id}`)
        .expect(200);

      // Assert
      const deletedFile = await prisma.event_files.findUnique({
        where: { id: file.id }
      });
      expect(deletedFile).toBeNull();
    });

    it('should return 404 for non-existent file', async () => {
      // Act
      await request(app)
        .delete('/files/non-existent-id')
        .expect(404);
    });
  });
});
