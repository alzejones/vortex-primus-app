# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Visão Geral

**Vortex Primus** é uma plataforma SaaS multiplataforma (Mobile + Web) para gestão fitness. Treinadores gerenciam alunos, realizam avaliações de composição corporal assistidas por IA e controlam assinaturas pagas via Stripe.

- **Status:** v1.0 em Produção · Módulo de Dieta em `develop` (aguardando testes → merge para `main`)
- **Deploy Web:** Vercel (exportação estática)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend Mobile & Web | React Native + Expo SDK 54 |
| Roteamento | Expo Router (file-based, rotas tipadas) |
| Backend & Banco | Supabase (PostgreSQL + Auth + Edge Functions) |
| Gateway de Pagamento | Stripe Checkout (sessão via URL) |
| Runtime Edge Functions | Deno |

---

## Comandos

```bash
npx expo start           # Desenvolvimento local
npx expo start -c        # Limpar cache (usar quando comportamento estranho)
npm run build            # Export estático (expo export)
npm run lint             # ESLint

# Supabase
npx supabase functions deploy <nome-da-funcao>
npx supabase secrets set NOME_DA_CHAVE=valor
```

---

## Estrutura de Rotas (Expo Router)

```
app/
  _layout.tsx                    # Root: StripeWrapper > ThemeProvider > AuthProvider
  index.tsx                      # Redirect por role
  login.tsx, set-password.tsx    # Auth flows
  evolution/[id].tsx             # Público, sem auth
  (protected)/                   # Treinadores
    _layout.tsx                  # Guard role=trainer
    index.tsx, clients.tsx, client-details.tsx, client-assessments.tsx
    client-diet.tsx, diet-plan-form.tsx, assessment-create.tsx
    anthropometry-form.tsx, plans.tsx, upgrade.tsx, trainer-profile.tsx
    assessments/conditioning.tsx, conditioning-evolution.tsx
    schedule/index.tsx, new.tsx
  (client)/                      # Alunos
    _layout.tsx                  # Guard role=client
    diet.tsx, meal-capture.tsx
```

---

## Banco de Dados (Supabase + RLS)

RLS está ativo em todas as tabelas. Sempre considere as políticas ao escrever queries ou Edge Functions.

### Tabelas Core

**`trainers`** — `id, user_id FK→auth.users, email, name, plan_id FK→plans`
**`plans`** — `id, name ('TESTE', 'INICIANTE', 'SCALED', 'RX'), price_monthly, stripe_product_id, stripe_price_id`
**`trainer_subscriptions`** — `id, trainer_id FK, plan_id FK, is_active`
**`clients`** — `id, trainer_id FK, user_id FK→auth.users, name, email, objective, activity_level, food_restrictions`
**`diet_preferences`** — `id, client_id FK, food_restrictions[], preferred_foods[]`

> ⚠️ Plano padrão: `'TESTE'` (price_monthly=0). Stripe IDs devem estar sincronizados.

### Tabelas de Avaliações

**`physical_assessments`** — `id, client_id FK, trainer_id FK, date, notes, assessor_name`
**`anthropometry`** — `id, assessment_id FK, weight, body_fat, waist/hip/chest/medidas, muscle_mass_percentage, basal_metabolic_rate`
**`conditioning_tests`** — `id, assessment_id FK, test_name, duration_sec, distance_m`
**`conditioning_assessments`** — `id, physical_assessment_id FK, distance_12min_m, pullups_reps, situps_per_minute, etc.`

> ⚠️ Sempre use `.toFixed(1)` nos valores numéricos antes de gravar. Vírgulas causam `NaN` silencioso.

### Tabelas do Módulo de Dieta

**`meal_plans`** — `id, client_id FK, trainer_id FK, title, meals_per_day, is_active`
**`meal_plan_meals`** — `id, meal_plan_id FK, name, time_suggestion, order_index`
**`meal_plan_foods`** — `id, meal_id FK, food_id FK, name, quantity, calories/protein/carbs/fat`
**`foods`** — Catálogo TACO (597 alimentos, somente leitura): `id, taco_id, name, energy_kcal, protein, carbs, fat`
**`meal_log`** — `id, client_id FK, meal_type, photo_url, logged_at`
**`meal_log_foods`** — `id, meal_log_id FK, name, quantity, calories/protein/carbs/fat`
**`appointments`** — `id, trainer_id FK, client_id FK, appointment_date, appointment_time, types[], status`

> CASCADE DELETE: `meal_plans` → `meal_plan_meals` → `meal_plan_foods`. `foods` é somente-leitura via `service_role`.

---

## Edge Functions (Deno)

**`stripe-checkout`** — `{ priceId, email, name }` → `{ url }`. Cria sessão Stripe Checkout. `verify_jwt = true`.
**`invite-client`** — `{ client_id, channel }` → `{ success, invite_link? }`. Convida aluno por email/WhatsApp. `verify_jwt = false`.
**`delete-client`** — `{ client_id }` → `{ success }`. Remove aluno e `auth.users`. `verify_jwt = false`.
**`generate-diet`** — `{ client_id }` → `{ plan, trainer_name }`. Gera plano alimentar via Claude API (claude-sonnet-4-6).
**`analyze-meal-photo`** — `{ image_base64 }` → `{ foods: [...] }`. Identifica alimentos via Claude Vision. Timeout 25s.

---

## Padrão Crítico: Web vs Mobile

> ⚠️ NUNCA importe módulos nativos diretamente em arquivos sem extensão de plataforma.

