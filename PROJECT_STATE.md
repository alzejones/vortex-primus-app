# CLAUDE.md — Vortex Primus (v1.0)

> Este arquivo é lido automaticamente pelo Claude Code no início de cada sessão.
> Mantenha-o atualizado conforme o projeto evolui.

---

## 1. Visão Geral do Projeto

**Vortex Primus** é uma plataforma SaaS multiplataforma (Mobile + Web) voltada para
gestão fitness e esportiva. O público-alvo são treinadores, personal trainers,
nutricionistas e coaches que precisam gerenciar alunos, realizar avaliações de
composição corporal assistidas por IA e controlar assinaturas.

- **Status atual:** v1.0 em Produção
- **Modelo de negócio:** SaaS com planos de assinatura pagos via Stripe

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Frontend Mobile & Web | React Native + Expo (SDK 54+) |
| Roteamento | Expo Router (file-based, rotas tipadas ativadas) |
| Backend & Banco | Supabase (PostgreSQL + Auth + Edge Functions) |
| Gateway de Pagamento | Stripe |
| Deploy Web | Vercel (exportação estática) |
| Runtime Edge Functions | Deno (dentro do Supabase) |

---

## 3. Banco de Dados (Supabase PostgreSQL)

O banco usa **RLS (Row Level Security)** em todas as tabelas. Sempre considere
as políticas de RLS ao escrever queries ou Edge Functions.

### Tabelas principais

**`plans`** — Planos de assinatura disponíveis
```
id                uuid        PK
name              text        Nome comercial do plano
price_monthly     numeric     Valor mensal
max_clients       integer?    Limite de alunos (nullable = ilimitado)
stripe_product_id text        ID do produto no Stripe
stripe_price_id   text        ID do preço no Stripe
```

**`trainer_subscriptions`** — Assinaturas ativas dos treinadores
```
Relaciona: Auth UID do treinador + plano + data de início + is_active (boolean)
```

> ⚠️ **Regra crítica:** Os `stripe_price_id` e `stripe_product_id` na tabela `plans`
> devem estar rigorosamente sincronizados com o painel do Stripe. Qualquer
> dessincronização quebra o fluxo de checkout silenciosamente.

---

## 4. Arquitetura de Pagamentos (Stripe)

A integração é dividida em **duas camadas** para suportar Cartão e PIX:

### Backend — Edge Function `stripe-checkout` (Deno)
- Recebe `priceId` via requisição autenticada
- Cria o cliente no Stripe
- Gera `ephemeralKey`
- Retorna `paymentIntentClientSecret`

### Frontend — React Native
- Usa `@stripe/stripe-react-native`
- Fluxo: `initPaymentSheet` → `presentPaymentSheet`
- Renderiza a gaveta nativa de pagamento

---

## 5. Padrão Crítico: Compatibilidade Web vs Mobile

> ⚠️ **NUNCA ignore este padrão.** O Stripe SDK é estritamente nativo e quebra
> o build do Vercel se importado diretamente em contexto Web.

Sempre que adicionar pacotes nativos incompatíveis com Web, use o padrão de
**extensões por plataforma** já estabelecido no projeto:

### Componentes
```
StripeWrapper.tsx        → Invoca <StripeProvider> nativo (iOS/Android)
StripeWrapper.web.tsx    → Retorna apenas children (ignora o SDK)
```

### Hooks
```
useStripeHook.ts         → Importa do @stripe/stripe-react-native
useStripeHook.web.ts     → Retorna funções mock avisando sobre pagamento mobile
```

O Expo Router resolve automaticamente a extensão correta por plataforma.
**Siga este mesmo padrão para qualquer novo pacote nativo.**

---

## 6. Módulo de Avaliação por IA

O preenchimento automático da IA retorna os seguintes campos:

- Percentual de Gordura
- Percentual de Músculo
- Idade Metabólica
- Metabolismo Basal

> ⚠️ **Formatação obrigatória:** Sempre use `.toFixed(1)` nos valores numéricos
> antes de gravar no PostgreSQL. **Nunca use vírgulas.** Vírgulas causam erros
> silenciosos de `NaN` na gravação.

---

## 7. Comandos Frequentes

```bash
# Rodar o projeto localmente
npx expo start

# Rodar limpando o cache (usar quando houver comportamento estranho)
npx expo start -c

# Deploy de Edge Function
npx supabase functions deploy stripe-checkout

# Atualizar segredos do backend
npx supabase secrets set NOME_DA_CHAVE=valor
```

---

## 8. Configuração do app.json

Todo plugin nativo adicionado ao Expo **deve ser declarado** no array `plugins`
do `app.json`.

Configuração atual do Stripe:
```json
{
  "plugins": [
    [
      "@stripe/stripe-react-native",
      {
        "merchantIdentifier": "merchant.com.vortexprimus",
        "enableGooglePay": true
      }
    ]
  ]
}
```

> Esta declaração é obrigatória para passar nas validações de build do Vercel,
> Google Play e App Store.

---

## 9. Roadmap — Próximas Implementações

Itens priorizados para as próximas versões, em ordem sugerida:

### 9.1 Webhooks do Stripe *(Alta prioridade)*
- Criar nova Edge Function: `stripe-webhook`
- Escutar eventos: `invoice.payment_succeeded`, `customer.subscription.deleted`
- Automatizar bloqueio/renovação de treinadores inadimplentes
- Isso elimina a dependência do estado vir apenas da tela do app

### 9.2 Publicação nas Lojas
- Gerar credenciais de produção
- Usar **EAS Build** (`expo build`) para empacotar os binários finais
- `.AAB` para Google Play
- `.IPA` para App Store

### 9.3 Módulo do Aluno
- App ou interface web dedicada ao aluno final
- Visualização da evolução: força, resistência, mobilidade
- Integração com avaliações montadas pelo treinador no Vortex Primus

---

## 10. Regras Gerais para o Claude Code

- **Sempre** respeitar o padrão de extensões `.web.ts` / `.web.tsx` para código
  específico de plataforma.
- **Nunca** importar módulos nativos diretamente em arquivos sem extensão de
  plataforma se eles não suportam Web.
- **Sempre** formatar números com `.toFixed(1)` antes de enviar ao Supabase.
- **Sempre** verificar se novos plugins estão declarados no `app.json`.
- **Sempre** considerar RLS ao criar ou modificar queries no Supabase.
- Ao criar novas Edge Functions, seguir o padrão Deno já estabelecido na função
  `stripe-checkout`.
- Antes de qualquer implementação maior, entrar em **Plan Mode** e apresentar
  o plano para aprovação.
