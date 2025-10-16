import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

export const notificationsRouter = Router();

// Middleware para injetar pool e prisma
function injectDeps(req: Request, res: Response, next: any) {
  (req as any).pool = (req.app as any).locals.pool;
  (req as any).prisma = (req.app as any).locals.prisma;
  next();
}

notificationsRouter.use(injectDeps);

// GET /notifications - Buscar notificações do usuário
notificationsRouter.get('/', async (req: Request, res: Response) => {
  const prisma: PrismaClient = (req as any).prisma;
  const userId = (req as any).userId; // Assumindo que há middleware de auth

  try {
    const notifications = await prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50, // Limitar para performance
    });
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// GET /notifications/unread-count - Contador de não lidas
notificationsRouter.get('/unread-count', async (req: Request, res: Response) => {
  const prisma: PrismaClient = (req as any).prisma;
  const userId = (req as any).userId;

  try {
    const count = await prisma.notifications.count({
      where: { user_id: userId, status: 'unread' },
    });
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// POST /notifications/:id/mark-as-read - Marcar como lida
notificationsRouter.post('/:id/mark-as-read', async (req: Request, res: Response) => {
  const prisma: PrismaClient = (req as any).prisma;
  const userId = (req as any).userId;
  const { id } = req.params;

  try {
    const notification = await prisma.notifications.updateMany({
      where: { id, user_id: userId },
      data: { status: 'read' },
    });
    if (notification.count === 0) {
      return res.status(404).json({ message: 'Notificação não encontrada.' });
    }
    return res.status(200).json({ message: 'Notificação marcada como lida.' });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// POST /push-subscription - Salvar inscrição push
notificationsRouter.post('/push-subscription', async (req: Request, res: Response) => {
  const prisma: PrismaClient = (req as any).prisma;
  const userId = (req as any).userId;
  const { endpoint, keys } = req.body; // keys: { p256dh, auth }

  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ message: 'Dados da inscrição push inválidos.' });
  }

  try {
    await prisma.push_subscriptions.upsert({
      where: { user_id_endpoint: { user_id: userId, endpoint } },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: {
        user_id: userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });
    return res.status(200).json({ message: 'Inscrição push salva com sucesso.' });
  } catch (error) {
    console.error('Erro ao salvar inscrição push:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});