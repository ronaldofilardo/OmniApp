import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import process from 'process';

// Setup global test environment
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/omni_mvp_test'
    }
  }
});

beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/omni_mvp_test';

  // Guard 1: impedir uso acidental do banco de desenvolvimento/produção
  if (!dbUrl.includes('_test')) {
    console.error(`❌ DATABASE_URL inválida para testes: ${dbUrl}. A URL deve apontar para um banco *_test (ex: omni_mvp_test).`);
    throw new Error('DATABASE_URL must point to a *_test database');
  }

  // Guard 2: SAFE_MODE permite pular migrações e conexão real com DB
  const safeMode = process.env.SAFE_MODE === '1' || process.env.SAFE_MODE === 'true';
  if (safeMode) {
    console.log('🛡️ SAFE_MODE ativo: pulando migrações e conexão com o banco.');
    return;
  }
  
  // Executar migrações no banco de testes
  try {
    console.log('📦 Running database migrations...');
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/omni_mvp_test' },
      stdio: 'inherit'
    });
    console.log('✅ Migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
  
  // Ensure database is ready
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Não limpar o banco aqui - deixar cada teste gerenciar seus próprios dados
});

afterEach(async () => {
  // Não limpar o banco aqui - deixar cada teste gerenciar seus próprios dados
});

/**
 * Helper para limpar dados de teste do banco
 * Ordem importante: deletar filhos antes dos pais
 */
async function cleanDatabase() {
  try {
    await prisma.$transaction([
      prisma.reminders.deleteMany(),
      prisma.upload_codes.deleteMany(),
      prisma.event_files.deleteMany(),
      prisma.events.deleteMany(),
      prisma.push_subscriptions.deleteMany(),
      prisma.notifications.deleteMany(),
      prisma.professionals.deleteMany(),
      prisma.users.deleteMany()
    ]);
  } catch (error) {
    // Ignora erros de limpeza se as tabelas ainda não existirem
    console.warn('⚠️ Clean database warning:', error);
  }
}
