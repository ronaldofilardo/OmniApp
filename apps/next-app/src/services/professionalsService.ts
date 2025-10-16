import { PrismaClient } from '@prisma/client';
import { createProfessionalSchema } from 'shared/validations';
import logger from '../logger';

export async function getProfessionals(prisma: PrismaClient, user_id: string) {
  return await prisma.professionals.findMany({
    where: { user_id, deleted_at: null },
    orderBy: { name: 'asc' }
  });
}

export async function checkProfessionalExists(prisma: PrismaClient, user_id: string, name: string, specialty: string) {
  const exists = await prisma.professionals.findFirst({
    where: {
      user_id,
      name,
      specialty,
      deleted_at: null
    }
  });
  return { exists: !!exists };
}

export async function createProfessional(prisma: PrismaClient, user_id: string, data: any) {
  const validatedData = createProfessionalSchema.parse(data);
  const { name, specialty, address, contact } = validatedData;
  return await prisma.professionals.create({
    data: { name, specialty, address, contact, user_id }
  });
}

export async function getProfessionalById(prisma: PrismaClient, user_id: string, id: string) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let professional;
  if (isUUID) {
    professional = await prisma.professionals.findUnique({ where: { id } });
  } else {
    professional = await prisma.professionals.findFirst({
      where: { name: id, user_id, deleted_at: null }
    });
  }
  if (!professional || professional.user_id !== user_id) {
    throw new Error('Profissional não encontrado.');
  }
  return professional;
}

export async function updateProfessional(prisma: PrismaClient, id: string, data: any) {
  const validatedData = createProfessionalSchema.parse(data);
  const { name, specialty, address, contact } = validatedData;
  return await prisma.professionals.update({
    where: { id },
    data: { name, specialty, address, contact }
  });
}

export async function getSpecialties(prisma: PrismaClient, user_id: string) {
  const specialties = await prisma.professionals.findMany({
    where: { user_id },
    select: { specialty: true },
    distinct: ['specialty']
  });
  return (specialties || []).map(s => s.specialty).filter(Boolean);
}

export async function deleteProfessional(prisma: PrismaClient, user_id: string, id: string) {
  // Busca o profissional garantindo que pertence ao usuário
  const professional = await prisma.professionals.findUnique({ where: { id } });
  if (!professional || professional.user_id !== user_id) {
    throw new Error('Profissional não encontrado.');
  }

  // Conta eventos não deletados que referenciam este profissional pelo nome
  const eventsCount = await prisma.events.count({
    where: { user_id, professional: professional.name, deleted_at: null }
  });

  if (eventsCount > 0) {
    // Soft delete: apenas marca deleted_at
    const updated = await prisma.professionals.update({
      where: { id },
      data: { deleted_at: new Date() }
    });
    return { action: 'soft_delete', professional: updated };
  } else {
    // Sem eventos: pode remover fisicamente
    await prisma.professionals.delete({ where: { id } });
    return { action: 'hard_delete', professionalId: id };
  }
}