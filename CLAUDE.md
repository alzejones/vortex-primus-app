# CLAUDE.md

Guia para Claude Code ao trabalhar no **Vortex Primus** - plataforma SaaS fitness multiplataforma.

## Stack Técnica

- **Frontend:** React Native + Expo SDK 54 + Expo Router
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions/Deno)
- **Pagamentos:** Stripe Checkout (URL-based)
- **Deploy:** Vercel (export estático)
- **Comandos:** `npx expo start` | `npm run build` | `npm run lint`

## Estrutura do Projeto

```
vortex-primus-app/
├── app/                         # Expo Router - estrutura de rotas
│   ├── index.tsx                # Redirect por role
│   ├── login.tsx                # Autenticação
│   ├── evolution/[id].tsx       # Evolução pública (sem auth)
│   ├── (protected)/             # Rotas de treinadores
│   │   ├── _layout.tsx          # TabBar: Home/Alunos/Agenda/Config
│   │   ├── index.tsx, clients.tsx, client-details.tsx
│   │   ├── client-assessments.tsx, supplements.tsx
│   │   └── client-diet.tsx, plans.tsx
│   └── (client)/                # Rotas de alunos
│       └── diet.tsx, meal-capture.tsx
├── components/                  # Componentes reutilizáveis
│   ├── BluetoothScaleConnector.tsx, TrainerScalesManager.tsx
│   ├── TrunkMeasurementsChart.tsx, LimbMeasurementsChart.tsx
│   ├── EvolutionPanel.tsx, MeasurementsEvolutionPanel.tsx
│   └── DashboardLayout[.web].tsx
├── utils/                       # Utilitários e helpers
│   ├── theme.ts                 # Sistema de cores/temas
│   └── assessmentCalculations.ts
├── contexts/                    # React Contexts
│   └── AuthContext.tsx
├── lib/                         # Configurações de bibliotecas
│   └── supabase.ts
├── supabase/                    # Backend Supabase
│   ├── migrations/              # Migrações SQL
│   └── functions/               # Edge Functions (Deno)
│       ├── stripe-checkout/, invite-client/, delete-client/
│       └── generate-diet/, analyze-meal-photo/
└── assets/                      # Recursos estáticos
    └── images/, fonts/
```

## Padrões Estabelecidos

**Multiplataforma:**
- Extensão `.web.tsx` para funcionalidades web específicas
- Nunca importar módulos nativos sem extensão de plataforma

**Dados:**
- `.toFixed(1)` em números antes do Supabase (vírgulas → `NaN`)
- RLS ativo em todas as tabelas
- Edge Functions retornam HTTP 200 + `{ error }`

**Layout:**
- Mobile-only com TabBar inferior
- Viewport detection: screenWidth >= 768 para modo desktop
- Padrão DashboardLayout: DashboardLayoutMobile.tsx + DashboardLayout.tsx (re-export) + DashboardLayout.web.tsx (sidebar desktop)

## Sistema Atual (v1.0 Produção)

**Funcionalidades Principais:**
- Sistema de autenticação (Google OAuth + email/senha)
- Gestão de clientes e avaliações físicas
- Gráficos de evolução (tronco, membros, gordura x músculo)
- Módulo de dieta com busca TACO e suplementos
- Sistema de balanças Bluetooth com múltiplos protocolos
- Planos automatizados para treinadores

**Tabelas Core:**
- trainers, clients, plans, trainer_subscriptions
- physical_assessments, anthropometry, appointments
- meal_plans, meal_plan_meals, meal_plan_foods, meal_log
- foods (TACO — 597 alimentos), supplements
- conditioning_assessments, conditioning_tests
- supported_scales, trainer_scales

**Navegação:**
- TabBar: Home/Alunos/Agenda/Config
- Suplementos movido para Config → Suplementos
- BluetoothScaleConnector integrado em client-assessments

## Regras de Trabalho

1. **TodoWrite obrigatório para tasks complexas**
2. **Plan Mode antes de implementações grandes**
3. **Nunca criar arquivos .md sem solicitação explícita**
4. **Sempre considerar RLS ao criar queries**
5. **Plugins nativos devem estar em `app.json`**
6. **Diagnóstico antes de qualquer correção**
7. **Uma frente por vez — aguardar confirmação antes de continuar**
8. **Commit + push ao final de cada bloco de trabalho**
9. **Nunca adivinhar — decisões baseadas sempre em dados reais**

---

## Credenciais e Acessos

**Supabase Database Password:**
```
stcvip01vortex
```

**Projeto Supabase:**
- **Project Ref:** `rwyyvilshrjhfwlzudqg`
- **URL:** https://rwyyvilshrjhfwlzudqg.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/rwyyvilshrjhfwlzudqg

**URLs de Deploy:**
- **Produção:** https://vortex-primus.vercel.app
- **Login:** https://vortex-primus.vercel.app/login

**Comandos Essenciais:**
```bash
# Aplicar migrations
export SUPABASE_DB_PASSWORD="stcvip01vortex" && npx supabase db push

# Desenvolvimento local
npx expo start

# Build e lint
npm run build
npm run lint
```

**Variáveis de Ambiente (.env):**
- `EXPO_PUBLIC_SUPABASE_URL=https://rwyyvilshrjhfwlzudqg.supabase.co`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eXl2aWxzaHJqaGZ3bHp1ZHFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyODAxMDQsImV4cCI6MjA4Njg1NjEwNH0.-f59-ol2LOwEEVWvjq-rwqFEt6sXK8i2zNHWBwSU8-Q`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TIWv32HlySFSGvPwazv22TtWHYO0W058yodScKMwjp4JXNzsv0hsbum1EGR2kiM5T2OmrUnWkCmppPiIZqzgAdl00dVzh5FKYs`

---

**Auth:** 3 níveis - trainer→`/(protected)`, client→`/(client)`, sem match→`/login`