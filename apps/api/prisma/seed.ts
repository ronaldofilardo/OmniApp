import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Cria usuário de exemplo com o ID MOCK_USER_ID
  const user = await prisma.users.upsert({
    where: { email: 'exemplo@teste.com' },
    update: { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
    create: {
      id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      email: 'exemplo@teste.com',
      password_hash: 'senha123',
    },
  });

  console.log('Usuário criado/atualizado:', user);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
