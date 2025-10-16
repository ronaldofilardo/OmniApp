import { NextRequest, NextResponse } from 'next/server';
import { getEventById, updateEvent, deleteEvent } from '@/services/eventsService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// Helper to get user from request
function getUserFromRequest(request: NextRequest) {
  return { id: 'mock-user-id' };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = getUserFromRequest(request);
    const event = await getEventById(prisma, id, user.id);
    return NextResponse.json(event);
  } catch (error: any) {
    logger.error({ err: error, eventId: id }, `Erro ao buscar evento ${id}`);
    return NextResponse.json({ message: error.message }, { status: error.message.includes('ID inválido') ? 400 : 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const override_travel_conflict = request.nextUrl.searchParams.get('override_travel_conflict') === 'true';
    const user = getUserFromRequest(request);
    const eventData = await request.json();
    const event = await updateEvent(prisma, id, eventData, override_travel_conflict, user.id);
    return NextResponse.json({ message: 'Evento atualizado com sucesso!', event });
  } catch (error: any) {
    logger.error({ err: error, eventId: id }, `Erro ao atualizar evento ${id}`);
    if (error.conflictType) {
      return NextResponse.json(error, { status: 409 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor.', errors: error.errors }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = getUserFromRequest(request);
    const result = await deleteEvent(prisma, id, user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error({ err: error, eventId: id }, `Erro ao deletar evento ${id}`);
    return NextResponse.json({ message: error.message }, { status: error.message.includes('não encontrado') ? 404 : 500 });
  }
}