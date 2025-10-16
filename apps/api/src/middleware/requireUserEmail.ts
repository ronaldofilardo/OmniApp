import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';

// Middleware de desenvolvimento: injeta usuário quando não há autenticação real.
// - Em NODE_ENV==='test', mantém o usuário mock fixo (compat com testes).
// - Em outros ambientes (dev), resolve/garante o usuário real no banco pelo e-mail,
//   evitando violações de FK (ex.: criação de profissionais).
export async function requireUserEmail(req: Request, res: Response, next: NextFunction) {
  try {
    // Se já houver usuário (ex.: futura autenticação JWT), segue.
    if ((req as any).user) return next();

    const DEFAULT_EMAIL = process.env.DEV_USER_EMAIL || 'user@email.com';
    const DEFAULT_PASSWORD = process.env.DEV_USER_PASSWORD || '1234';

    if (process.env.NODE_ENV === 'test') {
      // Mantém comportamento anterior para a suíte de testes
      (req as any).user = {
        id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        email: DEFAULT_EMAIL,
        name: 'Usuário Teste',
      };
      return next();
    }

    // Ambiente de desenvolvimento: resolver usuário real no banco
    const prisma = (req.app as any)?.locals?.prisma;
    if (!prisma) {
      // Falha segura: injeta mock para não bloquear fluxo,
      // mas isso pode gerar FK se o usuário não existir.
      (req as any).user = {
        id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        email: DEFAULT_EMAIL,
        name: 'Usuário Teste',
      };
      return next();
    }

    let user = await prisma.users.findUnique({ where: { email: DEFAULT_EMAIL } });
    if (!user) {
      // Cria usuário de desenvolvimento se não existir
      const password_hash = await bcrypt.hash(String(DEFAULT_PASSWORD), 10);
      user = await prisma.users.create({
        data: { email: DEFAULT_EMAIL, password_hash },
      });
    }

    (req as any).user = { id: user.id, email: user.email, name: 'Usuário Dev' };
    return next();
  } catch (err) {
    // Em último caso, não bloquear a requisição
    (req as any).user = {
      id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      email: 'user@email.com',
      name: 'Usuário Teste',
    };
    return next();
  }
}
