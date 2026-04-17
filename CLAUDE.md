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
  index.tsx                      # Redirect por role: trainer→/(protected), client→/(client)/diet, sem sessão→/login
  login.tsx                      # Tela de autenticação
  set-password.tsx               # Fluxo de convite do aluno: define senha a partir do link de invite
  evolution/[id].tsx             # Módulo de evolução (público, sem auth)
  (protected)/                   # Grupo protegido — treinadores
    _layout.tsx                  # Guard de auth (useAuth, role=trainer)
    index.tsx                    # Dashboard principal
    clients.tsx                  # Lista de alunos
    client-create.tsx            # Cadastro de aluno (+ objetivo, nível de atividade, restrições)
    client-details.tsx           # Detalhes do aluno (botões: HISTÓRICO, NOVA AVALIAÇÃO, DIETA, CONVITE)
    client-assessments.tsx       # Avaliações de um aluno específico
    client-diet.tsx              # Dieta do aluno: metas calculadas + barras Plano vs Meta + PDF export
    diet-plan-form.tsx           # Criação/edição de plano alimentar com busca TACO
    assessment-create.tsx        # Nova avaliação com IA
    anthropometry-form.tsx       # Formulário de antropometria
    plans.tsx                    # Visualização de planos de assinatura
    upgrade.tsx                  # Tela de upgrade de plano
    trainer-profile.tsx          # Perfil do treinador
    assessments/
      conditioning.tsx           # Avaliação de condicionamento
      conditioning-evolution.tsx # Evolução de condicionamento
    schedule/
      index.tsx                  # Agenda do treinador (lista de agendamentos)
      new.tsx                    # Novo agendamento
  (client)/                      # Grupo protegido — alunos autenticados
    _layout.tsx                  # Guard de auth (useAuth, role=client)
    diet.tsx                     # Plano alimentar read-only + edição de preferências do aluno
