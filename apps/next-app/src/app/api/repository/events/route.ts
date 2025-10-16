import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryEvents } from '@/services/repositoryService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// Helper to get user from request
function getUserFromRequest(request: NextRequest) {
  return { id: 'mock-user-id' };
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const events = await getRepositoryEvents(prisma, user.id);
    return NextResponse.json(events);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao listar eventos do repositório');
    return NextResponse.json({ message: 'Erro ao listar eventos do repositório.' }, { status: 500 });
  }
}