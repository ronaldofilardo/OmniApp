import express from 'express';
import { createProfessionalSchema } from './validations';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import config from './config';
import logger from './logger';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';
import { Request, Response } from 'express';
import os from 'os';
import { createApp } from './app/createApp';
import { pool } from './infra/db/pg';
import { prisma } from './infra/db/prisma';
const app = createApp(pool, prisma);

const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

// Função utilitária para obter o IP local da máquina
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Travel gap configuration (structure ready)
// Por padrão habilitamos a checagem de travel gap, a menos que a env explicite 'false'.
const TRAVEL_GAP_ENABLED = config.travelGap.enabled;
const TRAVEL_GAP_MINUTES = config.travelGap.minutes;

logger.info({ TRAVEL_GAP_ENABLED, TRAVEL_GAP_MINUTES }, 'Travel gap configuration');

// Ensure audit table for overrides exists
(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS event_conflict_overrides (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id text NOT NULL,
      event_id text NULL,
      override_at timestamptz DEFAULT now(),
      overridden_conflicts jsonb
    )`);
    logger.info('Verified event_conflict_overrides table');
  } catch (e: any) {
    logger.warn('Could not ensure event_conflict_overrides table: %s', e?.message || e);
  }
})();

import detectConflicts from './services/conflicts';

// Ensure orphan columns exist on startup (safe to run every start)
(async () => {
  try {
    await pool.query(`ALTER TABLE event_files ADD COLUMN IF NOT EXISTS is_orphan boolean DEFAULT false`);
    await pool.query(`ALTER TABLE event_files ADD COLUMN IF NOT EXISTS orphaned_at timestamptz NULL`);
  logger.info('Verified event_files orphan columns');
  } catch (e: any) {
    logger.warn('Could not ensure orphan columns on event_files: %s', e?.message || e);
  }
})();

// --- Configuração do Multer (Upload) ---
// Use memoryStorage here to avoid writing uploaded files into the project folder
// (writing into the repo can trigger ts-node-dev file watchers and restart the process).
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

// --- Rota de Status ---
// Nota: deleção do evento é implementada mais adiante com transação; evitar duplicação aqui


// ============================================
// ROTAS DE ARQUIVOS
// ============================================








// Duplicata removida: use a primeira implementação mais acima no arquivo







// ============================================
// ROTAS DE ARQUIVOS
// ============================================











// --- Inicialização do Servidor ---
const PORT = config.port || 3333;
const HOST = '0.0.0.0';
// Global process error handlers to avoid silent exits and provide diagnostics
process.on('uncaughtException', (err: any) => {
  logger.error({ err }, 'uncaughtException - unexpected error. Process will not exit (logged).');
});

process.on('unhandledRejection', (reason: any, promise: any) => {
  logger.error({ reason, promise }, 'unhandledRejection - promise rejected without handler.');
});

app.listen(PORT, HOST, () => {
  const localIp = getLocalIp();
  logger.info({ 
    port: PORT, 
    host: HOST, 
    localIp: localIp,
    urls: {
      local: `http://localhost:${PORT}`,
      network: `http://${localIp}:${PORT}`
    }
  }, `🚀 Servidor rodando na porta ${PORT} em ${HOST}`);
});
