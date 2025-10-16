import { NextRequest, NextResponse } from 'next/server';
import { restoreEvent } from '@/services/repositoryService';
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
    const result = await restoreEvent(prisma, id, user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Erro ao restaurar evento.';
    logger.error({ err: error, eventId: id }, `Erro ao restaurar evento ${id}`);
    return NextResponse.json({ message }, { status: 500 });
  }
}