import { NextRequest, NextResponse } from 'next/server';
import { getEvents, createEvent } from '@/services/eventsService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// Helper to get user from request
function getUserFromRequest(request: NextRequest) {
  return { id: 'mock-user-id' };
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const events = await getEvents(prisma, user.id);
    return NextResponse.json(events);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar eventos');
    return NextResponse.json({ message: 'Erro ao buscar eventos.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const override_travel_conflict = request.nextUrl.searchParams.get('override_travel_conflict') === 'true';
    const user = getUserFromRequest(request);
    const eventData = await request.json();
    const event = await createEvent(prisma, eventData, override_travel_conflict, user.id);
    return NextResponse.json({ message: 'Evento criado com sucesso!', event }, { status: 201 });
  } catch (error: any) {
    logger.error({ err: error }, 'Erro ao criar evento');
    if (error.conflictType) {
      return NextResponse.json(error, { status: 409 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor.', error, errors: error.errors }, { status: 500 });
  }
}