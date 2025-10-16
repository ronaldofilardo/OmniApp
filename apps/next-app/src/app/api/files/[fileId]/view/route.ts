import { NextRequest, NextResponse } from 'next/server';
import { getFileById } from '@/services/filesService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// GET /api/files/:fileId/view - Visualizar arquivo
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params;

  // Sem autenticação - acesso livre a todos os arquivos
  try {
    const file = await getFileById(prisma, fileId);
    if (!file) {
      return NextResponse.json({ message: 'Arquivo não encontrado.' }, { status: 404 });
    }

    if (file.file_content) {
      const buffer = Buffer.from(file.file_content, 'base64');
      const response = new NextResponse(buffer);
      response.headers.set('Content-Type', file.mime_type || 'application/octet-stream');
      response.headers.set('Content-Disposition', `inline; filename="${file.file_name}"`);
      return response;
    } else if (file.file_path) {
      // For filesystem files, we'd need to read from disk
      // This is simplified for now
      return NextResponse.json({ message: 'Conteúdo do arquivo não disponível.' }, { status: 404 });
    } else {
      return NextResponse.json({ message: 'Conteúdo do arquivo não disponível.' }, { status: 404 });
    }
  } catch (error: any) {
    logger.error({ err: error }, 'Erro ao visualizar arquivo');
    return NextResponse.json({ message: 'Erro ao visualizar arquivo.' }, { status: 500 });
  }
}