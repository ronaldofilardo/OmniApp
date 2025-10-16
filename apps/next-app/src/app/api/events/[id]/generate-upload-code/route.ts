import { NextRequest, NextResponse } from 'next/server';
import { generateUploadCode } from '@/services/eventsService';
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
  const { fileType } = await request.json();

  if (!fileType) {
    logger.warn({ eventId: id, body: await request.json() }, 'generate-upload-code called without fileType');
    return NextResponse.json({ message: 'fileType é obrigatório.' }, { status: 400 });
  }

  try {
    const user = getUserFromRequest(request);
    const result = await generateUploadCode(prisma, id, fileType, user.id);
    return NextResponse.json({ message: 'Código de envio gerado com sucesso.', ...result });
  } catch (error: any) {
    logger.error({ err: error, eventId: id }, `Erro ao gerar código de upload para o evento ${id}`);
    return NextResponse.json({ message: 'Erro ao gerar código.' }, { status: error.message.includes('não encontrado') ? 404 : 500 });
  }
}