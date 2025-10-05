import { PrismaClient } from '@prisma/client';
import { createProfessionalSchema } from '../validations';
import logger from '../logger';

const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

export async function getProfessionals(prisma: PrismaClient) {
  return await prisma.professionals.findMany({
    where: { user_id: MOCK_USER_ID, deleted_at: null },
    orderBy: { name: 'asc' }
  });
}

export async function checkProfessionalExists(prisma: PrismaClient, name: string, specialty: string) {
  const exists = await prisma.professionals.findFirst({
    where: {
      user_id: MOCK_USER_ID,
      name,
      specialty,
      deleted_at: null
    }
  });
  return { exists: !!exists };
}

export async function createProfessional(prisma: PrismaClient, data: any) {
  const validatedData = createProfessionalSchema.parse(data);
  const { name, specialty, address, contact } = validatedData;
  return await prisma.professionals.create({
    data: { name, specialty, address, contact, user_id: MOCK_USER_ID }
  });
}

export async function getProfessionalById(prisma: PrismaClient, id: string) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let professional;
  if (isUUID) {
    professional = await prisma.professionals.findUnique({ where: { id } });
  } else {
    professional = await prisma.professionals.findFirst({
      where: { name: id, user_id: MOCK_USER_ID, deleted_at: null }
    });
  }
  if (!professional || professional.user_id !== MOCK_USER_ID) {
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

export async function getSpecialties(prisma: PrismaClient) {
  const specialties = await prisma.professionals.findMany({
    where: { user_id: MOCK_USER_ID },
    select: { specialty: true },
    distinct: ['specialty']
  });
  return (specialties || []).map(s => s.specialty).filter(Boolean);
}