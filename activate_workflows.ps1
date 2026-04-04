param(
    [string]$ApiKey = "",
    [string]$BaseUrl = "https://n8n.blackserver.com.br"
)

if (-not $ApiKey) {
    Write-Error "Passe a chave com: .\activate_workflows.ps1 -ApiKey 'SUA_CHAVE'"
    exit 1
}

$headers = @{
    "X-N8N-API-KEY" = $ApiKey
    "Content-Type"  = "application/json"
}

# 1. Activate all subworkflows first
$subWorkflowIds = @(
    @{ id = "5DlT0ovpytTdNa87"; name = "Customer Info Flow" },
    @{ id = "bscOn6O9AEE0bt30"; name = "Customer Booking Flow" },
    @{ id = "RgFopyhhXY9aM9n1"; name = "Customer Reschedule Flow" },
    @{ id = "Ey2g8ihpH3sre7I3"; name = "Customer Cancel Flow" },
    @{ id = "TlyT8Wj5yQdQyDtp"; name = "Owner Rule Update Flow" },
    @{ id = "KdGmwZJqXadaooEe"; name = "Customer Router" }
)

foreach ($wf in $subWorkflowIds) {
    try {
        $r = Invoke-RestMethod -Uri "$BaseUrl/api/v1/workflows/$($wf.id)/activate" `
            -Method POST -Headers $headers -ErrorAction Stop
        Write-Host "✅ Activated: $($wf.name) (active=$($r.active))"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "⚠️  $($wf.name): HTTP $code - $($_.Exception.Message)"
    }
}

# 2. Update the Router ID in the Inbound workflow node
$inboundId = "hQb9hVKH54Lxk5yC"
$routerId   = "KdGmwZJqXadaooEe"

Write-Host "`nFetching Inbound workflow..."
$inbound = Invoke-RestMethod -Uri "$BaseUrl/api/v1/workflows/$inboundId" `
    -Method GET -Headers $headers

# Find and update the "→ Router Cliente" node
$updated = $false
foreach ($node in $inbound.nodes) {
    if ($node.name -eq "→ Router Cliente") {
        $node.parameters.workflowId = @{
            "__rl" = $true
            "mode" = "id"
            "value" = $routerId
        }
        $node.typeVersion = 1.1
        $updated = $true
        Write-Host "✅ Updated node '→ Router Cliente' → Router ID: $routerId"
        break
    }
}

if ($updated) {
    $body = $inbound | ConvertTo-Json -Depth 20
    Invoke-RestMethod -Uri "$BaseUrl/api/v1/workflows/$inboundId" `
        -Method PUT -Headers $headers -Body $body | Out-Null

    # Activate inbound
    Invoke-RestMethod -Uri "$BaseUrl/api/v1/workflows/$inboundId/activate" `
        -Method POST -Headers $headers | Out-Null
    Write-Host "✅ Inbound workflow saved and activated!"
} else {
    Write-Host "❌ Node '→ Router Cliente' not found in Inbound workflow"
}

Write-Host "`n🎉 Done! All Commercial workflows are configured."
