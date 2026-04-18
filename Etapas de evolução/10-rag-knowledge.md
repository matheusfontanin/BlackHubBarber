# Etapa 10 — RAG / Knowledge Base

**Duração estimada:** 4-5 dias
**Depende de:** [04 — Preparação N8N/Evolution](04-preparacao-n8n-evolution.md)
**Prioridade:** 🟡 Média-alta

## Objetivo

Permitir que o barbeiro envie documentos (cardápio detalhado, FAQ, regras internas, histórico de atendimento) e a IA consulte esses documentos durante conversas via **Retrieval-Augmented Generation (RAG)**.

O `pgvector` já está instalado em [00001_initial_schema.sql:8](supabase/migrations/00001_initial_schema.sql#L8) — falta a UI, pipeline de embeddings e tool para a IA.

---

## 10.1 — Schema

### `knowledge_documents`
```sql
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT CHECK (source_type IN ('upload','text','url','generated')),
  source_url TEXT,                          -- URL da origem, se aplicável
  file_path TEXT,                           -- path no Storage

  content_raw TEXT,                         -- texto completo (para busca full-text)
  metadata JSONB,

  category TEXT,                            -- 'faq','services','rules','menu','internal'
  tags TEXT[],
  priority INT DEFAULT 0,                   -- documentos mais importantes aparecem primeiro no retrieval

  chunks_count INT DEFAULT 0,
  indexed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','indexing','indexed','error')),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `knowledge_chunks`
```sql
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,

  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),                   -- OpenAI ada-002 dim; ajustar se usar outro modelo
  token_count INT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON knowledge_chunks (tenant_id, document_id);
```

---

## 10.2 — Pipeline de indexação

### Fluxo

```
Upload/texto → Chunking → Embedding → Insert → Ready
```

### Chunking strategy

- Dividir em blocos de ~500 tokens com overlap de 50 tokens
- Preservar quebras de parágrafo e seções
- Lib: `llm-chunk` ou implementação simples baseada em contagem de caracteres

### Edge Function: `kb-index-document`

```ts
// POST /functions/v1/kb-index-document
// body: { documentId: string }
// 1. Lê o documento
// 2. Chunka
// 3. Para cada chunk, chama OpenAI embeddings (ou Voyage, Cohere)
// 4. Insere em knowledge_chunks
// 5. Atualiza knowledge_documents.status = 'indexed'
```

### Tarefas

- [ ] Supabase Storage bucket `knowledge` com RLS por tenant
- [ ] Edge Function `kb-index-document` com chunking + embedding
- [ ] Fila de processamento via `pg_cron` ou trigger (documentos com `status='pending'`)
- [ ] Retry em caso de erro (max 3 tentativas)

---

## 10.3 — Busca semântica

### Edge Function: `kb-search`
```ts
// POST /functions/v1/kb-search
// body: { tenant_id, query, top_k?: 5, category?: string }
// response: { chunks: [{ content, score, document_title }], usage: {...} }
```

Implementação:
```sql
SELECT
  kc.content,
  kd.title AS document_title,
  1 - (kc.embedding <=> $query_embedding) AS score
FROM knowledge_chunks kc
JOIN knowledge_documents kd ON kd.id = kc.document_id
WHERE kc.tenant_id = $tenant_id
  AND ($category IS NULL OR kd.category = $category)
ORDER BY kc.embedding <=> $query_embedding
LIMIT $top_k;
```

---

## 10.4 — Tool para a IA

Nova tool `search_knowledge` que o agente N8N chama quando precisa de informação específica:

```json
{
  "tool": "search_knowledge",
  "arguments": {
    "query": "como funciona o atendimento de noivos?",
    "top_k": 3
  }
}
```

A IA recebe os chunks relevantes e usa como contexto para responder naturalmente.

### Tarefas

- [ ] Adicionar tool aos workflows N8N
- [ ] Documentar em [docs/n8n/tools-contract.md](docs/n8n/tools-contract.md)
- [ ] Testar com consulta real: barbeiro upload PDF do regulamento, cliente pergunta algo, verificar resposta

---

## 10.5 — UI

### Nova rota: `/knowledge` (ou dentro de Settings → IA → Conhecimento)

```
src/pages/knowledge/
├── KnowledgePage.tsx            (lista de documentos)
├── components/
│   ├── DocumentUploader.tsx     (drag-drop ou texto livre)
│   ├── DocumentCard.tsx         (com status de indexação)
│   ├── DocumentEditor.tsx       (editar texto direto)
│   ├── DocumentPreview.tsx      (ver chunks gerados)
│   ├── TestSearchPanel.tsx      (testar queries manualmente)
│   └── CategoryFilter.tsx
```

### Funcionalidades

- **Upload**: PDF, TXT, MD, DOCX (via lib `mammoth` para DOCX, `pdf-parse` para PDF, ambos no server)
- **Texto direto**: editor rico simples para criar FAQs
- **URL**: cola uma URL → fetch + parse HTML → texto → indexação
- **Preview de chunks**: mostra como o doc foi dividido (útil para debugging)
- **Teste de busca**: campo de query → mostra os top chunks retornados → barbeiro valida se está funcionando
- **Status em tempo real**: badge muda conforme indexação (pending → indexing → indexed)

### Documentos sugeridos (onboarding)

Ao conectar, sugerir criar 5 documentos:
1. "FAQ — Perguntas frequentes"
2. "Regulamento da barbearia"
3. "Nossos serviços em detalhe"
4. "Política de cancelamento"
5. "Sobre nós / História"

---

## 10.6 — Escolha do modelo de embeddings

Opções:

| Opção | Prós | Contras |
|---|---|---|
| OpenAI `text-embedding-3-small` | Barato ($0.02/1M), qualidade alta | Vendor lock |
| Voyage `voyage-3` | Melhor quality/price | API adicional |
| Cohere `embed-multilingual-v3` | Multilingue nativo | Menos popular |

**Recomendação:** OpenAI text-embedding-3-small. 1536 dim, barato, qualidade suficiente para PT-BR.

---

## Critérios de aceitação

- [ ] Upload de PDF/texto funciona
- [ ] Indexação automática após upload
- [ ] Busca retorna chunks relevantes em < 500ms
- [ ] Tool `search_knowledge` disponível ao N8N
- [ ] UI mostra status de indexação em tempo real
- [ ] Teste manual de busca funciona
- [ ] RLS: um tenant não vê documentos de outro
- [ ] Testes: indexação, busca, filtro por categoria
