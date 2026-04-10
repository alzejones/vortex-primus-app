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
npx supabase functions deploy stripe-checkout
npx supabase secrets set NOME_DA_CHAVE=valor
```

---

## Estrutura de Rotas (Expo Router)

```
app/
  _layout.tsx                    # Root: StripeWrapper > ThemeProvider > AuthProvider
  index.tsx                      # Redirect por role: trainer→/(protected), client→/(client)/diet, sem sessão→/login
  login.tsx                      # Tela de autenticação
  evolution/                     # Módulo de evolução (público/separado)
  (protected)/                   # Grupo protegido — treinadores
    _layout.tsx                  # Guard de auth (useAuth, role=trainer)
    index.tsx                    # Dashboard principal
    clients.tsx                  # Lista de alunos
    client-create.tsx            # Cadastro de aluno (+ objetivo, nível de atividade, restrições)
    client-details.tsx           # Detalhes do aluno (+ botões DIETA e CONVITE)
    client-assessments.tsx       # Avaliações de um aluno específico
    client-diet.tsx              # Dieta do aluno: metas, barras Plano vs Meta, PDF export ✨
    diet-plan-form.tsx           # Criação/edição de plano alimentar com busca TACO ✨
    assessment-create.tsx        # Nova avaliação com IA
    anthropometry-form.tsx       # Formulário de antropometria
    plans.tsx                    # Visualização de planos
    upgrade.tsx                  # Tela de upgrade de plano
    trainer-profile.tsx          # Perfil do treinador
    assessments/
      conditioning.tsx           # Avaliação de condicionamento
      conditioning-evolution.tsx # Evolução de condicionamento
    schedule/                    # Módulo de agenda
  (client)/                      # Grupo protegido — alunos autenticados ✨
    _layout.tsx                  # Guard de auth (useAuth, role=client)
    diet.tsx                     # Plano alimentar read-only + edição de preferências ✨
```

---

## Banco de Dados (Supabase + RLS)

RLS está ativo em todas as tabelas. Sempre considere as políticas ao escrever queries ou Edge Functions.

### Tabelas principais

**`trainers`** — Perfil do treinador (vinculado ao Auth UID)
```
id        uuid   PK
user_id   uuid   FK → auth.users
plan_id   uuid   FK → plans (nullable)
```

**`clients`** — Alunos cadastrados pelo treinador
```
id                uuid
trainer_id        uuid   FK → trainers
user_id           uuid   FK → auth.users (nullable — preenchido após convite aceito)
objective         text   (emagrecimento | hipertrofia | manutencao | saude | performance)
activity_level    text   (sedentario | levemente_ativo | moderadamente_ativo | muito_ativo | extremamente_ativo)
food_restrictions text
...
```

**`plans`** — Planos de assinatura disponíveis
```
id                uuid
name              text
price_monthly     numeric
max_clients       integer?   (nullable = ilimitado)
stripe_product_id text
stripe_price_id   text
```

**`trainer_subscriptions`** — Assinaturas ativas
```
trainer_id  uuid     FK → trainers
plan_id     uuid     FK → plans
is_active   boolean
start_date  date
```

> ⚠️ Os `stripe_price_id` e `stripe_product_id` em `plans` devem estar sincronizados com o Stripe. Dessincronização quebra o checkout silenciosamente.

**`meal_plans`** — Planos alimentares dos alunos ✨
```
id          uuid   PK
client_id   uuid   FK → clients
trainer_id  uuid   FK → trainers
title       text
objective   text
is_active   boolean
notes       text
```

**`meal_plan_meals`** — Refeições dentro de um plano ✨
```
meal_plan_id    uuid   FK → meal_plans (CASCADE DELETE)
name            text
time_suggestion text
order_index     integer
```

**`meal_plan_foods`** — Alimentos de cada refeição ✨
```
meal_id     uuid   FK → meal_plan_meals (CASCADE DELETE)
food_id     uuid   FK → foods (nullable — alimento customizado se NULL)
name        text
quantity    text
calories    numeric(7,1)
protein     numeric(5,1)
carbs       numeric(5,1)
fat         numeric(5,1)
order_index integer
```

**`foods`** — Catálogo TACO (597 alimentos, somente leitura) ✨
```
id          uuid   PK
taco_id     integer UNIQUE
name        text   (GIN index para busca em português)
energy_kcal numeric(7,1)
protein     numeric(5,1)
carbs       numeric(5,1)
fat         numeric(5,1)
fiber       numeric(5,1)
```
> RLS: SELECT público, INSERT/UPDATE/DELETE apenas via `service_role` (seed script).

---

## Arquitetura de Pagamentos (Stripe)

O fluxo atual usa **Stripe Checkout via URL**, não Payment Sheet nativo.

### Edge Function `stripe-checkout` (Deno)
Recebe `{ priceId, email, name }` → cria Customer → cria `checkout.sessions` → retorna `{ url }`.

### Frontend
Usa `expo-web-browser` para abrir a URL do Stripe Checkout. Após pagamento, Stripe redireciona para:
- Sucesso: `https://vortex-primus-app.vercel.app/(protected)`
- Cancelamento: `https://vortex-primus-app.vercel.app/upgrade`

