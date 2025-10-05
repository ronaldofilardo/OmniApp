import { Router } from 'express';
import { generateDataBackup, generateFilesBackup } from '../services/backup.service';
import logger from '../logger';

const router = Router();

// GET /backup/data - Gerar backup de dados (eventos e profissionais)
router.get('/data', async (req, res) => {
  const { includeDeleted } = req.query;
  try {
    const pool = req.app.locals.pool;
    const backupData = await generateDataBackup(pool, includeDeleted === 'true');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=omni-saude-backup-${new Date().toISOString().split('T')[0]}.json`);
    res.status(200).json(backupData);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao gerar backup de dados');
    res.status(500).json({ message: 'Erro ao gerar backup de dados.' });
  }
});

// POST /backup/files - Gerar backup de arquivos ZIP
router.post('/files', async (req, res) => {
  const { fileTypes } = req.body;
  if (!Array.isArray(fileTypes) || fileTypes.length === 0) {
    return res.status(400).json({ message: 'Nenhum tipo de arquivo selecionado.' });
  }

  try {
    const pool = req.app.locals.pool;
    await generateFilesBackup(pool, fileTypes, res);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao gerar backup de arquivos');
    if (!res.headersSent) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar backup de arquivos.';
      res.status(500).json({ message });
    }
  }
});

export default router;