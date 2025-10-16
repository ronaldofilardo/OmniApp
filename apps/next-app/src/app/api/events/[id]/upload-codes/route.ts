import { NextRequest, NextResponse } from 'next/server';
import { getUploadCodesForEvent } from '@/services/eventsService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const map = await getUploadCodesForEvent(prisma, id);
    return NextResponse.json({ codes: map });
  } catch (err: any) {
    logger.error({ err, eventId: id }, 'Erro ao buscar códigos de upload do evento');
    return NextResponse.json({ message: 'Erro ao recuperar códigos.' }, { status: 500 });
  }
}