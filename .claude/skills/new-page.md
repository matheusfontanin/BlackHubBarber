---
description: Cria uma nova pagina no BarberFlow
user_invocable: true
---

# Nova Pagina

1. Ler paginas existentes similares para manter consistencia
2. Criar `src/pages/{feature}/{FeaturePage}.tsx`
3. Adicionar rota em `src/App.tsx`
4. Verificar: `npm run lint` passa

Regras:
- DashboardLayout como wrapper
- TypeScript strict (interface para props)
- Textos em pt-BR
- Design System: Navy #1A1A2E + Gold #C4A35A
