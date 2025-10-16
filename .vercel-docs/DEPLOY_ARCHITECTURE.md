# 🗺️ Estrutura do Projeto para Deploy Vercel

## 📁 Estrutura de Arquivos (Simplificada)

```
HT/
├── 📄 vercel.json                    ← Config do monorepo
├── 📄 .vercelignore                  ← Arquivos a ignorar no upload
├── 📄 pnpm-workspace.yaml            ← Definição do workspace
├── 📄 package.json                   ← Scripts raiz
│
├── 📚 DEPLOY_CHECKLIST.md            ← Checklist de deploy
├── 📚 DEPLOY_QUICKSTART.md           ← Guia rápido
├── 📚 DEPLOY_SUMMARY.md              ← Resumo das mudanças
├── 📚 VERCEL_DEPLOY_GUIDE.md         ← Guia completo
├── 📚 VERCEL_COMMANDS.md             ← Comandos úteis
├── 🔧 validate-deploy.ps1            ← Script de validação
│
├── 📁 apps/
│   ├── 📁 next-app/                  ← ⭐ Projeto Next.js (DEPLOY)
│   │   ├── 📄 vercel.json            ← Config específica do app
│   │   ├── 📄 next.config.ts         ← Configuração Next.js
│   │   ├── 📄 package.json           ← Scripts e dependências
│   │   ├── 📄 .env.example           ← Template de variáveis
│   │   ├── 📄 tsconfig.json
│   │   │
│   │   ├── 📁 prisma/
│   │   │   └── schema.prisma         ← Schema do banco
│   │   │
│   │   └── 📁 src/
│   │       └── 📁 app/
│   │           ├── layout.tsx
│   │           ├── page.tsx          ← Página inicial
│   │           ├── 📁 api/           ← Rotas da API
│   │           │   ├── route.ts
│   │           │   ├── health/
│   │           │   ├── status/
│   │           │   └── timeline/
│   │           └── 📁 timeline/
│   │               └── page.tsx
│   │
│   ├── 📁 api/                       ← Backend separado (não no deploy)
│   └── 📁 web/                       ← Frontend alternativo (não no deploy)
│
└── 📁 packages/
    └── 📁 shared/                    ← Pacote compartilhado
        ├── 📄 package.json           ← Exports configurados
        └── 📁 src/
            └── validations.ts        ← Schemas Zod
```

---

## 🔄 Fluxo de Deploy

```
┌─────────────────────────────────────────────────────────────────┐
│                         REPOSITÓRIO GIT                          │
│                         github.com/...                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ git push
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL DETECTA                            │
│                   Novo commit em 'main'                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASE 1: CLONE                               │
│  • Clonar repositório                                            │
│  • Aplicar .vercelignore                                         │
│  • Detectar Root Directory: apps/next-app                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FASE 2: INSTALAÇÃO                             │
│  • Executar: pnpm install --filter=next-app...                   │
│  • Instalar dependências do workspace                            │
│  • Hoisting de dependências compartilhadas                       │
│  • Executar postinstall: prisma generate                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASE 3: BUILD                               │
│  • Executar: pnpm run build                                      │
│  • Gerar Prisma Client                                           │
│  • Transpilar pacote 'shared'                                    │
│  • Build Next.js (output: standalone)                            │
│  • Otimizar assets                                               │
│  • Criar bundle de produção                                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FASE 4: DEPLOY                               │
│  • Upload do build para CDN                                      │
│  • Configurar serverless functions                               │
│  • Aplicar variáveis de ambiente                                 │
│  • Gerar certificado SSL                                         │
│  • Ativar URL de produção                                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ✅ DEPLOY COMPLETO                            │
│              https://seu-dominio.vercel.app                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configurações Críticas

### 1. vercel.json (Raiz)

```json
{
  "buildCommand": "cd apps/next-app && pnpm install && pnpm run build",
  "installCommand": "pnpm install",
  "outputDirectory": "apps/next-app/.next"
}
```

**Por quê?** Define o contexto do monorepo.

### 2. apps/next-app/vercel.json

```json
{
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install --filter=next-app...",
  "framework": "nextjs"
}
```

**Por quê?** Config específica do Next.js com filtro de workspace.

### 3. next.config.ts

```typescript
{
  transpilePackages: ['shared'],
  output: 'standalone'
}
```

**Por quê?** Transpila dependências de workspace e otimiza bundle.

### 4. packages/shared/package.json

```json
{
  "exports": {
    ".": "./src/validations.ts"
  }
}
```

**Por quê?** Permite importar corretamente no monorepo.

---

## 🎯 Pontos de Atenção

### ❗ DATABASE_URL

```
Necessária no BUILD TIME
├── Prisma precisa gerar o client
├── Pode ser uma URL temporária
└── Configurar nas variáveis de ambiente da Vercel
```

### ❗ Root Directory

```
Deve apontar para: apps/next-app
├── Não para a raiz do monorepo
├── Vercel executa comandos a partir daqui
└── Mas tem acesso ao workspace completo
```

### ❗ Install Command

```
pnpm install --filter=next-app...
├── Instala next-app E suas dependências de workspace
├── O '...' é importante (inclui dependências)
└── Otimiza instalação (não instala apps/api, apps/web)
```

---

## 🔍 Troubleshooting Visual

### Erro 404

```
┌─────────────────────────────────────┐
│   ❌ Erro 404                       │
└─────────────────────────────────────┘
            │
            ├─► Verificar: Root Directory
            │   └─► Deve ser: apps/next-app
            │
            ├─► Verificar: Build Logs
            │   └─► Procurar erros de build
            │
            ├─► Verificar: Output Directory
            │   └─► Deve ser: .next
            │
            └─► Verificar: Variáveis de ambiente
                └─► DATABASE_URL configurada?
