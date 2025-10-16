import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/services/filesService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// DELETE /api/files/:fileId - Deletar arquivo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params;
  try {
    const result = await deleteFile(prisma, fileId);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error({ err: error }, 'Erro ao deletar arquivo');
    return NextResponse.json({ message: error.message }, { status: 404 });
  }
}