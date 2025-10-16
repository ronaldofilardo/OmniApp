import { NextRequest, NextResponse } from 'next/server';
import { uploadFileByCode } from '@/services/filesService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// POST /api/files/upload-by-code - Upload por código
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const uploadCode = formData.get('upload_code') as string;
    const file = formData.get('file') as File;

    if (!uploadCode) {
      return NextResponse.json({ message: 'Código de acesso é obrigatório.' }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ message: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Validate file type (JPG up to 2KB)
    if (file.type !== 'image/jpeg') {
      return NextResponse.json({ message: 'Apenas arquivos JPG são permitidos.' }, { status: 400 });
    }
    if (file.size > 2 * 1024) {
      return NextResponse.json({ message: 'Arquivo muito grande. Máximo permitido: 2KB.' }, { status: 400 });
    }

    // Convert File to buffer-like object
    const buffer = Buffer.from(await file.arrayBuffer());

    const mockFile = {
      buffer,
      originalname: file.name,
      mimetype: file.type,
      size: file.size
    };

    const result = await uploadFileByCode(prisma, uploadCode, mockFile);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    logger.error({ err: error }, 'Erro ao fazer upload por código');
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}