```

---

## Banco de Dados (Supabase + RLS)

RLS está ativo em todas as tabelas. Sempre considere as políticas ao escrever queries ou Edge Functions.

### Tabelas de Usuários e Assinaturas

**`trainers`** — Perfil do treinador
```
id               uuid   PK
user_id          uuid   NOT NULL FK → auth.users (ON DELETE CASCADE)
email            text   NOT NULL
name             text
status           text   DEFAULT 'active'
plan_id          uuid   FK → plans (nullable)
plan_status      text   DEFAULT 'active'
plan_expires_at  timestamp with time zone
created_at       timestamp with time zone
```

**`plans`** — Catálogo de planos de assinatura disponíveis
```
id                uuid   PK
name              text   NOT NULL   (ex: 'TESTE', 'INICIANTE', 'SCALED', 'RX')
price_monthly     numeric NOT NULL
max_clients       integer            (nullable = ilimitado)
stripe_product_id text
stripe_price_id   text
created_at        timestamp with time zone
```
> ⚠️ O plano padrão de novos treinadores se chama `'TESTE'` (price_monthly = 0). Renomear esse plano quebra o trigger `create_default_subscription()`.
> ⚠️ Os `stripe_price_id` e `stripe_product_id` devem estar sincronizados com o Stripe. Dessincronização quebra o checkout silenciosamente.

**`trainer_subscriptions`** — Assinaturas ativas dos treinadores
```
id          uuid   PK
trainer_id  uuid   NOT NULL FK → trainers (ON DELETE CASCADE)
plan_id     uuid   NOT NULL FK → plans
is_active   boolean DEFAULT true
start_date  date   DEFAULT CURRENT_DATE
```

**`subscriptions`** — Tabela legada de assinaturas (estrutura alternativa)
```
id            uuid   PK
user_id       uuid   FK → auth.users (ON DELETE CASCADE)
plan          text   NOT NULL CHECK (FREE | INICIANTE | SCALED | RX)
status        text   DEFAULT 'active' CHECK (active | expired | cancelled)
started_at    timestamp with time zone
expires_at    timestamp with time zone
paid_annually boolean DEFAULT false
max_clients   integer
price_monthly numeric
```

**`user_subscriptions`** — Tabela legada de vínculo usuário↔assinatura
```
id              uuid   PK
user_id         uuid   NOT NULL FK → auth.users (ON DELETE CASCADE)
subscription_id uuid   NOT NULL FK → subscriptions
status          text   NOT NULL DEFAULT 'active'
started_at      timestamp with time zone
expires_at      timestamp with time zone
created_at      timestamp with time zone
```

### Tabelas de Alunos

**`clients`** — Alunos cadastrados pelo treinador
```
id                uuid   PK
trainer_id        uuid   FK → trainers (ON DELETE SET NULL — nullable; NULL = aluno órfão)
user_id           uuid   FK → auth.users (ON DELETE SET NULL — nullable; preenchido após convite aceito)
name              text   NOT NULL
email             text
phone             text
birth_date        date
gender            char(1)  CHECK (M | F)
height_cm         numeric
objective         text   (emagrecimento | hipertrofia | manutencao | saude | performance)
activity_level    text   (sedentario | levemente_ativo | moderadamente_ativo | muito_ativo | extremamente_ativo)
food_restrictions text
observation       text
is_active         boolean DEFAULT true
created_at        timestamp with time zone
updated_at        timestamp with time zone
```

**`diet_preferences`** — Preferências alimentares do aluno (módulo de dieta)
```
id                uuid   PK
client_id         uuid   NOT NULL FK → clients (ON DELETE CASCADE)
food_restrictions text[]
preferred_foods   text[]
updated_at        timestamp with time zone NOT NULL
```

### Tabelas de Avaliações

**`physical_assessments`** — Avaliação física (registro pai)
```
id            uuid   PK
client_id     uuid   NOT NULL FK → clients (ON DELETE CASCADE)
trainer_id    uuid   NOT NULL FK → trainers (ON DELETE RESTRICT)
date          timestamp without time zone DEFAULT now()
notes         text
assessor_name text
```

**`anthropometry`** — Dados antropométricos de uma avaliação
```
id                      uuid   PK
assessment_id           uuid   NOT NULL FK → physical_assessments (ON DELETE CASCADE)
weight                  numeric
height                  numeric
body_fat                numeric
waist, hip, chest, abdomen, arm_right, arm_left,
thigh_right, thigh_left, calf_right, calf_left  numeric (medidas em cm)
photos                  jsonb
muscle_mass_percentage  numeric
basal_metabolic_rate    numeric
body_fat_index          numeric
metabolic_age           numeric
view_count              integer DEFAULT 0
```
> ⚠️ Sempre use `.toFixed(1)` nos valores numéricos antes de gravar. Vírgulas causam `NaN` silencioso.

**`conditioning_tests`** — Teste de condicionamento vinculado a uma avaliação
```
id            uuid   PK
assessment_id uuid   NOT NULL FK → physical_assessments (ON DELETE CASCADE)
test_name     text
duration_sec  integer
distance_m    integer
heart_rate    integer
vo2_estimated numeric
```

**`conditioning_assessments`** — Bateria de testes de condicionamento físico
```
id                           uuid   PK
physical_assessment_id       uuid   UNIQUE FK → physical_assessments (ON DELETE CASCADE)
distance_12min_m             integer
pullups_reps                 integer
pullups_isometric_seconds    integer
situps_per_minute            integer
pushups_until_failure        integer
sprint_100m_seconds          numeric(5,2)
plank_isometric_seconds      integer
squats_until_failure         integer
burpees_per_minute           integer
lumbar_mobility_cm           numeric(5,2)
created_at                   timestamp without time zone
```

**`endurance_tests`** — Subtestes de resistência
```
id                    uuid   PK
conditioning_test_id  uuid   FK → conditioning_tests (ON DELETE CASCADE)
test_type             text   NOT NULL
distance_m            numeric
time_seconds          integer
repetitions           integer
vo2_estimated         numeric
created_at            timestamp with time zone
```

**`strength_tests`** — Subtestes de força
```
id                    uuid   PK
conditioning_test_id  uuid   FK → conditioning_tests (ON DELETE CASCADE)
exercise_name         text
reps                  integer
load_kg               numeric
estimated_1rm         numeric
repetitions           text
```

**`mobility_tests`** — Subtestes de mobilidade
```
id                    uuid   PK
conditioning_test_id  uuid   FK → conditioning_tests (ON DELETE CASCADE)
test_name             text
score                 numeric
notes                 text
```

### Tabelas do Módulo de Dieta

**`meal_plans`** — Planos alimentares criados pelo treinador
```
id           uuid   PK
client_id    uuid   NOT NULL FK → clients (ON DELETE CASCADE)
trainer_id   uuid   NOT NULL FK → trainers (ON DELETE CASCADE)
title        text   NOT NULL DEFAULT 'Plano Alimentar'
objective    text
meals_per_day integer DEFAULT 5
notes        text
is_active    boolean NOT NULL DEFAULT true
created_at   timestamp with time zone
updated_at   timestamp with time zone
```

**`meal_plan_meals`** — Refeições dentro de um plano
```
id            uuid   PK
meal_plan_id  uuid   NOT NULL FK → meal_plans (ON DELETE CASCADE)
name          text   NOT NULL
time_suggestion text
order_index   integer NOT NULL DEFAULT 0
created_at    timestamp with time zone
```

**`meal_plan_foods`** — Alimentos de cada refeição
```
id          uuid   PK
meal_id     uuid   NOT NULL FK → meal_plan_meals (ON DELETE CASCADE)
food_id     uuid   FK → foods (ON DELETE SET NULL — nullable: alimento customizado se NULL)
name        text   NOT NULL
quantity    text
calories    numeric(7,1)
protein     numeric(5,1)
carbs       numeric(5,1)
fat         numeric(5,1)
notes       text
order_index integer NOT NULL DEFAULT 0
```
> CASCADE DELETE: `meal_plans` → `meal_plan_meals` → `meal_plan_foods`. Nunca deletar um `meal_plan` sem consciência disso.

**`foods`** — Catálogo TACO (597 alimentos, somente leitura)
```
id          uuid   PK
taco_id     integer UNIQUE
name        text   NOT NULL (GIN index para busca em português)
energy_kcal numeric(7,1)
protein     numeric(5,1)
carbs       numeric(5,1)
fat         numeric(5,1)
fiber       numeric(5,1)
sodium      numeric(7,1)
calcium     numeric(7,1)
iron        numeric(5,1)
created_at  timestamp with time zone
```
> RLS: SELECT público. INSERT/UPDATE/DELETE apenas via `service_role` (seed script). Nunca gerar mutations em `foods` para usuários autenticados.

### Tabela de Agenda

**`appointments`** — Agendamentos do treinador com alunos
```
id                uuid   PK
trainer_id        uuid   NOT NULL FK → trainers (ON DELETE CASCADE)
client_id         uuid   NOT NULL FK → clients (ON DELETE CASCADE)
appointment_date  date   NOT NULL
appointment_time  text   NOT NULL
types             text[] NOT NULL
notes             text
status            text   DEFAULT 'Agendado'
whatsapp_sent     boolean DEFAULT false
created_at        timestamp with time zone
```

### Tabelas de Monitoramento (internas)

**`cron_job_history`**, **`cron_test_log`**, **`test_run_history`** — Logs internos de cron jobs e saúde do sistema. Não expor ao frontend.

---

## Edge Functions (Deno)

Todas as funções ficam em `supabase/functions/<nome>/index.ts`. A configuração de JWT está em `supabase/config.toml`.

### `stripe-checkout`
**O que faz:** Inicia sessão de pagamento no Stripe.
- **Input:** `{ priceId, email, name }`
- **Output:** `{ url }` — URL da página de checkout do Stripe
- **Fluxo:** Cria Customer → cria `checkout.session` → retorna URL
- **`verify_jwt = true`** (padrão — requer token válido no header)
- Sucesso redireciona para `https://vortex-primus-app.vercel.app/(protected)`
- Cancelamento redireciona para `https://vortex-primus-app.vercel.app/upgrade`

