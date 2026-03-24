---
description: Faz commit e push das mudancas para o GitHub
user_invocable: true
---

# Commit & Push

1. `git status` — ver mudancas
2. `git diff` — entender o que mudou
3. `git log --oneline -5` — ver estilo dos commits recentes
4. `git add {arquivos especificos}` — nunca `git add .`
5. Commit em Conventional Commits (portugues):
   ```
   tipo(escopo): descricao curta (max 72 chars)

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```
6. `git push`

**Nunca commitar:** .env, credenciais, secrets.
**Nunca usar:** --no-verify, amend sem permissao.
