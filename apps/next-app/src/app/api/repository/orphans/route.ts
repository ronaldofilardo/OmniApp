import { NextRequest, NextResponse } from 'next/server';
import { getOrphanFiles } from '@/services/repositoryService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// Helper to get user from request
function getUserFromRequest(request: NextRequest) {
  return { id: 'mock-user-id' };
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    // Note: This service uses raw SQL, so we need to adapt it for Prisma
    // For now, we'll use a simplified version
    const files = await getOrphanFiles(prisma, user.id, request);
    return NextResponse.json(files);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar arquivos órfãos');
    return NextResponse.json({ message: 'Erro ao buscar arquivos órfãos.' }, { status: 500 });
  }
}