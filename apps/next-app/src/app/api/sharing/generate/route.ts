import { NextRequest, NextResponse } from 'next/server';
import { generateSharingSession } from '@/services/sharingService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';
import getLocalIp from '@/lib/network'; // Need to create this utility

// POST /sharing/generate - Gerar nova sessão de compartilhamento
export async function POST(request: NextRequest) {
  const { fileIds } = await request.json();
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return NextResponse.json({ message: 'Nenhum arquivo selecionado para compartilhamento.' }, { status: 400 });
  }

  try {
    const session = await generateSharingSession(prisma, fileIds);

    // Construir URL de compartilhamento - padronizar para localhost
    const requestHost = request.headers.get('host');
    const localIp = getLocalIp();

    // Sempre usar localhost para consistência, exceto se explicitamente em produção
    const hostToUse = process.env.NODE_ENV === 'production' && localIp !== 'localhost' && !localIp.startsWith('127.')
      ? localIp
      : 'localhost';

    const frontendPort = process.env.VITE_PORT || process.env.FRONTEND_PORT || '5173';
    const protocol = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
    const shareUrl = `${protocol}://${hostToUse}:${frontendPort}/share/${session.shareToken}`;

    logger.info({ shareUrl, hostToUse, requestHost, localIp, nodeEnv: process.env.NODE_ENV }, 'URL de compartilhamento gerada');
    console.log('🔗 DEBUG: ShareURL gerada:', shareUrl);
    return NextResponse.json({ ...session, shareUrl });
  } catch (error) {
    logger.error({ err: error }, 'Erro ao gerar link de compartilhamento');
    return NextResponse.json({ message: 'Erro ao gerar link de compartilhamento.' }, { status: 500 });
  }
}