# Omni Saúde - Sistema Unificado

Sistema completo de gestão de saúde com frontend e backend unificados em Next.js.

## 🚀 Deploy no Vercel (Free Tier)

### Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Banco PostgreSQL no [Neon](https://neon.tech) (já configurado)

### Configuração do Banco

O banco já está configurado com a URL:

```
postgresql://neondb_owner:npg_BPgFxGM04snX@ep-orange-heart-acvd2opp-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Deploy Steps

1. **Conectar repositório no Vercel**

   - Importe o projeto `apps/next-app` do GitHub
   - Configure como projeto Next.js

2. **Configurar Environment Variables**
   Adicione no Vercel as seguintes variáveis:

   ```env
   DATABASE_URL=postgresql://neondb_owner:npg_BPgFxGM04snX@ep-orange-heart-acvd2opp-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   JWT_SECRET=your-secure-jwt-secret-here
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-app.vercel.app
   ```

3. **Configurações do Build**

   - **Build Command**: `prisma generate && next build`
   - **Install Command**: `pnpm install`
   - **Root Directory**: `apps/next-app`

4. **Deploy**
   - O Vercel fará o deploy automaticamente
   - O banco será sincronizado via `prisma db push`

## ⚠️ Limitações do Free Tier

- **Timeout**: 10 segundos máximo por função API
- **Região**: São Paulo (sao-paulo1) configurada
- **Conexões**: Limitadas para otimizar performance

## 🔧 Comandos Úteis

```bash
# Desenvolvimento local
pnpm dev

# Build para produção
pnpm build

# Push do schema para o banco
pnpm db:push

# Gerar cliente Prisma
pnpm prisma generate
```

## 📊 Funcionalidades

- ✅ Gestão de Profissionais
- ✅ Agendamento de Eventos
- ✅ Upload de Arquivos
- ✅ Compartilhamento Seguro
- ✅ Timeline de Eventos
- ✅ Repositório de Arquivos
- ✅ Notificações Push

## 🏗️ Arquitetura

- **Frontend**: Next.js 15 + React 19
- **Backend**: Next.js API Routes
- **Banco**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Deploy**: Vercel

## 🔐 Segurança

- Sistema single-user (sem autenticação JWT)
- Sessões de compartilhamento simplificadas
- Validação com Zod
- CORS configurado
- Headers de segurança
