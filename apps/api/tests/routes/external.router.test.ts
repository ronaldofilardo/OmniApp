import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app/createApp';
import { prisma } from '../../src/infra/db/prisma';
import fs from 'fs';
import path from 'path';

// Mock pool and prisma for testing
const mockPool = {} as Pool;
const mockPrisma = prisma;

const app = createApp(mockPool, mockPrisma);

describe('External Router', () => {

  describe('POST /external/submit-exam', () => {
    it('should create event and files successfully', async () => {
      // Criar usuário de teste com email único
      const uniqueEmail = `test-create-success-${Date.now()}@example.com`;
      const user = await prisma.users.upsert({
        where: { email: uniqueEmail },
        update: {},
        create: {
          email: uniqueEmail,
          password_hash: 'hashed_password',
        },
      });

      // Criar imagem PNG simples (1x1) em memória (sem escrever no disco)
      const smallPng = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00,
        0x90, 0x77, 0x53, 0xDE,
        0x00, 0x00, 0x00, 0x0C,
        0x49, 0x44, 0x41, 0x54,
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44,
        0xAE, 0x42, 0x60, 0x82,
      ]);

      const response = await request(app)
        .post('/external/submit-exam')
        .field('email', uniqueEmail)
        .field('clinic_name', 'Clínica Teste')
        .field('professional', 'Dr. Silva')
        .field('event_date', '2025-10-15')
        .field('start_time', '10:00')
        .field('event_type', 'Exame')
        .field('notes', 'Teste de envio externo')
  .attach('file_requisicao', smallPng, { filename: 'test.png', contentType: 'image/png' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Documento(s) enviado(s) com sucesso!');

      // Verificar se o evento foi criado
      const events = await prisma.events.findMany({
        where: { user_id: user.id },
      });
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('Exame'); // default event_type
      expect(events[0].professional).toBe('Dr. Silva');

      // Verificar se o profissional foi criado
      const professionals = await prisma.professionals.findMany({
        where: { user_id: user.id },
      });
      expect(professionals).toHaveLength(1);
      expect(professionals[0].name).toBe('Dr. Silva');

      // Verificar se o arquivo foi criado
      const files = await prisma.event_files.findMany({
        where: { event_id: events[0].id },
      });
      expect(files).toHaveLength(1);
      expect(files[0].file_type).toBe('Requisicao');
      expect(files[0].file_content).toBeDefined();

      // Verificar se a notificação foi criada
      const notifications = await prisma.notifications.findMany({
        where: { user_id: user.id },
      });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toContain('Clínica Teste');
      expect(notifications[0].message).toContain('Dr. Silva');
      expect(notifications[0].message).toContain('enviou 1 arquivo(s)'); // novo evento criado
      expect(notifications[0].message).toContain('exame'); // tipo do evento
    });

    it('should return 404 for non-existent user', async () => {
      // Criar arquivo de teste para passar validação do multer
      const smallPng2 = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00,
        0x90, 0x77, 0x53, 0xDE,
        0x00, 0x00, 0x00, 0x0C,
        0x49, 0x44, 0x41, 0x54,
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44,
        0xAE, 0x42, 0x60, 0x82,
      ]);

      const response = await request(app)
        .post('/external/submit-exam')
        .field('email', 'nonexistent@example.com')
        .field('clinic_name', 'Clínica Teste')
        .field('professional', 'Dr. Silva')
        .field('event_date', '2025-10-15')
        .field('start_time', '10:00')
        .field('notes', 'Teste')
  .attach('file_requisicao', smallPng2, { filename: 'test.png', contentType: 'image/png' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Usuário não encontrado.');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/external/submit-exam')
        .field('email', 'invalid-email')
        .field('professional', '')
        .field('event_date', 'invalid-date')
        .field('start_time', 'invalid-time');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Dados inválidos.');
    });

    it('should return 400 for non-image file', async () => {
      // Criar usuário de teste usando upsert
      await prisma.users.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
          email: 'test@example.com',
          password_hash: 'hashed_password',
        },
      });

      const response = await request(app)
        .post('/external/submit-exam')
        .field('email', 'test@example.com')
        .field('clinic_name', 'Clínica Teste')
        .field('professional', 'Dr. Silva')
        .field('event_date', '2025-10-15')
        .field('start_time', '10:00')
        .attach('file_requisicao', Buffer.from('text content'), {
          filename: 'test.txt',
          contentType: 'text/plain'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Apenas arquivos do tipo imagem são permitidos');
    });

    it('should handle multiple file uploads', async () => {
      // Criar usuário de teste usando upsert
      const user = await prisma.users.upsert({
        where: { email: 'test-multiple@example.com' },
        update: {},
        create: {
          email: 'test-multiple@example.com',
          password_hash: 'hashed_password',
        },
      });

      // Criar arquivo de teste pequeno
      const smallPng3 = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00,
        0x90, 0x77, 0x53, 0xDE,
        0x00, 0x00, 0x00, 0x0C,
        0x49, 0x44, 0x41, 0x54,
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44,
        0xAE, 0x42, 0x60, 0x82,
      ]);

      const response = await request(app)
        .post('/external/submit-exam')
        .field('email', 'test-multiple@example.com')
        .field('clinic_name', 'Clínica Teste')
        .field('professional', 'Dr. Silva')
        .field('event_date', '2025-10-15')
        .field('start_time', '10:00')
        .field('notes', 'Teste de múltiplos arquivos')
  .attach('file_requisicao', smallPng3, { filename: 'test.png', contentType: 'image/png' })
  .attach('file_autorizacao', smallPng3, { filename: 'test2.png', contentType: 'image/png' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Documento(s) enviado(s) com sucesso!');

      // Verificar se os arquivos foram criados
      const events = await prisma.events.findMany({
        where: { user_id: user.id },
      });
      expect(events).toHaveLength(1);

      const files = await prisma.event_files.findMany({
        where: { event_id: events[0].id },
      });
      expect(files).toHaveLength(2);
      expect(files.map(f => f.file_type)).toEqual(expect.arrayContaining(['Requisicao', 'Autorizacao']));
    });

    it('should update existing event when same user, professional and date', async () => {
      // Criar usuário de teste usando upsert
      const user = await prisma.users.upsert({
        where: { email: 'test-update@example.com' },
        update: {},
        create: {
          email: 'test-update@example.com',
          password_hash: 'hashed_password',
        },
      });

      // Criar profissional usando upsert (specialty obrigatório)
      const professional = await prisma.professionals.upsert({
        where: {
          user_id_name_specialty: {
            user_id: user.id,
            name: 'Dr. Silva',
            specialty: 'Cardiologia',
          },
        },
        update: {},
        create: {
          user_id: user.id,
          name: 'Dr. Silva',
          specialty: 'Cardiologia',
        },
      });

      // Criar evento existente usando findFirst ou create
      const eventDate = new Date('2025-10-15T00:00:00.000Z');
      let existingEvent = await prisma.events.findFirst({
        where: {
          user_id: user.id,
          professional: professional.name,
          event_date: eventDate,
        },
      });
      
      if (!existingEvent) {
        existingEvent = await prisma.events.create({
          data: {
            user_id: user.id,
            type: 'Exame',
            professional: professional.name,
            event_date: eventDate,
            start_time: new Date('1970-01-01T10:00:00.000Z'),
            end_time: new Date('1970-01-01T10:01:00.000Z'),
            notes: 'Evento existente',
          },
        });
      }

      // Criar arquivo de teste pequeno
      const testImagePath = path.join(__dirname, '../../test-image.png');
      if (!fs.existsSync(testImagePath)) {
        const smallPng = Buffer.from([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
          0x00, 0x00, 0x00, 0x0D,
          0x49, 0x48, 0x44, 0x52,
          0x00, 0x00, 0x00, 0x01,
          0x00, 0x00, 0x00, 0x01,
          0x08, 0x02, 0x00, 0x00, 0x00,
          0x90, 0x77, 0x53, 0xDE,
          0x00, 0x00, 0x00, 0x0C,
          0x49, 0x44, 0x41, 0x54,
          0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
          0x00, 0x00, 0x00, 0x00,
          0x49, 0x45, 0x4E, 0x44,
          0xAE, 0x42, 0x60, 0x82,
        ]);
        fs.writeFileSync(testImagePath, smallPng);
      }

      const response = await request(app)
        .post('/external/submit-exam')
        .field('email', 'test-update@example.com')
        .field('clinic_name', 'Clínica Teste')
        .field('professional', 'Dr. Silva')
        .field('event_date', '2025-10-15')
        .field('start_time', '10:00')
        .field('notes', 'Atualização do evento existente')
        .attach('file_requisicao', testImagePath);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Documento(s) enviado(s) com sucesso!');

      // Verificar que apenas um evento existe (não criou novo)
      const events = await prisma.events.findMany({
        where: { user_id: user.id },
      });
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe(existingEvent.id);

      // Verificar que o arquivo foi criado no evento existente
      const files = await prisma.event_files.findMany({
        where: { event_id: existingEvent.id },
      });
      expect(files).toHaveLength(1);
      expect(files[0].file_type).toBe('Requisicao');
    });

    it('should return 400 for file too large', async () => {
      // Criar usuário de teste usando upsert
      await prisma.users.upsert({
        where: { email: 'test-large@example.com' },
        update: {},
        create: {
          email: 'test-large@example.com',
          password_hash: 'hashed_password',
        },
      });

      // Criar arquivo grande (mais de 2KB)
      const largeBuffer = Buffer.alloc(3000, 'x');

      const response = await request(app)
        .post('/external/submit-exam')
        .field('email', 'test-large@example.com')
        .field('clinic_name', 'Clínica Teste')
        .field('professional', 'Dr. Silva')
        .field('event_date', '2025-10-15')
        .field('start_time', '10:00')
        .attach('file_requisicao', largeBuffer, {
          filename: 'large.png',
          contentType: 'image/png'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('File too large');
    });
  });
});