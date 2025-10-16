# 🛠️ Comandos Úteis - Deploy Vercel

## 📦 Instalação e Setup

### Instalar Vercel CLI

```bash
# Global
pnpm add -g vercel

# Ou usar npx
npx vercel --version
```

### Login na Vercel

```bash
vercel login
```

---

## 🚀 Deploy

### Deploy de Preview

```bash
# Na raiz do projeto
vercel

# Ou especificando o diretório
vercel apps/next-app
```

### Deploy de Produção

```bash
# Na raiz do projeto
vercel --prod

# Com confirmação
vercel --prod --yes
```

### Deploy com Build Local

```bash
vercel --prebuilt
```

---

## 🔍 Inspeção e Logs

### Ver Logs do Último Deploy

```bash
vercel logs
```

### Ver Logs em Tempo Real

```bash
vercel logs --follow
```

### Inspecionar Deploy

```bash
vercel inspect [URL]
```

### Listar Deploys

```bash
vercel ls
```

### Ver Informações do Projeto

```bash
vercel project ls
```

---

## ⚙️ Configuração

### Linkar Projeto Local com Vercel

```bash
vercel link
```

### Adicionar Variável de Ambiente

```bash
vercel env add DATABASE_URL production
```

### Listar Variáveis de Ambiente

```bash
vercel env ls
```

### Remover Variável de Ambiente

```bash
vercel env rm DATABASE_URL production
```

### Puxar Variáveis de Ambiente

```bash
vercel env pull .env.local
```

---

## 🧪 Testes Locais

### Build Local (simula Vercel)

```bash
cd apps/next-app

# Limpar cache
rm -rf .next

# Instalar
pnpm install

# Gerar Prisma
pnpm prisma generate

# Build
pnpm run build

# Start
pnpm start
```

### Testar com Vercel Dev

```bash
vercel dev
```

---

## 🏗️ Build e Validação

### Validar Configuração (PowerShell)

```powershell
.\validate-deploy.ps1
```

### Build com Debug

```bash
cd apps/next-app
NEXT_DEBUG=1 pnpm run build
```

### Verificar Tamanho do Build

```bash
cd apps/next-app/.next
du -sh *
```

---

## 🔄 Git e Deploy

### Commit e Push (triggers auto-deploy se configurado)

```bash
git add .
git commit -m "Fix: Vercel deploy configuration"
git push origin main
```

### Ver Status do Git

```bash
git status
git log --oneline -5
```

### Criar Branch para Teste

```bash
git checkout -b test-vercel-deploy
git push origin test-vercel-deploy
```

---

## 🗑️ Limpeza

### Remover Deploy Específico

```bash
vercel rm [deployment-url] --yes
```

### Limpar Cache Local

```bash
cd apps/next-app
rm -rf .next node_modules
pnpm install
```

### Remover Link do Projeto

```bash
vercel unlink
```

---

## 📊 Monitoramento

### Ver Métricas do Projeto

```bash
vercel inspect [URL]
```

### Abrir Dashboard

```bash
vercel open
```

### Ver Domínios

```bash
vercel domains ls
```

---

## 🔧 Troubleshooting

### Verificar Instalação Vercel CLI

```bash
vercel --version
which vercel
```

### Limpar Cache Vercel

```bash
vercel build --force
```

### Re-deploy sem Cache

```bash
vercel --force --prod
```

### Verificar Configuração do Projeto

```bash
cat vercel.json
cat apps/next-app/vercel.json
```

### Testar Prisma

```bash
cd apps/next-app
pnpm prisma generate
pnpm prisma validate
pnpm prisma format
```

### Verificar Dependências

```bash
# Verificar se 'shared' está instalado
pnpm list shared

# Verificar estrutura do workspace
pnpm list --depth 0
```

---

## 🔐 Secrets e Variáveis

### Adicionar Secret

```bash
vercel secrets add my-secret-name "secret-value"
```

### Usar Secret em Env Var

```bash
vercel env add MY_VAR production
# Selecione "secret" e escolha o secret
```

### Listar Secrets

```bash
vercel secrets ls
```

---

## 🌐 Domínios

### Adicionar Domínio

```bash
vercel domains add example.com
```

### Remover Domínio

```bash
vercel domains rm example.com
```

### Ver Certificados SSL

```bash
vercel certs ls
```

---

## 📝 Aliases e URLs

### Criar Alias

```bash
vercel alias [deployment-url] [alias-url]
```

### Exemplo:

```bash
vercel alias my-app-abc123.vercel.app staging.myapp.com
```

---

## 🔄 Rollback

### Promover Deploy Anterior para Produção

```bash
# 1. Listar deploys
vercel ls

# 2. Promover deploy específico
vercel promote [deployment-url]
```

---

## 📱 Mobile/PWA

### Testar PWA Local

```bash
cd apps/next-app
pnpm run build
pnpm start

# Acesse via ngrok para testar em dispositivo móvel
npx ngrok http 3000
```

---

## 🎯 Comandos Quick Reference

| Comando          | Descrição            |
| ---------------- | -------------------- |
| `vercel`         | Deploy preview       |
| `vercel --prod`  | Deploy produção      |
| `vercel logs`    | Ver logs             |
| `vercel env ls`  | Listar env vars      |
| `vercel ls`      | Listar deploys       |
| `vercel open`    | Abrir dashboard      |
| `vercel dev`     | Dev local com Vercel |
| `vercel inspect` | Inspecionar deploy   |
| `vercel link`    | Linkar projeto       |
| `vercel pull`    | Puxar configurações  |

---

## 💡 Dicas

### 1. Preview Automático em PRs

Configure no GitHub para auto-deploy de cada PR:

```yaml
# .github/workflows/preview.yml (exemplo)
# Vercel faz isso automaticamente se integrado com GitHub
```

### 2. Variáveis por Ambiente

```bash
# Development
vercel env add API_URL development

# Preview
vercel env add API_URL preview

# Production
vercel env add API_URL production
```

### 3. Debug Mode

```bash
# Build com debug
NEXT_DEBUG=1 pnpm run build

# Vercel com verbose
vercel --debug
```

---

## 📚 Links de Referência

- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Git Integration](https://vercel.com/docs/concepts/git)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Última atualização:** 16 de outubro de 2025
