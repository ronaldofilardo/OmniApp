import { NextRequest, NextResponse } from 'next/server';
import { getProfessionalById, updateProfessional, deleteProfessional } from '@/services/professionalsService';
import logger from '@/logger';
import { prisma } from '@/lib/prisma';

// Helper to get user from request
function getUserFromRequest(request: NextRequest) {
  return { id: 'mock-user-id' };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = getUserFromRequest(request);
    const professional = await getProfessionalById(prisma, user.id, id);
    return NextResponse.json(professional);
  } catch (error: any) {
    logger.error({ err: error, professionalId: id }, `Erro ao buscar profissional ${id}`);
    return NextResponse.json({ message: error.message }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await request.json();
    const updated = await updateProfessional(prisma, id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    logger.error({ err: error }, 'Erro ao atualizar profissional');
    return NextResponse.json({ message: 'Erro ao atualizar profissional.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = getUserFromRequest(request);
    const result = await deleteProfessional(prisma, user.id, id);
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error({ err: error, professionalId: id }, 'Erro ao deletar profissional');
    return NextResponse.json({ message: error.message || 'Erro ao deletar profissional.' }, { status: 400 });
  }
}