Use extensões por plataforma — o Expo Router resolve automaticamente:
```
components/StripeWrapper.tsx       → <StripeProvider> nativo (iOS/Android)
components/StripeWrapper.web.tsx   → retorna apenas children
```

---

## Responsividade Web

Breakpoint mobile/desktop: 768px via `utils/useBreakpoint.ts`

Padrão de plataforma: arquivos `.web.tsx` são resolvidos automaticamente pelo Expo na web. O arquivo `.tsx` base é sempre o mobile — nunca alterá-lo para adicionar lógica web.

Arquivos web implementados:
- `components/TabBar.web.tsx` — sidebar 240px com brand, indicador lateral, hover states
- `components/layout/LayoutBase.web.tsx` — ScrollView centralizado, maxWidth 1100px, padding 32px
- `components/dashboard/DashboardLayout.web.tsx` — grid 2 colunas (flex:1 + 320px sidebar), hover actions nos cards de aluno, modal com overlay

Layout desktop `(protected)/_layout.tsx`:
- Desktop: `<TabBar /> | <Slot />` lado a lado em flexDirection row
- Mobile: TabBar absolute bottom 0, paddingBottom 64

Regra de expansão: ao tornar qualquer nova tela responsiva, sempre criar `.web.tsx` separado. Nunca usar condicionais de plataforma dentro do `.tsx` base.

---

## Módulos Implementados

### Stripe Checkout
Fluxo: **Checkout via URL** (não Payment Sheet nativo). Frontend usa `expo-web-browser`.

### Auth de 3 Níveis
1. `trainers.user_id = auth.uid()` → role `"trainer"` → `/(protected)`
2. `clients.user_id = auth.uid()` → role `"client"` → `/(client)/diet`
3. Sem match → `/login`

### Módulo de Dieta (branch `develop`)
- Fórmula BMR: Mifflin-St Jeor. Macros por objetivo (emagrecimento: TDEE-500, hipertrofia: TDEE+300).
- Componentes: MacroBar, MealCard, FoodSearchModal, DietPlanPDF(.web)
- Fluxo: Treinador cria planos → Aluno vê read-only + edita preferências
- PDF export: mobile via data URL, web via window.print()

### Análise de Refeição por Foto
- Edge Function `analyze-meal-photo` + tabelas `meal_log` + `meal_log_foods`
- Tela `meal-capture.tsx`: 3 steps (capture → analyzing → review)
- FAB 📷 em `/(client)/diet.tsx` quando `lastBio !== null`

---

## Configuração do app.json

Todo plugin nativo **deve ser declarado** no array `plugins`:

```json
{
  "plugins": [
    ["@stripe/stripe-react-native", {
      "merchantIdentifier": "merchant.com.vortexprimus",
      "enableGooglePay": true
    }]
  ]
}
```

---


---

## Histórico de Manutenção

### 2026-04-19 — Otimização auth system + cleanup debug UI
- `detectRole()` otimizada: queries paralelas via `Promise.all()`, timeout 5s, ~50% performance gain
- Debug UI removida da tela Config

### 2026-04-18 — Fix redirecionamentos intermitentes
- `detectRole()` timeout 15s + retry logic
- Layout guards reorganizados: tolerância a `role === null` temporário

### 2026-04-17 — Redesign dark theme + TabBar + análise de foto
- Dark theme completo: `utils/theme.ts` + `utils/gradients.ts`
- TabBar: 4 abas (Home/Alunos/Agenda/Config)
- Análise de refeição por foto: `meal-capture.tsx`, Edge Function `analyze-meal-photo`, Claude Vision
- Fixes: truncamentos de texto, agenda, PWA camera context

### 2026-04-13/14 — Sistema auth completo + bugs resolvidos
- Bugs 1-4 resolvidos: delete-client 401, OTP expired, role detection, tela branca
- Tela do aluno implementada: `/(client)/diet`, card avaliação, plano alimentar
- Template email customizado, RLS policies, triggers corrigidos

### 2026-04-09 — Módulo de Dieta (branch develop)
- 23 arquivos: MacroBar, MealCard, FoodSearchModal, DietPlanPDF(.web)
- Cálculo BMR Mifflin-St Jeor, macros por objetivo
- Fluxo trainer→aluno, PDF export mobile/web

---

## Regras para o Claude Code

### Padrões de Código
- Respeitar padrão `.web.ts` / `.web.tsx` para compatibilidade Web
- Nunca importar módulos nativos sem extensão de plataforma  
- Sempre usar `.toFixed(1)` em números antes de enviar ao Supabase
- Declarar plugins nativos no `app.json`
- Sempre considerar RLS ao criar/modificar queries

### Workflow
- Antes de implementação maior: **Plan Mode** + aprovação
- **Não merge `develop` → `main` sem autorização explícita**
- Edge Functions com token manual: `verify_jwt = false`

### Regras de Dados
- `meal_plans` CASCADE DELETE → `meal_plan_meals` → `meal_plan_foods`
- `foods` é somente-leitura via `service_role`
- `clients.user_id` preenchido automaticamente via trigger `link_client_user_id()`

### Regras Críticas
- Nunca `useMemo` para side-effects — usar `useEffect`
- `supabase.functions.invoke` injeta Authorization — nunca header manual
- Edge Functions: retornar HTTP 200 + `{ error }` em vez de 4xx/5xx
- PWA: salvar tokens antes de abrir câmera, restaurar após retorno
