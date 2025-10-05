import { Router } from 'express';
import { getSharingSessionsForDebug } from '../services/debug.service';
import logger from '../logger';

const router = Router();

// GET /debug/sharing-sessions - Listar sessões de compartilhamento (debug)
router.get('/sharing-sessions', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const sessions = await getSharingSessionsForDebug(pool);
    return res.status(200).json(sessions);
  } catch (error) {
    logger.error({ err: error }, 'Erro no debug/sharing-sessions');
    return res.status(500).json({ message: 'Erro ao listar sessions de compartilhamento.' });
  }
});

export default router;