### `invite-client`
**O que faz:** Envia convite de acesso ao aluno por e-mail ou gera link para WhatsApp.
- **Input:** `{ client_id, channel: "email" | "whatsapp" }`
- **Output:** `{ success: true }` (email) ou `{ success: true, invite_link }` (whatsapp)
- **Fluxo:** Valida token manualmente (`auth.getUser`) → verifica que o cliente pertence ao treinador → chama `supabase.auth.admin.inviteUserByEmail` (email) ou `auth.admin.generateLink` (whatsapp)
- **`verify_jwt = false`** — valida o token manualmente dentro da função
- O metadata do convite inclui `{ role: "client", client_id }`, usado pelo trigger `link_client_user_id()` para preencher `clients.user_id`
- O `redirectTo` do convite aponta para `https://vortex-primus-app.vercel.app/set-password`

### `delete-client`
**O que faz:** Exclui um aluno e seu registro em `auth.users`.
- **Input:** `{ client_id }`
- **Output:** `{ success: true }`
- **Fluxo:** Valida token manualmente → busca cliente (aceita `trainer_id = trainer.id` OU `trainer_id IS NULL` para limpeza de órfãos) → deleta `clients` (CASCADE remove `meal_plans`, `diet_preferences`, avaliações) → deleta `auth.users` se `user_id` não for null
- **`verify_jwt = false`** — valida o token manualmente dentro da função
- Falha ao deletar `auth.users` é logada mas não interrompe o fluxo (o registro de `clients` já foi removido)

