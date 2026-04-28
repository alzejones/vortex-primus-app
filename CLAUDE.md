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
- Módulo de Dieta em produção
- Sistema de Balanças Bluetooth — Fase 1 (a51365a) e Fase 2 (b709d39) concluídas
  - Tabelas: supported_scales, trainer_scales
  - Campos novos em anthropometry: bmi, water_percent, bone_mass, source
  - Componente: BluetoothScaleConnector.tsx (Web Bluetooth API nativa)
  - Protocolo implementado: Xiaomi Mi Body Composition Scale 2
  - Fase 3 pendente: convite de auto-pesagem para o aluno
- Sistema de Suplementos Herbalife — commit ed57ea4
  - Tabela: supplements (brand, sku, name, serving_size_g, macros, notes)
  - Componente: SupplementSearchModal.tsx (busca dinâmica, badge laranja)
  - Botão 💊 Herbalife ao lado do 🔍 TACO no formulário de refeição
  - 7 produtos Herbalife no seed inicial
  - meal_plan_foods: colunas food_id e supplement_id adicionadas (commit 6a1f227)
- Fix AuthContext: detecta role no evento USER_UPDATED — commit c3cf3f8
- Responsividade completa implementada
- Bugs abertos: nenhum no código

**✅ SITUAÇÃO DO BANCO DE DADOS - RECUPERAÇÃO CONCLUÍDA:**
- **28/04/2026:** Banco de dados totalmente recuperado e funcional
- **Novo projeto:** rwyyvilshrjhfwlzudqg.supabase.co (substituindo qgeezszpcuypqujplkde)
- **Schema completo:** 22 tabelas criadas + RLS + triggers funcionando
- **16 migrations:** Aplicadas com sucesso no novo projeto
- **5 Edge Functions:** Deployadas e operacionais
- **App testado:** Login e conexão validados - sistema 100% funcional

**Gráficos de Evolução implementados:**
- Gordura x Músculo (client-assessments)
- Evolução do Tronco — TrunkMeasurementsChart.tsx
- Evolução de Membros — LimbMeasurementsChart.tsx

**Banco de dados (schema completo operacional):**
- 22 tabelas, 5 Edge Functions
- Dados zerados — aguardando repopulação conforme uso

**Tabelas Core:**
- trainers, clients, plans, trainer_subscriptions
- physical_assessments, anthropometry
- meal_plans, meal_plan_meals, meal_plan_foods, meal_log
- foods (TACO — 597 alimentos), supplements (Herbalife — 7 produtos seed)
- conditioning_assessments, conditioning_tests
- supported_scales, trainer_scales

**Edge Functions (deployadas e funcionais):**
- stripe-checkout, invite-client, delete-client
- generate-diet, analyze-meal-photo

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

## Pendências e Roadmap

**✅ RECUPERAÇÃO CONCLUÍDA — Sistema operacional:**
- ✅ Conectado ao novo projeto Supabase rwyyvilshrjhfwlzudqg
- ✅ Schema base recriado: 13 tabelas principais + RLS + triggers
- ✅ 16 migrations aplicadas com sucesso no novo banco
- ✅ 5 Edge Functions deployadas e funcionais
- ✅ Variáveis de ambiente locais configuradas (migradas para .env)
- ✅ Atualizar variáveis de ambiente no Vercel e ambiente local (concluído)
- ✅ Login e funcionamento testados e validados

**Detalhes técnicos da recuperação:**
- Baseline migration recriada com schema completo
- Conflitos de CREATE TABLE resolvidos com IF NOT EXISTS
- RLS policies funcionando em todas as tabelas
- Auth trigger (handle_new_user) operacional
- TypeScript compilation sem erros relacionados ao Supabase
- Variáveis de ambiente migradas do hardcode para .env (EXPO_PUBLIC_SUPABASE_URL/ANON_KEY)
- Cache Expo limpo e servidor testado com novas configurações

**Sistema de Balanças:**
- Fase 3 — Auto-pesagem do aluno (convite via link, igual ao módulo Dieta)
- Teste real BLE com balança física (aguarda aluno com Xiaomi disponível)
- Protocolos pendentes: Original Line (Chipsea/OKOK) e Techline TEC-BF01 (Fitdays)

**Suplementos Herbalife:**
- Completar tabela nutricional dos produtos restantes (dados parciais do catálogo)
- Futura tela de gerenciamento de suplementos em Config

---

**Auth:** 3 níveis - trainer→`/(protected)`, client→`/(client)`, sem match→`/login`
