# 🧪 Guia de Testes Automatizados - API

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura de Testes](#estrutura-de-testes)
- [Configuração](#configuração)
- [Executando Testes](#executando-testes)
- [Escrevendo Testes](#escrevendo-testes)
- [Boas Práticas](#boas-práticas)
- [CI/CD](#cicd)

## 🎯 Visão Geral

Esta suíte de testes automatizados foi criada para garantir a qualidade e prevenir regressões no desenvolvimento da API. Utilizamos **Vitest** como framework de testes por sua velocidade e compatibilidade com TypeScript.

### Cobertura de Testes

- ✅ **Testes Unitários**: Serviços e funções isoladas
- ✅ **Testes de Integração**: Rotas e fluxos completos
- ✅ **Testes de Middleware**: Validações e autenticação
- ✅ **Code Coverage**: Relatórios de cobertura de código

## 📁 Estrutura de Testes

```
tests/
├── setup.ts                      # Configuração global
├── helpers/
│   ├── mocks.ts                  # Mocks reutilizáveis
│   └── database.ts               # Helpers de banco de dados
├── services/                     # Testes unitários de serviços
│   ├── files.service.test.ts
│   ├── events.service.test.ts
│   └── ...
├── integration/                  # Testes de integração
│   ├── files.router.integration.test.ts
│   └── ...
└── middleware/                   # Testes de middleware
    └── requireUserEmail.test.ts
```

## ⚙️ Configuração

### Pré-requisitos

1. **Banco de Dados de Teste**

   Crie um banco separado para testes:

   ```sql
   CREATE DATABASE omni_mvp_test;
   ```

2. **Variáveis de Ambiente**

   Configure no arquivo `.env`:

   ```env
   DATABASE_URL=postgresql://postgres:123456@localhost:5432/omni_mvp_test
   ```

3. **Dependências**

   As dependências já estão instaladas no projeto:

   - vitest
   - @vitest/ui
   - supertest
   - @types/supertest

## 🚀 Executando Testes

### Comandos Disponíveis

```bash
# Executar todos os testes uma vez
pnpm test:unit

# Executar testes em modo watch (detecta alterações)
pnpm test:watch

# Executar testes com interface UI
pnpm test:ui

# Gerar relatório de cobertura
pnpm test:coverage

# Executar testes específicos
pnpm test files.service

# Executar apenas testes de integração
pnpm test integration
```

### Saída Esperada

```
✓ tests/services/files.service.test.ts (15)
✓ tests/services/events.service.test.ts (12)
✓ tests/integration/files.router.integration.test.ts (8)

Test Files  3 passed (3)
     Tests  35 passed (35)
  Duration  2.34s
```

## ✍️ Escrevendo Testes

### Estrutura de um Teste

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cleanDatabase, createTestUser } from "../helpers/database";
import { prisma } from "../setup";

describe("Nome do Módulo", () => {
  beforeEach(async () => {
    // Setup antes de cada teste
    await cleanDatabase(prisma);
  });

  afterEach(async () => {
    // Cleanup após cada teste
    await cleanDatabase(prisma);
  });

  describe("funcionalidade específica", () => {
    it("should comportamento esperado", async () => {
      // Arrange (preparar)
      const user = await createTestUser(prisma);

      // Act (executar)
      const result = await algumServico(user.id);

      // Assert (verificar)
      expect(result).toBeTruthy();
      expect(result.id).toBe(user.id);
    });
  });
});
```

### Padrão AAA (Arrange-Act-Assert)

Sempre organize seus testes seguindo este padrão:

1. **Arrange**: Preparar dados e configuração
2. **Act**: Executar a ação sendo testada
3. **Assert**: Verificar o resultado

### Helpers Disponíveis

#### Database Helpers

```typescript
import {
  cleanDatabase,
  createTestUser,
  createTestEvent,
  createTestFile,
  createTestProfessional,
} from "../helpers/database";

// Limpar banco
await cleanDatabase(prisma);

// Criar usuário de teste
const user = await createTestUser(prisma, "test@example.com");

// Criar evento de teste
const event = await createTestEvent(prisma, userId, "Dr. Teste");

// Criar arquivo de teste
const file = await createTestFile(prisma, eventId, userId);
```

#### Mocks Helpers

```typescript
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockPrisma,
  createMockPool,
} from "../helpers/mocks";

// Mock de Request
const req = createMockRequest({
  body: { email: "test@example.com" },
  params: { id: "123" },
});

// Mock de Response
const res = createMockResponse();

// Mock de Next
const next = createMockNext();
```

## 📊 Cobertura de Código

### Meta de Cobertura

- **Linhas**: 80%
- **Funções**: 80%
- **Branches**: 75%
- **Statements**: 80%

### Visualizar Relatório

Após executar `pnpm test:coverage`, abra:

```
coverage/index.html
```

## ✅ Boas Práticas

### 1. Testes Isolados

❌ **Evite:**

```typescript
let sharedUser; // Estado compartilhado entre testes

it("test 1", () => {
  sharedUser = createUser();
});

it("test 2", () => {
  // Depende do test 1
  expect(sharedUser).toBeTruthy();
});
```

✅ **Faça:**

```typescript
it("test 1", async () => {
  const user = await createTestUser(prisma);
  // Teste isolado
});

it("test 2", async () => {
  const user = await createTestUser(prisma);
  // Teste independente
});
```

### 2. Nomes Descritivos

❌ **Evite:**

```typescript
it("should work", () => {
  // Muito genérico
});
```

✅ **Faça:**

```typescript
it("should return 404 when file does not exist", () => {
  // Descritivo e específico
});
```

### 3. Limpar Dados

```typescript
beforeEach(async () => {
  await cleanDatabase(prisma);
});

afterEach(async () => {
  await cleanDatabase(prisma);
});
```

### 4. Testar Casos de Erro

```typescript
it("should throw error when file not found", async () => {
  await expect(deleteFile(prisma, "non-existent-id")).rejects.toThrow(
    "File not found"
  );
});
```

### 5. Usar Matchers Apropriados

```typescript
// ✅ Bom
expect(array).toHaveLength(3);
expect(value).toBeTruthy();
expect(error).toBeInstanceOf(Error);

// ❌ Ruim
expect(array.length).toBe(3);
expect(!!value).toBe(true);
```

## 🔄 CI/CD

### GitHub Actions

Arquivo `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: 123456
          POSTGRES_DB: omni_mvp_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run migrations
        run: pnpm prisma migrate deploy
        working-directory: apps/api

      - name: Run tests
        run: pnpm test:coverage
        working-directory: apps/api

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/lcov.info
```

### Pre-commit Hook

Instale Husky para executar testes antes de commits:

```bash
pnpm add -D husky

# Adicione no package.json
{
  "scripts": {
    "prepare": "husky install"
  }
}

# Crie o hook
npx husky add .husky/pre-commit "cd apps/api && pnpm test:unit"
```

## 🐛 Debugging

### VS Code

Adicione ao `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test:unit"],
      "cwd": "${workspaceFolder}/apps/api",
      "console": "integratedTerminal"
    }
  ]
}
```

### Console Logs

```typescript
it("should debug test", async () => {
  const result = await someFunction();
  console.log("Debug:", result); // Será exibido no terminal
  expect(result).toBeTruthy();
});
```

## 📝 Checklist para Novos Testes

- [ ] Teste segue o padrão AAA (Arrange-Act-Assert)
- [ ] Nome do teste é descritivo
- [ ] Testes são isolados e independentes
- [ ] Dados de teste são limpos antes/depois
- [ ] Casos de sucesso E erro são testados
- [ ] Usa matchers apropriados
- [ ] Não tem lógica complexa no teste
- [ ] Executa em < 100ms (se possível)

## 🆘 Problemas Comuns

### Erro: "Database connection failed"

**Solução**: Verifique se o PostgreSQL está rodando e a URL do banco está correta.

```bash
# Verificar se está rodando
pg_isready -h localhost -p 5432

# Recriar banco de teste
dropdb omni_mvp_test
createdb omni_mvp_test
```

### Erro: "Timeout"

**Solução**: Aumente o timeout no vitest.config.ts:

```typescript
export default defineConfig({
  test: {
    testTimeout: 20000, // 20 segundos
  },
});
```

### Testes Falhando Intermitentemente

**Solução**: Garanta que os testes são isolados e não dependem de ordem de execução.

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)

---

**Última Atualização**: Outubro 2025
**Mantenedor**: Equipe de Desenvolvimento OmniSaúde
