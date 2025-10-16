# Script para liberar a porta 3333 (API) no Firewall do Windows
# Execute como Administrador

Write-Host "Criando regra de firewall para permitir acesso à API (porta 3333)..." -ForegroundColor Green

New-NetFirewallRule -DisplayName "Omni Saude API - Porta 3333" `
    -Direction Inbound `
    -LocalPort 3333 `
    -Protocol TCP `
    -Action Allow `
    -Profile Any `
    -ErrorAction SilentlyContinue

if ($?) {
    Write-Host "✅ Regra de firewall criada com sucesso!" -ForegroundColor Green
    Write-Host "A API agora está acessível na rede local pela porta 3333" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ Erro ao criar regra. Você executou como Administrador?" -ForegroundColor Yellow
}

Write-Host "`nPara testar do celular, acesse:" -ForegroundColor White
Write-Host "http://192.168.15.4:3333/health" -ForegroundColor Yellow
