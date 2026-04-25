# CLAUDE.md

Guia para Claude Code ao trabalhar no **Vortex Primus** - plataforma SaaS fitness multiplataforma.

## Stack Técnica

- **Frontend:** React Native + Expo SDK 54 + Expo Router
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions/Deno)
- **Pagamentos:** Stripe Checkout (URL-based)
- **Deploy:** Vercel (export estático)
- **Comandos:** `npx expo start` | `npm run build` | `npm run lint`

## Estrutura de Rotas

```
app/
  index.tsx                      # Redirect por role
  login.tsx                      # Auth
  evolution/[id].tsx             # Público, sem auth
  (protected)/                   # Treinadores
    _layout.tsx                  # TabBar: Home/Alunos/Agenda/Config
    index.tsx, clients.tsx, client-details.tsx, client-assessments.tsx
    client-diet.tsx, assessment-create.tsx, plans.tsx
  (client)/                      # Alunos
    diet.tsx, meal-capture.tsx
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
- Módulo de Dieta em branch `develop` (aguardando merge)
- Análise de refeição por foto (Claude Vision)
- Responsividade completa implementada
- Bugs abertos: nenhum

**Tabelas Core:**
- `trainers`, `clients`, `plans`, `trainer_subscriptions`
- `physical_assessments`, `anthropometry` 
- `meal_plans`, `meal_log` (módulo dieta)

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
