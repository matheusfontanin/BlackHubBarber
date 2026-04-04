# 📋 TECH NOTES — Pilar Comercial BlackHub

## IDs dos Workflows no N8N (Produção)

| Workflow | ID N8N | Status |
|---|---|---|
| Commercial — Webhook Inbound | `hQb9hVKH54Lxk5yC` | ✅ Ativo |
| Commercial — Customer Router | `KdGmwZJqXadaooEe` | ⚠️ Ativar manualmente |
| Commercial — Customer Info Flow | `5DlT0ovpytTdNa87` | ✅ Ativo |
| Commercial — Customer Booking Flow | `bscOn6O9AEE0bt30` | ✅ Ativo |
| Commercial — Customer Reschedule Flow | `RgFopyhhXY9aM9n1` | ✅ Ativo |
| Commercial — Customer Cancel Flow | `Ey2g8ihpH3sre7I3` | ✅ Ativo |
| Commercial — Owner Rule Update Flow | `TlyT8Wj5yQdQyDtp` | ✅ Ativo |

---

## ⚠️ Pendência: Ativar o Router

O **Customer Router** foi criado diretamente via API mas precisa ser ativado manualmente.

### Opção A — Script PowerShell (recomendado)
```powershell
cd "c:\Users\mat-f\OneDrive\Área de Trabalho\Antigravity\Particulares\Barbearias"
.\activate_workflows.ps1 -ApiKey "SUA_CHAVE"
```

A chave está em: **https://n8n.blackserver.com.br/settings/api**

### Opção B — Via UI
1. Acesse https://n8n.blackserver.com.br
2. Abra o workflow "Commercial — Customer Router"
3. Clique no toggle **Active** no canto superior direito
4. Abra "Commercial — Webhook Inbound"
5. No nó **"→ Router Cliente"**, confirme que aponta para "Commercial — Customer Router"

---

## Arquitetura do Fluxo

```
WhatsApp (Evolution API)
    └── Webhook Inbound (hQb9hVKH54Lxk5yC)
            ├── Resolver Tenant
            ├── Criar/Buscar Cliente
            ├── Gerenciar Conversa
            ├── Salvar Mensagem
            ├── [DONO] → Owner Rule Update Flow (TlyT8Wj5yQdQyDtp)
            └── [CLIENTE] → Customer Router (KdGmwZJqXadaooEe)
                    ├── info      → Info Flow (5DlT0ovpytTdNa87)
                    ├── booking   → Booking Flow (bscOn6O9AEE0bt30)
                    ├── reschedule→ Reschedule Flow (RgFopyhhXY9aM9n1)
                    └── cancel    → Cancel Flow (Ey2g8ihpH3sre7I3)
```

---

## Conflict Detection (implementado no Booking e Reschedule)

O Booking Flow verifica **dois tipos** de conflito antes de criar o agendamento:
1. **Conflito exato**: outro agendamento no mesmo intervalo de início
2. **Conflito por sobreposição**: outro agendamento que termina dentro do novo horário

Ao detectar conflito, o bot informa o horário ocupado e sugere o próximo slot disponível (fim do conflito + buffer).

---

## Variáveis de Ambiente N8N (configurar em Settings → Variables)

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | Service role key |
| `EVOLUTION_API_URL` | URL da Evolution API |
| `EVOLUTION_API_KEY` | Chave da Evolution API |

---

## Credenciais N8N (configurar em Settings → Credentials)

- **OpenAI API**: Para todos os flows com IA (classificação, booking, regras)
  - Usado nos nós `@n8n/n8n-nodes-langchain.openAi`

---

## Ordem de Importação (se precisar reimportar)

1. `commercial.customer.info-flow.json`
2. `commercial.customer.booking-flow.json`
3. `commercial.customer.reschedule-flow.json`
4. `commercial.customer.cancel-flow.json`
5. `commercial.owner.rule-update-flow.json`
6. Router (criar via API ou copiar IDs acima)
7. `commercial.webhook-inbound.json`

---

## Teste End-to-End

Enviar mensagem para o número WhatsApp conectado e verificar:

| Mensagem | Fluxo Esperado | Resultado |
|---|---|---|
| "Qual o preço do corte?" | Info Flow | Resposta com preços |
| "Quero marcar para amanhã às 14h" | Booking Flow | Cria appointment no Supabase |
| "Quero remarcar meu horário" | Reschedule Flow | Atualiza appointment |
| "Preciso cancelar" | Cancel Flow | Status → cancelled |
| (dono) "O corte agora custa 60" | Owner Rule Update | Salva em regras_dinamicas |
