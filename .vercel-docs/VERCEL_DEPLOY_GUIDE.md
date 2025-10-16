# 🚀 Guia de Deploy na Vercel - OmniApp

## 📋 Problemas Identificados e Soluções

### 🔴 Problema 1: Monorepo com pnpm

**Causa:** A Vercel não detecta automaticamente a estrutura de monorepo com pnpm workspaces.

**Solução Implementada:**

- ✅ Criado `vercel.json` na raiz com configurações do monorepo
- ✅ Criado `vercel.json` em `apps/next-app` com configurações específicas
- ✅ Adicionado `.vercelignore` para otimizar o build

### 🔴 Problema 2: Prisma no Build

**Causa:** O Prisma precisa gerar o client antes do build, mas pode falhar sem DATABASE_URL.

**Solução Implementada:**

- ✅ Script `vercel-build` que gera o Prisma Client
- ✅ Fallback no `postinstall` para evitar falhas
- ✅ Output `standalone` no Next.js

### 🔴 Problema 3: Pacote Workspace `shared`

**Causa:** Dependências de workspace podem não ser resolvidas corretamente.

**Solução Implementada:**

- ✅ Adicionado `transpilePackages: ['shared']` no `next.config.ts`
- ✅ Configurado exports no `package.json` do shared
- ✅ Comando de instalação otimizado com `--filter`

### 🔴 Problema 4: Erro 404

**Causas possíveis:**

1. Build falha silenciosamente
2. Output directory incorreto
3. Variáveis de ambiente ausentes
4. Rotas não configuradas corretamente

**Soluções Implementadas:**

- ✅ Output directory configurado: `apps/next-app/.next`
- ✅ Framework detectado como Next.js
- ✅ Rotas da API corretamente estruturadas

---

## 🛠️ Configuração do Projeto Vercel

### 1️⃣ Configurações Básicas do Projeto

No dashboard da Vercel, configure:

```
Framework Preset: Next.js
Root Directory: apps/next-app
Build Command: pnpm run build
Output Directory: .next
Install Command: pnpm install --filter=next-app...
Node Version: 20.x
```

### 2️⃣ Variáveis de Ambiente Necessárias

Configure estas variáveis no dashboard da Vercel:

```bash
# Database (Obrigatório para build com Prisma)
DATABASE_URL=postgresql://user:password@host:port/database?schema=public

# Next.js
NEXT_PUBLIC_API_URL=https://seu-dominio.vercel.app/api
NODE_ENV=production

# Se usar autenticação JWT
JWT_SECRET=seu_secret_aqui

# Outras variáveis específicas do seu app
```

**⚠️ IMPORTANTE:** Mesmo que você não use banco de dados no build, o Prisma precisa de uma DATABASE_URL válida. Você pode usar uma URL de banco temporário apenas para gerar o client.

### 3️⃣ Configurações Avançadas (Settings)

#### Build & Development Settings:

- ✅ Enable: **Include source files outside of the Root Directory in the Build Step**
- ✅ Node.js Version: **20.x**
- ✅ Install Command: `pnpm install --filter=next-app...`

#### General Settings:

- ✅ Framework: **Next.js**
- ✅ Root Directory: **apps/next-app**

---

## 📝 Passos para Deploy

### Opção A: Deploy via Dashboard

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Importe o repositório GitHub
4. Configure:
   - **Root Directory:** `apps/next-app`
   - **Framework:** Next.js
   - **Build Command:** `pnpm run build`
   - **Install Command:** `pnpm install --filter=next-app...`
5. Adicione as variáveis de ambiente
6. Clique em "Deploy"

### Opção B: Deploy via CLI

```bash
# Instalar Vercel CLI
pnpm add -g vercel

# Na raiz do projeto
cd c:\apps\HM\HT

# Login na Vercel
vercel login

# Deploy
vercel --prod

# Ou para preview
vercel
```

---

## 🔍 Verificação do Build

### Testes Locais Antes do Deploy

```bash
# 1. Limpar build anterior
cd apps/next-app
rm -rf .next

# 2. Instalar dependências
pnpm install

# 3. Gerar Prisma Client
pnpm prisma generate

# 4. Build de produção
pnpm run build

# 5. Testar localmente
pnpm start
```

### Verificar se o Build foi Bem-Sucedido

Acesse:

- `http://localhost:3000` - Página inicial
- `http://localhost:3000/api` - API info
- `http://localhost:3000/api/health` - Health check
- `http://localhost:3000/timeline` - Timeline page

---

## 🐛 Troubleshooting

### Erro: "MODULE_NOT_FOUND: shared"

**Solução:**

```bash
# Verificar se o workspace está configurado
cat pnpm-workspace.yaml

# Reinstalar dependências
rm -rf node_modules apps/next-app/node_modules packages/shared/node_modules
pnpm install
```

### Erro: "Prisma Client não foi gerado"

**Solução:**

```bash
cd apps/next-app
pnpm prisma generate
```

### Erro 404 após Deploy

**Verificações:**

1. ✅ Logs de build na Vercel (procure por erros)
2. ✅ Variáveis de ambiente configuradas
3. ✅ Root Directory correto: `apps/next-app`
4. ✅ Output directory: `.next`
5. ✅ Build command executou com sucesso

### Build Falha com "Cannot find module 'shared'"

**Solução:**
Adicione ao `next.config.ts`:

```typescript
transpilePackages: ["shared"];
```

(já implementado ✅)

### Prisma Falha no Build

**Opções:**

1. **Usar banco de desenvolvimento temporário:**

```bash
DATABASE_URL="postgresql://temp:temp@localhost:5432/temp"
```

2. **Ou pular geração do Prisma se não for necessário:**
   Modificar `package.json`:

```json
"postinstall": "echo 'Skipping Prisma'"
```

---

## 📊 Monitoramento Pós-Deploy

### Verificar Deploy

```bash
# Ver logs em tempo real
vercel logs

# Ver último deploy
vercel inspect
```

### Endpoints para Testar

Após deploy, teste:

```bash
# Health check
curl https://seu-dominio.vercel.app/api/health

# API info
curl https://seu-dominio.vercel.app/api

# Status
curl https://seu-dominio.vercel.app/api/status

# Página inicial
curl https://seu-dominio.vercel.app/
```

---

## 🎯 Checklist Final

Antes de fazer deploy, confirme:

- [ ] Todas as variáveis de ambiente configuradas na Vercel
- [ ] `DATABASE_URL` válida (mesmo que temporária)
- [ ] Root Directory: `apps/next-app`
- [ ] Build funciona localmente: `pnpm run build`
- [ ] Arquivos de configuração criados:
  - [ ] `vercel.json` (raiz)
  - [ ] `apps/next-app/vercel.json`
  - [ ] `.vercelignore`
- [ ] `next.config.ts` com `transpilePackages` e `output: standalone`
- [ ] Package `shared` com exports configurados

---

## 🔗 Links Úteis

- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [pnpm Workspaces](https://pnpm.io/workspaces)

---

## 📞 Suporte

Se o problema persistir:

1. Verifique os logs de build na Vercel
2. Compare com o build local
3. Verifique se todas as dependências estão instaladas
4. Confirme que o `pnpm-lock.yaml` está atualizado

---

**Última atualização:** 16 de outubro de 2025
