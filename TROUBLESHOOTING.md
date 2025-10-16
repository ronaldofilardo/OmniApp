# Troubleshooting Vercel Deployment

## Problema Atual: ERR_INVALID_THIS com pnpm

### Causa
O erro `ERR_INVALID_THIS` indica um problema do pnpm ao tentar acessar o registro npm na infraestrutura da Vercel.

### Soluções Implementadas

#### 1. Configuração do .npmrc (✅ Implementado)
```
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=true
node-linker=hoisted
```

#### 2. Comando de Build Atualizado (✅ Implementado)
```json
{
  "buildCommand": "pnpm --filter next-app build",
  "installCommand": "pnpm install --no-frozen-lockfile"
}
```

---

## Soluções Alternativas

### Opção A: Usar npm ao invés de pnpm na Vercel

Atualizar `vercel.json`:
```json
{
  "buildCommand": "cd apps/next-app && npm run build",
  "installCommand": "cd apps/next-app && npm install && cd ../.. && npm install --prefix packages/shared",
  "framework": "nextjs"
}
```

### Opção B: Simplificar para um único package

Mover o conteúdo de `apps/next-app` para a raiz e remover a estrutura de monorepo:

```bash
# Criar branch de teste
git checkout -b single-package-deploy

# Mover arquivos
cp -r apps/next-app/* .
cp -r apps/next-app/.* .

# Atualizar vercel.json
echo '{}' > vercel.json

# Commit e deploy
git add .
git commit -m "Simplify structure for Vercel"
vercel --prod
```

### Opção C: Configurar Root Directory na Vercel

No dashboard da Vercel:
1. Vá em **Settings** > **General**
2. Em **Root Directory**, configure: `apps/next-app`
3. Clique em **Save**
4. Faça um novo deploy

Isso faz a Vercel tratar `apps/next-app` como raiz do projeto.

### Opção D: Usar package.json scripts

Adicionar no `package.json` raiz:

```json
{
  "scripts": {
    "vercel-build": "pnpm --filter next-app build",
    "vercel-install": "pnpm install --no-frozen-lockfile"
  }
}
```

E simplificar `vercel.json`:
```json
{
  "framework": "nextjs"
}
```

---

## Próximos Passos se o Build Atual Falhar

1. **Verificar logs**: https://vercel.com/ronaldofilardos-projects/omniapp
2. **Testar Opção C** (mais simples): Configurar Root Directory
3. **Se persistir, testar Opção A**: Usar npm na Vercel
4. **Último recurso, Opção B**: Simplificar estrutura

---

## Comandos Úteis para Debugging

### Testar build localmente com mesmas condições da Vercel:
```bash
# Limpar node_modules
Remove-Item -Recurse -Force node_modules, apps/*/node_modules

# Instalar com pnpm
pnpm install --no-frozen-lockfile

# Build do next-app
pnpm --filter next-app build
```

### Ver logs em tempo real da Vercel:
```bash
vercel logs https://omniapp-5ml0ps915-ronaldofilardos-projects.vercel.app
```

### Fazer deploy com output detalhado:
```bash
vercel --prod --debug
```

---

## Configuração Recomendada: Root Directory (Opção C)

**ESTA É A SOLUÇÃO MAIS SIMPLES E RECOMENDADA**

1. Acesse: https://vercel.com/ronaldofilardos-projects/omniapp/settings
2. Role até **Root Directory**
3. Configure: `apps/next-app`
4. Marque: **Include source files outside of the Root Directory in the Build Step**
5. Salve e faça redeploy

Isso elimina a necessidade de comandos customizados no `vercel.json`.

---

## Status Atual

- ✅ Configuração do .npmrc
- ✅ Atualização do vercel.json  
- 🔄 Deploy em andamento
- ⏳ Aguardando resultado

**Link de Inspeção**: https://vercel.com/ronaldofilardos-projects/omniapp/3ZCjZubV4J2b6cHqVCaCEfmnShh4
