import { NextRequest, NextResponse } from 'next/server';
import { getSpecialties } from '@/services/professionalsService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// Helper to get user from request
function getUserFromRequest(request: NextRequest) {
  return { id: 'mock-user-id' };
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const specialties = await getSpecialties(prisma, user.id);
    return NextResponse.json(specialties);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao buscar especialidades');
    return NextResponse.json({ message: 'Erro ao buscar especialidades.' }, { status: 500 });
  }
}