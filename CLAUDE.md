# CLAUDE.md — Vortex Primus

Arquivo de contexto para Claude Code. Leia este arquivo antes de qualquer ação.

---

## Visão Geral do Projeto

**Vortex Primus** é um SaaS de gestão fitness para personal trainers, nutricionistas e coaches. Desenvolvido e mantido por um único desenvolvedor, com foco no mercado brasileiro. O app está em desenvolvimento ativo, ainda não aberto ao público.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React Native + Expo SDK 54 + Expo Router |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions/Deno) |
| Pagamentos | Stripe |
| Deploy | Vercel |
| Ambiente de dev | Linux Mint — notebook Positivo (Intel Pentium T4500) |

---

## Módulos Implementados

### Clientes
- CRUD completo
- Edge Function `delete-client` para exclusão segura
- Tela com versão `.web.tsx`

### Agenda
- Tela de agendamento com versão web (`schedule/index.web.tsx`, `schedule/new.web.tsx`)

### Avaliações / Antropometria
- Tabela `anthropometry` com colunas de membros: `arm_left`, `arm_right`, `thigh_left`, `thigh_right`, `calf_left`, `calf_right`
- `LimbMeasurementsChart.tsx` — barras agrupadas lado a lado (esq/dir) via `react-native-gifted-charts`
- Diagnóstico por barras de classificação (gordura corporal, massa muscular, gordura visceral) — tabelas Omron
- Avaliação à Distância (IA) via RFM + equação Mifflin-St Jeor
- Integração com balança Bluetooth BLE (`BluetoothScaleConnector`)
- Telas: `client-assessments.tsx`, `AssessmentDetailsModal`, `AssessmentHistoryCard`, `evolution/[id]`

### Fotos de Avaliação (Antes/Depois)
- **Bucket Supabase Storage:** `assessment-photos` (privado, signed URLs com validade de 1h)
- **Tabela:** `assessment_photos` com RLS — colunas: `id`, `assessment_id`, `trainer_id`, `client_id`, `storage_path`, `label`, `created_at`
- **Labels disponíveis:** `frente`, `costas`, `lateral_dir`, `lateral_esq`, `outro`
- **Path organizado no Storage:** `{trainerId}/{clientId}/{assessmentId}/{filename}`
- **Compressão automática:** `expo-image-manipulator` — redimensiona para 900px, JPEG 78% (~150–250KB)
- **Limite:** 4 fotos por avaliação
- **Fluxo de upload:** seleção via `expo-image-picker` → compressão → upload após `INSERT` da avaliação
- **Exclusão em cascada:** ao deletar avaliação, remove arquivos do Storage antes de deletar da tabela
- **Componentes:**
  - `AssessmentPhotoGallery.tsx` — galeria horizontal com visualizador fullscreen e botão de download por foto
  - Botão `📷 Salvar Foto` no formulário (canto superior esquerdo, entre o header e a Balança Bluetooth)
  - Miniaturas reais (36x36px) nos cards do histórico — máx. 3 visíveis + badge `+N`
  - Fallback de texto `📷 N` enquanto as signed URLs carregam
- **Download:**
  - Web: abre em nova aba via `<a download>`
  - Mobile: `expo-file-system` + `expo-media-library` → salva na galeria; fallback: `expo-sharing` se permissão negada
- **Dependências adicionadas:** `expo-image-picker`, `expo-image-manipulator`, `expo-file-system`, `expo-media-library`, `expo-sharing`

### Dieta
- **Protocolo High Protein** — `utils/dietCalculations.ts` com valores baseados em evidências científicas:
  - Emagrecimento: 2.7 g/kg LBM | Hipertrofia: 2.8 g/kg LBM
  - Manutenção: 2.2 g/kg LBM | Saúde: 2.0 g/kg LBM | Performance: 2.6 g/kg LBM
- **Banco TACO** com 597 alimentos brasileiros
- **Componentes:** `MacroBar`, `MealCard`, `FoodSearchModal`, `SupplementSearchModal`
- **Suporte a suplementos Herbalife** em todos os formulários (trainer + client)
- **ScienceReferencesModal** — embasamento científico disponível em todas as telas de dieta
- **Export PDF** com padrão `.web.tsx`
- **Sistema de convite** de clientes via WhatsApp/email
- **Geração de dieta por IA** (exibe "em breve" — aguardando créditos de API)
- **Proteções de segurança:** fallback contra NaN em cálculos, validação de roles

### Suplementos
- **Catálogo Herbalife Brasil** com 34 produtos
- **Tabela `supplements`** no Supabase com RLS
- **Integração completa** nos formulários de dieta (trainer + client)
- **Tela CRUD** em `app/(protected)/supplements.tsx`
- **Aba 💊 "Suplem."** no TabBar

---

## Banco de Dados — Supabase

- **Projeto ativo:** `rwyyvilshrjhfwlzudqg` (nome: Vortex Primus)
- **Projeto anterior perdido:** `qgeezszpcuypqujplkde` (incidente Supabase 27/04/2026)
- As 16 migrations Git contêm apenas `ALTER TABLE` — o schema base (`CREATE TABLE`) foi reconstruído manualmente em `00_base_schema.sql`
- Auth em três níveis: `admin` / `trainer` / `client`

### Recuperação pós-outage — correções aplicadas em 10/05/2026

**Divergências encontradas e corrigidas no banco reconstruído (rwyyvilshrjhfwlzudqg):**

