# Deploy Vercel - Quick Start

## 🚀 Deploy Rápido

### 1. Configure as Variáveis de Ambiente na Vercel

```bash
DATABASE_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_API_URL=https://seu-dominio.vercel.app/api
JWT_SECRET=seu-secret-aqui
NODE_ENV=production
```

### 2. Configurações do Projeto na Vercel

- **Root Directory:** `apps/next-app`
- **Framework:** Next.js
- **Build Command:** `pnpm run build`
- **Install Command:** `pnpm install --filter=next-app...`
- **Node Version:** 20.x

### 3. Deploy

Clique em "Deploy" no dashboard da Vercel.

---

## 📚 Documentação Completa

Veja o arquivo `VERCEL_DEPLOY_GUIDE.md` para detalhes completos, troubleshooting e configurações avançadas.

## ✅ Arquivos Criados

- ✅ `vercel.json` (raiz)
- ✅ `apps/next-app/vercel.json`
- ✅ `.vercelignore`
- ✅ `next.config.ts` atualizado
- ✅ `package.json` com scripts de build otimizados
- ✅ `packages/shared/package.json` com exports configurados
- ✅ Guia completo de deploy

## 🔍 Verificação Rápida

Antes de fazer deploy:

```bash
cd apps/next-app
pnpm install
pnpm prisma generate
pnpm run build
pnpm start
```

Teste localmente em `http://localhost:3000`
