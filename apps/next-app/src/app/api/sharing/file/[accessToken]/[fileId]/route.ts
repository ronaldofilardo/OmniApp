import { NextRequest, NextResponse } from 'next/server';
import { getSharedFiles } from '@/services/sharingService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// GET /sharing/file/:sessionId/:fileId - Stream do conteúdo do arquivo
export async function GET(
  request: NextRequest,
  { params }: { params: { accessToken: string; fileId: string } }
) {
  const { accessToken: sessionId, fileId } = params;
  try {
    // Reusar verificação da sessão via getSharedFiles (lança se inválido)
    const files = await getSharedFiles(prisma, sessionId);
    const allowed = files.find((f: any) => String(f.id) === String(fileId));
    if (!allowed) {
      return NextResponse.json({ message: 'Arquivo não autorizado para esta sessão.' }, { status: 404 });
    }

    // Buscar o arquivo específico para obter conteúdo/mime atualizados
    const file = await prisma.event_files.findUnique({
      where: { id: fileId },
      select: {
        file_name: true,
        mime_type: true,
        file_content: true
      }
    });

    if (!file) {
      return NextResponse.json({ message: 'Arquivo não encontrado.' }, { status: 404 });
    }

    if (!file.file_content) {
      return NextResponse.json({ message: 'Arquivo sem conteúdo.' }, { status: 404 });
    }

    const mime = file.mime_type || 'application/octet-stream';
    const buffer = Buffer.from(file.file_content, 'base64');

    // Content-Disposition com filename ASCII e UTF-8 (RFC 5987)
    const originalName: string = file.file_name || 'arquivo';
    const asciiName = originalName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '');
    const encodedName = encodeURIComponent(originalName);
    const isInline = String(mime).startsWith('image/') || String(mime) === 'application/pdf';
    const dispositionType = isInline ? 'inline' : 'attachment';

    const response = new NextResponse(buffer);
    response.headers.set('Content-Type', mime);
    response.headers.set('Content-Length', buffer.length.toString());
    response.headers.set('Content-Disposition', `${dispositionType}; filename="${asciiName || 'arquivo'}"; filename*=UTF-8''${encodedName}`);
    return response;
  } catch (error: any) {
    console.log('❌ DEBUG: Erro ao servir arquivo compartilhado:', error?.message || error);
    return NextResponse.json({ message: 'Token de acesso inválido ou expirado.' }, { status: 401 });
  }
}