const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const email = 'user@email.com';
  const plainPassword = '1234';
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

  await prisma.users.deleteMany({ where: { email } });

  const user = await prisma.users.create({
    data: {
      id: MOCK_USER_ID,
      email,
      password_hash: passwordHash,
    }
  });

  console.log('Usuário criado:', { id: user.id, email: user.email });
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Erro:', e);
  try { await prisma.$disconnect(); } catch(e) {}
  process.exit(1);
});
