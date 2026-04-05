$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YWRmZGM2ZS03NmExLTRmMzQtYWZmOC1hNWYyMTljNDNmMzQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiOWQyMGUyZjAtODc4Ny00Nzk0LWFlOTAtYTBhZGU2NzMyZmM0IiwiaWF0IjoxNzc1MzQyOTcyLCJleHAiOjE3Nzc4NjcyMDB9.VAWIfII8ixvilJ-Qu9yxYVMInO-BePmEatL1K4Lk3wE"
$base = "https://n8n.blackserver.com.br"
$h = @{ "X-N8N-API-KEY" = $key; "Content-Type" = "application/json" }

$subIds = @(
    @{ id = "5DlT0ovpytTdNa87"; name = "Info Flow" },
    @{ id = "bscOn6O9AEE0bt30"; name = "Booking Flow" },
    @{ id = "RgFopyhhXY9aM9n1"; name = "Reschedule Flow" },
    @{ id = "Ey2g8ihpH3sre7I3"; name = "Cancel Flow" },
    @{ id = "TlyT8Wj5yQdQyDtp"; name = "Owner Rule Update" }
)

foreach ($wf in $subIds) {
    # Get current workflow
    $current = Invoke-RestMethod -Uri "$base/api/v1/workflows/$($wf.id)" -Method GET -Headers $h

    # Set callerPolicy to workflowsFromSameOwner (which allows Router since they're in same owner)
    if (-not $current.settings) { $current.settings = @{} }
    $current.settings.callerPolicy = "workflowsFromSameOwner"

    # PUT the updated workflow
    $body = $current | ConvertTo-Json -Depth 20
    try {
        Invoke-RestMethod -Uri "$base/api/v1/workflows/$($wf.id)" -Method PUT -Headers $h -Body $body | Out-Null
        Write-Host "Updated $($wf.name): callerPolicy=workflowsFromSameOwner"
    } catch {
        Write-Host "Error updating $($wf.name): $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "--- Trying to activate Router ---"
try {
    $resp = Invoke-WebRequest -Uri "$base/api/v1/workflows/KdGmwZJqXadaooEe/activate" -Method POST -Headers $h -ErrorAction Stop
    $data = $resp.Content | ConvertFrom-Json
    Write-Host "Router activated! active=$($data.active)"
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Host "HTTP $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Body: $body"
}
