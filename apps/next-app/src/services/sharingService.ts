import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface SharingSession {
  shareToken: string;
  accessCode: string;
}

export interface AccessTokenPayload {
  sessionId: string;
  fileIds: string[];
}

export async function generateSharingSession(prisma: PrismaClient, fileIds: string[]): Promise<SharingSession> {
  const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = await bcrypt.genSalt(10);
  const accessCodeHash = await bcrypt.hash(accessCode, salt);
  const sessionToken = crypto.randomUUID(); // Using Web Crypto API instead of gen_random_uuid
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.sharing_sessions.create({
    data: {
      user_id: MOCK_USER_ID,
      token: sessionToken,
      access_code_hash: accessCodeHash,
      file_ids: fileIds,
      expires_at: expiresAt
    }
  });

  return { shareToken: sessionToken, accessCode };
}

export async function verifySharingSession(prisma: PrismaClient, shareToken: string, accessCode: string): Promise<string> {
  console.log('🔍 DEBUG: Buscando sessão com token:', shareToken);

  const session = await prisma.sharing_sessions.findFirst({
    where: {
      token: shareToken,
      status: 'pending',
      expires_at: {
        gt: new Date()
      }
    }
  });

  console.log('🔍 DEBUG: Sessão encontrada:', !!session);

  if (!session) {
    throw new Error('Sessão de compartilhamento inválida ou expirada.');
  }

  const isMatch = await bcrypt.compare(accessCode, session.access_code_hash);

  if (!isMatch) {
    throw new Error('Código de acesso incorreto.');
  }

  // Mark session as active
  await prisma.sharing_sessions.update({
    where: { id: session.id },
    data: { status: 'active' }
  });

  // Return session ID as access token (simplified for single user)
  return session.id;
}

export async function getSharedFiles(prisma: PrismaClient, sessionId: string): Promise<any[]> {
  console.log('🔐 DEBUG: Verificando sessão de compartilhamento...');

  // Get session and verify it's active
  const session = await prisma.sharing_sessions.findUnique({
    where: { id: sessionId }
  });

  if (!session || session.status !== 'active') {
    throw new Error('Sessão de compartilhamento inválida.');
  }

  console.log('✅ DEBUG: Sessão válida, fileIds:', session.file_ids);

  const files = await prisma.event_files.findMany({
    where: {
      id: {
        in: session.file_ids
      }
    },
    select: {
      id: true,
      file_name: true,
      file_path: true,
      file_content: true,
      mime_type: true
    }
  });

  console.log('📄 DEBUG: Arquivos encontrados no banco:', files.length);

  return files;
}

export async function getSharingSessionsForDebug(prisma: PrismaClient): Promise<any[]> {
  const sessions = await prisma.sharing_sessions.findMany({
    orderBy: { created_at: 'desc' },
    take: 50,
    select: {
      id: true,
      token: true,
      status: true,
      expires_at: true,
      file_ids: true,
      created_at: true
    }
  });

  return sessions;
}