import { PrismaClient } from '@prisma/client';

/**
 * Helper para limpar dados de teste do banco
 * Ordem importante: deletar filhos antes dos pais
 */
export async function cleanDatabase(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.reminders.deleteMany(),
    prisma.upload_codes.deleteMany(),
    prisma.event_files.deleteMany(),
    prisma.events.deleteMany(),
    prisma.push_subscriptions.deleteMany(),
    prisma.notifications.deleteMany(),
    prisma.professionals.deleteMany(),
    prisma.users.deleteMany()
  ]);
}

/**
 * Helper para criar usuário de teste
 */
export async function createTestUser(
  prisma: PrismaClient,
  email?: string
) {
  // Gerar email único se não fornecido
  const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
  const uniqueEmail = email || `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
  
  // Usa upsert para garantir idempotência e evitar erro de duplicidade
  const user = await prisma.users.upsert({
    where: { id: MOCK_USER_ID },
    update: {
      email: uniqueEmail,
      password_hash: '$2a$10$testhashedpassword'
    },
    create: {
      id: MOCK_USER_ID,
      email: uniqueEmail,
      password_hash: '$2a$10$testhashedpassword'
    }
  });
  
  // eslint-disable-next-line no-console
  console.log('[createTestUser] Usuário criado:', user.id, user.email, 'confirmado? true');
  return user;
}

/**
 * Helper para criar profissional de teste
 */
export async function createTestProfessional(
  prisma: PrismaClient,
  userId: string,
  name = 'Dr. Teste'
) {
  // Sempre garantir que o usuário existe (idempotente)
  const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
  let validUserId = userId || MOCK_USER_ID;
  let user = await prisma.users.findUnique({ where: { id: validUserId } });
  if (!user) {
    user = await createTestUser(prisma);
    validUserId = user.id;
  }
  
  // eslint-disable-next-line no-console
  console.log('[createTestProfessional] Usuário existe antes de criar profissional?', !!user, validUserId);
  
  // Usa upsert para evitar conflitos de unicidade
  const professional = await prisma.professionals.upsert({
    where: {
      user_id_name_specialty: {
        user_id: validUserId,
        name,
        specialty: 'Teste'
      }
    },
    update: {},
    create: {
      user_id: validUserId,
      name,
      specialty: 'Teste'
    }
  });
  
  // eslint-disable-next-line no-console
  console.log('[createTestProfessional] Profissional criado/encontrado:', professional.id, professional.user_id, professional.name);
  return professional;
}

/**
 * Helper para criar evento de teste
 */
export async function createTestEvent(
  prisma: PrismaClient,
  userId: string,
  professionalName: string,
  overrides: any = {}
) {
  // Garante usuário válido
  // Sempre garantir que o usuário existe (idempotente)
  const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
  let realUserId = userId || MOCK_USER_ID;
  let user = await prisma.users.findUnique({ where: { id: realUserId } });
  if (!user) {
    user = await createTestUser(prisma);
    realUserId = user.id;
  }
  // eslint-disable-next-line no-console
  console.log('[createTestEvent] Usuário existe antes do evento?', !!user, realUserId);
  // Garante profissional válido
  const safeProfessionalName = professionalName || 'Dr. Teste';
  let professional = await prisma.professionals.findFirst({ where: { user_id: realUserId, name: safeProfessionalName } });
  if (!professional) {
    professional = await createTestProfessional(prisma, realUserId, safeProfessionalName);
  }
  // eslint-disable-next-line no-console
  console.log('[createTestEvent] Profissional existe antes do evento?', !!professional, realUserId, safeProfessionalName);
  // Cria evento com data única se não especificada
  const baseDate = overrides.event_date || new Date(Date.now() + Math.random() * 1000000);
  const eventDate = baseDate instanceof Date ? baseDate : new Date(baseDate);
  
  return await prisma.events.create({
    data: {
      user_id: realUserId,
      professional: safeProfessionalName,
      type: 'Consulta',
      event_date: eventDate,
      start_time: new Date('1970-01-01T09:00:00Z'),
      end_time: new Date('1970-01-01T10:00:00Z'),
      ...overrides
    }
  });
}

/**
 * Helper para criar arquivo de teste
 */
export async function createTestFile(
  prisma: PrismaClient,
  eventId: string,
  userId: string,
  overrides: any = {}
) {
  // Garante evento válido
  let event = await prisma.events.findUnique({ where: { id: eventId } });
  let realUserId = userId;
  if (!event) {
    // Cria evento com helpers, que garantem usuário e profissional
    const createdEvent = await createTestEvent(prisma, userId, 'Dr. Teste');
    event = createdEvent;
    realUserId = createdEvent.user_id;
  }
  // Cria o arquivo e retorna o objeto criado
  // Força o user_id a ser o MOCK_USER_ID para compatibilidade com services
  const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
  const file = await prisma.event_files.create({
    data: {
      event_id: event.id,
      user_id: MOCK_USER_ID,
      file_name: overrides.file_name || 'test.pdf',
      file_type: overrides.file_type || 'LaudoResultado',
      mime_type: overrides.mime_type || 'application/pdf',
      file_content: overrides.file_content || Buffer.from('test content').toString('base64'),
      file_path: null, // Opcional
      ...overrides
    }
  });
  return file;
}

/**
 * Helper para criar código de upload de teste
 */
export async function createTestUploadCode(
  prisma: PrismaClient,
  eventId: string,
  userId: string,
  fileType: string,
  plainCode: string,
  hashedCode: string
) {
  return await prisma.upload_codes.create({
    data: {
      event_id: eventId,
      user_id: userId,
      file_type: fileType,
      plain_code: plainCode,
      code_hash: hashedCode,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
      status: 'active'
    }
  });
}

/**
 * Helper para esperar um tempo (útil para testes assíncronos)
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
