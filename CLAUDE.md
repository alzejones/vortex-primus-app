# CLAUDE.md — Vortex Primus

Arquivo de contexto para Claude Code. Leia este arquivo antes de qualquer ação.

---

## Visão Geral do Projeto

**Vortex Primus** é um SaaS de gestão fitness para personal trainers, nutricionistas e coaches. Desenvolvido e mantido por um único desenvolvedor, com foco no mercado brasileiro. App em desenvolvimento ativo, ainda não aberto ao público.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React Native + Expo SDK 54 + Expo Router |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions/Deno) |
| Pagamentos | Stripe |
| Deploy | Vercel |

---

## Estrutura Principal

### Pastas Core
```
app/(protected)/         # Telas autenticadas
  client-assessments.tsx # Avaliações físicas
  clients.tsx           # CRUD clientes
  diet.tsx              # Planejamento nutricional
  supplements.tsx       # CRUD suplementos
  schedule/             # Agendamento
components/             # Componentes reutilizáveis
  TabBar.web.tsx       # Sidebar web responsiva
utils/                  # Utilitários
  dietCalculations.ts   # Protocolo High Protein
supabase/              # Migrations e Edge Functions
```

### Módulos Existentes
- **Clientes**: CRUD completo + Edge Function `delete-client`
- **Agenda**: Sistema de agendamentos
- **Avaliações**: Antropometria + Fotos Antes/Depois + Balança Bluetooth BLE
- **Dieta**: Protocolo High Protein + Banco TACO (597 alimentos)
- **Suplementos**: Catálogo Herbalife Brasil (34 produtos)

---

## IDs Críticos

| Recurso | ID |
|---|---|
| Supabase Projeto | `rwyyvilshrjhfwlzudqg` |
| Vercel Deploy | `vortex-primus.vercel.app` |
| GitHub Repo | `vortex-primus-app` |

---

## ⚠️ AVISO IMPORTANTE — Banco de Dados

**O banco de dados foi perdido por incidente no Supabase (27/04/2026) e reconstruído via engenharia reversa do código. Podem existir divergências residuais. A fonte da verdade é SEMPRE o código — quando houver conflito entre código funcionando e banco, o banco deve ser ajustado para se adequar ao código, nunca o contrário.**

### Tabelas Principais
| Tabela | Descrição |
|---|---|
| `clients` | Cadastro de alunos |
| `trainers` | Cadastro de treinadores |
| `physical_assessments` | Cabeçalho das avaliações |
| `anthropometry` | Dados de bioimpedância/medidas |
| `assessment_photos` | Fotos Antes/Depois (cascade delete) |
| `supplements` | Catálogo de suplementos |
| `diets` | Planos alimentares |

---

## Padrão Web Responsivo

- Arquivos `.tsx` são **mobile-only** — nunca modificar para web
- Expo resolve automaticamente `.web.tsx` na web  
- Breakpoint: **768px** (`utils/useBreakpoint.ts`)
- Sidebar web: **240px** fixo
- Layout: two-column grid no dashboard web

---

## Convenções de Trabalho

1. **Frontend é fonte da verdade** — banco segue o código, não o contrário
2. **Diagnóstico antes de corrigir** — entender causa raiz sempre
3. **Uma frente por vez** — aguardar confirmação para avançar
4. **Commits diretos em `main`** — workflow simplificado durante desenvolvimento
5. **Arquivos `.tsx`** — desenvolvedor envia diretamente; Claude nunca deve pedir para exibir
6. **Commit + push** ao final de cada bloco de trabalho
