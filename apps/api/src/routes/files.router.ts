import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import * as filesService from '../services/files.service';
import { prisma } from '../infra/db/prisma';
import { upload } from '../infra/storage/uploads';
import config from '../config';
import logger from '../logger';


export const filesRouter = Router();

// Helper para deletar arquivo temporário de forma segura
function safeUnlink(path: string | undefined) {
  if (path) {
    try {
      require('fs').unlinkSync(path);
    } catch (e) {
      // ignore - arquivo pode não existir ou path undefined
    }
  }
}

function injectPrisma(req: Request, res: Response, next: any) {
  (req as any).prisma = (req.app as any).locals.prisma;
  next();
}


filesRouter.use(injectPrisma);

// Middleware para tratamento de erros do multer (tipo/tamanho)
filesRouter.use((err: any, req: Request, res: Response, next: any) => {
  if (err && (err instanceof Error || err.name === 'MulterError')) {
    // Erro de validação de arquivo
    let message = err.message || 'Erro ao processar arquivo.';
    // Mensagens customizadas para erros comuns
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Arquivo muito grande. Máximo permitido: 2KB.';
    } else if (err.message && err.message.includes('imagem')) {
      message = 'Apenas arquivos do tipo imagem são permitidos';
    }
    return res.status(400).json({ message });
  }
  next(err);
});

filesRouter.get('/events/:eventId/files', async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const authHeader = req.get('Authorization') || req.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
  try {
    const files = await filesService.getFilesForEvent((req as any).prisma, eventId, token);
    return res.status(200).json(files);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar arquivos');
    return res.status(500).json({ message: 'Erro ao buscar arquivos.' });
  }
});

// Endpoint público para buscar arquivos de eventos externos (sem autenticação)
filesRouter.get('/events/:eventId/files/public', async (req: Request, res: Response) => {
  const { eventId } = req.params;
  try {
    const files = await filesService.getFilesForEvent((req as any).prisma, eventId, undefined);
    return res.status(200).json(files);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar arquivos públicos');
    return res.status(500).json({ message: 'Erro ao buscar arquivos.' });
  }
});

filesRouter.post('/events/:eventId/files', upload.single('file'), async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { file_type, upload_code } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
  if (!file_type) {
    // Deletar arquivo se tipo não fornecido
    safeUnlink(file.path);
    return res.status(400).json({ message: 'O tipo do arquivo é obrigatório.' });
  }

  // Se veio upload_code, validar código antes de persistir o arquivo
  if (upload_code) {
    try {
      const pool = (req.app as any).locals.pool;
      const result = await pool.query('SELECT upload_code_hash, upload_code_expires_at, upload_code_status FROM events WHERE id = $1 AND user_id = $2', [eventId, 'a1b2c3d4-e5f6-7890-1234-567890abcdef']);
      if (result.rows.length === 0) {
        console.info(`[upload-diagnostics] event=${eventId} - not found`);
        safeUnlink(file.path);
        return res.status(404).json({ message: 'Evento não encontrado.' });
      }
      const row = result.rows[0];
      // Diagnostic logs (do not log sensitive hashes)
      console.info(`[upload-diagnostics] event=${eventId} status=${row.upload_code_status} expires_at=${row.upload_code_expires_at}`);
      if (row.upload_code_status !== 'active' || !row.upload_code_hash || !row.upload_code_expires_at || new Date(row.upload_code_expires_at) < new Date()) {
        console.info(`[upload-diagnostics] event=${eventId} - code invalid/expired`);
        safeUnlink(file.path);
        return res.status(401).json({ message: 'Código de envio inválido ou expirado.' });
      }
      const bcrypt = require('bcryptjs');
      const match = await bcrypt.compare(String(upload_code), row.upload_code_hash);
      if (!match) {
        console.info(`[upload-diagnostics] event=${eventId} - code mismatch`);
        safeUnlink(file.path);
        return res.status(401).json({ message: 'Código de envio incorreto.' });
      }
      // Código válido: apenas prosseguir; marcamos como 'used' APÓS persistir o arquivo com sucesso
    } catch (err) {
      logger.error({ err }, 'Erro ao validar código de upload');
      safeUnlink(file.path);
      return res.status(500).json({ message: 'Erro ao validar código de envio.' });
    }
  }

  // diagnostic: log received upload_code and file info before persisting
  console.info(`[upload-diagnostics] event=${eventId} received_upload_code=${upload_code}`);
  console.info(`[upload-diagnostics] event=${eventId} file_name=${file.originalname} size=${file.size} path=${file.path}`);
  let created: any = null;
  try {
    logger.info({ eventId, file: file.originalname }, '[upload-diagnostics] iniciando persistência de arquivo');
  created = await filesService.uploadFile(prisma, eventId, file, file_type);
    logger.info({ eventId, createdId: created && created.id }, '[upload-diagnostics] arquivo persistido com sucesso');
    // marcar upload_code como 'used' APÓS persistência (o código já fazia isso, apenas reforçamos logging)
  } catch (err) {
    // log completo para diagnóstico e remover arquivo temporário
    logger.error({ err }, `[upload-diagnostics] erro ao persistir arquivo para event=${eventId}`);
    safeUnlink(file.path);
    return res.status(500).json({ message: 'Erro ao salvar arquivo.' });
  }

  try {
    // Se veio upload_code, marcar como usado agora que persistimos com sucesso
    if (upload_code) {
      try {
        const pool = (req.app as any).locals.pool;
        await pool.query('UPDATE events SET upload_code_status = $1 WHERE id = $2', ['used', eventId]);
      } catch (e) {
        logger.error({ err: e }, 'Erro ao marcar código de envio como usado após upload');
        // Não falhar o upload por causa da marcação; apenas logar
      }
    }
    // substituir retorno incorreto por created
    return res.status(201).json(created);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao salvar arquivo');
    return res.status(500).json({ message: 'Erro ao salvar arquivo.' });
  }
});

