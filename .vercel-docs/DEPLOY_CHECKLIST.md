# ✅ Checklist Final de Deploy - Vercel

## 📋 Antes de Fazer Deploy

### 1. Arquivos de Configuração

- [x] `vercel.json` criado na raiz
- [x] `apps/next-app/vercel.json` criado
- [x] `.vercelignore` criado
- [x] `next.config.ts` atualizado com transpilePackages
- [x] `package.json` com scripts de build otimizados
- [x] `packages/shared/package.json` com exports

### 2. Validação Local

Execute no PowerShell:

```powershell
.\validate-deploy.ps1
```

Ou manualmente:

```bash
cd apps/next-app
pnpm install
pnpm prisma generate
pnpm run build
pnpm start
```

**Teste as rotas:**

- [ ] http://localhost:3000 → Página inicial funciona
- [ ] http://localhost:3000/api → API info retorna JSON
- [ ] http://localhost:3000/api/health → Health check OK
- [ ] http://localhost:3000/timeline → Timeline carrega

---

## 🌐 Configuração na Vercel

### Dashboard da Vercel → Project Settings

#### General

- [ ] **Framework Preset:** Next.js
- [ ] **Root Directory:** `apps/next-app`

#### Build & Development Settings

- [ ] **Build Command:** `pnpm run build` (ou automático)
- [ ] **Output Directory:** `.next` (automático)
- [ ] **Install Command:** `pnpm install --filter=next-app...`
- [ ] **Node.js Version:** 20.x

#### Environment Variables

Adicione as seguintes variáveis:

**Production:**

- [ ] `DATABASE_URL` = `postgresql://user:password@host:port/database`
- [ ] `NEXT_PUBLIC_API_URL` = `https://seu-dominio.vercel.app/api`
- [ ] `JWT_SECRET` = `seu-secret-super-seguro-aqui`
- [ ] `NODE_ENV` = `production`

**Preview (opcional):**

- [ ] Mesmas variáveis ou valores diferentes para staging

**Development (opcional):**

- [ ] Valores locais

---

## 🚀 Deploy

### Opção A: Via GitHub (Automático)

- [ ] Commit e push para `main` (ou branch configurada)
- [ ] Vercel detecta e inicia deploy automaticamente
- [ ] Acompanhe o progresso no dashboard

### Opção B: Via CLI

```bash
# Login (primeira vez)
vercel login

# Na raiz do projeto
cd c:\apps\HM\HT

# Deploy de preview
vercel

# Deploy de produção
vercel --prod
```

---

## ✅ Após Deploy

### Verificações Pós-Deploy

**1. Build Log**

- [ ] Build completou sem erros
- [ ] Prisma Client foi gerado
- [ ] Next.js build finalizado
- [ ] Output standalone criado

**2. Testar URLs**
Substitua `seu-dominio.vercel.app` pelo seu domínio:

```bash
# Página inicial
curl https://seu-dominio.vercel.app/

# API
curl https://seu-dominio.vercel.app/api

# Health check
curl https://seu-dominio.vercel.app/api/health

# Status
curl https://seu-dominio.vercel.app/api/status
```

**3. Browser**

- [ ] Abra `https://seu-dominio.vercel.app/`
- [ ] Navegue para `/timeline`
- [ ] Verifique console do navegador (sem erros)
- [ ] Teste funcionalidades principais

---

## 🐛 Se Houver Problemas

### Erro 404

1. [ ] Verificar Root Directory: `apps/next-app`
2. [ ] Verificar Output Directory: `.next`
3. [ ] Ver logs de build no dashboard
4. [ ] Confirmar variáveis de ambiente

### Build Falha

1. [ ] Ver logs de build completo
2. [ ] Verificar DATABASE_URL (necessária para Prisma)
3. [ ] Testar build local primeiro
4. [ ] Verificar se `pnpm-lock.yaml` está atualizado

### Erro de Módulo não Encontrado

1. [ ] Verificar `transpilePackages: ['shared']` em `next.config.ts`
2. [ ] Verificar Install Command: `pnpm install --filter=next-app...`
3. [ ] Rebuild: `vercel --force --prod`

### Variáveis de Ambiente

1. [ ] Todas as variáveis configuradas?
2. [ ] Valores corretos (sem aspas extras)?
3. [ ] Scope correto (production/preview/development)?

---

## 📊 Monitoramento

### Dashboard Vercel

- [ ] Ver métricas de performance
- [ ] Configurar alertas (opcional)
- [ ] Verificar logs periodicamente

### Domínio Customizado (opcional)

- [ ] Adicionar domínio em Vercel
- [ ] Configurar DNS
- [ ] SSL automático ativo

---

## 📚 Documentação de Referência

Se precisar de ajuda, consulte:

- **DEPLOY_SUMMARY.md** → Resumo de todas as mudanças
- **VERCEL_DEPLOY_GUIDE.md** → Guia completo com troubleshooting
- **DEPLOY_QUICKSTART.md** → Guia rápido de deploy
- **VERCEL_COMMANDS.md** → Lista de comandos úteis

---

## 🎉 Deploy Bem-Sucedido!

Se todas as verificações acima passaram:

✅ **Parabéns!** Seu app está rodando na Vercel!

Próximos passos:

- Configure domínio customizado (opcional)
- Configure analytics/monitoring
- Setup CI/CD para deploys automáticos
- Configure preview deployments para PRs

---

## 💾 Salvar Esta Configuração

Para futuros deploys, mantenha:

- ✅ Arquivos `vercel.json`
- ✅ Variáveis de ambiente documentadas
- ✅ Scripts de validação
- ✅ Esta documentação

---

**Última verificação:** **\_**/**\_**/**\_**

**Status:** [ ] Deploy bem-sucedido | [ ] Problemas encontrados

**Notas:**

---

---

---

---

**Data:** 16 de outubro de 2025  
**Versão:** 1.0