### `generate-diet`
**O que faz:** Gera plano alimentar completo de 7 dias via Claude API (IA).
- **Input:** `{ client_id }`
- **Output:** `{ plan: { observations, days: [...] }, trainer_name }`
- **Fluxo:** Valida token → busca cliente + última avaliação física → calcula BMR/TDEE/macros (Mifflin-St Jeor) → chama `claude-sonnet-4-6` com prompt estruturado → retorna plano JSON
- Aceita chamada tanto do treinador (`trainer.id === client.trainer_id`) quanto do próprio aluno (`client.user_id === user.id`)
- Requer `ANTHROPIC_API_KEY` configurada via `supabase secrets set`
- Exige dados mínimos: `weight` (última avaliação), `height_cm`, `birth_date`, `gender`, `objective`, `activity_level`

---

## Arquitetura de Pagamentos (Stripe)

O fluxo atual usa **Stripe Checkout via URL**, não Payment Sheet nativo.

O frontend usa `expo-web-browser` para abrir a URL do Stripe Checkout.

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

## Módulo de Dieta (branch `develop` — aguardando testes)

Implementado em 2026-04-09 em 10 fases. Commit `d6fa011` em `origin/develop`. **Não fazer merge para `main` antes dos testes.**

### Auth de 3 Níveis

`AuthContext.tsx` detecta o papel do usuário logado:
1. `trainers.user_id = auth.uid()` → role `"trainer"` → `/(protected)`
2. `clients.user_id = auth.uid()` → role `"client"` → `/(client)/diet`
3. Sem match → `/login`

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
2. Envia convite por e-mail ou WhatsApp (modal CONVITE em `client-details.tsx`)
3. Acessa `client-diet.tsx` (botão DIETA) → vê metas calculadas + barras "Plano vs Meta"
4. Cria/edita plano em `diet-plan-form.tsx` → busca alimentos TACO pelo botão **🔍 TACO** por alimento
5. Exporta PDF com botão **📄 Exportar PDF**

### Fluxo do Aluno

1. Recebe link de convite → acessa `/set-password` → define senha
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

## Bugs Conhecidos / Pendentes

### Bug 1 — `delete-client` retornava 401

**Status: ✅ RESOLVIDO. Deploy v5 em produção (2026-04-13).**

Três correções aplicadas em sequência:

- **`verify_jwt = false`** (commit `9e28cd2`, confirmado em produção): o Supabase Gateway estava rejeitando a requisição antes de chegar ao código porque validava o JWT duas vezes. A função valida o token manualmente via `supabaseAdmin.auth.getUser(token)`, então o Gateway deve ficar fora.
- **Ordem de exclusão invertida:** `auth.users` é deletado ANTES de `clients`. Se `deleteUser` falhar, `clients` sobrevive e a operação pode ser retentada. Erro em `deleteUser` agora lança exceção (`throw`) em vez de log silencioso.
- **Fallback por email:** quando `clients.user_id` é `NULL` (convite enviado mas não aceito — `link_client_user_id()` só preenche após o aluno confirmar o e-mail), a função busca `auth.users` pelo email do client via GoTrue Admin API (`GET /auth/v1/admin/users?filter=email`) antes de deletar.
- **Migration `20260412000001_fix_handle_new_user_role_check.sql`** aplicada: trigger `handle_new_user()` agora verifica `raw_user_meta_data->>'role'` — se `role = 'client'`, retorna sem criar registro em `trainers`. Eliminado o bug que criava registros espúrios em `trainers` (e `trainer_subscriptions` por CASCADE) para cada aluno convidado.

