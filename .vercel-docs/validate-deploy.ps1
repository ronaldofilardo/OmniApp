# Script de validação pré-deploy para Vercel
# Execute este script DA RAIZ DO PROJETO antes de fazer deploy
# Exemplo: .\.vercel-docs\validate-deploy.ps1

Write-Host "🔍 Validando configuração para deploy na Vercel..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# Verificar se está na raiz do projeto
if (-not (Test-Path "pnpm-workspace.yaml")) {
    Write-Host "❌ Execute este script na raiz do projeto!" -ForegroundColor Red
    Write-Host "   Comando correto: .\.vercel-docs\validate-deploy.ps1" -ForegroundColor Yellow
    exit 1
}

# 1. Verificar arquivos de configuração
Write-Host "📁 Verificando arquivos de configuração..." -ForegroundColor Yellow

$requiredFiles = @(
    "vercel.json",
    ".vercelignore",
    "apps/next-app/vercel.json",
    "apps/next-app/next.config.ts",
    "apps/next-app/package.json",
    "pnpm-workspace.yaml"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        $errors += "  ❌ Arquivo não encontrado: $file"
        Write-Host "  ❌ $file" -ForegroundColor Red
    }
}

Write-Host ""

# 2. Verificar package.json do next-app
Write-Host "📦 Verificando scripts de build..." -ForegroundColor Yellow

$packageJson = Get-Content "apps/next-app/package.json" -Raw | ConvertFrom-Json

if ($packageJson.scripts.build) {
    Write-Host "  ✅ Script 'build' encontrado" -ForegroundColor Green
} else {
    $errors += "  ❌ Script 'build' não encontrado em apps/next-app/package.json"
    Write-Host "  ❌ Script 'build' não encontrado" -ForegroundColor Red
}

if ($packageJson.scripts.'vercel-build') {
    Write-Host "  ✅ Script 'vercel-build' encontrado" -ForegroundColor Green
} else {
    $warnings += "  ⚠️ Script 'vercel-build' não encontrado (opcional)"
    Write-Host "  ⚠️ Script 'vercel-build' não encontrado (opcional)" -ForegroundColor Yellow
}

Write-Host ""

# 3. Verificar next.config.ts
Write-Host "⚙️ Verificando next.config.ts..." -ForegroundColor Yellow

$nextConfig = Get-Content "apps/next-app/next.config.ts" -Raw

if ($nextConfig -match "transpilePackages.*shared") {
    Write-Host "  ✅ transpilePackages configurado" -ForegroundColor Green
} else {
    $errors += "  ❌ transpilePackages não encontrado em next.config.ts"
    Write-Host "  ❌ transpilePackages não configurado" -ForegroundColor Red
}

if ($nextConfig -match "output.*standalone") {
    Write-Host "  ✅ output: 'standalone' configurado" -ForegroundColor Green
} else {
    $warnings += "  ⚠️ output: 'standalone' não encontrado (recomendado)"
    Write-Host "  ⚠️ output: 'standalone' não configurado (recomendado)" -ForegroundColor Yellow
}

Write-Host ""

# 4. Verificar pacote shared
Write-Host "📚 Verificando pacote shared..." -ForegroundColor Yellow

if (Test-Path "packages/shared/package.json") {
    $sharedPackage = Get-Content "packages/shared/package.json" -Raw | ConvertFrom-Json
    
    if ($sharedPackage.exports) {
        Write-Host "  ✅ Exports configurados no package.json do shared" -ForegroundColor Green
    } else {
        $warnings += "  ⚠️ Exports não configurados no package.json do shared"
        Write-Host "  ⚠️ Exports não configurados" -ForegroundColor Yellow
    }
} else {
    $errors += "  ❌ packages/shared/package.json não encontrado"
    Write-Host "  ❌ packages/shared/package.json não encontrado" -ForegroundColor Red
}

Write-Host ""

# 5. Teste de build local
Write-Host "🏗️ Testando build local..." -ForegroundColor Yellow
Write-Host "  (Isso pode levar alguns minutos)" -ForegroundColor Gray

Push-Location "apps/next-app"

# Limpar build anterior
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "  ✅ Build anterior limpo" -ForegroundColor Green
}

# Instalar dependências
Write-Host "  📥 Instalando dependências..." -ForegroundColor Gray
$installOutput = pnpm install 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Dependências instaladas" -ForegroundColor Green
} else {
    $errors += "  ❌ Falha ao instalar dependências"
    Write-Host "  ❌ Falha ao instalar dependências" -ForegroundColor Red
    Write-Host "  Saída: $installOutput" -ForegroundColor Red
}

# Gerar Prisma Client
Write-Host "  🔧 Gerando Prisma Client..." -ForegroundColor Gray
$prismaOutput = pnpm prisma generate 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Prisma Client gerado" -ForegroundColor Green
} else {
    $warnings += "  ⚠️ Falha ao gerar Prisma Client (pode ser necessário DATABASE_URL)"
    Write-Host "  ⚠️ Prisma Client não gerado (verifique DATABASE_URL)" -ForegroundColor Yellow
}

# Build
Write-Host "  🔨 Executando build..." -ForegroundColor Gray
$buildOutput = pnpm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Build executado com sucesso!" -ForegroundColor Green
} else {
    $errors += "  ❌ Build falhou"
    Write-Host "  ❌ Build falhou" -ForegroundColor Red
    Write-Host "  Saída: $buildOutput" -ForegroundColor Red
}

Pop-Location

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Resumo
if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ TUDO OK! Seu projeto está pronto para deploy na Vercel!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Configure as variáveis de ambiente na Vercel" -ForegroundColor White
    Write-Host "2. Configure Root Directory: apps/next-app" -ForegroundColor White
    Write-Host "3. Configure Install Command: pnpm install --filter=next-app..." -ForegroundColor White
    Write-Host "4. Faça o deploy!" -ForegroundColor White
} elseif ($errors.Count -eq 0) {
    Write-Host "⚠️ ATENÇÃO! Há alguns avisos:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host $warning -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "O deploy pode funcionar, mas recomendamos corrigir os avisos." -ForegroundColor Yellow
} else {
    Write-Host "❌ ERROS ENCONTRADOS! Corrija antes de fazer deploy:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host $error -ForegroundColor Red
    }
    Write-Host ""
    if ($warnings.Count -gt 0) {
        Write-Host "Avisos adicionais:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host $warning -ForegroundColor Yellow
        }
    }
    exit 1
}

Write-Host ""
Write-Host "📚 Veja VERCEL_DEPLOY_GUIDE.md para mais informações" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
