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
│   │   ├── client-assessments.tsx, assessment-create.tsx
│   │   └── client-diet.tsx, plans.tsx
│   └── (client)/                # Rotas de alunos
│       ├── diet.tsx, meal-capture.tsx
├── components/                  # Componentes reutilizáveis
│   ├── TrunkMeasurementsChart.tsx    # Gráfico evolução tronco
│   ├── LimbMeasurementsChart.tsx     # Gráfico evolução membros
│   ├── EvolutionPanel.tsx, MeasurementsEvolutionPanel.tsx
│   ├── AssessmentDetailsModal.tsx, AssessmentHistoryCard.tsx
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

## Estado Atual

**v1.0 em Produção**
- Módulo de Dieta em produção (mergeado em main)
- Responsividade completa implementada
- Bugs abertos: nenhum

**Gráficos de Evolução implementados:**
- Gordura x Músculo (client-assessments)
- Evolução do Tronco — 4 linhas (Peitoral, Abdômen, Cintura, Quadril)
  - Componente: components/TrunkMeasurementsChart.tsx
  - Presente em: client-assessments, AssessmentDetailsModal, evolution/[id]
  - Filtro: exibe apenas avaliações com medidas de tronco preenchidas (> 0)
- Evolução de Membros — barras agrupadas para comparação de simetria E/D
  - Componente: components/LimbMeasurementsChart.tsx
  - 💪 MEMBROS SUPERIORES (arm_left azul #4A90D9 | arm_right verde #7ED321) 
  - 🦵 MEMBROS INFERIORES com COXA (thigh_left #1E5799 | thigh_right #4A90D9) e PANTURRILHA (calf_left #B85C00 | calf_right #F5A623)
  - Valores numéricos dentro das barras se >= 5cm
  - Presente em: client-assessments, AssessmentDetailsModal, evolution/[id]
  - Usa react-native-gifted-charts BarChart com data array agrupado (spacing diferenciado)

**Banco de dados:**
- 152 avaliações válidas (limpeza realizada em 25/04/2026)
- 135 clientes vinculados a treinadores
- Integridade referencial 100%

**Tabelas Core:**
- `trainers`, `clients`, `plans`, `trainer_subscriptions`
- `physical_assessments`, `anthropometry`
- `meal_plans`, `meal_log` (módulo dieta)
- `conditioning_assessments`, `conditioning_tests` (avaliações de performance — tabela separada)

**Edge Functions:**
- `stripe-checkout`, `invite-client`, `delete-client`
- `generate-diet`, `analyze-meal-photo`

## Regras de Trabalho

1. **Não merge `develop` → `main` sem autorização**
2. **TodoWrite obrigatório para tasks complexas**
3. **Plan Mode antes de implementações grandes**
4. **Nunca criar arquivos .md sem solicitação explícita**
5. **Sempre considerar RLS ao criar queries**
6. **Plugins nativos devem estar em `app.json`**
7. **Diagnóstico antes de qualquer correção**
8. **Uma frente por vez — aguardar confirmação antes de continuar**
9. **Commit + push ao final de cada bloco de trabalho**
10. **Nunca adivinhar — decisões baseadas sempre em dados reais**

---

**Auth:** 3 níveis - trainer→`/(protected)`, client→`/(client)`, sem match→`/login`
