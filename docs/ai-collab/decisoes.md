# Decisoes do Projeto

## Decisao 001
**Data:** 2026-04-01
**Tema:** naming
**Decisao:** Projeto renomeado de BarberFlow para BlackHub Barber
**Motivo:** Alinhar com visao de plataforma (BlackHub Clinic, BlackHub Nutri, etc.)
**Impacto:** Todas as referencias de UI, package.json, instance names atualizados

## Decisao 002
**Data:** 2026-04-01
**Tema:** agenda
**Decisao:** Google Agenda sera uma integracao transitoria via CalendarProvider interface
**Motivo:** Acelerar o MVP comercial sem acoplar o dominio ao Google
**Impacto:** Interface CalendarProvider criada em src/types/providers.ts

## Decisao 003
**Data:** 2026-04-01
**Tema:** backend
**Decisao:** Manter Supabase Edge Functions como backend no MVP, migrar para Node.js proprio no Nivel 3
**Motivo:** Evitar overengineering no MVP; Edge Functions atendem o volume inicial
**Impacto:** Contratos e interfaces criados agora para facilitar migracao futura

## Decisao 004
**Data:** 2026-04-01
**Tema:** CRM
**Decisao:** Nao usar Chatwoot. CRM proprio integrado ao dashboard
**Motivo:** Controle total sobre UX e integracao com agentes IA
**Impacto:** Tabelas conversations/messages no Supabase, inbox proprio no frontend

## Decisao 005
**Data:** 2026-04-01
**Tema:** design system
**Decisao:** Cores oficiais: Primary #1A1A2E (Midnight Navy), Secondary #C4A35A (Brass Gold). Fontes: DM Serif Display, Inter, JetBrains Mono
**Motivo:** Identidade visual consistente da marca BlackHub
**Impacto:** Eliminadas todas as cores hardcoded (#141414, #E4E3E0) em favor de tokens Tailwind
