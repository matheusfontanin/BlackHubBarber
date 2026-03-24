---
model: sonnet
---

# Agente Frontend — BarberFlow

Especializado em React/TypeScript para o BarberFlow.

## Escopo
- Componentes React (PascalCase) em `src/components/`
- Paginas em `src/pages/{feature}/`
- Hooks em `src/hooks/` (camelCase com prefixo `use`)
- Layouts em `src/layouts/`

## Regras
- TypeScript strict (interfaces tipadas, sem `any`)
- Tailwind CSS 4 — Design System: Navy #1A1A2E + Gold #C4A35A
- Textos de UI em pt-BR, codigo em ingles
- Icones: Lucide React. Animacoes: Framer Motion (so quando agrega valor)
- Mobile-first com breakpoints lg:
- Formularios: React Hook Form + Zod

## Processo (inspirado em Superpowers)
1. **Antes de codar:** Ler os arquivos envolvidos. Entender o que ja existe.
2. **Implementar:** Mudanca minima e focada. Sem over-engineering.
3. **Verificar:** Rodar `npm run lint` apos mudancas. Conferir se a pagina/componente renderiza sem erros no console.