---

### Bug 2 — `set-password` — link de convite rejeitado com `otp_expired`

**Status: ✅ RESOLVIDO. Deploy em produção (2026-04-13, commit `e634aea`).**

**Causa raiz confirmada:** O Gmail (e outros serviços de segurança de e-mail) faz pre-fetch automático dos links no corpo do e-mail, fazendo GET no endpoint `/auth/v1/verify?token=...` do Supabase. Como o OTP é single-use, ele era consumido pelo scanner antes do aluno clicar. Evidência: `confirmation_token` em `auth.users` aparecia vazio e `confirmation_sent_at = null` com `updated_at` ~10 minutos após `created_at`, sem o aluno ter clicado.

**Correções aplicadas:**

1. **Template de e-mail** (Supabase Dashboard → Authentication → Email Templates → Invite User): link alterado de `{{ .ConfirmationURL }}` (aponta para `/auth/v1/verify`) para `https://vortex-primus-app.vercel.app/set-password?token_hash={{ .TokenHash }}&type=invite`. O Gmail escaneia a URL do app (renderiza React estático, sem ação de auth) → token não é consumido.

2. **`app/set-password.tsx`** (commit `e634aea`): removida lógica de hash (`parseInviteHash`, `setSession`) — substituída por `useLocalSearchParams` lendo `token_hash` e `type` dos query params, e chamada `supabase.auth.verifyOtp({ token_hash, type: 'invite' })`.

3. **`app/(protected)/client-details.tsx`** (commit `e634aea`): cooldown de 60 segundos na opção "Por E-mail" no modal de convite após envio bem-sucedido, impedindo reenvio acidental que invalidaria o link anterior.

**Nota:** `flowType: 'pkce'` (Opção 1) **não** resolveria o problema — o formato do link do e-mail é determinado pelo template, não pelo `flowType` do cliente SDK.

---

### Bug 3 — Aluno detectado como trainer e redirecionado para o dashboard errado

**Status: ✅ RESOLVIDO. Commits `001e24d` e `1fe88c4` em produção (2026-04-13).**

**Causa raiz confirmada — `login.tsx` redirecionava todos para `/(protected)` sem verificar role:**
`login.tsx:29–33` tinha `useEffect([session])` que disparava `router.replace("/(protected)")` imediatamente ao detectar `session`, antes de `detectRole()` terminar. O role ainda era `null` nesse momento. Com o guard de `(protected)/_layout.tsx` sem verificação de role, o aluno atravessava para o dashboard do treinador.

**Causa secundária — `(protected)/_layout.tsx` não verificava role:**
O layout só checava `session`, não `role`. Qualquer usuário autenticado passava pelo guard independente de ser trainer ou client — vulnerabilidade de autorização.

**Correções aplicadas:**
1. **`app/login.tsx`** (commit `1fe88c4`): `useEffect` agora observa `[session, role]`. Aguarda `role !== null` antes de redirecionar. Trainer → `/(protected)`, client → `/(client)/diet`. Elimina o loop infinito e o redirecionamento errado.
2. **`app/(protected)/_layout.tsx`** (commit `001e24d`): Adicionado `role !== "trainer"` no guard — simetria com `(client)/_layout.tsx`. Alunos autenticados que cheguem à rota de trainer são devolvidos ao login.

---

### Bug 4 — Tela em branco ao acessar `/` após logout do aluno

**Status: ✅ RESOLVIDO. Commit `001e24d` em produção (2026-04-13).**

**Causa confirmada:** `app/index.tsx` tinha dois `return null` separados:
- `if (loading) return null` — correto, transitório.
- `if (role === null) return null` — problemático: quando `session` ainda era truthy no estado React e `role` já era `null` após início do logout, o componente ficava preso aqui indefinidamente, exibindo tela branca sem redirect.

**Correção aplicada — `app/index.tsx`** (commit `001e24d`): As duas guardas foram colapsadas em uma única condição: `if (loading || (session && role === null)) return null`. Isso trata "session existe mas role ainda não resolvido" da mesma forma que o loading inicial. O `if (role === null) return null` redundante foi removido; usuário órfão (session sem role reconhecido) cai no `return <Redirect href="/login" />` final.

