import { NextRequest, NextResponse } from 'next/server';
import { getProfessionals, createProfessional, checkProfessionalExists } from '@/services/professionalsService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// Helper to get user from request (assuming JWT middleware or similar)
function getUserFromRequest(request: NextRequest) {
  // This would need to be implemented based on your auth system
  // For now, returning a mock user ID
  return { id: 'mock-user-id' };
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const professionals = await getProfessionals(prisma, user.id);
    return NextResponse.json(professionals);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar profissionais');
    return NextResponse.json({ message: 'Erro ao buscar profissionais.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const body = await request.json();
    const newProfessional = await createProfessional(prisma, user.id, body);
    return NextResponse.json(newProfessional, { status: 201 });
  } catch (error: any) {
    // Trata violação de unicidade (user_id, name, specialty)
    const code = error?.code;
    if (code === 'P2002') {
      return NextResponse.json({ message: 'Já existe um profissional com este nome e especialidade.' }, { status: 409 });
    }
    logger.error({ err: error }, 'Erro ao criar profissional');
    return NextResponse.json({ message: 'Erro interno ao criar profissional.' }, { status: 500 });
  }
}