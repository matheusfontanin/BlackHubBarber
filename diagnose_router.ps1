$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YWRmZGM2ZS03NmExLTRmMzQtYWZmOC1hNWYyMTljNDNmMzQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiOWQyMGUyZjAtODc4Ny00Nzk0LWFlOTAtYTBhZGU2NzMyZmM0IiwiaWF0IjoxNzc1MzQyOTcyLCJleHAiOjE3Nzc4NjcyMDB9.VAWIfII8ixvilJ-Qu9yxYVMInO-BePmEatL1K4Lk3wE"
$base = "https://n8n.blackserver.com.br"
$headers = @{ "X-N8N-API-KEY" = $key; "Content-Type" = "application/json" }

# Get full error body from failed activation
try {
    $resp = Invoke-WebRequest -Uri "$base/api/v1/workflows/KdGmwZJqXadaooEe/activate" `
        -Method POST -Headers $headers -ErrorAction Stop
    Write-Host "OK: $($resp.Content)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Host "HTTP $statusCode"
    Write-Host "Body: $body"
}

Write-Host ""
Write-Host "--- Checking current Router state ---"
$r = Invoke-RestMethod -Uri "$base/api/v1/workflows/KdGmwZJqXadaooEe" -Method GET -Headers $headers
Write-Host "active=$($r.active)"
Write-Host "nodes=$($r.nodes.Count)"
$r.nodes | ForEach-Object { Write-Host "  node: $($_.name) [$($_.type)]" }
