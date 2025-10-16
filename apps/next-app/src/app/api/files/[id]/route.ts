import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;

    const file = await prisma.event_files.findUnique({
      where: { id: fileId },
      select: {
        file_content: true,
        mime_type: true,
        file_name: true
      }
    });

    if (!file || !file.file_content) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
    }

    // Converter Base64 para Buffer
    const fileBuffer = Buffer.from(file.file_content, 'base64');

    // Retornar o arquivo com headers apropriados
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mime_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${file.file_name || 'arquivo'}"`,
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error) {
    console.error('Erro ao buscar arquivo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}