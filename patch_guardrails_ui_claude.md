
# PATCH — GUARDRAILS DE UI PARA CLAUDE CODE
## Destino recomendado: `CLAUDE.md`

> Objetivo: evitar que o Claude Code transforme instruções internas, observações técnicas, notas de UX ou comentários de implementação em texto visível dentro da interface.

---

# BLOCO PARA ADICIONAR NO `CLAUDE.md`

```md
## Regras de UI e Conteúdo Visível

Ao implementar interfaces, formulários, cards, modais, páginas ou componentes visuais, siga estas regras rigorosamente:

### 1. Nunca transformar instruções internas em texto da interface
Observações como:
- "aparece no menu lateral"
- "isso vai para a IA"
- "usar no onboarding"
- "salvar no Supabase"
- "campo usado pelo N8N"
- "ideal: quadrado, fundo transparente"
- "máx. 500KB"
- "essa informação será usada no prompt"
- "isso alimenta o agente"
- "mostrar no dashboard depois"

NÃO devem ser renderizadas automaticamente como:
- títulos
- subtítulos
- descrições
- labels
- helper texts
- placeholders
- badges
- avisos
- tooltips
- textos secundários

Essas frases são, por padrão, instruções de implementação ou contexto de produto, e não conteúdo para o usuário final.

---

### 2. Só mostrar texto na UI se ele for explicitamente adequado ao usuário final
Antes de adicionar qualquer texto visível, valide mentalmente:

- isso faz sentido para o dono da barbearia ler?
- isso ajuda a usar a interface?
- isso parece texto de produto real?
- isso foi pedido como microcopy visível?
- isso tem função prática na experiência?

Se a resposta não for claramente "sim", não renderize o texto.

---

### 3. Diferenciar obrigatoriamente:
- regra técnica
- observação de implementação
- conteúdo visível

#### Regra técnica
Serve para código, comportamento, integração ou persistência.  
Nunca deve virar texto na UI automaticamente.

#### Observação de implementação
Serve para orientar desenvolvimento, arquitetura ou UX.  
Nunca deve virar texto visível sem pedido explícito.

#### Conteúdo visível
Só pode aparecer na interface quando for claramente uma destas categorias:
- label de campo
- título de seção
- descrição útil ao usuário
- helper text realmente necessário
- mensagem de erro
- mensagem de sucesso
- empty state
- CTA

---

### 4. Helper texts devem ser mínimos e úteis
Não adicionar helper text por impulso.

Só usar helper text quando ele:
- evita erro real de uso
- explica restrição importante
- melhora a conversão ou compreensão

Evitar helper texts decorativos, redundantes ou que pareçam comentário de documentação.

Exemplo incorreto:
- "Aparece no menu lateral"
- "Esse dado será usado pela IA"
- "O sistema salva isso para uso futuro"

Exemplo correto:
- "Envie uma imagem quadrada para melhor visualização."
- "Formatos aceitos: PNG, JPG, SVG ou WEBP."

---

### 5. Não inventar microcopy
Não inventar:
- slogans
- descrições
- observações
- textos de apoio
- empty states
- mensagens de ajuda

a menos que isso tenha sido pedido ou seja claramente necessário para completar a interface.

Se houver dúvida, prefira:
- interface mais limpa
- menos texto
- texto mais direto

---

### 6. Princípio de UX: menos texto, mais precisão
Ao construir UI:
- prefira título curto
- label claro
- descrição apenas se indispensável
- nada de comentários disfarçados de microcopy

---

### 7. Em caso de dúvida, não renderizar
Se não estiver claro se uma frase é:
- instrução técnica
ou
- texto para o usuário

assuma que é instrução técnica e NÃO mostre na UI.

---

### 8. Check obrigatório antes de finalizar qualquer tela
Antes de concluir uma implementação visual, revisar cada texto renderizado e perguntar:

- esse texto foi realmente pedido?
- esse texto ajuda o usuário final?
- esse texto parece comentário de dev?
- esse texto parece documentação vazando para a interface?
- esse texto está poluindo a tela?

Se parecer comentário, documentação ou observação interna, remover.

---

### 9. Regra específica para uploads, integrações e configurações
Em campos de upload, integração, IA, agenda, onboarding e configurações:
- não transformar observações arquiteturais em UI
- não expor detalhes técnicos sem necessidade
- não adicionar explicações sobre sistema interno
- não explicar implementação ao usuário final

Exemplo:
Se a instrução for:
"O logo deve aparecer no menu lateral"

Isso significa comportamento do sistema.
Não significa que a interface deve mostrar a frase:
"Aparece no menu lateral"

---

### 10. Prioridade final
Sempre priorize:
1. clareza visual
2. limpeza da interface
3. utilidade real do texto
4. consistência com produto premium
5. zero vazamento de comentários internos
```

---

# INSTRUÇÃO CURTA PARA COLAR NO CLAUDE CODE AGORA

Use esta regra a partir deste momento:

**Nunca transforme observações de implementação, contexto técnico, notas arquiteturais ou comentários de UX em texto visível na interface.**  
Só adicione textos na UI se forem claramente úteis para o usuário final e fizerem parte real da experiência.  
Se houver dúvida entre "isso é instrução interna" e "isso é microcopy", trate como instrução interna e não renderize.

---

# RECOMENDAÇÃO DE USO

O melhor lugar para isso é o `CLAUDE.md`, porque essa regra é:
- operacional
- transversal
- recorrente
- e afeta qualquer tela futura

Opcionalmente, você também pode repetir uma versão resumida em:
- `docs/ai-collab/decisoes.md`
- ou em um bloco "UI guardrails" dentro do documento mestre do projeto

Mas o local principal deve ser o `CLAUDE.md`.