---

## Histórico de Manutenção

### 2026-04-17 — Correções de truncamento + navegação agenda

- Fix: título "COMPOSIÇÃO CORPORAL" em `evolution/[id].tsx` truncando em dispositivos com fonte grande (`adjustsFontSizeToFit` + `flex:1` no container)
- Fix: botão "Consultar" em `AssessmentHistoryCard.tsx` truncando — adicionado `minWidth: 82` e `adjustsFontSizeToFit`
- Fix: botão "Excluir Aluno" em `client-details.tsx` truncando para "Exclusivo Aluno" — adicionado `width: '100%'` no estilo e `adjustsFontSizeToFit` no Text
- Fix: botão "Cadastrar novo aluno" ausente ao agendar via card "Novo Agendamento" do Dashboard — adicionado `ListFooterComponent` no modal de seleção de aluno em `index.tsx` (o botão já existia em `schedule/index.tsx` mas não no modal do Dashboard)
- Feature pendente em andamento: análise de refeição por foto (Fases 2 e 3 do meal-capture)

---

### 2026-04-14 — Ponto de versão pré-redesign (v1.0-stable)

Todos os bugs resolvidos (1-4). Features implementadas: tela do aluno com card de avaliação, botão criar plano alimentar, diet-plan-form para client, RLS policies. Template de email customizado com token_hash. Sistema funcional e estável.

**Tag: v1.0-stable** — ponto de retorno antes do redesign dark theme.

---

### 2026-04-13 — Sessão completa: Bugs 1-4 resolvidos + feature tela do aluno

**Bug 1 — delete-client 401:** Resolvido. Edge Function v5: ordem de exclusão invertida (auth.users antes de clients) + fallback busca auth.users por email via GoTrue Admin API quando clients.user_id é NULL.

**Bug 2 — set-password "Link inválido" (OTP expirado):** Resolvido. Causa raiz: Gmail pre-fetch consumia o token OTP ao escanear o link /auth/v1/verify. Fix: template de email customizado com {{ .TokenHash }} redireciona para /set-password?token_hash=...&type=invite (Gmail renderiza a página sem consumir token). set-password.tsx reescrito para usar verifyOtp({ token_hash, type: 'invite' }). Cooldown de 60s no botão de convite.

**Bug 3 — Aluno caía no Dashboard do treinador:** Resolvido. Duas causas: (1) login.tsx redirecionava todos para /(protected) sem verificar role — corrigido para redirecionar por role. (2) clients.user_id não era preenchido após verifyOtp — adicionado UPDATE manual no set-password.tsx + RLS policy client_self_link_on_invite.

**Bug 4 — Tela branca após logout:** Resolvido. index.tsx retornava null quando session existia mas role era null — colapsada guarda em loading || (session && role === null).

**Feature — Tela do aluno (/(client)/diet):** Card de última avaliação corporal adicionado. Mensagem para contatar treinador quando sem avaliação. Botão "+ Criar Plano Alimentar" visível apenas com avaliação existente. Nova rota app/(client)/diet-plan-form.tsx para criação de plano pelo aluno. RLS policies para meal_plans, meal_plan_meals e meal_plan_foods. Fix .order("date") em vez de "created_at" inexistente (commit `5ff65cf`).

**Correções estruturais:** Migration handle_new_user() com guard role='client'. Guard de role no (protected)/_layout.tsx. Template de email Invite User customizado no Dashboard.

**Pendente para próxima sessão:** Testar se o card de avaliação aparece corretamente após fix do .order("date"). Testar fluxo completo de criação de plano alimentar pelo aluno.

---

### 2026-04-13 — Bugs 3 e 4 resolvidos; sistema de routing de auth completo

