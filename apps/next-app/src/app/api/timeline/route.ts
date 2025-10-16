import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as eventsService from '@/services/events.service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
    return NextResponse.json({ message: 'Os parâmetros startDate e endDate são obrigatórios.' }, { status: 400 });
  }

  try {
    const items = await eventsService.getTimeline(prisma, startDate, endDate);
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno ao buscar a timeline.' }, { status: 500 });
  }
}