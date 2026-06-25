# CLAUDE.md — Vortex Primus

Arquivo de contexto para Claude Code. Leia antes de qualquer ação.

---

## Visão Geral

**Vortex Primus** é um SaaS de gestão fitness para personal trainers, nutricionistas e coaches. Desenvolvido e mantido por um único desenvolvedor, focado no mercado brasileiro. Em desenvolvimento ativo, não aberto ao público.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React Native + Expo SDK 54 + Expo Router |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions/Deno) |
| Pagamentos | Stripe |
| Deploy | Vercel |

**IDs Críticos:**
- Supabase Projeto: `rwyyvilshrjhfwlzudqg`
- Vercel Deploy: `vortex-primus.vercel.app`
- GitHub Repo: `vortex-primus-app`

---

## ⚠️ CONTEXTO CRÍTICO — Banco de Dados

**O banco de dados original (`qgeezszpcuypqujplkde`) foi perdido em outage global do Supabase (27/04/2026) e reconstruído via engenharia reversa do código funcional. O projeto ativo atual é `rwyyvilshrjhfwlzudqg`.**

**REGRA ABSOLUTA:** A fonte da verdade é **sempre o código funcionando**. Em conflito entre código e banco, o banco deve ser ajustado para adequar-se ao código, nunca o contrário.

### Tabelas Principais
| Tabela | Descrição |
|---|---|
| `clients` | Cadastro de alunos |
| `trainers` | Cadastro de treinadores |
| `physical_assessments` | Cabeçalho das avaliações |
| `anthropometry` | Dados de bioimpedância/medidas |
| `assessment_photos` | Fotos Antes/Depois (cascade delete) |
| `supplements` | Catálogo de suplementos (71 registros) |
| `diets` | Planos alimentares |
| `foods` | Banco TACO (597 alimentos) |
| `supported_scales` | Modelos de balança BLE (6 registros) |

### Permissões (schema public)
- GRANTs explícitos aplicados em 30/05/2026 (migration `20260530222841`)
- **anon**: SELECT em `plans`, `foods`, `supported_scales`
- **authenticated**: SELECT/INSERT/UPDATE/DELETE em todas as 23 tabelas
- Default privileges configurados para tabelas futuras
- Conformidade válida até 30/10/2026

---

## Estrutura do Projeto

```
app/(protected)/         # Telas autenticadas
  client-assessments.tsx # Avaliações físicas
  clients.tsx            # CRUD clientes
  diet.tsx               # Planejamento nutricional
  supplements.tsx        # CRUD suplementos
  schedule/              # Agendamento
components/              # Componentes reutilizáveis
  TabBar.web.tsx         # Sidebar web responsiva
utils/                   # Utilitários
  dietCalculations.ts    # Protocolo High Protein
supabase/                # Migrations e Edge Functions
```

### Módulos Implementados
- **Clientes**: CRUD + Edge Function `delete-client`
- **Agenda**: Sistema de agendamentos
- **Avaliações**: Antropometria + Fotos Antes/Depois + Balança BLE
- **Dieta**: Protocolo High Protein + Banco TACO
- **Suplementos**: Catálogo multibrands

---

## Protocolo High Protein (dietCalculations.ts)

**Ordem de cálculo:** Proteína → Carboidratos (teto fixo) → Gordura (sobra)

### Proteína (g/kg massa magra)
| Objetivo | g/kg LBM | Referência |
|---|---|---|
| Emagrecimento | 2.7 | Helms ER et al. 2014 |
| Hipertrofia | 2.8 | Morton RW et al. 2018 |
| Manutenção | 2.2 | Phillips SM 2011 |
| Saúde | 2.0 | Jäger R et al. 2017 |
| Performance | 2.6 | Burke LM et al. 2019 |

### Ajuste Calórico (TDEE)
| Objetivo | Ajuste |
|---|---|
| Emagrecimento | -500 kcal |
| Hipertrofia | +300 kcal |
| Manutenção | 0 kcal |
| Saúde | -200 kcal |
| Performance | +200 kcal |

### Teto de Carboidratos (Low Carb)
| Objetivo | Teto (g) |
|---|---|
| Emagrecimento | 80 |
| Saúde | 120 |
| Manutenção | 180 |
| Hipertrofia | 280 |
| Performance | 300 |

**Travas de segurança:**
- Proteína: piso 1.6g/kg LBM
- Carboidratos: piso 30g
- Gordura: piso 0.8g/kg peso total (saúde hormonal)
- Calorias: nunca abaixo do BMR

**BMR:** Usa valor medido pela bioimpedância se disponível, senão Mifflin-St Jeor (1990).

---

## Balanças BLE Suportadas

| Modelo | Manufacturer ID |
|---|---|
| AXL-396 (Be-Manage) | — |
| Chipsea/OKOK | 4032 |
| Entrada Manual | — |
| Mi Body Composition Scale 2 | — |
| RM-BD1904A (Fitdays) | — |
| TEC-BF01 (Fitdays) | — |

---

## Padrão Web Responsivo

- Arquivos `.tsx` são **mobile-only** — nunca modificar para web
- Expo resolve automaticamente `.web.tsx` na plataforma web
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

---

## ⚠️ Armadilha Crítica: Arquivos .web.tsx

**REGRA:** Arquivos `.web.tsx` **SUBSTITUEM completamente** (não herdam) o arquivo `.tsx` na plataforma web.

**OBRIGATORIEDADE:** Qualquer `_layout.web.tsx` deve conter a **mesma árvore de providers** do `_layout.tsx`:
- StripeWrapper
- ThemeProvider
- AuthProvider
- View com T.bg

**Consequência de omissão:** Contextos retornam valores default (ex: `loading: true` eterno no AuthContext) → tela branca no desktop sem erro visível no build.

**Validação:** Sempre verificar se `[AUTH] iniciando getSession` aparece no console web quando trabalhar com layouts de plataforma.

---

## Projetos Paralelos

Trabalhar em múltiplos projetos simultaneamente com terminais Claude Code paralelos aumenta risco de vazamento de arquivos entre projetos. Ao criar arquivos de plataforma (`.web.tsx`, `.native.tsx`), sempre verificar a árvore de providers completa.

**Projetos separados:**
- **JusVia**: repositório e Vercel próprios — arquivos HTML estáticos NÃO vão em `public/` do Vortex Primus
- **mybox-iraja-games**: repositório independente

---

## important-instruction-reminders

Do what has been asked; nothing more, nothing less.  
NEVER create files unless absolutely necessary.  
ALWAYS prefer editing an existing file to creating a new one.  
NEVER proactively create documentation files (*.md) or README files unless explicitly requested.
