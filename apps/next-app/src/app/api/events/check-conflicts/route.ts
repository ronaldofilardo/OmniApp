import { NextRequest, NextResponse } from 'next/server';
import { checkConflicts } from '@/services/eventsService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// Helper to get user from request
function getUserFromRequest(request: NextRequest) {
  return { id: 'mock-user-id' };
}

export async function POST(request: NextRequest) {
  try {
    const { event_date, start_time, end_time, professional, excludeId } = await request.json();
    const user = getUserFromRequest(request);
    const result = await checkConflicts(prisma, event_date, start_time, end_time, professional, excludeId, user.id);
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao checar conflitos');
    return NextResponse.json({ message: 'Erro interno ao checar conflitos.' }, { status: 500 });
  }
}