# Deploy na Vercel - Configuração Completa

## ✅ Deployment realizado com sucesso!

### 🔗 Links importantes:

- **URL de Produção**: https://omniapp-u0c03r70b-ronaldofilardos-projects.vercel.app
- **Dashboard Vercel**: https://vercel.com/ronaldofilardos-projects/omniapp
- **Inspeção do Deploy**: https://vercel.com/ronaldofilardos-projects/omniapp/5NdkAtPcLTi7eSradsKVLpVckQdX
- **Repositório GitHub**: https://github.com/ronaldofilardo/OmniApp

---

## 📦 Variáveis de Ambiente Configuradas:

### ✅ Banco de Dados

- **DATABASE_URL**: `postgresql://neondb_owner:npg_Iitb6kFyWAj9@ep-soft-cloud-ac5elx48-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require`
  - Configurada para: Development, Preview, Production

### ✅ Autenticação

- **JWT_SECRET**: Gerado automaticamente (64 caracteres seguros)
  - Configurada para: Production

### ✅ Aplicação

- **NODE_ENV**: `production`
  - Configurada para: Production

### ✅ Configurações de Negócio

- **TRAVEL_GAP_ENABLED**: `true`

  - Habilita detecção de conflitos de agenda
  - Configurada para: Production

- **TRAVEL_GAP_MINUTES**: `60`
  - Tempo mínimo entre eventos (em minutos)
  - Configurada para: Production

---

## 🗄️ Banco de Dados Neon

### Status das Migrações:

✅ 6 migrações aplicadas com sucesso:

1. `20250923221600_atualizar_schema`
2. `20250926114317_remove_repetitive_events`
3. `20251005184152_add_base64_storage_support`
4. `20251009210151_add_upload_codes`
5. `20251009215530_add_plain_code_to_upload_codes`
6. `20251009230230_add_notifications_and_push_subscriptions`

### Conexão:

- **Host**: ep-soft-cloud-ac5elx48-pooler.sa-east-1.aws.neon.tech
- **Database**: neondb
- **Region**: sa-east-1 (São Paulo - AWS)
- **SSL**: Habilitado

---

## 🛠️ Configuração do Projeto

### Estrutura:

- **Framework**: Next.js 15.5.5
- **Package Manager**: pnpm
- **Node Version**: 20.x
- **Prisma**: 6.16.2

### Build Command:

```bash
cd apps/next-app && pnpm install && npx prisma generate && pnpm build
```

### Install Command:

```bash
pnpm install
```

---

## 📝 Próximos Passos

### Para conectar o repositório GitHub ao deploy automático:

1. Acesse: https://vercel.com/ronaldofilardos-projects/omniapp/settings/git
2. Clique em **Connect Git Repository**
3. Selecione **GitHub** e autorize
4. Escolha o repositório: `ronaldofilardo/OmniApp`
5. Clique em **Connect**

Com isso, todo push para a branch `main` fará deploy automático! 🚀

### Para adicionar variáveis de ambiente para Preview/Development:

```bash
vercel env add NOME_DA_VARIAVEL preview
vercel env add NOME_DA_VARIAVEL development
```

### Para ver logs do deploy:

```bash
vercel logs
```

### Para fazer novo deploy:

```bash
vercel --prod
```

---

## 🔧 Comandos Úteis

### Listar variáveis de ambiente:

```bash
vercel env ls
```

### Baixar variáveis para arquivo local:

```bash
vercel env pull .env.local
```

### Ver status do projeto:

```bash
vercel project ls
```

### Executar migrações no Neon:

```bash
cd apps/next-app
$env:DATABASE_URL='postgresql://neondb_owner:npg_Iitb6kFyWAj9@ep-soft-cloud-ac5elx48-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
npx prisma migrate deploy
```

---

## 📋 Checklist de Deploy

- [x] Repositório criado no GitHub
- [x] Primeiro commit e push realizados
- [x] Projeto linkado na Vercel
- [x] Banco de dados Neon configurado
- [x] Migrações aplicadas no Neon
- [x] Variáveis de ambiente configuradas
- [x] Deploy em produção realizado
- [ ] Conectar repositório GitHub para deploy automático (opcional)
- [ ] Configurar domínio customizado (opcional)

---

## 🎯 URLs de Teste

Após o build completar, teste as seguintes rotas:

- **Health Check**: https://omniapp-u0c03r70b-ronaldofilardos-projects.vercel.app/api/health
- **Status**: https://omniapp-u0c03r70b-ronaldofilardos-projects.vercel.app/api/status
- **Timeline**: https://omniapp-u0c03r70b-ronaldofilardos-projects.vercel.app/api/timeline
- **Home**: https://omniapp-u0c03r70b-ronaldofilardos-projects.vercel.app/

---

**Data do Deploy**: 16 de outubro de 2025
**Versão**: 1.0.0
**Status**: ✅ Em Produção
