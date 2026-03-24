---
description: Referencia rapida de expressoes N8N (sintaxe, variaveis, exemplos)
user_invocable: true
---

# Expressoes N8N — Referencia Rapida

## Acesso a Dados
```
{{ $json.campo }}                          — campo do item atual
{{ $json.objeto.campo_aninhado }}          — campo aninhado
{{ $json['campo-com-hifen'] }}             — campo com caracter especial
{{ $node['Nome do Node'].json.campo }}     — dado de node especifico
{{ $input.first().json.campo }}            — primeiro item do input
{{ $input.all() }}                         — todos os items
```

## Variaveis de Contexto
```
{{ $env.MINHA_VAR }}                       — variavel de ambiente
{{ $now.toISO() }}                         — data/hora atual ISO
{{ $now.toFormat('dd/MM/yyyy') }}          — data formatada
{{ $workflow.id }}                         — ID do workflow
{{ $execution.id }}                        — ID da execucao
```

## Operacoes Uteis
```
{{ $json.texto.toUpperCase() }}            — maiusculas
{{ $json.lista.length }}                   — tamanho do array
{{ $json.lista.join(', ') }}               — join de array
{{ $json.campo ?? 'valor_padrao' }}        — fallback se null/undefined
{{ $json.ativo ? 'sim' : 'nao' }}          — condicional ternario
{{ JSON.stringify($json) }}               — serializar para string
```

## Patterns Comuns no BarberFlow
```
— Tenant ID do webhook WhatsApp:
{{ $json.instance }}

— Mensagem recebida:
{{ $json.data.message.conversation ?? $json.data.message.extendedTextMessage.text }}

— Resposta da Claude API:
{{ $json.content[0].text }}

— Timestamp para Supabase:
{{ new Date().toISOString() }}
```

## Dica de Debug
Adicionar node **Set** antes do node problemático com:
```
{{ JSON.stringify($json) }}
```
Isso exibe o objeto completo e revela o caminho correto dos campos.
