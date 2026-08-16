# Pendências Técnicas — Vortex Primus

Registro de bugs e dívidas técnicas encontrados durante o trabalho de i18n
(chat "Bilíngue PT/EN"), fora do escopo das frentes em andamento.
Não corrigir sem antes confirmar prioridade e frente dedicada.

Última atualização: 2026-08-16

---

## 🐛 Bugs reais (prováveis falhas em runtime)

### 1. `SaleFormModal.tsx` — variáveis inexistentes (`selProduct`, `setPrice`)
- **Onde:** `components/business/SaleFormModal.tsx`, linha 683
- **O quê:** dentro do picker de cliente, há `if (selProduct) setPrice(...)` — nenhuma
  das duas existe mais no componente. Provavelmente resíduo da refatoração do
  carrinho multi-item (commit `9cc67ef`).
- **Risco:** se esse trecho for alcançado em runtime, gera `ReferenceError` e
  quebra a tela. TypeScript já acusa isso como erro de compilação.
- **Prioridade sugerida:** alta — investigar se o código morto ainda é alcançável.

### 2. `contexts/TutorialContext.tsx` — propriedade `trainer` inexistente
- **Onde:** linha 40
- **O quê:** acessa `trainer` de `AuthContextType`, mas esse tipo não declara essa
  propriedade.
- **Prioridade sugerida:** média — confirmar se funciona em runtime (JS solto) ou
  se está de fato quebrado.

### 3. `hooks/useTrainer.ts` / `components/TrainerScalesManager.tsx` — tipos incompatíveis em `setState`
- **Onde:** `useTrainer.ts:82`, `TrainerScalesManager.tsx`
- **O quê:** dados vindos do Supabase (`any[]`) atribuídos direto a states tipados
  (`Plan | null`, `TrainerScale[]`), sem validação/cast correto.
- **Prioridade sugerida:** baixa — funciona em runtime, mas indica falta de
  validação de shape dos dados.

### 4. `hooks/use-theme-color.ts` / `components/ui/collapsible.tsx` — import quebrado de `Colors`
- **Onde:** ambos importam `Colors` de `@/constants/theme`, que não exporta isso
  (o projeto usa `T` de `utils/theme`, não `constants/theme`)
- **Prioridade sugerida:** baixa — parecem arquivos de boilerplate do template
  Expo original, possivelmente não usados. Confirmar se estão em uso antes de
  decidir remover ou corrigir.

### 5. `components/tutorial/TutorialHelpButton.tsx` — `position: 'fixed'` inválido em RN
- **Onde:** linha 33
- **O quê:** `'fixed'` não é um valor válido de `position` no React Native (só
  existe no CSS web puro). Funciona no build web por acaso, mas é tipagem
  incorreta.
- **Prioridade sugerida:** baixa.

### 6. `utils/dietPDFTemplateAI.ts` — 14 erros de tipo (dados do plano de dieta gerado por IA)
- **Onde:** todo o arquivo — várias propriedades (`protein`, `fat`, `carbs`,
  `calories`, `quantity`, `name`, `label`, `total_calories`, `time_suggestion`)
  acessadas em objetos tipados como `string`.
- **O quê:** o tipo do retorno da IA (Anthropic) não está alinhado com o que o
  template realmente usa — provavelmente falta uma interface/type correta para
  a resposta do `generate-diet`.
- **Prioridade sugerida:** média — é o pipeline de PDF de dieta gerado por IA,
  vale revisar com calma antes de mexer.

### 7. `components/BluetoothScaleConnector.tsx` — tipos da Web Bluetooth API ausentes
- **Onde:** 5 erros (`Navigator.bluetooth`, `BluetoothDevice`,
  `BluetoothRemoteGATTCharacteristic`, `RequestDeviceOptions`, parâmetro
  implícito `any`)
- **O quê:** faltam os tipos `@types/web-bluetooth` (ou declaração manual) — a
  Web Bluetooth API não está no `lib.dom` padrão do TypeScript.
- **Prioridade sugerida:** baixa — cosmético, não afeta o funcionamento real.

### 8. Gráficos (`EvolutionPanel.tsx`, `LimbMeasurementsChart.tsx`, `StrengthDotMatrixChart.tsx`, `EnduranceDotMatrixChart.tsx`) — tipos de props incompatíveis
- **O quê:** props passadas para os componentes de gráfico não batem com os
  tipos esperados pela lib de charts, e alguns parâmetros de callback sem
  tipo explícito (`any` implícito).
- **Prioridade sugerida:** baixa — cosmético, gráficos já funcionam
  visualmente.

### 9. `components/AssessmentPhotoGallery.tsx` — `cacheDirectory` não existe no tipo do módulo
- **Prioridade sugerida:** baixa.

---

## ⚠️ Ruído — NÃO são bugs reais (não perder tempo com isso)

- **~53 erros `Cannot find name 'Deno'` / `Cannot find module 'npm:...'` / 
  `'https://deno.land/...'`** nos arquivos em `supabase/functions/*/index.ts`
  (stripe-webhook, stripe-checkout, generate-diet, analyze-meal-photo,
  invite-client, import-fineshape, delete-client). Isso é esperado: Edge
  Functions rodam em Deno, e o `tsc` local (configurado pra Node/React Native)
  não reconhece os globals/imports do Deno. **Não corrigir** — só ignorar ao
  rodar `npx tsc --noEmit`.

---

## 🧹 Dívida técnica de código (não são erros de tipo, mas valem revisão)

### 1. Duplicação de lógica em `client-create.tsx`
- **Onde:** `handleSave` e o callback `onGoToAssessment` dentro do
  `CoachQuestionnaireForm`
- **O quê:** os dois blocos fazem quase a mesma validação, busca de trainer e
  insert de cliente, copiados um do outro.
- **Sugestão:** extrair para uma função compartilhada `saveClient()`.

### 2. Chaves de tradução órfãs em `locales/*/dashboard.json`
- **O quê:** `planActive` e `planInactive` foram criadas na Frente 4a mas
  nunca usadas no código (o status do plano só decide a cor de um indicador,
  nunca aparece como texto). Não são erro, só sobra.
- **Sugestão:** usar quando o status do plano virar texto visível em algum
  lugar, ou remover se nunca for usado.

### 3. Log de debug esquecido em `login.tsx`
- **O quê:** `console.log("[DEBUG 4] login.tsx renderizando")` (ou similar)
  aparece no console do navegador em produção.
- **Sugestão:** remover ou envolver em `if (__DEV__)`.

### 4. `expo-av` depreciado
- **O quê:** o sistema de tutorial usa `expo-av` para tocar os áudios
  (`tutorialAudioMap.ts`), e a Expo já avisa que será removido no futuro em
  favor de `expo-audio`/`expo-video`.
- **Sugestão:** migrar quando houver uma janela de manutenção — não é urgente,
  mas vai quebrar em alguma versão futura do Expo SDK.

---

## 🌐 Escopo de i18n ainda não coberto (não são bugs, é continuação do trabalho)

- `OBJECTIVE_LABELS` e `ACTIVITY_LABELS` (`utils/dietCalculations.ts`) — usados
  em várias telas, ainda 100% em português.
- Nomes dos planos vindos do banco (`Iniciante`, `Avançado`, `Escalando`) —
  dado dinâmico, não string de código; precisa de estratégia própria (coluna
  extra ou tabela de tradução) se for traduzir.
- `components/dashboard/DashboardLayoutMobile.tsx` — versão mobile do
  dashboard, ainda não migrada (a web já está 100%).
