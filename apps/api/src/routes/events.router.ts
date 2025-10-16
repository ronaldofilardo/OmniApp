import { Router, Request, Response } from 'express';
import * as eventsService from '../services/events.service';
import logger from '../logger';

export const eventsRouter = Router();

// Middleware para injetar pool e prisma (assumindo que serão passados via app.locals)
function injectDeps(req: Request, _res: Response, next: any) {
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
    const userId = (req as any)?.user?.id;
    const items = await eventsService.getTimeline((req as any).pool, (req as any).prisma, startDate, endDate, userId);
    return res.status(200).json(items);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar timeline');
    return res.status(500).json({ message: 'Erro interno ao buscar a timeline.' });
  }
});

eventsRouter.post('/check-conflicts', async (req: Request, res: Response) => {
  try {
    const { event_date, start_time, end_time, professional, excludeId } = req.body;
    const userId = (req as any)?.user?.id;
    const result = await eventsService.checkConflicts((req as any).pool, event_date, start_time, end_time, professional, excludeId, userId);
    return res.status(200).json(result);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao checar conflitos');
    return res.status(500).json({ message: 'Erro interno ao checar conflitos.' });
  }
});

eventsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const override_travel_conflict = req.body?.override_travel_conflict === true;
    const userId = (req as any)?.user?.id;
    const event = await eventsService.createEvent((req as any).pool, (req as any).prisma, req.body, override_travel_conflict, userId);
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
    const userId = (req as any)?.user?.id;
    const events = await eventsService.getEvents((req as any).prisma, userId);
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
    const userId = (req as any)?.user?.id;
    const items = await eventsService.getEventsByPeriod((req as any).pool, (req as any).prisma, startDate, endDate, userId);
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
    const userId = (req as any)?.user?.id;
    const event = await eventsService.updateEvent((req as any).pool, (req as any).prisma, id, req.body, override_travel_conflict, userId);
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
    const userId = (req as any)?.user?.id;
    const event = await eventsService.getEventById((req as any).pool, id, userId);
    return res.status(200).json(event);
  } catch (error: any) {
    logger.error({ err: error, eventId: id }, `Erro ao buscar evento ${id}`);
    return res.status(error.message.includes('ID inválido') ? 400 : 404).json({ message: error.message });
  }
});

eventsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const userId = (req as any)?.user?.id;
    const result = await eventsService.deleteEvent((req as any).pool, id, userId);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error({ err: error, eventId: id }, `Erro ao deletar evento ${id}`);
    return res.status(error.message.includes('não encontrado') ? 404 : 500).json({ message: error.message });
  }
});

eventsRouter.post('/:id/generate-upload-code', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fileType } = req.body;
  if (!fileType) {
    logger.warn({ eventId: id, body: req.body }, 'generate-upload-code called without fileType');
    return res.status(400).json({ message: 'fileType é obrigatório.' });
  }
  try {
    const userId = (req as any)?.user?.id as string | undefined;
    const result = await eventsService.generateUploadCode((req as any).pool, (req as any).prisma, id, fileType, userId);
    return res.status(200).json({ message: 'Código de envio gerado com sucesso.', ...result });
  } catch (error: any) {
    logger.error({ err: error, eventId: id }, `Erro ao gerar código de upload para o evento ${id}`);
    return res.status(error.message.includes('não encontrado') ? 404 : 500).json({ message: 'Erro ao gerar código.' });
  }
});

// GET existing upload code for an event and fileType (if stored in plain_text)
eventsRouter.get('/:id/upload-code', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fileType } = req.query;
  if (!fileType || typeof fileType !== 'string') return res.status(400).json({ message: 'fileType query param is required.' });
  try {
    const code = await eventsService.getUploadCodeForEvent((req as any).pool, (req as any).prisma, id, fileType);
    if (!code) return res.status(404).json({ message: 'No active upload code found.' });
    return res.status(200).json({ uploadCode: code });
  } catch (err: any) {
    logger.error({ err, eventId: id, query: req.query }, 'Erro ao buscar código de upload existente');
    return res.status(500).json({ message: 'Erro ao recuperar código.' });
  }
});

// Return all active upload codes (map file_type -> plain_code|null)
eventsRouter.get('/:id/upload-codes', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const map = await eventsService.getUploadCodesForEvent((req as any).pool, (req as any).prisma, id);
    return res.status(200).json({ codes: map });
  } catch (err: any) {
    logger.error({ err, eventId: id }, 'Erro ao buscar códigos de upload do evento');
    return res.status(500).json({ message: 'Erro ao recuperar códigos.' });
  }
});