- **`app/login.tsx`** (commit `1fe88c4`): `useEffect` reescrito para observar `[session, role]`. Aguarda `detectRole()` resolver antes de redirecionar. Trainer vai para `/(protected)`, client vai para `/(client)/diet`. Elimina loop infinito causado pelo redirect hardcoded para `/(protected)` antes do role estar disponível.
- **`app/(protected)/_layout.tsx`** (commit `001e24d`): Adicionado `role` ao destructuring de `useAuth()`. Guard alterado de `!session` para `!session || role !== "trainer"` — simetria com `(client)/_layout.tsx`. Impede acesso de alunos autenticados às rotas de treinador.
- **`app/index.tsx`** (commit `001e24d`): Colapsado `if (loading) return null` e `if (role === null) return null` em `if (loading || (session && role === null)) return null`. Remove tela branca durante transição de logout. `return <Redirect href="/login" />` no final cobre o caso de usuário órfão (session sem role reconhecido).
- **`supabase/migrations/20260413000000_client_self_link_policy.sql`** (commit `3a23067`): RLS policy `client_self_link_on_invite` — autoriza o aluno a fazer UPDATE em `clients.user_id` apenas na própria linha ainda não vinculada (`USING (user_id IS NULL)`, `WITH CHECK (user_id = auth.uid())`). Necessária porque `set-password.tsx` faz o vínculo diretamente após `verifyOtp`, com a sessão do aluno ativa.
- **`app/set-password.tsx`** (commit `3a23067`): Adicionado UPDATE em `clients.user_id` logo após `verifyOtp` retornar sucesso, usando o `client_id` do `user_metadata`. Garante o vínculo mesmo que o trigger `link_client_user_id()` não execute (limitação de `auth.uid()` em contexto de trigger no Supabase Cloud).

---

### 2026-04-13 — Bug 2 resolvido; Bugs 3 e 4 identificados; correções set-password e client-details

- **`app/set-password.tsx`** (commit `e634aea`): Reescrita completa da lógica de token. Removidas `parseInviteHash()`, `inviteTokens` ref e toda a lógica de `#access_token` no hash. Adicionado `useLocalSearchParams` lendo `token_hash` e `type` dos query params. Substituído `setSession()`/`getSession()` por `supabase.auth.verifyOtp({ token_hash, type: 'invite' })`.
- **`app/(protected)/client-details.tsx`** (commit `e634aea`): Cooldown de 60s na opção "Por E-mail" do modal de convite após envio bem-sucedido. Implementado com `inviteEmailSent` state + `setTimeout` + cleanup em `useEffect`.
- **Template de e-mail Supabase** (mudança manual no Dashboard): Link do convite alterado de `{{ .ConfirmationURL }}` para `https://vortex-primus-app.vercel.app/set-password?token_hash={{ .TokenHash }}&type=invite`. Resolve o pré-fetch do Gmail.
- **Bug 3 identificado** (não corrigido): Aluno detectado como trainer por registro espúrio em `trainers` + `(protected)/_layout.tsx` sem verificação de role.
- **Bug 4 identificado** (não corrigido): Tela branca em `/` após logout por `return null` na linha 16 de `index.tsx` durante transição de estado do logout.

### 2026-04-13 — Correções delete-client e trigger handle_new_user

- **`supabase/functions/delete-client/index.ts`** (v5, deploy confirmado): Ordem de exclusão invertida — `auth.users` é deletado antes de `clients`. Adicionado fallback por email via GoTrue Admin API para o cenário onde `clients.user_id` é `NULL` (convite enviado, não aceito pelo aluno). Erro em `deleteUser` agora lança exceção em vez de log silencioso. `select` da busca do client atualizado para incluir `email`. `supabaseUrl` e `serviceKey` extraídos como variáveis para reutilização no `fetch`.
- **Migration `20260412000001_fix_handle_new_user_role_check.sql`**: Trigger `handle_new_user()` corrigido para verificar `raw_user_meta_data->>'role'` — se `role = 'client'`, retorna sem criar registro em `trainers`. Evita registros espúrios em `trainers` e `trainer_subscriptions` para alunos convidados. Query de limpeza de `trainers` espúrios incluída na migration.
- **Bug 2 (set-password / otp_expired)**: Investigação iniciada. Causa raiz ainda não confirmada. Testes continuam com ambiente 100% limpo.

### 2026-04-12 — Fluxo de convite e exclusão de aluno

