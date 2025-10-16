import { NextRequest, NextResponse } from 'next/server';
import { getFilesForEvent, uploadFile } from '@/services/filesService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// Helper to get user from request
function getUserFromRequest(request: NextRequest) {
  return { id: 'mock-user-id' };
}

// GET /api/files/events/:eventId/files - Buscar arquivos do evento
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

  try {
    const files = await getFilesForEvent(prisma, eventId, token);
    return NextResponse.json(files);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar arquivos');
    return NextResponse.json({ message: 'Erro ao buscar arquivos.' }, { status: 500 });
  }
}

// POST /api/files/events/:eventId/files - Upload de arquivo
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('file_type') as string;

    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo enviado.' }, { status: 400 });
    }
    if (!fileType) {
      return NextResponse.json({ message: 'O tipo do arquivo é obrigatório.' }, { status: 400 });
    }

    // Convert File to buffer-like object
    const buffer = Buffer.from(await file.arrayBuffer());

    const mockFile = {
      buffer,
      originalname: file.name,
      mimetype: file.type,
      size: file.size
    };

    const created = await uploadFile(prisma, eventId, mockFile, fileType);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    logger.error({ err: error }, 'Erro ao salvar arquivo');
    return NextResponse.json({ message: 'Erro ao salvar arquivo.' }, { status: 500 });
  }
}