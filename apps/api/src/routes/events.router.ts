import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import * as eventsService from '../services/events.service';
import logger from '../logger';

export const eventsRouter = Router();

// Middleware para injetar pool e prisma (assumindo que serão passados via app.locals ou similar)
function injectDeps(req: Request, res: Response, next: any) {
  (req as any).pool = (req.app as any).locals.pool;
  (req as any).prisma = (req.app as any).locals.prisma;
  next();
}

eventsRouter.use(injectDeps);

eventsRouter.get('/timeline', async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
    return res.status(400).json({ message: 'Os parâmetros startDate e endDate são obrigatórios.' });
  }

  try {
    const items = await eventsService.getTimeline((req as any).pool, (req as any).prisma, startDate, endDate);
    return res.status(200).json(items);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar timeline');
    return res.status(500).json({ message: 'Erro interno ao buscar a timeline.' });
  }
});

eventsRouter.post('/check-conflicts', async (req: Request, res: Response) => {
  try {
    const { event_date, start_time, end_time, professional, excludeId } = req.body;
    const result = await eventsService.checkConflicts((req as any).pool, event_date, start_time, end_time, professional, excludeId);
    return res.status(200).json(result);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao checar conflitos');
    return res.status(500).json({ message: 'Erro interno ao checar conflitos.' });
  }
});

eventsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const override_travel_conflict = req.body?.override_travel_conflict === true;
    const event = await eventsService.createEvent((req as any).pool, (req as any).prisma, req.body, override_travel_conflict);
    return res.status(201).json({ message: 'Evento criado com sucesso!', event });
  } catch (error: any) {
    logger.error({ err: error }, 'Erro ao criar evento');
    if (error.conflictType) {
      return res.status(409).json(error);
    }
    return res.status(500).json({ message: 'Erro interno do servidor.', error, errors: error.errors });
  }
});

eventsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const events = await eventsService.getEvents((req as any).prisma);
    return res.status(200).json(events);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar eventos');
    return res.status(500).json({ message: 'Erro ao buscar eventos.' });
  }
});

eventsRouter.get('/by-period', async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
    return res.status(400).json({ message: 'Os parâmetros startDate e endDate são obrigatórios.' });
  }

  try {
    const items = await eventsService.getEventsByPeriod((req as any).pool, (req as any).prisma, startDate, endDate);
    return res.status(200).json(items);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar eventos por período');
    return res.status(500).json({ message: 'Erro interno ao buscar eventos por período.' });
  }
});

eventsRouter.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const override_travel_conflict = req.body?.override_travel_conflict === true;
    const event = await eventsService.updateEvent((req as any).pool, (req as any).prisma, id, req.body, override_travel_conflict);
    return res.status(200).json({ message: 'Evento atualizado com sucesso!', event });
  } catch (error: any) {
    logger.error({ err: error, eventId: id }, `Erro ao atualizar evento ${id}`);
    if (error.conflictType) {
      return res.status(409).json(error);
    }
    return res.status(500).json({ message: 'Erro interno do servidor.', errors: error.errors });
  }
});

eventsRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const event = await eventsService.getEventById((req as any).pool, id);
    return res.status(200).json(event);
  } catch (error: any) {
    logger.error({ err: error, eventId: id }, `Erro ao buscar evento ${id}`);
    return res.status(error.message.includes('ID inválido') ? 400 : 404).json({ message: error.message });
  }
});

eventsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await eventsService.deleteEvent((req as any).pool, id);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error({ err: error, eventId: id }, `Erro ao deletar evento ${id}`);
    return res.status(error.message.includes('não encontrado') ? 404 : 500).json({ message: error.message });
  }
});

eventsRouter.post('/:id/generate-upload-code', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await eventsService.generateUploadCode((req as any).pool, id);
    return res.status(200).json({ message: 'Código de envio gerado com sucesso.', ...result });
  } catch (error: any) {
    logger.error({ err: error, eventId: id }, `Erro ao gerar código de upload para o evento ${id}`);
    return res.status(error.message.includes('não encontrado') ? 404 : 500).json({ message: error.message });
  }
});