- **`app/set-password.tsx`** (feat `6c00c9c` + fix `a3ebad3`): Tela de definição de senha para alunos convidados. Lida com dois cenários: sessão prévia no browser (treinador logado) e fluxo limpo (sem sessão).
- **`supabase/functions/delete-client/`** (feat `789ad5b` + fix `143e2d6` + fix `9e28cd2`): Edge Function que exclui o aluno de `clients` e de `auth.users`. Aceita `trainer_id IS NULL` para clientes órfãos. Configurado com `verify_jwt = false`.
- **`app/(protected)/client-details.tsx`**: Modal de seleção de canal de convite (E-mail ou WhatsApp). Botão de exclusão com confirmação dupla.

### 2026-04-09 — Módulo de Dieta completo (branch `develop`)

23 arquivos criados/modificados em commit `d6fa011`. Branch `develop` existe e está separada de `main`. **Aguardando testes antes do merge.**

Arquivos novos: `app/(client)/_layout.tsx`, `app/(client)/diet.tsx`, `app/(protected)/client-diet.tsx`, `app/(protected)/diet-plan-form.tsx`, `components/DietPlanPDF.tsx`, `components/DietPlanPDF.web.tsx`, `components/FoodSearchModal.tsx`, `components/MacroBar.tsx`, `components/MealCard.tsx`, `docs/plano-modulo-dieta.md`, `scripts/seed-taco.js`, `supabase/functions/invite-client/index.ts`, `supabase/functions/generate-diet/index.ts`, 4 migrations SQL, `utils/dietCalculations.ts`, `utils/dietPDFTemplate.ts`.

Arquivos modificados: `app/(protected)/client-create.tsx`, `app/(protected)/client-details.tsx`, `app/index.tsx`, `contexts/AuthContext.tsx`.

### 2026-04-07 — Bug da tela Meu Perfil (trainer-profile.tsx)

**1. Trigger `handle_new_user()` engolia erros silenciosamente**
O trigger disparado em `auth.users` após INSERT tinha `EXCEPTION WHEN OTHERS THEN RETURN NEW`, o que fazia erros no INSERT de `trainers` serem ignorados. Resultado: usuários criados no Auth sem registro correspondente em `trainers` (órfãos). Corrigido removendo o bloco de exceção e adicionando `email` no INSERT.

**2. Trigger `create_default_subscription()` buscava plano inexistente**
A função buscava `WHERE name = 'FREE'`, mas o plano gratuito se chama `'TESTE'`. Como `plan_id` tem NOT NULL, o INSERT em `trainer_subscriptions` falhava, derrubando todo o INSERT em `trainers`. Corrigido para `'TESTE'` + guard `IF free_plan_id IS NOT NULL`.

**3. Query `loadProfile()` selecionava coluna inexistente**
A query em `trainer-profile.tsx` selecionava `plan_status` (coluna que não existe em `trainers`) e fazia join direto com `plans` (que deve ser feito via `trainer_subscriptions`). Corrigido para duas queries separadas seguindo o padrão de `useTrainer.ts`.

---

## Regras para o Claude Code

- Respeitar sempre o padrão de extensões `.web.ts` / `.web.tsx`.
- Nunca importar módulos nativos incompatíveis com Web em arquivos sem extensão de plataforma.
- Sempre formatar números com `.toFixed(1)` antes de enviar ao Supabase.
- Sempre verificar se novos plugins estão declarados no `app.json`.
- Sempre considerar RLS ao criar ou modificar queries.
- Novas Edge Functions que validam token manualmente devem ter `verify_jwt = false` em `supabase/config.toml`.
- Antes de qualquer implementação maior, entrar em **Plan Mode** e apresentar o plano para aprovação.
- **Não fazer merge de `develop` → `main` sem autorização explícita do usuário.** O Módulo de Dieta está em `develop` aguardando testes.
- Ao criar/modificar tabelas do Módulo de Dieta, lembrar que `meal_plan_foods` usa CASCADE DELETE a partir de `meal_plan_meals`, e `meal_plan_meals` usa CASCADE DELETE a partir de `meal_plans`. Nunca deletar um `meal_plan` sem consciência disso.
- `foods` é catálogo somente-leitura. Nunca gerar queries de INSERT/UPDATE/DELETE em `foods` para usuários autenticados — apenas `service_role` pode escrever.
- O trigger `link_client_user_id()` preenche `clients.user_id` automaticamente quando o aluno aceita o convite. Não fazer UPDATE manual desse campo no fluxo de convite.
