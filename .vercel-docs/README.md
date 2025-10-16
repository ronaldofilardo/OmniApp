# 📚 Documentação de Deploy na Vercel

Esta pasta contém toda a documentação necessária para fazer deploy do projeto OmniApp na Vercel.

---

## 📖 Documentos Disponíveis

### 🚀 [DEPLOY_QUICKSTART.md](./DEPLOY_QUICKSTART.md)

**Comece aqui!** Guia rápido para fazer o primeiro deploy.

- Configurações essenciais
- Passos resumidos
- Links para documentação completa

### 📊 [DEPLOY_SUMMARY.md](./DEPLOY_SUMMARY.md)

Resumo executivo de todas as mudanças feitas no projeto.

- Problemas identificados
- Soluções implementadas
- Checklist de configuração
- Status dos arquivos modificados

### 📚 [VERCEL_DEPLOY_GUIDE.md](./VERCEL_DEPLOY_GUIDE.md)

Guia completo e detalhado de deploy.

- Explicação de cada problema
- Configurações detalhadas
- Troubleshooting extensivo
- Melhores práticas

### ✅ [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)

Checklist interativo para seguir durante o deploy.

- Verificações pré-deploy
- Configurações da Vercel
- Validações pós-deploy
- Troubleshooting rápido

### 🗺️ [DEPLOY_ARCHITECTURE.md](./DEPLOY_ARCHITECTURE.md)

Visualização da arquitetura e fluxo de deploy.

- Estrutura de arquivos
- Fluxo de deploy visual
- Configurações críticas explicadas
- Diagramas e esquemas

### 🛠️ [VERCEL_COMMANDS.md](./VERCEL_COMMANDS.md)

Referência de comandos úteis.

- Comandos Vercel CLI
- Scripts de build
- Comandos de troubleshooting
- Quick reference

### 🔧 [validate-deploy.ps1](./validate-deploy.ps1)

Script PowerShell para validar configuração antes do deploy.

- Verifica arquivos de configuração
- Testa build local
- Valida dependências
- Relatório de erros/avisos

---

## 🎯 Por Onde Começar?

### Se você nunca fez deploy antes:

1. Leia **DEPLOY_QUICKSTART.md**
2. Execute **validate-deploy.ps1**
3. Siga **DEPLOY_CHECKLIST.md**

### Se você está com problemas:

1. Consulte **VERCEL_DEPLOY_GUIDE.md** (seção Troubleshooting)
2. Verifique **DEPLOY_ARCHITECTURE.md** (diagramas de erro)
3. Execute **validate-deploy.ps1** para diagnóstico

### Se precisa de comandos específicos:

1. Consulte **VERCEL_COMMANDS.md**

---

## 📁 Arquivos de Configuração (na raiz do projeto)

Estes arquivos **precisam ficar na raiz** para o deploy funcionar:

- `vercel.json` - Configuração do monorepo
- `.vercelignore` - Arquivos a ignorar no upload
- `apps/next-app/vercel.json` - Configuração específica do Next.js
- `apps/next-app/.env.example` - Template de variáveis de ambiente

---

## 🚀 Deploy Rápido

```bash
# 1. Validar configuração
.\.vercel-docs\validate-deploy.ps1

# 2. Deploy via CLI
vercel --prod

# Ou configure na Vercel Dashboard:
# - Root Directory: apps/next-app
# - Install Command: pnpm install --filter=next-app...
# - Build Command: pnpm run build
```

---

## 🔗 Links Úteis

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

## 💡 Dicas Importantes

1. **DATABASE_URL é obrigatória** mesmo que você não use banco no runtime (Prisma precisa gerar client no build)
2. **Root Directory deve ser `apps/next-app`** pois é um monorepo
3. **Use o script de validação** antes de cada deploy
4. **Mantenha esta documentação atualizada** quando fizer mudanças no projeto

---

**Última atualização:** 16 de outubro de 2025
