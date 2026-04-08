# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Visão Geral

**Vortex Primus** é uma plataforma SaaS multiplataforma (Mobile + Web) para gestão fitness. Treinadores gerenciam alunos, realizam avaliações de composição corporal assistidas por IA e controlam assinaturas pagas via Stripe.

- **Status:** v1.0 em Produção
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
  index.tsx                      # Redirect para login ou (protected)
  login.tsx                      # Tela de autenticação
  evolution/                     # Módulo de evolução (público/separado)
  (protected)/                   # Grupo protegido — redireciona para /login se sem sessão
    _layout.tsx                  # Guard de auth (useAuth)
    index.tsx                    # Dashboard principal
    clients.tsx                  # Lista de alunos
    client-create.tsx            # Cadastro de aluno
    client-details.tsx           # Detalhes do aluno
    client-assessments.tsx       # Avaliações de um aluno específico
    assessment-create.tsx        # Nova avaliação com IA
    anthropometry-form.tsx       # Formulário de antropometria
    plans.tsx                    # Visualização de planos
    upgrade.tsx                  # Tela de upgrade de plano
    trainer-profile.tsx          # Perfil do treinador
    assessments/
      conditioning.tsx           # Avaliação de condicionamento
      conditioning-evolution.tsx # Evolução de condicionamento
    schedule/                    # Módulo de agenda
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
id          uuid
trainer_id  uuid   FK → trainers
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
