$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YWRmZGM2ZS03NmExLTRmMzQtYWZmOC1hNWYyMTljNDNmMzQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiOWQyMGUyZjAtODc4Ny00Nzk0LWFlOTAtYTBhZGU2NzMyZmM0IiwiaWF0IjoxNzc1MzQyOTcyLCJleHAiOjE3Nzc4NjcyMDB9.VAWIfII8ixvilJ-Qu9yxYVMInO-BePmEatL1K4Lk3wE"
$base = "https://n8n.blackserver.com.br"
$headers = @{ "X-N8N-API-KEY" = $key; "Content-Type" = "application/json" }

try {
    $r = Invoke-RestMethod -Uri "$base/api/v1/workflows/KdGmwZJqXadaooEe/activate" -Method POST -Headers $headers -ErrorAction Stop
    Write-Host "Router ativado! active=$($r.active)"
} catch {
    Write-Host "Erro: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Detalhes: $($reader.ReadToEnd())"
    }
}