filesRouter.post('/:fileId/mark-as-viewed', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  try {
    const result = await filesService.markFileAsViewed((req as any).prisma, fileId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(200).json({ message: error.message });
  }
});

filesRouter.get('/:fileId/view', async (req: Request, res: Response) => {
  const { fileId } = req.params;

  // Sem autenticação - acesso livre a todos os arquivos
  try {
    const file = await filesService.getFileById((req as any).prisma, fileId);
    if (!file) {
      return res.status(404).json({ message: 'Arquivo não encontrado.' });
    }

    if (file.file_content) {
      const buffer = Buffer.from(file.file_content, 'base64');
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${file.file_name}"`);
      return res.send(buffer);
    } else if (file.file_path) {
      return res.sendFile(file.file_path);
    } else {
      return res.status(404).json({ message: 'Conteúdo do arquivo não disponível.' });
    }
  } catch (error: any) {
    logger.error({ err: error }, 'Erro ao visualizar arquivo');
    return res.status(500).json({ message: 'Erro ao visualizar arquivo.' });
  }
});

filesRouter.post('/upload-by-code', upload.single('file'), async (req: Request, res: Response) => {
  const { upload_code } = req.body;
  const file = req.file;
  if (!upload_code) return res.status(400).json({ message: 'Código de acesso é obrigatório.' });
  if (!file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });

  // Validate file type (JPG up to 2KB)
  if (file.mimetype !== 'image/jpeg') {
    safeUnlink(file.path);
    return res.status(400).json({ message: 'Apenas arquivos JPG são permitidos.' });
  }
  if (file.size > 2 * 1024) {
    safeUnlink(file.path);
    return res.status(400).json({ message: 'Arquivo muito grande. Máximo permitido: 2KB.' });
  }

  try {
    const result = await filesService.uploadFileByCode((req as any).prisma, upload_code, file);
    return res.status(201).json(result);
  } catch (error: any) {
    logger.error({ err: error }, 'Erro ao fazer upload por código');
    return res.status(400).json({ message: error.message });
  }
});

filesRouter.delete('/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  try {
    const result = await filesService.deleteFile((req as any).prisma, fileId);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error({ err: error }, 'Erro ao deletar arquivo');
    return res.status(404).json({ message: error.message });
  }
});