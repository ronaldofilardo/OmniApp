const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function addUser() {
  const email = "user@email.com";
  const password = "1234";

  try {
    // Verificar se usuário já existe
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      console.log("❌ Usuário já existe:", email);
      return;
    }

    // Criar hash da senha
    const password_hash = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.users.create({
      data: {
        email,
        password_hash,
        created_at: new Date(),
      },
    });

    console.log("✅ Usuário criado com sucesso!");
    console.log("📧 Email:", user.email);
    console.log("🆔 ID:", user.id);
    console.log("🔑 Senha: 1234");
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addUser();
