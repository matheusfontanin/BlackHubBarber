$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YWRmZGM2ZS03NmExLTRmMzQtYWZmOC1hNWYyMTljNDNmMzQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiOWQyMGUyZjAtODc4Ny00Nzk0LWFlOTAtYTBhZGU2NzMyZmM0IiwiaWF0IjoxNzc1MzQyOTcyLCJleHAiOjE3Nzc4NjcyMDB9.VAWIfII8ixvilJ-Qu9yxYVMInO-BePmEatL1K4Lk3wE"
$base = "https://n8n.blackserver.com.br"
$h = @{ "X-N8N-API-KEY" = $key; "Content-Type" = "application/json" }

# Check callerPolicy on subworkflows and the router
$ids = @(
    @{ id = "KdGmwZJqXadaooEe"; name = "Router" },
    @{ id = "5DlT0ovpytTdNa87"; name = "Info Flow" },
    @{ id = "bscOn6O9AEE0bt30"; name = "Booking Flow" },
    @{ id = "RgFopyhhXY9aM9n1"; name = "Reschedule Flow" },
    @{ id = "Ey2g8ihpH3sre7I3"; name = "Cancel Flow" },
    @{ id = "TlyT8Wj5yQdQyDtp"; name = "Owner Rule Update" }
)

foreach ($wf in $ids) {
    $r = Invoke-RestMethod -Uri "$base/api/v1/workflows/$($wf.id)" -Method GET -Headers $h
    $policy = $r.settings.callerPolicy
    $active = $r.active
    Write-Host "$($wf.name): callerPolicy=$policy, active=$active"
}
