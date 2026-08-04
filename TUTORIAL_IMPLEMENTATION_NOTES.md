# Sistema de Tutorial Contextual - Implementação

## ✅ Componentes Implementados

### 1. Contexto Global (`contexts/TutorialContext.tsx`)
- Gerenciamento de estado do tutorial
- Persistência em `trainers.tutorial_enabled` e `trainers.tutorial_progress`
- Funções: `startTour`, `nextStep`, `prevStep`, `closeTour`, `toggleTutorialEnabled`

### 2. Roteiros (`components/tutorial/tutorialScripts.ts`)
- 5 telas com roteiros completos:
  - **login**: 3 passos (tela toda, email, senha)
  - **novo_cliente**: 6 passos (nome, email/telefone, dados pessoais, objetivo, observações)
  - **metas**: 4 passos (tela toda, aba atendimento, aba comercial, botão editar)
  - **nova_venda**: 5 passos (tipo venda, kit/produto, indicação, qtd/valor)
  - **avaliacao**: 6 passos (data/peso, medidas tronco, membros, dados avançados, auto-preencher)

### 3. Áudios (`assets/tutorial-audio/`)
- 24 arquivos MP3 gerados com edge-tts
- Voz: pt-BR-FranciscaNeural, rate=-5%
- Nomeação: `{screenId}_{passo}.mp3`

### 4. Componentes Visuais
- **TutorialOverlay.tsx**: Modal fullscreen com spotlight, balão, navegação e áudio
- **TutorialHelpButton.tsx**: Botão flutuante "?" canto inferior direito

### 5. Integrações Completas
✅ **app/login.tsx**: refs (email, senha), TutorialOverlay + TutorialHelpButton
✅ **app/(protected)/client-create.tsx**: refs (nome, email/telefone, dados pessoais, objetivo, observações)
✅ **components/business/MetasContent.tsx**: refs (aba_atendimento, aba_comercial, botao_editar_meta)
✅ **app/(protected)/trainer-profile.tsx**: Toggle "Assistente de Ajuda" com Switch
✅ **app/_layout.tsx**: TutorialProvider envolvendo o app

### 6. Integrações Pendentes (Manual)
⚠️ **components/business/VendasContent.tsx**: Adicionar refs + Tutorial (modal Nova Venda)
⚠️ **components/AssessmentFormModal.tsx**: Adicionar refs + Tutorial

## 📋 Roteiro de Teste

1. Abrir app em desenvolvimento: `npx expo start`
2. Fazer login (deve aparecer botão "?" no canto inferior direito)
3. Tocar no botão "?" → Tutorial deve iniciar no passo 0
4. Navegar pelos passos usando "Próximo" e "Anterior"
5. Verificar:
   - Spotlight destaca o elemento correto
   - Áudio reproduz automaticamente
   - Botão mudo funciona
   - Ao concluir, botão "?" desaparece daquela tela
6. Ir em Config (Perfil) → Desligar "Assistente de Ajuda"
7. Voltar ao Login → Botão "?" NÃO deve aparecer
8. Religar o Assistente → Botão volta, mas telas já concluídas não mostram mais

## 🔧 Para Completar as Integrações Pendentes

### VendasContent.tsx (Modal Nova Venda)
```typescript
// 1. Adicionar imports
import { useRef } from 'react';
import { TutorialHelpButton } from '../tutorial/TutorialHelpButton';
import { TutorialOverlay } from '../tutorial/TutorialOverlay';

// 2. Criar refs dentro do componente (modal)
const tipo_vendaRef = useRef(null);
const kit_produto_clienteRef = useRef(null);
const indicacaoRef = useRef(null);
const qtd_valorRef = useRef(null);

// 3. Adicionar refs nos elementos correspondentes
<View ref={tipo_vendaRef}>...</View>
<View ref={kit_produto_clienteRef}>...</View>
<View ref={indicacaoRef}>...</View>
<View ref={qtd_valorRef}>...</View>

// 4. Antes do fechamento do Modal
<TutorialOverlay targetRefs={{
  tipo_venda: tipo_vendaRef,
  kit_produto_cliente: kit_produto_clienteRef,
  indicacao: indicacaoRef,
  qtd_valor: qtd_valorRef,
}} />
<TutorialHelpButton screenId="nova_venda" />
```

### AssessmentFormModal.tsx
```typescript
// 1. Adicionar imports
import { useState, useEffect, useRef } from 'react';
import { TutorialHelpButton } from './tutorial/TutorialHelpButton';
import { TutorialOverlay } from './tutorial/TutorialOverlay';

// 2. Criar refs
const data_pesoRef = useRef(null);
const medidas_troncoRef = useRef(null);
const medidas_membrosRef = useRef(null);
const dados_avancadosRef = useRef(null);
const auto_preencherRef = useRef(null);

// 3. Adicionar refs nos elementos
// 4. Antes do fechamento do Modal
<TutorialOverlay targetRefs={{...}} />
<TutorialHelpButton screenId="avaliacao" />
```

## 🗂️ Estrutura de Arquivos Criados

```
contexts/
  TutorialContext.tsx           (novo)

components/tutorial/
  tutorialScripts.ts            (novo)
  TutorialOverlay.tsx           (novo)
  TutorialHelpButton.tsx        (novo)

assets/tutorial-audio/
  login_0.mp3 ... login_2.mp3   (24 arquivos no total)
  novo_cliente_0.mp3 ... novo_cliente_5.mp3
  metas_0.mp3 ... metas_3.mp3
  nova_venda_0.mp3 ... nova_venda_4.mp3
  avaliacao_0.mp3 ... avaliacao_5.mp3

Modificados:
  app/_layout.tsx               (+ TutorialProvider)
  app/login.tsx                 (+ Tutorial)
  app/(protected)/client-create.tsx (+ Tutorial)
  app/(protected)/trainer-profile.tsx (+ Toggle)
  components/business/MetasContent.tsx (+ Tutorial)
```

## 🎯 Próximos Passos

1. ✅ Testar tutorial em Login e Novo Cliente
2. ⚠️ Completar integrações em VendasContent e AssessmentFormModal
3. 📱 Testar em mobile (iOS/Android)
4. 🌐 Testar em web
5. 🔍 Ajustar posicionamento do spotlight se necessário
6. 🎨 Revisar UX e feedback visual
