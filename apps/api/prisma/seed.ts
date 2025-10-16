import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'user@email.com';
  const plainPassword = '1234';

  // Gera hash com salt rounds compatível com bcryptjs (10 rounds)
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

  console.log('Removendo todos os usuários existentes...');
  try {
    const del = await prisma.users.deleteMany({});
    console.log('Usuários removidos:', del.count);
  } catch (e) {
    console.error('Erro ao remover usuários:', e);
  }

  console.log('Criando usuário de teste...');
  try {
    const user = await prisma.users.create({
      data: {
        id: MOCK_USER_ID,
        email,
        password_hash: passwordHash,
      }
    });
    console.log('Usuário criado/atualizado:', { id: user.id, email: user.email });
  } catch (e) {
    console.error('Erro ao criar usuário:', e);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
