# 🔧 Correções Necessárias nos Testes

## ✅ Status Atual

- **Passando**: 47/78 testes (60%)
- **Falhando**: 31/78 testes (40%)

## 🐛 Problemas Identificados

### 1. **Foreign Key Constraints (P2003)** ⚠️ CRÍTICO

**Problema**: Helpers de database não incluem `professional_id` obrigatório

**Arquivos afetados**:

- `tests/helpers/database.ts` - `createTestEvent()` e `createTestFile()`

**Solução**:

```typescript
// createTestEvent precisa criar um professional primeiro
export async function createTestEvent(
  prisma: PrismaClient,
  userId: string,
  professionalName: string,
  overrides = {}
) {
  // 1. Criar professional
  const professional = await prisma.professionals.create({
    data: {
      name: professionalName,
      specialty: "Medicina Geral",
    },
  });

  // 2. Criar event com professional_id
  return await prisma.events.create({
    data: {
      user_id: userId,
      professional_id: professional.id, // ← ADICIONAR
      professional: professionalName,
      date: new Date(),
      type: "Consulta",
      ...overrides,
    },
  });
}
```

**Testes afetados**: 15+ testes

---

### 2. **UUID Inválidos (P2023)** ⚠️ MÉDIO

**Problema**: Testes usando strings como "non-existent-id" ou "nonexistent"

**Exemplo**:

```typescript
// ❌ ERRADO
.get('/files/non-existent-id/view')

// ✅ CORRETO
import { randomUUID } from 'crypto';
.get(`/files/${randomUUID()}/view`)
```

**Testes afetados**:

- `tests/integration/files.router.integration.test.ts:114`
- `tests/services/files.service.test.ts:120`
- `tests/routes/files.router.test.ts:202`

---

### 3. **Unique Constraints (P2002)** ⚠️ MÉDIO

**Problema**: Emails duplicados entre testes

**Solução**: Usar emails únicos ou limpar banco antes de cada teste

```typescript
beforeEach(async () => {
  await cleanDatabase(prisma);
  // OU
  const user = await createTestUser(
    prisma,
    `test-${Date.now()}@example.com` // Email único
  );
});
```

**Testes afetados**:

- `tests/routes/external.router.test.ts:158`

---

### 4. **Mocks Incompletos** ⚠️ MÉDIO

**Problema**: Mocks não implementam `.rows` em queries

**Arquivo**: `tests/helpers/mocks.ts` - `createMockPool()`

**Solução**:

```typescript
export function createMockPool(queryResults: any[] = []) {
  return {
    query: vi.fn().mockResolvedValue({
      rows: queryResults, // ← ADICIONAR
      rowCount: queryResults.length,
    }),
  };
}
```

**Testes afetados**:

- `tests/services/sharing.behavior.test.ts:40`

---

### 5. **Erros 500 nas Rotas** ⚠️ ALTO

**Problema**: Rotas lançando exceções não tratadas

**Causa provável**: Foreign keys e validações falhando

**Solução**:

1. Corrigir helpers de database (#1)
2. Adicionar try-catch nas rotas
3. Verificar validações

**Testes afetados**: 20+ testes (maioria dos router tests)

---

### 6. **Contagem de Funções Incorreta** ⚠️ BAIXO

**Arquivo**: `tests/services/events.test.ts:23`

**Problema**:

```typescript
expect(Object.keys(eventsService)).toHaveLength(9); // Esperado: 9, Real: 11
```

**Solução**: Atualizar para 11 ou verificar exportações

---

### 7. **Upload Code Validation** ⚠️ MÉDIO

**Problema**: Testes de `uploadFileByCode` falhando por código inválido

**Causa**: Mocks não configurando `upload_codes` corretamente

**Solução**: Criar código de upload real no beforeEach:

```typescript
beforeEach(async () => {
  const event = await createTestEvent(prisma, userId, "Dr. Test");

  await prisma.upload_codes.create({
    data: {
      event_id: event.id,
      slot_label: "Requisição",
      plain_code: "validcode",
      hashed_code: await bcrypt.hash("validcode", 10),
    },
  });
});
```

---

## 📈 Prioridades de Correção

### 🔴 **Alta Prioridade** (Corrigir AGORA)

1. ✅ Foreign Keys - Adicionar `professional_id` nos helpers
2. ✅ Criar helper para criar professionals
3. ✅ Corrigir UUIDs inválidos

### 🟡 **Média Prioridade** (Próxima iteração)

4. ✅ Mocks do Pool com `.rows`
5. ✅ Upload codes nos testes
6. ✅ Emails únicos

### 🟢 **Baixa Prioridade** (Pode esperar)

7. ✅ Contagem de exportações
8. ✅ Refatorar testes duplicados

---

## 🚀 Ações Imediatas

### 1. Corrigir database.ts

```bash
# Adicionar createTestProfessional
# Atualizar createTestEvent para usar professional_id
# Atualizar createTestFile
```

### 2. Corrigir UUIDs

```bash
# Substituir strings por randomUUID()
```

### 3. Corrigir mocks.ts

```bash
# Adicionar .rows no mock do Pool
```

### 4. Re-executar testes

```bash
pnpm test:unit
```

---

## 📊 Meta de Cobertura

| Métrica           | Meta | Atual | Status |
| ----------------- | ---- | ----- | ------ |
| Testes Passando   | 100% | 60%   | 🟡     |
| Cobertura Linhas  | 80%  | N/A   | ⏳     |
| Cobertura Funções | 80%  | N/A   | ⏳     |

---

## 📝 Notas

- Muitos erros são cascata do problema #1 (foreign keys)
- Após corrigir helpers, espera-se que 20+ testes passem
- Priorizar correções estruturais antes de ajustes individuais
- Considerar adicionar validação de UUID nas rotas

---

**Última atualização**: 2025-10-15  
**Próxima ação**: Corrigir `tests/helpers/database.ts`