> O campo `paymentIntentClientSecret` / `ephemeralKey` **não é usado** no fluxo atual.

---

## Padrão Crítico: Web vs Mobile

> ⚠️ NUNCA importe módulos nativos diretamente em arquivos sem extensão de plataforma.

O Stripe SDK (`@stripe/stripe-react-native`) quebra o build do Vercel se importado diretamente. Use extensões por plataforma — o Expo Router resolve automaticamente:

```
components/StripeWrapper.tsx       → <StripeProvider> nativo (iOS/Android)
components/StripeWrapper.web.tsx   → retorna apenas children
hooks/useStripeProxy.ts            → re-exporta useStripe do SDK nativo
hooks/useStripeProxy.web.ts        → retorna funções mock com aviso
```

Aplique este mesmo padrão para qualquer novo pacote nativo incompatível com Web.

---

## Módulo de Avaliação por IA

A IA retorna: Percentual de Gordura, Percentual de Músculo, Idade Metabólica, Metabolismo Basal.

> ⚠️ Sempre use `.toFixed(1)` nos valores numéricos antes de gravar no PostgreSQL. Vírgulas causam `NaN` silencioso.

---

## Módulo de Dieta ✨ (branch `develop` — aguardando testes)

Implementado em 2026-04-09 em 10 fases. Commit `d6fa011` em `origin/develop`. **Não fazer merge para `main` antes dos testes.**

### Auth de 3 Níveis

`AuthContext.tsx` detecta o papel do usuário logado:
1. `trainers.user_id = auth.uid()` → role `"trainer"` → `/(protected)`
2. `clients.user_id = auth.uid()` → role `"client"` → `/(client)/diet`
3. Sem match → `/login`

O convite do aluno é enviado pela Edge Function `invite-client` (Deno), que chama `supabase.auth.admin.inviteUserByEmail` com metadata `{ role: "client", client_id }`.

### Lógica de Cálculo (`utils/dietCalculations.ts`)

Fórmula BMR: **Mifflin-St Jeor**. TDEE = BMR × fator de atividade.

| Objetivo | Ajuste calórico | Proteína (g/kg massa magra) |
|---|---|---|
| Emagrecimento | TDEE − 500 | 2,2 |
| Hipertrofia | TDEE + 300 | 2,4 |
| Manutenção | TDEE | 1,8 |
| Saúde | TDEE − 100 | 2,0 |
| Performance | TDEE + 200 | 2,2 |

Gordura = 25% das calorias-alvo. Carboidratos = calorias restantes ÷ 4.

### Componentes do Módulo de Dieta

```
components/
  MacroBar.tsx          # Barra de progresso macro (current vs target); laranja se fora de ±15%
  MealCard.tsx          # Card de refeição reutilizável; exporta tipos FoodItem e MealItem
  FoodSearchModal.tsx   # Busca TACO (ilike, debounce 350ms), ajuste de quantidade, preview proporcional
  DietPlanPDF.tsx       # Export PDF — mobile: data URL via expo-web-browser
  DietPlanPDF.web.tsx   # Export PDF — web: window.open() + window.print()

utils/
  dietCalculations.ts   # BMR, TDEE, macros por objetivo
  dietPDFTemplate.ts    # Gerador de HTML compartilhado (tabelas por refeição, CSS @media print)
```

### Fluxo do Treinador

1. Cadastra aluno com objetivo + nível de atividade + restrições
2. Envia convite por e-mail (botão CONVITE em `client-details.tsx`)
3. Acessa `client-diet.tsx` (botão DIETA) → vê metas calculadas + barras "Plano vs Meta"
4. Cria/edita plano em `diet-plan-form.tsx` → busca alimentos TACO pelo botão **🔍 TACO** por alimento
5. Exporta PDF com botão **📄 Exportar PDF**

