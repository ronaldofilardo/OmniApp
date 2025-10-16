import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../infra/db/prisma';
import { upload } from '../infra/storage/uploads';
import logger from '../logger';
import { z } from 'zod';

// usar prisma compartilhado do infra para permitir mocks em testes

const submitExamSchema = z.object({
  email: z.string().email(),
  clinic_name: z.string().optional(),
  professional: z.string().min(1),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  // Adicionar tipo de evento (exame ou consulta)
  event_type: z.enum(['Exame', 'Consulta']).default('Exame'),
  // file_type becomes optional because we infer type from file slot names
  file_type: z.string().optional(),
  notes: z.string().optional(),
});

export const externalRouter = Router();

// Campos esperados para arquivos (MVP): um arquivo por slot, chave FormData abaixo
const FILE_SLOTS = [
  { key: 'file_requisicao', label: 'Requisição', type: 'Requisicao' },
  { key: 'file_autorizacao', label: 'Autorização', type: 'Autorizacao' },
  { key: 'file_atestado', label: 'Atestado', type: 'Atestado' },
  { key: 'file_prescricao', label: 'Prescrição', type: 'Prescricao' },
  { key: 'file_laudo_resultado', label: 'Laudo/Resultado', type: 'LaudoResultado' },
  { key: 'file_nota_fiscal', label: 'Nota Fiscal', type: 'NotaFiscal' },
];

