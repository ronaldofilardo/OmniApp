# Script para adicionar variáveis de ambiente na Vercel
# Execute este script após revisar e ajustar os valores

Write-Host "=== Configuração de Variáveis de Ambiente na Vercel ===" -ForegroundColor Cyan
Write-Host ""

# Gerar um JWT_SECRET aleatório
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Host "JWT_SECRET gerado: $JWT_SECRET" -ForegroundColor Green
Write-Host ""
Write-Host "Para adicionar as variáveis de ambiente, execute os seguintes comandos:" -ForegroundColor Yellow
Write-Host ""

# Comandos para adicionar variáveis
$commands = @"
# 1. JWT_SECRET (obrigatório para autenticação)
vercel env add JWT_SECRET production
# Quando solicitado, cole: $JWT_SECRET

# 2. NODE_ENV
vercel env add NODE_ENV production
# Quando solicitado, digite: production

# 3. PORT (opcional, Vercel define automaticamente)
# vercel env add PORT production
# Quando solicitado, digite: 3000

# 4. TRAVEL_GAP_ENABLED (para detecção de conflitos)
vercel env add TRAVEL_GAP_ENABLED production
# Quando solicitado, digite: true

# 5. TRAVEL_GAP_MINUTES (minutos de gap entre eventos)
vercel env add TRAVEL_GAP_MINUTES production
# Quando solicitado, digite: 60

"@

Write-Host $commands -ForegroundColor White
Write-Host ""
Write-Host "=== Variáveis Essenciais ===" -ForegroundColor Cyan
Write-Host "✓ DATABASE_URL (já configurada)" -ForegroundColor Green
Write-Host "! JWT_SECRET (OBRIGATÓRIO - use o valor gerado acima)" -ForegroundColor Yellow
Write-Host "! NODE_ENV (recomendado)" -ForegroundColor Yellow
Write-Host "! TRAVEL_GAP_ENABLED (recomendado)" -ForegroundColor Yellow
Write-Host "! TRAVEL_GAP_MINUTES (recomendado)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Deseja que eu execute esses comandos automaticamente? (S/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    Write-Host ""
    Write-Host "Adicionando variáveis de ambiente..." -ForegroundColor Cyan
    
    # NODE_ENV
    Write-Host "`nAdicionando NODE_ENV..." -ForegroundColor Yellow
    "production" | vercel env add NODE_ENV production
    
    # JWT_SECRET
    Write-Host "`nAdicionando JWT_SECRET..." -ForegroundColor Yellow
    $JWT_SECRET | vercel env add JWT_SECRET production
    
    # TRAVEL_GAP_ENABLED
    Write-Host "`nAdicionando TRAVEL_GAP_ENABLED..." -ForegroundColor Yellow
    "true" | vercel env add TRAVEL_GAP_ENABLED production
    
    # TRAVEL_GAP_MINUTES
    Write-Host "`nAdicionando TRAVEL_GAP_MINUTES..." -ForegroundColor Yellow
    "60" | vercel env add TRAVEL_GAP_MINUTES production
    
    Write-Host "`n✓ Variáveis configuradas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "`nValores salvos em env-vars.txt para referência" -ForegroundColor Yellow
    @"
DATABASE_URL=postgresql://neondb_owner:npg_Iitb6kFyWAj9@ep-soft-cloud-ac5elx48-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
TRAVEL_GAP_ENABLED=true
TRAVEL_GAP_MINUTES=60
"@ | Out-File -FilePath "env-vars.txt" -Encoding UTF8
    
    Write-Host "Arquivo criado: env-vars.txt" -ForegroundColor Green
}
