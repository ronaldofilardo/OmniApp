import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { vi } from 'vitest';

/**
 * Mock do Pool do PostgreSQL
 */
export const createMockPool = () => {
  const mockQuery = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  
  return {
    query: mockQuery,
    connect: vi.fn(),
    end: vi.fn(),
    on: vi.fn()
  } as unknown as Pool;
};

/**
 * Mock do PrismaClient
 */
export const createMockPrisma = () => {
  return {
    users: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    events: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    event_files: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    professionals: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    upload_codes: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
    $use: vi.fn(),
  } as unknown as PrismaClient;
};

/**
 * Dados mock para testes
 */
export const mockUser = {
  id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  email: 'user@email.com',
  password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
  created_at: new Date('2025-01-01')
};

export const mockProfessional = {
  id: 'prof-1234-5678-9012',
  user_id: mockUser.id,
  name: 'Dr. João Silva',
  specialty: 'Cardiologia',
  created_at: new Date('2025-01-01'),
  deleted_at: null
};

export const mockEvent = {
  id: 'event-1234-5678-9012',
  user_id: mockUser.id,
  professional_id: mockProfessional.id,
  event_type: 'Consulta',
  event_date: '2025-10-15',
  start_time: '09:00',
  end_time: '10:00',
  address: 'Rua Teste, 123',
  created_at: new Date('2025-01-01'),
  deleted_at: null,
  upload_code_hash: null,
  upload_code_expires_at: null,
  upload_code_status: null
};

export const mockFile = {
  id: 'file-1234-5678-9012',
  event_id: mockEvent.id,
  user_id: mockUser.id,
  file_name: 'laudo.pdf',
  file_type: 'LaudoResultado',
  file_path: null,
  file_content: 'base64encodedcontent',
  mime_type: 'application/pdf',
  uploaded_at: new Date('2025-01-01'),
  viewed_at: null
};

/**
 * Helper para criar request mock do Express
 */
export const createMockRequest = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    get: vi.fn((header: string) => ''),
    app: {
      locals: {
        pool: createMockPool(),
        prisma: createMockPrisma()
      }
    },
    ...overrides
  };
};

/**
 * Helper para criar response mock do Express
 */
export const createMockResponse = () => {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sendFile: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis()
  };
  return res;
};

/**
 * Helper para criar next mock do Express
 */
export const createMockNext = () => vi.fn();
