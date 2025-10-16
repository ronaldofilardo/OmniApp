# 🚀 Deploy na Vercel - OmniApp

## 📚 Documentação Completa

Toda a documentação de deploy foi organizada na pasta **`.vercel-docs/`**.

➡️ **[Acesse a documentação completa aqui](./.vercel-docs/README.md)**

---

## ⚡ Quick Start

### 1️⃣ Validar Configuração

```powershell
.\.vercel-docs\validate-deploy.ps1
```

### 2️⃣ Configurar na Vercel

- **Root Directory:** `apps/next-app`
- **Install Command:** `pnpm install --filter=next-app...`
- **Build Command:** `pnpm run build` (automático)

### 3️⃣ Variáveis de Ambiente

```
DATABASE_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_API_URL=https://seu-dominio.vercel.app/api
JWT_SECRET=seu-secret-aqui
NODE_ENV=production
```

### 4️⃣ Deploy

```bash
vercel --prod
```

---

## 📖 Documentos Disponíveis

| Documento                                                       | Descrição               |
| --------------------------------------------------------------- | ----------------------- |
| [README.md](./.vercel-docs/README.md)                           | Índice da documentação  |
| [DEPLOY_QUICKSTART.md](./.vercel-docs/DEPLOY_QUICKSTART.md)     | Guia rápido             |
| [VERCEL_DEPLOY_GUIDE.md](./.vercel-docs/VERCEL_DEPLOY_GUIDE.md) | Guia completo           |
| [DEPLOY_CHECKLIST.md](./.vercel-docs/DEPLOY_CHECKLIST.md)       | Checklist interativo    |
| [DEPLOY_ARCHITECTURE.md](./.vercel-docs/DEPLOY_ARCHITECTURE.md) | Arquitetura e diagramas |
| [VERCEL_COMMANDS.md](./.vercel-docs/VERCEL_COMMANDS.md)         | Comandos úteis          |
| [validate-deploy.ps1](./.vercel-docs/validate-deploy.ps1)       | Script de validação     |

---

## ⚙️ Arquivos de Configuração

Estes arquivos foram criados/modificados e devem permanecer na raiz:

- ✅ `vercel.json` - Configuração do monorepo
- ✅ `.vercelignore` - Arquivos a ignorar
- ✅ `apps/next-app/vercel.json` - Config do Next.js
- ✅ `apps/next-app/next.config.ts` - Transpile packages
- ✅ `apps/next-app/.env.example` - Template de variáveis

---

## 🆘 Precisa de Ajuda?

1. **Problemas de deploy?** → Ver [VERCEL_DEPLOY_GUIDE.md](./.vercel-docs/VERCEL_DEPLOY_GUIDE.md) (seção Troubleshooting)
2. **Erro 404?** → Ver [DEPLOY_ARCHITECTURE.md](./.vercel-docs/DEPLOY_ARCHITECTURE.md) (diagramas de erro)
3. **Dúvidas sobre comandos?** → Ver [VERCEL_COMMANDS.md](./.vercel-docs/VERCEL_COMMANDS.md)

---

**Última atualização:** 16 de outubro de 2025