### Fluxo do Aluno

1. Recebe link de convite → cria senha
2. Login detecta `role = "client"` → redireciona para `/(client)/diet`
3. Vê plano alimentar completo (read-only) + metas de macros
4. Edita objetivo, nível de atividade e restrições → macros recalculados localmente sem reload

### PDF Export

- **Sem `expo-print`** (não estava instalado). Mobile usa `expo-web-browser.openBrowserAsync(dataUrl)`.
- Web: `window.open()` + `document.write(html)` + `window.print()` com fallback `setTimeout(600ms)`.
- Template HTML em `utils/dietPDFTemplate.ts` com CSS `@media print` e `break-inside: avoid` por refeição.

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

## Histórico de Manutenção

### 2026-04-09 — Módulo de Dieta completo (branch `develop`)

23 arquivos criados/modificados em commit `d6fa011`. Branch `develop` existe e está separada de `main`. **Aguardando testes antes do merge.**

Arquivos novos: `app/(client)/_layout.tsx`, `app/(client)/diet.tsx`, `app/(protected)/client-diet.tsx`, `app/(protected)/diet-plan-form.tsx`, `components/DietPlanPDF.tsx`, `components/DietPlanPDF.web.tsx`, `components/FoodSearchModal.tsx`, `components/MacroBar.tsx`, `components/MealCard.tsx`, `docs/plano-modulo-dieta.md`, `scripts/seed-taco.js`, `supabase/functions/invite-client/index.ts`, 4 migrations SQL, `utils/dietCalculations.ts`, `utils/dietPDFTemplate.ts`.

Arquivos modificados: `app/(protected)/client-create.tsx`, `app/(protected)/client-details.tsx`, `app/index.tsx`, `contexts/AuthContext.tsx`.

---

### 2026-04-07 — Bug da tela Meu Perfil (trainer-profile.tsx)

**1. Trigger `handle_new_user()` engolia erros silenciosamente**
O trigger disparado em `auth.users` após INSERT tinha `EXCEPTION WHEN OTHERS THEN RETURN NEW`, o que fazia erros no INSERT de `trainers` serem ignorados. Resultado: usuários criados no Auth sem registro correspondente em `trainers` (órfãos). Corrigido removendo o bloco de exceção e adicionando `email` no INSERT.

**2. Trigger `create_default_subscription()` buscava plano inexistente**
A função buscava `WHERE name = 'FREE'`, mas o plano gratuito se chama `'TESTE'`. Como `plan_id` tem NOT NULL, o INSERT em `trainer_subscriptions` falhava, derrubando todo o INSERT em `trainers`. Corrigido para `'TESTE'` + guard `IF free_plan_id IS NOT NULL`.

**3. Query `loadProfile()` selecionava coluna inexistente**
A query em `trainer-profile.tsx` selecionava `plan_status` (coluna que não existe em `trainers`) e fazia join direto com `plans` (que deve ser feito via `trainer_subscriptions`). Corrigido para duas queries separadas seguindo o padrão de `useTrainer.ts`.

> ⚠️ O plano padrão de novos treinadores é `TESTE` (price_monthly = 0). Qualquer renomeação desse plano quebra o trigger `create_default_subscription()`.

---

## Regras para o Claude Code

- Respeitar sempre o padrão de extensões `.web.ts` / `.web.tsx`.
- Nunca importar módulos nativos incompatíveis com Web em arquivos sem extensão de plataforma.
- Sempre formatar números com `.toFixed(1)` antes de enviar ao Supabase.
- Sempre verificar se novos plugins estão declarados no `app.json`.
- Sempre considerar RLS ao criar ou modificar queries.
- Novas Edge Functions devem seguir o padrão Deno de `stripe-checkout`.
- Antes de qualquer implementação maior, entrar em **Plan Mode** e apresentar o plano para aprovação.
- **Não fazer merge de `develop` → `main` sem autorização explícita do usuário.** O Módulo de Dieta está em `develop` aguardando testes.
- Ao criar/modificar tabelas do Módulo de Dieta, lembrar que `meal_plan_foods` usa CASCADE DELETE a partir de `meal_plan_meals`, e `meal_plan_meals` usa CASCADE DELETE a partir de `meal_plans`. Nunca deletar um `meal_plan` sem consciência disso.
- `foods` é catálogo somente-leitura. Nunca gerar queries de INSERT/UPDATE/DELETE em `foods` para usuários autenticados — apenas `service_role` pode escrever.