// POST /external/submit-exam - aceita 1..6 imagens pequenas (<=2KB) em slots nomeados
externalRouter.post('/submit-exam', upload.fields(
  FILE_SLOTS.map(s => ({ name: s.key, maxCount: 1 }))
), async (req: Request, res: Response) => {
  try {
    // Validação dos dados (campos básicos)
    const validationResult = submitExamSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Dados inválidos.', errors: validationResult.error.issues });
    }

    const { email, clinic_name, professional, event_date, start_time, event_type, notes } = validationResult.data;

    // Extrair arquivos enviados por slot
    const files = (req as any).files as Record<string, Express.Multer.File[]> | undefined;
    const providedFiles: Array<{ slotKey: string; slotLabel: string; type: string; file: Express.Multer.File }> = [];
    for (const s of FILE_SLOTS) {
      const arr = files?.[s.key];
      if (arr && arr.length > 0) {
        providedFiles.push({ slotKey: s.key, slotLabel: s.label, type: s.type, file: arr[0] });
      }
    }

    if (providedFiles.length === 0) {
      return res.status(400).json({ message: 'Ao menos um arquivo de imagem deve ser enviado.' });
    }

    // Validar cada arquivo (imagem e tamanho máximo 2KB)
    for (const pf of providedFiles) {
      const f = pf.file as any;
      console.error('DEBUG: validating file', pf.slotLabel, 'mimetype:', f.mimetype, 'size:', f.size);
      if (!f.mimetype || !f.mimetype.startsWith('image/')) {
        console.error('DEBUG: rejecting non-image file');
        return res.status(400).json({ message: `Arquivo para ${pf.slotLabel} deve ser uma imagem.` });
      }
      if (typeof f.size !== 'number' || f.size > 2 * 1024) {
        console.error('DEBUG: rejecting large file');
        return res.status(400).json({ message: `Arquivo para ${pf.slotLabel} excede o tamanho máximo de 2KB.` });
      }
    }

    // Usar transação para garantir atomicidade
    await prisma.$transaction(async (tx) => {
      // Encontrar usuário pelo email
      const user = await tx.users.findUnique({
        where: { email },
      });
      if (!user) {
        logger.error({ email }, 'Usuário não encontrado para envio externo');
        throw new Error('Usuário não encontrado.');
      }

      // Verificar/Criar profissional
      let existingProfessional = await tx.professionals.findFirst({
        where: {
          user_id: user.id,
          name: professional,
          deleted_at: null,
        },
      });

      let isNewProfessional = false;
      if (!existingProfessional) {
        existingProfessional = await tx.professionals.create({
          data: {
            user_id: user.id,
            name: professional,
            specialty: 'A ser definido',
          },
        });
        isNewProfessional = true;
        logger.info({ userId: user.id, professionalName: professional }, 'Novo profissional criado via envio externo');
      }

      // Verificar se já existe um evento para este usuário, profissional e data
      let existingEvent = await tx.events.findFirst({
        where: {
          user_id: user.id,
          professional: existingProfessional.name,
          event_date: `${event_date}T00:00:00.000Z`,
          type: event_type,
          deleted_at: null,
        },
      });

      let targetEvent;
      let isNewEvent = false;

      if (existingEvent) {
        // Usar evento existente
        targetEvent = existingEvent;
        logger.info({ eventId: existingEvent.id, userId: user.id }, 'Usando evento existente para envio externo');
      } else {
        // Criar novo evento
        const eventData = {
          user_id: user.id,
          type: event_type,
          professional: existingProfessional.name,
          event_date: `${event_date}T00:00:00.000Z`,
          start_time: `1970-01-01T${start_time}:00.000Z`,
          end_time: `1970-01-01T${start_time}:01.000Z`, // +1 minuto
          notes: notes || null,
        };

        targetEvent = await tx.events.create({ data: eventData });
        isNewEvent = true;
        logger.info({ eventId: targetEvent.id, userId: user.id, fileCount: providedFiles.length }, 'Novo evento criado via envio externo');
      }

      // Persistir cada arquivo como um registro em event_files (ou atualizar se já existir)
      for (const pf of providedFiles) {
        const fileContent = pf.file.buffer.toString('base64');

        // Verificar se já existe um arquivo deste tipo para este evento
        const existingFile = await tx.event_files.findFirst({
          where: {
            event_id: targetEvent.id,
            file_type: pf.type,
          },
        });

        if (existingFile) {
          // Atualizar arquivo existente
          await tx.event_files.update({
            where: { id: existingFile.id },
            data: {
              file_name: pf.file.originalname || 'arquivo',
              file_content: fileContent,
              mime_type: pf.file.mimetype || '',
              uploaded_at: new Date(),
            },
          });
          logger.info({ eventId: targetEvent.id, fileType: pf.slotLabel, fileName: pf.file.originalname }, 'Arquivo atualizado via envio externo');
        } else {
          // Criar novo arquivo
          await tx.event_files.create({
            data: {
              event_id: targetEvent.id,
              user_id: user.id,
              file_name: pf.file.originalname || 'arquivo',
              file_content: fileContent,
              mime_type: pf.file.mimetype || '',
              file_type: pf.type,
              uploaded_at: new Date(),
            },
          });
          logger.info({ eventId: targetEvent.id, fileType: pf.slotLabel, fileName: pf.file.originalname }, 'Arquivo criado via envio externo');
        }
      }

      // Enviar notificação sempre, mas com mensagem diferente dependendo do contexto
      const clinicDisplay = clinic_name || 'Clínica/Laboratório';
      let message = '';

      if (isNewEvent) {
        // Novo evento criado
        const sampleType = providedFiles[0].slotLabel;
        message = `${clinicDisplay} enviou ${providedFiles.length} arquivo(s) (${sampleType}) do seu ${event_type.toLowerCase()} com o Dr(a). ${professional}.`;
        if (isNewProfessional) {
          message += ' Por favor, complete o cadastro deste novo profissional.';
        }
      } else {
        // Evento existente atualizado - notificar sobre novos arquivos
        const fileTypes = providedFiles.map(pf => pf.slotLabel).join(', ');
        message = `${clinicDisplay} enviou novos arquivos (${fileTypes}) para o seu ${event_type.toLowerCase()} com o Dr(a). ${professional}.`;
      }

      await createNotification(tx, user.id, message, 'info');
      logger.info({ userId: user.id, message, isNewEvent, fileCount: providedFiles.length }, 'Notificação enviada via envio externo');
    });

    return res.status(201).json({ message: 'Documento(s) enviado(s) com sucesso!' });
  } catch (error: any) {
    logger.error({ err: error }, 'Erro ao processar envio externo');
    // Erros específicos do multer normalmente são instâncias de MulterError
    if (error && error.name === 'MulterError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Usuário não encontrado.') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Função auxiliar para criar notificação
async function createNotification(tx: any, userId: string, message: string, type: 'info' | 'alert' | 'reminder') {
  await tx.notifications.create({
    data: {
      user_id: userId,
      message,
      type,
    },
  });
}