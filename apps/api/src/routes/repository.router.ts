import { Router } from 'express';
import {
  getOrphanFiles,
  getRepositoryEvents,
  confirmDeleteEvent,
  restoreEvent
} from '../services/repository.service';
import logger from '../logger';

const router = Router();

// GET /repository/orphans - Listar arquivos órfãos
router.get('/orphans', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const files = await getOrphanFiles(pool, req);
    return res.status(200).json(files);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar arquivos órfãos');
    return res.status(500).json({ message: 'Erro ao buscar arquivos órfãos.' });
  }
});

// GET /repository/events - Listar eventos do repositório (inclui deletados)
router.get('/events', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const events = await getRepositoryEvents(pool);
    return res.status(200).json(events);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao listar eventos do repositório');
    return res.status(500).json({ message: 'Erro ao listar eventos do repositório.' });
  }
});

// POST /repository/events/:id/confirm-delete - Confirmar deleção permanente
router.post('/events/:id/confirm-delete', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.pool;
    const result = await confirmDeleteEvent(pool, id);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao remover evento permanentemente.';
    logger.error({ err: error, eventId: id }, `Erro ao confirmar deleção do evento ${id}`);
    return res.status(500).json({ message });
  }
});

// POST /repository/events/:id/restore - Restaurar evento deletado
router.post('/events/:id/restore', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.pool;
    const result = await restoreEvent(pool, id);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao restaurar evento.';
    logger.error({ err: error, eventId: id }, `Erro ao restaurar evento ${id}`);
    return res.status(500).json({ message });
  }
});

export default router;