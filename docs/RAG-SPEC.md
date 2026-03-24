# RAG-SPEC.md — BarberFlow

## Agentes RAG

### 1. Agente Profissional (Dono)
- **Objetivo:** Permitir que o dono ensine a IA via WhatsApp e consulte métricas.
- **Base de Conhecimento:** Regras de negócio, scripts de resposta, histórico de correções.
- **Intenções:** "adicionar regra", "ver agenda", "modificar preço".

### 2. Agente Cliente
- **Objetivo:** Atendimento personalizado baseado no histórico do cliente.
- **Base de Conhecimento:** Preferências do cliente, histórico de cortes, pontos de fidelidade.
- **Intenções:** "agendar", "cancelar", "saber preço", "localização".

## Busca Semântica (pgvector)
- **Embedding:** `text-embedding-3-small` (OpenAI).
- **Threshold:** Similaridade mínima de 0.75 para considerar um documento relevante.
- **Contexto:** Injetado no system prompt da Claude API.
