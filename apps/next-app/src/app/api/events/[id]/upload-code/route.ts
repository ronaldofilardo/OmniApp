import { NextRequest, NextResponse } from 'next/server';
import { getUploadCodeForEvent } from '@/services/eventsService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const fileType = searchParams.get('fileType');

  if (!fileType || typeof fileType !== 'string') {
    return NextResponse.json({ message: 'fileType query param is required.' }, { status: 400 });
  }

  try {
    const code = await getUploadCodeForEvent(prisma, id, fileType);
    if (!code) {
      return NextResponse.json({ message: 'No active upload code found.' }, { status: 404 });
    }
    return NextResponse.json({ uploadCode: code });
  } catch (err: any) {
    logger.error({ err, eventId: id, query: searchParams }, 'Erro ao buscar código de upload existente');
    return NextResponse.json({ message: 'Erro ao recuperar código.' }, { status: 500 });
  }
}