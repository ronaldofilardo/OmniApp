import { NextRequest, NextResponse } from 'next/server';
import { verifySharingSession } from '@/services/sharingService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// POST /sharing/verify - Verificar código de acesso e gerar token
export async function POST(request: NextRequest) {
  const { shareToken, accessCode } = await request.json();
  try {
    logger.debug('--- [DEBUG] /sharing/verify ---');
    logger.debug({ shareToken, accessCode: accessCode ? 'REDACTED' : undefined }, 'sharing.verify inputs');

    const accessToken = await verifySharingSession(prisma, shareToken, accessCode);

    logger.info('Acesso concedido para sessão de compartilhamento');
    return NextResponse.json({ accessToken });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Erro ao verificar código de acesso.';
    logger.error({ err: error }, message);

    if (message.includes('inválida ou expirada')) {
      logger.warn({ shareToken }, 'Sessão não encontrada ou expirada para token');
      return NextResponse.json({ message }, { status: 404 });
    } else if (message.includes('incorreto')) {
      logger.warn({ shareToken }, 'Código de acesso incorreto para token');
      return NextResponse.json({ message }, { status: 401 });
    } else {
      return NextResponse.json({ message, error: message }, { status: 500 });
    }
  }
}