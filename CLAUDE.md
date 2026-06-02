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

## Permissões (schema public)
- GRANTs explícitos aplicados em 30/05/2026 (migration 20260530222841)
- anon: SELECT em plans, foods, supported_scales apenas
- authenticated: SELECT/INSERT/UPDATE/DELETE em todas as 23 tabelas
- Default privileges configurados para tabelas futuras
- Conformidade com requisito Supabase válida até 30/10/2026

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

---

## Armadilhas Conhecidas

### Padrão .web.tsx substitui completamente o arquivo original
No Expo Router, arquivos com sufixo `.web.tsx` SUBSTITUEM (não 
herdam) o arquivo `.tsx` correspondente na plataforma web.

**REGRA OBRIGATÓRIA:** Qualquer `_layout.web.tsx` deve conter 
a mesma árvore de providers do `_layout.tsx`:
- StripeWrapper
- ThemeProvider  
- AuthProvider
- View com T.bg

Se um provider for omitido no `.web.tsx`, o contexto retorna 
o valor default (ex: loading: true eterno no AuthContext) 
causando tela branca no desktop sem nenhum erro visível no 
build.

**Origem do bug (01/06/2026):** `_layout.web.tsx` criado para 
injetar CSS de scroll durante sessão de trabalho paralela com 
projetos JusVia e mybox-iraja-games. O arquivo foi criado com 
apenas `<Slot/>`, sem os providers. Build passou normalmente 
(Ready ✅), mas AuthProvider nunca montava no web. Sintomas:
- Desktop: tela branca sem erro no console
- Mobile: OAuth Google voltava para tela de login

**Diagnóstico:** `[AUTH] iniciando getSession` nunca aparecia 
no console web — sinal de que AuthProvider não montava.

### Projetos paralelos no mesmo terminal
Trabalhar em 2+ projetos simultaneamente com múltiplos 
terminais Claude Code abertos aumenta risco de arquivos 
vazarem entre projetos ou configurações serem aplicadas 
no projeto errado. Ao criar arquivos de plataforma 
(.web.tsx, .native.tsx), verificar sempre se a árvore 
de providers está completa.

### JusVia e arquivos estáticos
Arquivos HTML estáticos de outros projetos NÃO devem 
ser colocados em public/ do Vortex Primus. O Expo copia 
tudo de public/ para dist/, podendo corromper o build.
JusVia tem repositório e projeto Vercel próprios.
