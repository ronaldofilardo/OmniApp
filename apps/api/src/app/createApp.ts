import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import logger from '../logger';
import { router } from '../routes';
import { requireUserEmail } from '../middleware/requireUserEmail';

export function createApp(pool: Pool, prisma: PrismaClient) {
  const app = express();

  app.use(express.json());
  
  // Middleware de logging para debug
  app.use((req, res, next) => {
    logger.info({
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      timestamp: new Date().toISOString()
    }, `📥 ${req.method} ${req.url} from ${req.ip}`);
    next();
  });
  
  // Middleware para servir arquivos estáticos com CORS
  app.use('/uploads', (req, res, next) => {
    // Configurar cabeçalhos CORS para arquivos
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  }, express.static('uploads'));

  app.use(cors({
    origin: (origin, cb) => {
      logger.info({ origin, timestamp: new Date().toISOString() }, `🔒 CORS Check: Origin = ${origin}`);
      
      // Permitir chamadas sem origin (ex.: curl, Postman, requests diretas)
      if (!origin) {
        logger.info('✅ CORS: Allowing request without origin');
        return cb(null, true);
      }
      
      try {
        // Permitir localhost em várias portas de desenvolvimento
  const allowedLocalhost = /^http:\/\/localhost:(5173|5174|5175|3000|3001|4173)$/;
        // Permitir IPs da rede local em portas de desenvolvimento (mais flexível)
  const allowedLan = /^http:\/\/(192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+):(5173|5174|5175|3000|3001|4173)$/;
        // Permitir outros IPs comuns de desenvolvimento
  const allowedDev = /^http:\/\/(127\.0\.0\.1|0\.0\.0\.0):(5173|5174|5175|3000|3001|4173)$/;
        // Permitir acesso de dispositivos móveis com portas padrão
  const allowedMobile = /^http:\/\/(192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+):(5173|5175|3000)$/;
        
        const isAllowed = allowedLocalhost.test(origin) || allowedLan.test(origin) || 
                         allowedDev.test(origin) || allowedMobile.test(origin);
        
        if (isAllowed) {
          logger.info(`✅ CORS: Origin allowed: ${origin}`);
          return cb(null, true);
        } else {
          logger.warn(`❌ CORS: Origin rejected: ${origin}`);
        }
      } catch (e) {
        logger.error({ error: e, origin }, 'CORS regex check failed');
      }
      return cb(new Error('CORS origin not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
  }));

  // Injetar dependências
  app.locals.pool = pool;
  app.locals.prisma = prisma;

  // Middleware que exige JWT e verifica email do usuário (REQUIRED_USER_EMAIL)
  app.use(requireUserEmail);

  // Montar rotas
  app.use(router);

  // Error handling middleware (must be after routes)
  // This captures any error thrown in routes/middlewares and ensures
  // we log it and respond with a JSON error instead of letting the process crash.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, req: any, res: any, next: any) => {
    try {
      logger.error({ err, url: req.url, method: req.method }, 'Unhandled error in request pipeline');
    } catch (loggingErr) {
      // swallow logging errors
      // eslint-disable-next-line no-console
      console.error('Failed to log error', loggingErr);
    }

    // Tratamento específico para erros do multer
    if (err && err.name === 'MulterError') {
      let message = err.message;
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'File too large';
      }
      return res.status(400).json({ message });
    }

    // Tratamento específico para erros do fileFilter do multer
    if (err && err.message && err.message.includes('Apenas arquivos do tipo imagem são permitidos')) {
      return res.status(400).json({ message: err.message });
    }

    const status = err && err.status ? err.status : 500;
    const message = err && err.message ? err.message : 'Erro interno do servidor.';
    return res.status(status).json({ message });
  });

  return app;
}