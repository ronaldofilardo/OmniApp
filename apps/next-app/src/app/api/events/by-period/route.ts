import { NextRequest, NextResponse } from 'next/server';
import { getEventsByPeriod } from '@/services/eventsService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// Helper to get user from request
function getUserFromRequest(request: NextRequest) {
  return { id: 'mock-user-id' };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
    return NextResponse.json({ message: 'Os parâmetros startDate e endDate são obrigatórios.' }, { status: 400 });
  }

  try {
    const user = getUserFromRequest(request);
    const items = await getEventsByPeriod(prisma, startDate, endDate, user.id);
    return NextResponse.json(items);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar eventos por período');
    return NextResponse.json({ message: 'Erro interno ao buscar eventos por período.' }, { status: 500 });
  }
}