- `trainers`: coluna `plan_id uuid REFERENCES plans(id)` estava ausente → adicionada + todos os trainers existentes atualizados para o plano Teste (id: 9d8a50e0-007a-4e5f-ab1c-3641629204a7)
- `plans`: coluna `stripe_price_id text` estava ausente → adicionada
- `plans`: RLS `plans_trainer_access` bloqueava SELECT para outros trainers → removida e substituída por `plans_select_authenticated` (authenticated, USING true)
- `plans`: nomes, preços e stripe_price_ids atualizados:
  - Plano Iniciante → R$14,90/mês → price_1TIXIy2HlySFSGvPVYuorHXs
  - Avançado → R$24,90/mês → price_1TIXL72HlySFSGvPThHoZmT1
  - Escalando 🚀🚀🚀 → R$39,90/mês → price_1TIXOj2HlySFSGvPdGX9EBKF
  - Teste → R$0 → sem stripe_price_id
- Edge Function `stripe-checkout`: secret STRIPE_SECRET_KEY estava ausente no novo projeto → reconfigurada via CLI

**Arquivos gerados:**
- supabase/migrations/*_fix_post_recovery.sql
- supabase/backups/backup_20260510_232646.sql

### Tabelas principais
| Tabela | Descrição |
|---|---|
| `clients` | Cadastro de alunos |
| `trainers` | Cadastro de treinadores |
| `physical_assessments` | Cabeçalho das avaliações |
| `anthropometry` | Dados de bioimpedância e medidas (FK → `physical_assessments`) |
| `assessment_photos` | Fotos Antes/Depois (FK → `physical_assessments`, cascade delete) |
| `supplements` | Catálogo de suplementos |
| `diets` | Planos alimentares |

---

## Padrão Web Responsivo

- Arquivos base `.tsx` são **mobile-only** — nunca modificar para web
- Expo resolve automaticamente `.web.tsx` na web
- Breakpoint: **768px** — utilitário em `utils/useBreakpoint.ts`
- Sidebar web: **240px** fixo — `components/TabBar.web.tsx`
- Layout dashboard web: two-column grid — `components/dashboard/DashboardLayout.web.tsx`
- Hover states via classes CSS globais injetadas em `app/_layout.web.tsx`

---

## i18n

- Branch dedicada: `feat/i18n-implementation`
- Stack: `i18next` + `react-i18next` + `expo-localization`
- Idiomas: `pt-BR` (padrão) e `en`
- **⚠️ Não mergear para `main` sem autorização escrita explícita**
- Todos os comandos de deploy estão bloqueados nessa branch

---

## Claude Code — Configuração

- Versão fixada: `@anthropic-ai/claude-code@1.0.88`
  - Motivo: versões mais recentes usam binários nativos com `popcnt` (SSE4.2), não suportado pelo Pentium T4500
- Node: `v20.20.2` via nvm
- Alias aponta para: `~/.nvm/versions/node/v20.20.2/lib/node_modules/@anthropic-ai/claude-code/cli.js`
- **Se quebrar:** `npm install -g @anthropic-ai/claude-code@1.0.88` + `hash -r`

---

## Convenções de Trabalho

1. **Diagnóstico antes de corrigir** — nunca aplicar correções sem entender a causa raiz
2. **Uma frente por vez** — aguardar confirmação antes de avançar para o próximo ponto
3. **Prompts completos** — entregar como bloco único copiável para o Claude Code
4. **Commit + push** ao final de cada bloco de trabalho
5. **Credenciais nunca no chat** — usar prefixo `!` no terminal para comandos sensíveis
6. **Arquivos `.tsx`** — o desenvolvedor envia o arquivo diretamente; Claude Code nunca deve ser pedido para exibi-lo

---

## Git Workflow

- Commits diretos em `main` enquanto o app não está aberto ao mercado
- A regra `develop → main com autorização` será reativada quando houver outros usuários
- Exceção ativa: branch `feat/i18n-implementation` — merge bloqueado

---

## Bugs Conhecidos / Histórico de Correções

| Bug | Causa Raiz | Status |
|---|---|---|
| `delete-client` retornando 401 | Frontend chamava `.delete()` direto na tabela em vez de `supabase.functions.invoke('delete-client')` | ✅ Corrigido em `clients.tsx` |
| Tela `set-password` mostrando "link inválido" | Token de convite chegava no hash da URL (`window.location.hash`), não nos query params | ✅ Corrigido com fallback `URLSearchParams` |
| "Erro ao salvar a senha" em set-password | `verifyOtp()` não persistia sessão automaticamente no ambiente Vercel/web | ✅ Corrigido com `setSession()` explícito |
| Clientes não viam formulário diet-plan-form | `useTrainer()` com `loadingTrainer=true` bloqueava render para usuários com role='client' | ✅ Corrigido com detecção de role |
| Tela branca em diet.tsx após ScienceReferencesModal | Interface `DietCalculationResult` alterada quebrou propriedade `macros` | ✅ Corrigido restaurando interface esperada |
| NaN em "Metas Calculadas" | Falta de fallback para `ACTIVITY_MULTIPLIERS` e valores inválidos de body_fat | ✅ Corrigido com validações e fallbacks |
| Trigger `handle_new_user()` | Erro de UUID null em novos usuários | ✅ Corrigido |
| Query `loadProfile()` | Referenciava coluna inexistente `plan_status` | ✅ Corrigido |
