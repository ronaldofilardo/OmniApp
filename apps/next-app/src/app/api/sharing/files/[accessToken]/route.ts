import { NextRequest, NextResponse } from 'next/server';
import { getSharedFiles } from '@/services/sharingService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// GET /sharing/files/:sessionId - Obter arquivos compartilhados
export async function GET(
  request: NextRequest,
  { params }: { params: { accessToken: string } }
) {
  const { accessToken: sessionId } = params;
  console.log('🔍 DEBUG: Buscando arquivos com sessionId:', sessionId.substring(0, 20) + '...');
  try {
    const files = await getSharedFiles(prisma, sessionId);
    console.log('📁 DEBUG: Arquivos encontrados:', files.length);

    // Para melhorar compatibilidade, retornar URL HTTP de streaming
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
    const filesWithUrls = files.map((file: any) => {
      const url = `${protocol}://${host}/api/sharing/file/${sessionId}/${file.id}`;
      return { id: file.id, fileName: file.file_name, url };
    });

    console.log('✅ DEBUG: Enviando resposta com', filesWithUrls.length, 'arquivos');
    return NextResponse.json(filesWithUrls);
  } catch (error: any) {
    console.log('❌ DEBUG: Erro ao buscar arquivos:', error?.message || error);
    logger.error({ err: error }, 'Erro ao buscar arquivos compartilhados');
    return NextResponse.json({ message: 'Sessão de compartilhamento inválida.' }, { status: 401 });
  }
}