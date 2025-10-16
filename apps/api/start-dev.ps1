param(
  [string]$showAllOrphans = 'true',
  [int]$port = 3333
)

function Kill-Port {
  param([int]$port)
  try {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
      $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
      foreach ($pid in $pids) {
        if ($pid) {
          Write-Host "Killing process $pid listening on port $port"
          Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
      }
    } else {
      Write-Host "No process found listening on port $port"
    }
  } catch {
    Write-Warning "Kill-Port: $_"
  }
}

# Move to script dir
Set-Location -Path (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)

Write-Host "Starting dev server (REPO_DEV_SHOW_ALL_ORPHANS=$showAllOrphans) in $(Get-Location)"

# Kill any existing process on the port
Kill-Port -port $port

# Set env for the current session (ts-node-dev will inherit this)
$env:REPO_DEV_SHOW_ALL_ORPHANS = $showAllOrphans

# Ensure logs exist
if (-not (Test-Path -Path '.\server.out.log')) { New-Item -Path '.\server.out.log' -ItemType File | Out-Null }
if (-not (Test-Path -Path '.\server.err.log')) { New-Item -Path '.\server.err.log' -ItemType File | Out-Null }

# Start the server with pnpm exec ts-node-dev and redirect logs
Write-Host 'Starting ts-node-dev via pnpm exec... (logs -> server.out.log / server.err.log)'
try {
  # Use cmd.exe /c to run pnpm on Windows in foreground (no redirection) so output appears
  $cmd = "pnpm exec ts-node-dev src/server.ts"
  Write-Host "Executing: cmd.exe /c $cmd"
  $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', $cmd) -WorkingDirectory (Get-Location) -NoNewWindow -PassThru
  Write-Host "Started process Id: $($proc.Id) (cmd.exe wrapper for pnpm)"
} catch {
  Write-Warning "Failed to start pnpm via cmd.exe: $_"
}

# Wait a bit for server to boot
Start-Sleep -Seconds 3

# Try the debug endpoint
try {
  Write-Host 'Calling /repository/orphans/debug ...'
  $resp = Invoke-RestMethod -Method GET -Uri "http://localhost:$port/repository/orphans/debug" -ErrorAction Stop
  Write-Host 'Response from debug endpoint:'
  $resp | ConvertTo-Json -Depth 5 | Write-Host
} catch {
  Write-Warning 'Failed to call debug endpoint. Check logs and the process.'
  Write-Host 'Tail last 200 lines of server.err.log:'
  Get-Content -Path '.\server.err.log' -Tail 200 | Out-String | Write-Host
}

Write-Host 'If server started, you can stream logs with: Get-Content .\server.out.log -Wait'