import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import logger from '../logger';
import * as notificationsService from './notifications.service';

const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

export async function getFilesForEvent(prisma: PrismaClient, eventId: string, token?: string) {
  const files = await prisma.event_files.findMany({
    where: { event_id: eventId },
    select: {
      id: true,
      file_name: true,
      file_type: true,
      file_path: true,
      file_content: true,
      mime_type: true
    }
  });
  return files.map((file: any) => {
    // URL sem token - acesso livre
    const baseUrl = `${process.env.BASE_URL || 'http://localhost:3333'}/files/${file.id}/view`;
    return {
      ...file,
      url: baseUrl
    };
  });
}

export async function uploadFile(prisma: PrismaClient, eventId: string, file: Express.Multer.File, fileType: string) {
  // Converter o arquivo para Base64
  const fileContent = file.buffer.toString('base64');
  
  const newFile = await prisma.event_files.create({
    data: {
      event_id: eventId,
      file_name: file.originalname, // Usar nome original
      file_type: fileType,
      mime_type: file.mimetype || '',
      file_content: fileContent,    // Salvar como Base64
      file_path: null,              // Não usar filesystem
      user_id: MOCK_USER_ID,
      uploaded_at: new Date()
    }
  });
  return newFile;
}

export async function markFileAsViewed(prisma: PrismaClient, fileId: string) {
  const updated = await prisma.event_files.updateMany({
    where: { id: fileId, user_id: MOCK_USER_ID, viewed_at: null },
    data: { viewed_at: new Date() }
  });
  if (updated.count === 0) {
    throw new Error('Arquivo já estava marcado como visto ou não foi encontrado.');
  }
  return { message: 'Arquivo marcado como visto.' };
}

export async function getFileById(prisma: PrismaClient, fileId: string) {
  const file = await prisma.event_files.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      file_name: true,
      file_type: true,
      file_path: true,
      file_content: true,
      mime_type: true,
      user_id: true
    }
  });
  return file;
}

export async function uploadFileByCode(prisma: PrismaClient, uploadCode: string, file: Express.Multer.File) {
  // Find the upload code
  const codes = await prisma.upload_codes.findMany({
    where: { status: 'active', expires_at: { gt: new Date() } }
  });

  let matchedCode: any = null;
  for (const code of codes) {
    const isMatch = await bcrypt.compare(uploadCode, code.code_hash);
    if (isMatch) {
      matchedCode = code;
      break;
    }
  }

  if (!matchedCode) {
    throw new Error('Código de acesso inválido ou expirado.');
  }

  // Check if file already exists for this event and file_type
  const existingFile = await prisma.event_files.findUnique({
    where: { event_id_file_type: { event_id: matchedCode.event_id, file_type: matchedCode.file_type } }
  });
  if (existingFile) {
    throw new Error('Arquivo já foi enviado para este slot.');
  }

  // Upload the file
  const fileContent = file.buffer.toString('base64');

  const newFile = await prisma.event_files.create({
    data: {
      event_id: matchedCode.event_id,
      file_name: file.originalname,
      file_type: matchedCode.file_type,
      mime_type: file.mimetype,
      file_content: fileContent,
      user_id: matchedCode.user_id,
      uploaded_at: new Date()
    }
  });

  // Mark code as used
  await prisma.upload_codes.update({
    where: { id: matchedCode.id },
    data: { status: 'used' }
  });

  // Notify user about document received
  try {
    const event = await prisma.events.findUnique({
      where: { id: matchedCode.event_id },
      select: { professional: true },
    });
    const professionalName = event?.professional || 'Clínica/Laboratório';
    await notificationsService.notifyDocumentReceived(prisma, matchedCode.event_id, matchedCode.file_type, professionalName);
  } catch (err) {
    logger.error({ err }, 'Erro ao enviar notificação de documento recebido');
    // Não falhar o upload por causa da notificação
  }

  return { message: 'Arquivo enviado com sucesso.', file: newFile };
}

export async function deleteFile(prisma: PrismaClient, fileId: string) {
  const file = await prisma.event_files.findUnique({
    where: { id: fileId }
  });
  if (!file || file.user_id !== MOCK_USER_ID) {
    throw new Error('Arquivo não encontrado.');
  }
  await prisma.event_files.delete({ where: { id: fileId } });
  
  // Apenas deletar arquivo físico se existir (compatibilidade com arquivos antigos)
  if (file.file_path) {
    fs.unlink(file.file_path, (err) => {
      if (err) logger.error({ err, filePath: file.file_path }, `Erro ao deletar arquivo do disco: ${file.file_path}`);
    });
  }
  return { message: 'Arquivo deletado com sucesso.' };
}