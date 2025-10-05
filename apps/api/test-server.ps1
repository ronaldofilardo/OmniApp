# PowerShell HTTP Listener Test
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8080/")
$listener.Start()

Write-Host "🚀 PowerShell HTTP Server started on http://127.0.0.1:8080/" -ForegroundColor Green
Write-Host "Teste com: curl http://127.0.0.1:8080/health" -ForegroundColor Yellow

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        if ($request.Url.AbsolutePath -eq "/health") {
            $responseString = '{"status":"ok","timestamp":"' + (Get-Date).ToString("o") + '"}'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseString)
            $response.ContentLength64 = $buffer.Length
            $response.ContentType = "application/json"
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $response.StatusCode = 404
        }
        
        $response.Close()
    }
} finally {
    $listener.Stop()
}