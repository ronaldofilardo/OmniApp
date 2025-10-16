import { NextRequest, NextResponse } from 'next/server';
import { confirmDeleteEvent } from '@/services/repositoryService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// Helper to get user from request
function getUserFromRequest(request: NextRequest) {
  return { id: 'mock-user-id' };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = getUserFromRequest(request);
    const result = await confirmDeleteEvent(prisma, id, user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Erro ao remover evento permanentemente.';
    logger.error({ err: error, eventId: id }, `Erro ao confirmar deleção do evento ${id}`);
    return NextResponse.json({ message }, { status: 500 });
  }
}