```

### Module Not Found: 'shared'

```
┌─────────────────────────────────────┐
│   ❌ Cannot find module 'shared'   │
└─────────────────────────────────────┘
            │
            ├─► Verificar: next.config.ts
            │   └─► transpilePackages: ['shared']
            │
            ├─► Verificar: packages/shared/package.json
            │   └─► exports configurados
            │
            └─► Verificar: Install Command
                └─► --filter=next-app...
```

### Prisma Error

```
┌─────────────────────────────────────┐
│   ❌ Prisma Client não gerado      │
└─────────────────────────────────────┘
            │
            ├─► Verificar: DATABASE_URL
            │   └─► Configurada na Vercel?
            │
            ├─► Verificar: package.json
            │   └─► postinstall: prisma generate
            │
            └─► Verificar: Build logs
                └─► Prisma generate executou?
```

---

## 📊 Variáveis de Ambiente

### Fluxo de Configuração

```
Vercel Dashboard
    │
    ├─► Environment Variables
    │   ├─► DATABASE_URL → Production
    │   ├─► DATABASE_URL → Preview
    │   ├─► NEXT_PUBLIC_API_URL → Production
    │   ├─► NEXT_PUBLIC_API_URL → Preview
    │   ├─► JWT_SECRET → Production
    │   └─► JWT_SECRET → Preview
    │
    └─► Injetadas no Build
        └─► Disponíveis em process.env
```

### Como Acessar no Código

```typescript
// Server-side (API routes, Server Components)
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;

// Client-side (Browser)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

---

## 🎨 Estrutura de Rotas

```
https://seu-dominio.vercel.app/
│
├─► /                      → src/app/page.tsx
├─► /timeline              → src/app/timeline/page.tsx
│
└─► /api/
    ├─► /                  → src/app/api/route.ts
    ├─► /health            → src/app/api/health/route.ts
    ├─► /status            → src/app/api/status/route.ts
    └─► /timeline          → src/app/api/timeline/route.ts
```

---

## ✅ Checklist Rápido

```
┌─────────────────────────────────────┐
│  PRÉ-DEPLOY                         │
├─────────────────────────────────────┤
│  ☐ Arquivos de config criados      │
│  ☐ Build local funciona             │
│  ☐ Testes passando                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  VERCEL DASHBOARD                   │
├─────────────────────────────────────┤
│  ☐ Root Directory: apps/next-app    │
│  ☐ Install Command configurado      │
│  ☐ Variáveis de ambiente OK         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  PÓS-DEPLOY                         │
├─────────────────────────────────────┤
│  ☐ Build sem erros                  │
│  ☐ URLs funcionando                 │
│  ☐ API respondendo                  │
└─────────────────────────────────────┘
```

---

**Para deploy, consulte:** `DEPLOY_QUICKSTART.md`  
**Para troubleshooting:** `VERCEL_DEPLOY_GUIDE.md`  
**Para comandos úteis:** `VERCEL_COMMANDS.md`
