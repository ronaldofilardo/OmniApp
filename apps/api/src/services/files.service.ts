import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import logger from '../logger';

const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

export async function getFilesForEvent(prisma: PrismaClient, eventId: string) {
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
    // Se tem conteúdo Base64, usar ele; senão manter compatibilidade com file_path
    if (file.file_content) {
      return {
        ...file,
        url: `data:${file.mime_type};base64,${file.file_content}`
      };
    } else if (file.file_path) {
      return {
        ...file,
        url: `${process.env.BASE_URL || 'http://localhost:3333'}/${file.file_path.replace(/\\/g, '/')}`
      };
    }
    return file;
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