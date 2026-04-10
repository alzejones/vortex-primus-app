# Plano — Módulo de Dieta (Vortex Primus)

## Fase 1 — Migration SQL ✅ CONCLUÍDA
Arquivo: `supabase/migrations/20260409000000_diet_module.sql`
Tabelas criadas: `meal_plans`, `meal_plan_meals`, `meal_plan_foods`, `diet_preferences`.
Coluna `user_id` adicionada em `clients`. RLS ativo em todas as tabelas.

---

## Fase 2 — Seed TACO
Arquivo: `scripts/seed-taco.js`
- Requer CSV oficial UNICAMP (TACO 4ª edição) e `SUPABASE_SERVICE_ROLE_KEY`
- Lê CSV, mapeia colunas para o schema `foods`, insere em lotes de 50
- Executado uma única vez

---

## Fase 3 — Lógica de Cálculo
Arquivo: `utils/dietCalculations.ts`
- TDEE = BMR × activity_multiplier
- Objetivos:
  - Emagrecimento: TDEE - 500
  - Hipertrofia: TDEE + 300
  - Manutenção: TDEE
  - Saúde: TDEE - 100
  - Performance: TDEE + 200
- Proteína por objetivo:
  - Emagrecimento: lean_mass × 2.2
  - Hipertrofia: lean_mass × 2.4

---

## Fase 4 — Edge Function invite-client
Nova função Deno no Supabase.
- Recebe `client_id`
- Busca email do cliente
- Chama `supabase.auth.admin.inviteUserByEmail` com metadata `role=client` e `client_id`
- Retorna `{ success: true }`
- Deploy: `npx supabase functions deploy invite-client`

---

## Fase 5 — Auth 3 Níveis
Detecção de papel em `app/index.tsx`:
- Sem sessão → `/login`
- Com sessão → verifica `trainers.user_id` → treinador → `/(protected)`
- Não encontrou → verifica `clients.user_id` → aluno → `/(client)`
- Não encontrou → `/login`

---

## Fase 6 — Campos no Cadastro do Aluno
Novos campos em `client-create.tsx` e `client-details.tsx`:
- Objetivo (5 opções)
- Nível de atividade (5 opções)
- Restrições alimentares (TextInput multiline)
- Botão DIETA em `client-details.tsx`
- Botão ENVIAR CONVITE em `client-details.tsx`

---

## Fase 7 — Telas de Dieta (Treinador) ✅ CONCLUÍDA
Arquivos: `client-diet.tsx` e `diet-plan-form.tsx`

---

## Fase 8 — Telas de Dieta (Aluno) ✅ CONCLUÍDA
Arquivo: `app/(client)/diet.tsx`
- Autenticação via `session.user.id` → busca `clients.user_id`
- Exibe metas de macros calculadas (BMR/TDEE)
- Plano alimentar ativo em modo read-only
- Edição de objetivo, nível de atividade e restrições alimentares
- Recálculo local de macros ao salvar (sem reload de tela)
- Botão de logout via `signOut()` do AuthContext
- `app/index.tsx` redireciona clientes para `/(client)/diet`

---

## Fase 9 — Componentes ✅ CONCLUÍDA
- `MacroBar.tsx` — barra de progresso macro (current vs target), cor laranja se fora de ±15% da meta
- `MealCard.tsx` — card reutilizável de refeição com totais de macros; exporta tipos `FoodItem` e `MealItem`
- `FoodSearchModal.tsx` — busca TACO com debounce 350ms, tela de quantidade com preview proporcional e cálculo por grama
- Integrado em `diet-plan-form.tsx`: botão "🔍 TACO" por alimento abre FoodSearchModal e preenche todos os campos automaticamente
- `client-diet.tsx` e `(client)/diet.tsx` refatorados: usam `MealCard` e `MacroBar` (barras "Plano vs Meta")
- PDF (DietPlanPDF) movido para Fase 10

---

## Fase 10 — PDF Export ✅ CONCLUÍDA
- `utils/dietPDFTemplate.ts` — gerador de HTML compartilhado (CSS print-friendly, tabelas por refeição, total geral, macros do aluno)
- `components/DietPlanPDF.tsx` — mobile: abre HTML como data URL no navegador nativo via `expo-web-browser` (sem expo-print — não estava instalado)
- `components/DietPlanPDF.web.tsx` — web: `window.open()` + `window.print()` automático com fallback de timeout 600ms
- Integrado em `client-diet.tsx`: botão "📄 Exportar PDF" ao lado do botão Editar, visível quando há plano ativo
