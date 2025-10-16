import { PrismaClient } from '@prisma/client';
import logger from '../logger';

const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

// Função para criar notificação
export async function createNotification(
  prisma: PrismaClient,
  userId: string,
  message: string,
  type: 'info' | 'alert' | 'reminder',
  actionUrl?: string
) {
  try {
    const notification = await prisma.notifications.create({
      data: {
        user_id: userId,
        message,
        type,
        action_url: actionUrl,
      },
    });
    logger.info({ notificationId: notification.id, userId, type }, 'Notificação criada');

    // Disparar envio de push em background
    setImmediate(() => sendPushNotification(prisma, userId, message, actionUrl));

    return notification;
  } catch (error) {
    logger.error({ err: error, userId, message }, 'Erro ao criar notificação');
    throw error;
  }
}

// Função para enviar push notification
async function sendPushNotification(
  prisma: PrismaClient,
  userId: string,
  message: string,
  actionUrl?: string
) {
  try {
    const subscriptions = await prisma.push_subscriptions.findMany({
      where: { user_id: userId },
    });

    if (subscriptions.length === 0) {
      logger.info({ userId }, 'Nenhuma inscrição push encontrada para o usuário');
      return;
    }

    const payload = {
      title: 'Omni Saúde',
      body: message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        actionUrl: actionUrl || '/',
      },
    };

    // Para cada inscrição, enviar push
    for (const sub of subscriptions) {
      try {
        // Simular envio de push (em produção, usar web-push ou similar)
        logger.info({ userId, endpoint: sub.endpoint }, 'Enviando push notification');
        // Aqui seria o código para enviar via FCM ou diretamente
        // Por exemplo: await webpush.sendNotification(sub, JSON.stringify(payload));
      } catch (error) {
        logger.error({ err: error, userId, endpoint: sub.endpoint }, 'Erro ao enviar push notification');
      }
    }
  } catch (error) {
    logger.error({ err: error, userId }, 'Erro ao enviar push notifications');
  }
}

// Função para gatilho: documento recebido
export async function notifyDocumentReceived(
  prisma: PrismaClient,
  eventId: string,
  fileType: string,
  professionalName?: string
) {
  // Buscar o userId do evento
  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: { user_id: true, type: true },
  });

  if (!event) {
    logger.warn({ eventId }, 'Evento não encontrado para notificação');
    return;
  }

  const userId = event.user_id;
  const eventType = event.type;
  const profName = professionalName || 'Clínica/Laboratório';

  const message = `${profName} enviou o seu ${fileType} para o evento '${eventType}'.`;
  const actionUrl = `/timeline?eventId=${eventId}`;

  await createNotification(prisma, userId, message, 'info', actionUrl);
}