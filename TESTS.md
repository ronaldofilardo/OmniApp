# 🚀 Suite de Testes Automatizados - OmniSaúde

## ✅ O que foi criado

Implementamos uma suíte completa de testes automatizados para prevenir regressões e garantir qualidade no desenvolvimento.

### 📦 Estrutura Criada

```
apps/api/
├── vitest.config.ts          ✨ Configuração do Vitest
├── tests/
│   ├── README.md             📚 Guia completo de testes
│   ├── setup.ts              ⚙️ Configuração global
│   ├── helpers/
│   │   ├── mocks.ts          🎭 Mocks reutilizáveis
│   │   └── database.ts       🗄️ Helpers de banco
│   ├── services/
│   │   ├── files.service.test.ts      🧪 Testes de arquivos
│   │   └── events.service.test.ts     🧪 Testes de eventos
│   ├── integration/
│   │   └── files.router.integration.test.ts  🔗 Testes de integração
│   └── middleware/
│       └── requireUserEmail.test.ts   🛡️ Testes de middleware
└── package.json              📝 Scripts atualizados

.github/workflows/
└── tests.yml                 🤖 CI/CD automatizado
```

## 🎯 Funcionalidades

### 1. **Testes Unitários**

- ✅ Testes de serviços (files, events)
- ✅ Testes de helpers e utilitários
- ✅ Mocks reutilizáveis para Prisma e Pool

### 2. **Testes de Integração**

- ✅ Testes de rotas completas
- ✅ Validação de request/response
- ✅ Testes de upload de arquivos

### 3. **Cobertura de Código**

- ✅ Relatórios HTML, JSON e LCOV
- ✅ Metas de cobertura configuradas:
  - Linhas: 80%
  - Funções: 80%
  - Branches: 75%
  - Statements: 80%

### 4. **CI/CD**

- ✅ GitHub Actions configurado
- ✅ Testes rodando automaticamente em PRs
- ✅ Upload de cobertura para Codecov

## 🚀 Como Usar

### Executar Testes

```bash
# Entrar na pasta da API
cd apps/api

# Executar todos os testes uma vez
pnpm test:unit

# Executar em modo watch (detecta alterações)
pnpm test:watch

# Interface visual dos testes
pnpm test:ui

# Gerar relatório de cobertura
pnpm test:coverage
```

### Ver Cobertura

Após executar `pnpm test:coverage`, abra:

```
apps/api/coverage/index.html
```

## 📝 Scripts Disponíveis

```json
{
  "test": "vitest", // Modo interativo
  "test:unit": "vitest run", // Executa uma vez
  "test:watch": "vitest watch", // Modo watch
  "test:coverage": "vitest run --coverage", // Com cobertura
  "test:ui": "vitest --ui" // Interface visual
}
```

## 🧪 Exemplo de Teste

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { cleanDatabase, createTestUser } from "../helpers/database";
import { prisma } from "../setup";

describe("Files Service", () => {
  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it("should upload file successfully", async () => {
    // Arrange
    const user = await createTestUser(prisma);

    // Act
    const result = await uploadFile(user.id, mockFile);

    // Assert
    expect(result).toHaveProperty("id");
    expect(result.file_name).toBe("test.pdf");
  });
});
```

## 📊 Metas de Qualidade

| Métrica    | Meta | Atual |
| ---------- | ---- | ----- |
| Linhas     | 80%  | 🎯    |
| Funções    | 80%  | 🎯    |
| Branches   | 75%  | 🎯    |
| Statements | 80%  | 🎯    |

## 🔧 Configuração do Banco de Teste

```sql
-- Criar banco de teste
CREATE DATABASE omni_mvp_test;
```

```env
# .env
DATABASE_URL=postgresql://postgres:123456@localhost:5432/omni_mvp_test
```

## 📚 Helpers Disponíveis

### Database Helpers

```typescript
// Limpar banco
await cleanDatabase(prisma);

// Criar usuário
const user = await createTestUser(prisma, "test@example.com");

// Criar evento
const event = await createTestEvent(prisma, userId, "Dr. Teste");

// Criar arquivo
const file = await createTestFile(prisma, eventId, userId);
```

### Mocks Helpers

```typescript
// Mock de Request/Response/Next
const req = createMockRequest();
const res = createMockResponse();
const next = createMockNext();

// Mock de Prisma
const prisma = createMockPrisma();

// Mock de Pool
const pool = createMockPool();
```

## 🤖 CI/CD Automático

### O que acontece a cada Push/PR:

1. ✅ Setup do ambiente (Node.js, PostgreSQL)
2. ✅ Instalação de dependências
3. ✅ Migração do banco de dados
4. ✅ Execução dos testes
5. ✅ Geração de relatório de cobertura
6. ✅ Upload para Codecov
7. ✅ Verificação de TypeScript

### Status Badge

Adicione ao README principal:

```markdown
![Tests](https://github.com/ronaldofilardo/OmniApp/workflows/Tests/badge.svg)
```

## 📈 Próximos Passos

### Testes a Adicionar

- [ ] Testes de profissionais
- [ ] Testes de backup
- [ ] Testes de conflitos
- [ ] Testes de compartilhamento
- [ ] Testes de notificações
- [ ] Testes de repositório
- [ ] Testes E2E com Playwright

### Melhorias

- [ ] Configurar Husky para pre-commit hooks
- [ ] Adicionar testes de performance
- [ ] Implementar testes de carga
- [ ] Adicionar mutation testing
- [ ] Configurar SonarQube

## 🐛 Troubleshooting

### Erro: "Database connection failed"

```bash
# Verificar PostgreSQL
pg_isready -h localhost -p 5432

# Recriar banco
dropdb omni_mvp_test
createdb omni_mvp_test
pnpm prisma migrate deploy
```

### Testes lentos

```bash
# Executar apenas testes modificados
pnpm test --changed

# Executar testes específicos
pnpm test files.service
```

## 📖 Documentação Completa

Veja [tests/README.md](apps/api/tests/README.md) para guia completo com:

- Boas práticas
- Padrões de código
- Debugging
- Exemplos avançados

## ✨ Benefícios

1. **Previne Regressões**: Detecta bugs antes de ir para produção
2. **Documentação Viva**: Testes servem como exemplos de uso
3. **Refatoração Segura**: Permite mudanças com confiança
4. **Qualidade Garantida**: Mantém padrões de código
5. **CI/CD Automatizado**: Validação em cada commit

## 🎓 Recursos de Aprendizado

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

**Criado em**: Outubro 2025  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para uso
