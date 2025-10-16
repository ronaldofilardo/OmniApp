import { NextRequest, NextResponse } from 'next/server';
import { checkProfessionalExists } from '@/services/professionalsService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// Helper to get user from request
function getUserFromRequest(request: NextRequest) {
  return { id: 'mock-user-id' };
}

export async function POST(request: NextRequest) {
  const { name, specialty } = await request.json();
  if (!name || !specialty) {
    return NextResponse.json({ message: 'Nome e especialidade são obrigatórios.' }, { status: 400 });
  }
  try {
    const user = getUserFromRequest(request);
    const result = await checkProfessionalExists(prisma, user.id, name, specialty);
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao verificar profissional');
    return NextResponse.json({ message: 'Erro ao verificar profissional.' }, { status: 500 });
  }
}