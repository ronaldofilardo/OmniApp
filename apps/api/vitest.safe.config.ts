import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Carrega .env.test para garantir variáveis de teste
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Não usar setupFiles no modo seguro para evitar migrações/conexão
    include: [
      'tests/services/**/*.test.ts',
      'tests/services/**/*.spec.ts',
      'tests/middleware/**/*.test.ts',
      'tests/middleware/**/*.spec.ts',
      // Evita rotas/integration por padrão
    ],
    exclude: [
      'node_modules', 'dist', '.git',
      'tests/integration/**',
      'tests/routes/**',
      'tests/**/external.router.*',
    ],
    testTimeout: 8000,
    hookTimeout: 8000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['src/**/*.ts'],
      exclude: ['tests/**', 'prisma/**', 'dist/**', '**/*.d.ts', '**/*.config.*'],
      all: false
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
