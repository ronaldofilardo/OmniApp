import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as filesService from '../../src/services/files.service';
import { createTestUser, createTestEvent, createTestFile } from '../helpers/database';
import { prisma } from '../setup';

// IMPORTANTE: Este ID deve corresponder ao MOCK_USER_ID em files.service.ts
const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

describe('Files Service', () => {
  let testUserId: string;
  let testEventId: string;

  beforeEach(async () => {
    // Criar usuário com o ID específico que o serviço espera usando upsert
    const user = await prisma.users.upsert({
      where: { id: MOCK_USER_ID },
      update: {
        email: `test-${Date.now()}@example.com`,
        password_hash: '$2a$10$testhashedpassword'
      },
      create: {
        id: MOCK_USER_ID,
        email: `test-${Date.now()}@example.com`,
        password_hash: '$2a$10$testhashedpassword'
      }
    });
    
    testUserId = user.id;
    const event = await createTestEvent(prisma, testUserId, 'Dr. Teste');
    testEventId = event.id;
  });

  describe('getFilesForEvent', () => {
    it('should return files for an event', async () => {
      // Arrange
      await createTestFile(prisma, testEventId, testUserId);

      // Act
      const files = await filesService.getFilesForEvent(prisma, testEventId);

      // Assert
      expect(files).toHaveLength(1);
      expect(files[0]).toHaveProperty('id');
      expect(files[0]).toHaveProperty('file_name');
      expect(files[0]).toHaveProperty('url');
    });

    it('should return empty array when no files exist', async () => {
      // Act
      const files = await filesService.getFilesForEvent(prisma, testEventId);

      // Assert
      expect(files).toHaveLength(0);
    });

    it('should generate correct URL for each file', async () => {
      // Arrange
      await createTestFile(prisma, testEventId, testUserId);

      // Act
      const files = await filesService.getFilesForEvent(prisma, testEventId);

      // Assert
      expect(files[0].url).toContain('/files/');
      expect(files[0].url).toContain('/view');
    });
  });

  describe('uploadFile', () => {
    it('should create file with base64 content', async () => {
      // Arrange
      const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content')
      } as Express.Multer.File;

      // Act
      const result = await filesService.uploadFile(
        prisma,
        testEventId,
        mockFile,
        'LaudoResultado'
      );

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.file_name).toBe('test.pdf');
      expect(result.file_type).toBe('LaudoResultado');
      expect(result.file_content).toBeTruthy();
      expect(result.file_path).toBeNull();
    });

    it('should store mime type correctly', async () => {
      // Arrange
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test image')
      } as Express.Multer.File;

      // Act
      const result = await filesService.uploadFile(
        prisma,
        testEventId,
        mockFile,
        'Requisicao'
      );

      // Assert
      expect(result.mime_type).toBe('image/jpeg');
    });
  });

  describe('getFileById', () => {
    it('should return file by id', async () => {
      // Arrange
      const file = await createTestFile(prisma, testEventId, testUserId);

      // Act
      const result = await filesService.getFileById(prisma, file.id);

      // Assert
      expect(result).toBeTruthy();
      expect(result?.id).toBe(file.id);
    });

    it('should return null for non-existent file', async () => {
      // Act
      const result = await filesService.getFileById(prisma, randomUUID());

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('markFileAsViewed', () => {
    it('should update viewed_at timestamp', async () => {
      // Arrange
      const file = await createTestFile(prisma, testEventId, testUserId);

      // Act
      await filesService.markFileAsViewed(prisma, file.id);

      // Assert
      const updated = await prisma.event_files.findUnique({
        where: { id: file.id }
      });
      expect(updated?.viewed_at).toBeTruthy();
    });

    it('should throw error for non-existent file', async () => {
      // Act & Assert
      await expect(
        filesService.markFileAsViewed(prisma, randomUUID())
      ).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      // Arrange
      const file = await createTestFile(prisma, testEventId, testUserId);

      // Act
      await filesService.deleteFile(prisma, file.id);

      // Assert
      const deleted = await prisma.event_files.findUnique({
        where: { id: file.id }
      });
      expect(deleted).toBeNull();
    });

    it('should throw error for non-existent file', async () => {
      // Act & Assert
      await expect(
        filesService.deleteFile(prisma, 'non-existent-id')
      ).rejects.toThrow();
    });
  });
});
