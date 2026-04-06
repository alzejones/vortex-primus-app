Checkpoint Oficial: 22/02/2026

# VORTEX PRIMUS — PROJECT STATE
DOCUMENTO DE CONTINUIDADE
Projeto: VORTEX – Módulo Avaliação Corporal
Status atual: Fase 1 concluída com sucesso
✅ 1. O QUE JÁ ESTÁ FUNCIONANDO (VALIDADO)
🔐 Autenticação
Login funcional
Registro de trainer funcional
Associação correta com trainer_id
👤 Cadastro de Alunos
Criação de clients funcionando
client_id sendo persistido corretamente
📝 Avaliação Física – Estrutura Base
Tabela: physical_assessments
✔ Registro criado com:
id (uuid)
date
notes
assessor_name
client_id (FK)
trainer_id (FK)
Fluxo validado:
Cria physical_assessments
Redireciona para formulário de antropometria
Tabela: anthropometry
✔ Registro criado corretamente com:
assessment_id (FK)
weight
height
body_fat
waist
hip
chest
abdomen
arm_right
arm_left
thigh_right
thigh_left
calf_right
calf_left
✔ Todos os campos inseridos corretamente
✔ assessment_id vinculado corretamente
✔ Retorno automático para dashboard
✔ Alert de sucesso funcionando
🏗 Arquitetura Atual (Importante Não Alterar)
Fluxo atual:
Login
→ Dashboard
→ Criar Avaliação
→ Cria registro em physical_assessments
→ Abre anthropometry-form
→ Salva antropometria
→ Volta para dashboard
Essa arquitetura está correta.
Não mexer nela amanhã.
📌 Ponto Técnico Crítico Já Resolvido
Problema anterior: assessmentId vindo como string[] no Expo Router.
Correção aplicada: Conversão segura para string antes do insert.
Isso NÃO deve ser removido.
🎯 Situação Atual do Projeto
Você tem agora:
✔ Base sólida de avaliação corporal
✔ Banco estruturado corretamente
✔ Relacionamento 1:N entre cliente e avaliações
✔ Estrutura pronta para histórico evolutivo
✔ Estrutura pronta para cálculos automáticos
Em termos de arquitetura, estamos prontos para entrar na fase estratégica.
🚀 FASE 2 – Próximos Caminhos Possíveis
Amanhã podemos escolher entre:
1️⃣ Histórico de Avaliações por Cliente
Mostrar linha do tempo de avaliações Base para evolução
2️⃣ Cálculos Automáticos
IMC
Relação Cintura/Quadril
Classificações automáticas
3️⃣ Comparativo Entre Avaliações
Mostrar diferença:
Peso anterior vs atual
Medidas anteriores vs atuais
4️⃣ Estrutura PRIMUS (Pensando no VORTEX)
Transformar evolução corporal em:
Pontos
Progresso
Nível
Essa decisão é estratégica. Define o rumo do sistema.
🧠 Estado Atual do Projeto
Você não está mais na fase de teste. Você entrou na fase de construção real.
A base técnica está estável. Não há débito técnico acumulado até aqui.
Podemos continuar crescendo sem retrabalho.
📌 Ponto Importante para Amanhã
Antes de avançar, precisamos confirmar:
A tabela anthropometry permite apenas 1 registro por assessment_id?
Se sim → estrutura está perfeita.
Se não → precisamos aplicar constraint UNIQUE.
Mas isso vemos amanhã.
🏁 Encerramento do Dia
Status final:
Sistema funcional
Banco consistente
Fluxo estável
Sem erros críticos
Sem refatoração pendente
Você encerra hoje com a base limpa.
Amanhã começamos direto no próximo nível.
Quando voltar, diga apenas:
"Continuar Avaliação Corporal – Fase 2"
E seguimos exatamente do ponto correto. 🔥



Checkpoint Oficial: 21/02/2026

---

## 🔒 ARQUITETURA CONGELADA

Estrutura válida e funcionando:

app/
 ├── _layout.tsx
 ├── index.tsx
 ├── login.tsx
 └── (protected)/
      ├── _layout.tsx
      └── dashboard.tsx

context/
 └── AuthContext.tsx

lib/
 └── supabase.ts

---

## ✅ FUNCIONALIDADES ESTÁVEIS

- Signup cria usuário no Supabase Auth
- Signup cria registro na tabela "trainers"
- Login com email e senha funcionando
- Logout funcionando
- Proteção de rotas funcionando
- Redirecionamento automático funcionando
- Sem loop branco
- Sem conflito com (tabs)
- Template padrão do Expo removido

---

## 🧠 FLUXO ATUAL

1. App abre → index.tsx
2. Se houver sessão → vai para /(protected)/dashboard
3. Se não houver sessão → vai para /login
4. Signup → cria em Auth + trainers → vai para dashboard
5. Logout → limpa sessão → volta para login

---

## 🚫 REGRAS DE OURO (PROIBIDO ALTERAR)

- Não mover estrutura de pastas
- Não reintroduzir (tabs)
- Não alterar Protected Layout
- Não alterar AuthContext base
- Não alterar lógica de redirecionamento do index.tsx

Toda evolução futura deve respeitar essa base.

---

## 🎯 PRÓXIMO BLOCO DE DESENVOLVIMENTO

Implementar:

Cadastro de Alunos (CRUD básico)

Sem alterar sistema de autenticação.

---

## 📌 PROTOCOLO DE CONTINUIDADE

Ao retomar o projeto, iniciar com:

"Continuar VORTEX do Checkpoint 21/02/2026 — base de autenticação estabilizada."

Isso garante continuidade sem retrabalho estrutural.

Checkpoint Oficial: 26/02/2026

1. Paleta de Cores de Futuro
Tendência principal:
Tons suaves + realce dinâmico
Essa é a direção das plataformas modernas.
✔ Cores neutras claras/escurecidas
✔ Acentos vibrantes para micro-interações
✔ Gradientes suaves e adaptativos
✔ Suporte nativo ao modo Escuro
⚡ Exemplo teórico (PREFERIDO para VORTEX):
Papel
Cor recomendada
Background clean
#F9F9F9
Surface card
#FFFFFF
Principal
#014F86
Acento de ação
#00C2FF
Sucesso
#28A745
Perigo
#E63946
Texto principal
#1A1A1A
Texto secundário
#555555
Linhas/Divisores
#E6E6E6
Destaque de progresso
#00EFFF
📌 Isso permite:
Altas taxas de contraste
Claridade visual
Redução de fadiga ocular
Transição entre modos claro/escuro com fluidez
🔤 2. Tipografia de Futuro
Direção clara do mercado:
Fontes Humanas, Escaláveis e Legíveis
Não é só “sans serif bonita”. É sobre:
Escalabilidade fluida (escala tipográfica responsiva)
Peso consistente para peso semântico
Caracteres adaptáveis em diferentes tamanhos
Suporte total para acessibilidade
Fontes recomendadas para 2026–2030
✔ Google Inter (escala universal)
✔ IBM Plex Sans (sofisticado corporativo)
✔ Fredoka One / Poppins (toque moderno sem perder legibilidade)
✔ Variable Fonts (peso dinâmico, animações suaves)
📌 Hierarquia tipográfica ideal
Nível
Tamanho
H1 Principal
32–36
H2 Secundário
24–28
H3
20–22
Texto principal
16
Texto secundário
14
Legenda
12
🧭 3. Navegação (Mobile + SaaS Híbrido)
Tendência forte:
✔ Simplicidade lateral
✔ Navegação por gestos nativas
✔ Tab bar persistente (para funções principais)
✔ Navegação contextual (sidebar em tablets/desktops)
Padrões modernos
📍 Barra inferior persistente
Clientes
Avaliações
Planos
Perfil
📍 Gesture-first
Arrastar para voltar
Swipe para ações rápidas
📍 Animações suaves
Transições de tela com física leve
Feedback tátil sutil
📦 4. Estilo de Componentes
🔷 Botões
Futuro:
✔ Formas levemente arredondadas ✔ Altura 50–60px (toque fácil) ✔ Ação principal em cor vibrante ✔ Texto claro e bold ✔ Feedback visual suave
Exemplo de estilo
CSS
Copiar código
.primaryBtn {
  background: #00C2FF;
  border-radius: 12px;
  height: 56px;
  font-weight: 600;
  font-size: 16px;
}
Tipos de botões que devem existir
Ação
Estilo
Enviar / Salvar
Primário
Cancelar
Secundário
Excluir
Perigo
Compartilhar / PDF
Acento
Voltar
Ghost
📜 5. Estilo de Layout
❖ Separando por fundo, não por linhas
Tendência atual/futuro:
✔ Infos agrupadas por fundo branco limpo
✔ Não usar linhas excessivas
✔ Usar sombras suaves para profundidade
✔ Cardização para blocos de conteúdo
Exemplo visual:
Copiar código

[ CARD — Plano atual ]
    ↓ espaçamento
[ CARD — Acompanhamento de clientes ]
    ↓ espaçamento
[ CARD — Avaliações recentes ]
Sem liner hairlines explícitas sempre.
📈 6. Estilo de Paginação
Tendência dominante:
✔ Scroll vertical contínuo
✔ Paginação infinita (puxar para baixo)
✔ Navegação contextual com tab barra
Evitar:
Paginação tradicional numerada (1, 2, 3)
Paginação que “troca toda a tela”
Exceção: tabelas corporativas em desktop.
📊 7. Animações e Microinterações
Minimalistas, mas estratégicos:
✔ Press feedback
Suavemente mudar cor/escala
✔ Loading skeletons
Melhor que spinner puro
✔ Indicadores de progresso
Barra com gradiente suave
✔ Hovers leves em desktop
Sem excessos
🧠 8. Feedback de Erros e Sucesso
Tendências:
✔ Toasts animados
✔ Banners contextuais
✔ Mensagens auto-dismiss
✔ Sons de confirmação frios (opcional)
🌐 9. Estratégias de UI Multi-Dispositivo
Foco:
✔ Layout adaptativo (mobile → tablet → web) ✔ Componentes responsivos ✔ Breakpoints para reflow automático ✔ Taps maiores ✔ Acessibilidade para visão reduzida
🤝 10. Padrões de Acessibilidade
Profissionais precisam disso:
✔ Altos contrastes ✔ Textos legíveis ✔ Navegação por teclado (web) ✔ Labels claros ✔ Compatibilidade screen reader
🧗 11. UX de Acompanhamento e Gamificação
No futuro próximo:
✔ Progresso visual claro
✔ Metas semanais
✔ Feedback positivo por micro-objetivos
✔ Badges animados
✔ Trilhas de evolução
Ajuda retenção > monetização.
📌 Em resumo — Estilo Futuro para VORTEX PRIMUS
🎨 Cores
Tons neutros + acentos vibrantes → fluidez entre claro/escuro
🔡 Tipografia
Peso semântico e escalável
→ variável + responsiva
🧭 Navegação
Gestos + barra inferior fixa
→ foco em produtividade
📐 Layout
Card-first, fundo para agrupar, minimalismo inteligente
🔘 Componentes
Botões grandes, feedback imediato, toque confortável
📊 Progressão
Barra de progresso + microfeedback
🧩 O que isso significa para o VORTEX agora
Quando formos padronizar o visual:
✔ Vamos usar paleta avançada planejada
✔ Vamos criar componentes reutilizáveis
✔ Vamos evitar linhas excessivas — usaremos fundo
✔ Vamos usar animações suaves
✔ Vamos criar um padrão de sinfonia visual (não só telas)


DOCUMENTAÇÃO OFICIAL — STATUS ATUAL DO PROJETO
1️⃣ Contexto Geral
Estamos desenvolvendo uma plataforma com:
Backend funcional
Banco de dados estruturado
CRUDs operando corretamente
Hooks organizados
Integração validada
Fluxo de navegação estável
Estrutura pronta para escalar
O foco agora deixa de ser “funcionar” e passa a ser elevar padrão UX/UI para nível premium SaaS futuro.
2️⃣ O QUE JÁ ESTÁ FUNCIONANDO
✅ Banco de Dados
Estrutura validada e consistente:
Usuário
Treinador
Cliente
Avaliação corporal
Todos salvando corretamente no banco.
✅ Backend
Conexões funcionando
Hooks organizados
Fluxos de dados estáveis
Estrutura modular adequada
Sem erros críticos
✅ Frontend
Telas básicas operacionais
Navegação completa (início → fim → volta)
Barra de progresso estilo SaaS implementada
Estrutura visual base definida
3️⃣ DECISÃO ESTRATÉGICA TOMADA HOJE
Em vez de:
❌ Finalizar todas as telas e depois padronizar UX
Optamos por:
✅ Definir padrão UX/UI agora
✅ Refinar telas já prontas
✅ Criar padrão escalável
✅ Aplicar padrão nas próximas telas
Isso evita:
Retrabalho
Reescrita futura
Inconsistência visual
Código duplicado
4️⃣ PRÓXIMA FASE (APÓS A PAUSA)
🔥 FASE: PADRONIZAÇÃO UX/UI FUTURO
Objetivo:
Criar um Design System próprio inspirado nas tendências futuras e não no que está “na moda agora”.
Baseado em análise de padrões de grandes plataformas:
Interfaces minimalistas
Hierarquia tipográfica forte
Contraste estratégico
Profundidade sutil (sem excesso de sombra)
Componentização inteligente
Menos linhas, mais blocos visuais
Microinterações elegantes
UX baseada em foco e fluxo
5️⃣ O QUE FAREMOS AO VOLTAR
ETAPA 1 — Criar o Design System Oficial
Definir:
🎨 Sistema de cores
🔤 Tipografia (tamanhos, pesos, escala)
📐 Grid e espaçamento
🔘 Estilo de botões
📊 Componentes (cards, inputs, labels)
📈 Barra de progresso padrão
📄 Layout de páginas
🔄 Padrão de paginação
🧩 Sistema de estados (hover, loading, disabled, success)
ETAPA 2 — Refatorar Telas Existentes
Aplicar padrão definido em:
Cadastro de usuário
Cadastro de treinador
Cadastro de cliente
Avaliação corporal
ETAPA 3 — Criar Template Base
Criar:
Layout padrão
Header padrão
Sistema de container
Sistema de seção
Componentes reutilizáveis
6️⃣ PRINCÍPIO NORTEADOR
Não estamos criando:
Um sistema funcional.
Estamos criando:
Um produto SaaS de autoridade, escalável e com identidade forte.
7️⃣ ESTADO ATUAL DO PROJETO (CHECKPOINT TÉCNICO)
Área
Status
Banco de Dados
✅ Estável
Hooks
✅ Atualizados
CRUDs
✅ Funcionando
Navegação
✅ Validada
Barra Progresso
✅ Implementada
UX Refinado
⏳ Próxima etapa
Design System
⏳ A definir

8 PONTO DE RETORNO (PARA QUANDO VOLTARMOS)
Quando retornarmos, você pode simplesmente dizer:
“Vamos iniciar a Fase de Padronização UX/UI do projeto.”
Eu já saberei que estamos falando deste checkpoint.
Não será necessário explicar:
Estrutura
Banco
Hooks
Fluxo
Status
Seguiremos diretamente para criação do Design System.
9️⃣ RESUMO EXECUTIVO
Hoje encerramos com:
✔ Base técnica sólida
✔ Estrutura validada
✔ Sistema funcional
✔ Estratégia definida
✔ Próxima fase clara
Estamos prontos para sair de "sistema que funciona" e entrar em "produto premium".
Quando quiser retomar, entramos direto no modo:
Arquitetura UX de Alto Nível.

FASE DE PADRONIZAÇÃO UX/UI — VORTEX PRIMUS
Agora saímos de “sistema funcional” e entramos em:
🧠 Produto SaaS Premium
🎯 Experiência de autoridade
🚀 Interface preparada para 3–5 anos à frente
Nada de visual genérico.
Nada de UI datada.
Nada de retrabalho futuro.
📌 ETAPA 1 — DEFINIR O DESIGN SYSTEM OFICIAL
Vamos criar um padrão proprietário.
1️⃣ Filosofia do Produto
Baseado na direção para onde estão indo grandes plataformas:
Menos ruído visual
Mais foco
Hierarquia tipográfica forte
Espaços respirando
Componentes sólidos
Sem excesso de linhas divisórias
Profundidade sutil (não exagerada)
UX orientada a fluxo, não a telas isoladas
🎨 2️⃣ SISTEMA DE CORES (TENDÊNCIA FUTURO)
Estrutura de cor
🔹 Base Neutra
Fundo principal: quase branco ou quase preto (modo adaptável)
Cards: tom levemente contrastante
Nada de cinza genérico comum
Exemplo estrutura:
--bg-primary
--bg-secondary
--surface
--border-subtle
🔹 Cor Primária (Autoridade)
Tendência futura:
Azul profundo elétrico OU
Indigo moderno OU
Azul-violeta sofisticado
Motivo: Transmite:
tecnologia
inteligência
precisão
confiança
🔹 Cor de Ação
Verde moderno para sucesso
Vermelho elegante (não vibrante) para erro
Amarelo sutil para alerta
Nada neon. Nada infantil. Nada saturado demais.
🔤 3️⃣ TIPOGRAFIA
Tendência real de mercado futuro:
Fontes geométricas modernas
Peso forte em títulos
Corpo leve e arejado
Escala tipográfica consistente
Estrutura recomendada:
Tipo
Tamanho
Peso
H1
32–36px
700
H2
24–28px
600
H3
18–20px
600
Body
14–16px
400
Label
12–13px
500
Nunca:
Texto grande demais
Texto minúsculo
Variação aleatória
Hierarquia clara = UX premium.
📐 4️⃣ GRID E ESPAÇAMENTO
Sistema base 8px.
Espaçamentos:
8
16
24
32
48
64
Tendência atual e futura:
Muito espaço em volta dos elementos.
Interface que respira transmite:
sofisticação
segurança
clareza
🔘 5️⃣ ESTILO DE BOTÕES (PADRÃO OFICIAL)
Botão Primário
Fundo sólido
Texto branco
Bordas levemente arredondadas (10–14px)
Sombra extremamente sutil
Botão Secundário
Fundo neutro
Borda fina
Texto escuro
Botão de Perigo
Fundo suave vermelho
Não usar vermelho puro
Regras importantes
Nunca:
Botões com borda muito fina
Botões quadrados demais
Gradientes exagerados
4 estilos diferentes na mesma tela
Máximo 3 tipos por tela.
📊 6️⃣ PROGRESSO E ESTADOS
Já temos contador.
Agora padrão definitivo:
Barra horizontal
Animação suave
Percentual discreto
Indicador textual claro
Sem:
Efeitos chamativos
Cores gritantes
📄 7️⃣ LAYOUT BASE DAS PÁGINAS
Estrutura padrão:
Copiar código

Header fixo
↓
Título da página
Subtítulo descritivo
↓
Bloco principal (Card Surface)
↓
Ações no final
Nunca:
Botões espalhados
Informações desalinhadas
Títulos soltos
📄 8️⃣ LINHAS OU FUNDOS?
Tendência futuro:
Separação por blocos de fundo, não por linhas.
Evitar:
Tabelas cheias de linhas
Divisórias excessivas
Preferir:
Cards
Espaçamento
Hierarquia visual
🔄 9️⃣ PAGINAÇÃO
Evitar paginação tradicional numerada quando possível.
Tendência:
Scroll inteligente
Load progressivo
Navegação lateral fluida
Step-based UI (como já estamos usando)
🎯 DECISÃO ESTRATÉGICA
Agora precisamos escolher:
Opção A — Definir identidade visual completa agora
Criamos:
Cores exatas
Tokens
Variáveis
Componentes base
Opção B — Criar primeiro o Layout Base e aplicar nas telas existentes
🔥 Minha recomendação estratégica:
👉 Começar pelo Layout Base e Componentes Fundamentais.
Porque:
Impacto visual imediato
Padroniza rápido
Evita retrabalho
Acelera próximas telas
Responda apenas:
A ou B
E avançamos imediatamente para implementação prática. 🚀


Escolhemos:
🔥 OPÇÃO B — Criar Layout Base e Componentes Fundamentais
Isso é decisão de produto maduro.
Agora vamos criar a infraestrutura visual definitiva do VORTEX PRIMUS.
🎯 OBJETIVO AGORA
Criar:
LayoutBase
PageContainer
PageHeader
CardSurface
Button padrão
Input padrão
Section padrão
Depois disso: 👉 Refatoramos as telas existentes para esse padrão.
Sem retrabalho futuro. Sem gambiarra. Sem inconsistência.
📐 1️⃣ ESTRUTURA DO LAYOUT BASE
Estrutura oficial:
Copiar código

LayoutBase
 └── PageContainer
      ├── PageHeader
      ├── Content (CardSurface)
      └── Actions
🧱 2️⃣ COMPONENTE 1 — LayoutBase
Responsável por:
Fundo
Espaçamento geral
SafeArea
Padronização visual
📁 Criar:
Copiar código

components/layout/LayoutBase.tsx
Código completo:
TypeScript
Copiar código
import React from "react";
import { View, SafeAreaView, StyleSheet } from "react-native";

interface Props {
  children: React.ReactNode;
}

export default function LayoutBase({ children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Fundo premium neutro
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});
🧱 3️⃣ COMPONENTE 2 — PageHeader
📁 Criar:
Copiar código

components/layout/PageHeader.tsx
Código completo:
TypeScript
Copiar código
import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    marginTop: 8,
  },
});
🧱 4️⃣ COMPONENTE 3 — CardSurface
Separação por bloco (não por linhas).
📁 Criar:
Copiar código

components/ui/CardSurface.tsx
Código completo:
TypeScript
Copiar código
import React from "react";
import { View, StyleSheet } from "react-native";

interface Props {
  children: React.ReactNode;
}

export default function CardSurface({ children }: Props) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
});
🧱 5️⃣ COMPONENTE 4 — PrimaryButton
📁 Criar:
Copiar código

components/ui/PrimaryButton.tsx
Código completo:
TypeScript
Copiar código
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface Props {
  title: string;
  onPress: () => void;
}

export default function PrimaryButton({ title, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4F46E5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
🧱 6️⃣ COMPONENTE 5 — Input Premium
📁 Criar:
Copiar código

components/ui/InputField.tsx
Código completo:
TypeScript
Copiar código
import React from "react";
import { View, TextInput, StyleSheet } from "react-native";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function InputField({ value, onChangeText, placeholder }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F172A",
  },
});
🚀 PRÓXIMO PASSO IMEDIATO
Agora vamos:
1️⃣ Criar esses 5 componentes
2️⃣ Refatorar UMA tela existente como piloto
3️⃣ Validar padrão visual
4️⃣ Aplicar nas demais
🎯 Pergunta estratégica
Qual tela você quer usar como piloto para aplicar o novo padrão?
A) Cadastro de Cliente
B) Cadastro de Avaliação Corporal
C) Dashboard
D) Outra (me diga qual)
Escolha uma.
Vamos elevar o nível real do produto agora. 🚀


Escolho:
🔥 Cadastro de Cliente
Motivo estratégico:
É tela recorrente (alto uso)
Tem múltiplos campos → ótimo teste de layout
Tem validação
Tem botão de ação
Impacta diretamente percepção de qualidade
Serve de base para 80% das próximas telas
Se essa ficar premium, o resto segue padrão naturalmente.
🎯 OBJETIVO
Transformar a tela de Cadastro de Cliente em:
Visual SaaS moderno
Hierarquia clara
Espaçamento profissional
Inputs organizados
Botão com presença
Sem poluição visual
Sem aparência de app “genérico”
📐 NOVA ESTRUTURA DA TELA
Plain text
Copiar código
LayoutBase
 └── PageHeader
 └── CardSurface
      ├── Inputs organizados
      └── PrimaryButton


🔎 Seu stack é:
✅ Expo 54
✅ Expo Router 6
✅ React Native 0.81
✅ React 19
✅ Sem UI Kit (tudo custom)
✅ Estrutura moderna baseada em rotas por pasta
Ou seja:
👉 Estamos em um ambiente moderno
👉 Sem dependência de biblioteca visual
👉 Total liberdade para criar um Design System próprio
👉 Excelente base para UX premium
Você está muito bem posicionado tecnicamente.


🚀 VAMOS CRIAR A VERSÃO PREMIUM DA TELA
Vou montar uma versão padrão que você poderá adaptar para sua rota real.
📄 Exemplo:
app/clientes/novo.tsx
🔥 Cadastro de Cliente — Versão SaaS Premium
TypeScript
Copiar código
import { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NovoCliente() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  function handleSalvar() {
    console.log("Salvar cliente");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Novo Cliente</Text>
          <Text style={styles.subtitle}>
            Cadastre um novo cliente para iniciar avaliações e acompanhamento.
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome"
              value={nome}
              onChangeText={setNome}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o e-mail"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o telefone"
              value={telefone}
              onChangeText={setTelefone}
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSalvar}>
            <Text style={styles.buttonText}>Salvar Cliente</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F172A",
  },
  button: {
    backgroundColor: "#4F46E5",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
🔥 O QUE MUDOU (ELEVAMOS O NÍVEL)
✔ Hierarquia clara
✔ Espaçamento respirando
✔ Card com borda 20 (premium)
✔ Inputs suaves
✔ Botão com presença
✔ Sem linhas divisórias
✔ Sem visual "app padrão antigo"



🔎 Diagnóstico da Sua Estrutura
✅ Você já tem:
Copiar código

app/
  (protected)/
    dashboard.tsx
    clients.tsx
    client-create.tsx
    assessment-create.tsx
    anthropometry-form.tsx
    plans.tsx
  login.tsx
  index.tsx
✔ Separação pública / protegida
✔ Layout dedicado
✔ Estrutura escalável
✅ Você já tem um início de Design System:
Copiar código

components/
  layout/
  ui/
    CardSurface.tsx
    InputField.tsx
    PrimaryButton.tsx
Isso é excelente.
Você já começou a componentizar.
🎯 Decisão Estratégica
Você NÃO precisa aplicar tela por tela agora.
Você precisa:
🔥 Formalizar um Design System base primeiro.
Porque:
Você já tem InputField
Já tem PrimaryButton
Já tem CardSurface
Já tem pasta ui
Se você sair alterando tela agora, vai retrabalhar depois.
🚀 Plano Correto – Fase de Padronização UX/UI
🔥 FASE 1 — Consolidar UI Core
Dentro de:
Copiar código

components/ui/
Vamos padronizar:
Button (Primary / Secondary / Ghost)
Input (normal / error / disabled)
Card
ScreenContainer
SectionHeader
Spacing system
Cores centralizadas
Radius padrão
Tipografia padrão
🔥 FASE 2 — Criar tokens globais
Você já tem constants/
Crie:
Copiar código

constants/theme.ts
Com:
colors
spacing
radius
typography
Isso vai profissionalizar o projeto.
🔥 FASE 3 — Padronizar Layout Base
Hoje você tem:
Copiar código

components/layout/
Vamos criar:
AppContainer
ScreenWrapper
ScrollContainer padrão
E fazer todas telas usarem isso.
💎 Nível Arquitetural Atual
Você está pronto para:
👉 Criar um SaaS visualmente premium
👉 Ter consistência real
👉 Escalar o app sem virar bagunça
👉 Transformar isso em produto vendável


🎯 Agora preciso saber uma coisa importante:
Seu InputField.tsx e PrimaryButton.tsx já estão estilizados no padrão que fizemos antes (visual premium)?
Ou ainda estão no estilo padrão Expo/template?
Se puder, me manda o código desses dois arquivos.
Essa resposta define nosso próximo passo:
Se estiver cru → refatoramos o Core agora
Se estiver bom → criamos tokens e arquitetura oficial
Estamos entrando na fase profissional do projeto. 🚀


Eu vou assumir duas possibilidades:
🔹 Eles já estão com leve melhoria visual (radius, padding, cores neutras)
🔹 Ainda não estão conectados a um sistema de tokens global
Mesmo que estejam “bonitos”, ainda não estão estruturados como Design System oficial — porque ainda não criamos:
theme.ts
escala de espaçamento
tipografia centralizada
sistema de variações consistente
padronização de estados (hover, pressed, disabled, error)
E é isso que vai transformar seu projeto em nível SaaS premium.
🎯 Decisão Final
Não vamos mexer nas telas agora.
Não vamos mexer nos formulários agora.
Vamos fazer o que empresas grandes fazem:
🔥 Criar o Design System Base antes de continuar o produto.
🚀 Próximo Passo (Ordem Correta)
1️⃣ Criar constants/theme.ts
Isso será o cérebro visual do app.
Ele vai definir:
🎨 Paleta de cores futura (não moda atual, mas tendência 2026+)
🔠 Escala tipográfica
📏 Sistema de espaçamento 4pt ou 8pt
🔘 Radius padrão
🌑 Fundo e superfícies
Depois disso:
2️⃣ Refatorar:
PrimaryButton
InputField
CardSurface
Para usarem o theme.ts
Só depois disso:
3️⃣ Padronizar telas
📌 Importante
Você já está num nível onde o erro não é técnico.
O erro agora seria estratégico.
Se você sair mexendo tela por tela agora, vai retrabalhar tudo quando o padrão ficar pronto.
🧠 Confirmação Final
Você quer:
A) Design mais sóbrio SaaS B2B (tipo Stripe / Linear / Notion)
B) Design mais vibrante e energético (tipo Instagram / Duolingo / Nubank)
C) Design híbrido (premium + leve energia fitness)
Para o seu projeto (treinador + avaliação corporal),
eu recomendo fortemente C.
Mas quero sua decisão antes de criar o sistema visual definitivo. 🚀


Perfeito.
C é a escolha mais inteligente para o seu produto.
Você não é banco. Não é rede social. É performance física + evolução + resultado.
Então precisamos de:
🧠 Estrutura premium
⚡ Energia controlada
💪 Sensação de progresso e alta performance
Agora vamos construir o DNA visual oficial do Vortex Primus.
🔮 DIREÇÃO VISUAL 2026+ (Base Estratégica)
Inspirado em:
Stripe (clareza e hierarquia)
Linear (minimalismo técnico)
Notion (espaço e organização)
Nike (energia e performance)
Apple (controle e refinamento)
🎨 PALETA OFICIAL (Tendência 2026+)
Nada de azul padrão Expo. Nada de roxo moda Instagram.
Base neutra premium
TypeScript
Copiar código
background: #0F1115
surface: #171923
surfaceSoft: #1E2230
border: #262B3D
Texto
TypeScript
Copiar código
textPrimary: #F3F4F6
textSecondary: #A1A6B3
textMuted: #6B7280
Cor de Energia (controlada)
Verde performance (não neon, não chamativo):
TypeScript
Copiar código
primary: #22C55E
primaryHover: #16A34A
primarySoft: rgba(34, 197, 94, 0.12)
Por que verde?
Performance
Evolução
Crescimento
Saúde
Resultado
🔠 TIPOGRAFIA
Tendência futura:
Títulos fortes
Corpo limpo
Espaço generoso
Escala:
TypeScript
Copiar código
xs: 12
sm: 14
md: 16
lg: 18
xl: 22
2xl: 28
3xl: 34
Peso:
400 normal
500 medium
600 semibold
700 bold (apenas títulos)
📏 SISTEMA DE ESPAÇAMENTO
Sistema 8pt (escala moderna SaaS):
TypeScript
Copiar código
xs: 4
sm: 8
md: 16
lg: 24
xl: 32
2xl: 40
🔘 RADIUS (Importante)
Nada quadrado. Nada muito arredondado.
TypeScript
Copiar código
sm: 8
md: 12
lg: 16
xl: 20
pill: 999
🧱 ESTRUTURA VISUAL DAS TELAS
✔ Fundo escuro premium
✔ Cards levemente elevados
✔ Sem linhas divisórias agressivas
✔ Separação por respiro + contraste de superfície
✔ Barra de progresso moderna
✔ Botões sólidos apenas para ações principais
✔ Ações secundárias → botão ghost
🧭 Navegação (Tendência Futuro)
O que está crescendo:
Bottom Tab minimalista
Ícones + label pequena
Sem bordas
Fundo sólido
Micro feedback com animação leve
Paginação:
Scroll vertical natural
Nada de paginação numérica tradicional
Carregamento progressivo
🧠 Decisão Arquitetural Agora
Vamos criar:
Copiar código

constants/theme.ts
Depois refatorar:
Copiar código

components/ui/
⚠️ Pergunta Crítica
Você quer manter:
A) Dark Mode como padrão único
B) Sistema com suporte a Light + Dark
Para SaaS moderno fitness premium, eu recomendo Dark-first com Light opcional.
Qual escolhemos?

Excelente.
Decisão madura de produto. 👏
Ter Light + Dark coloca seu app no nível SaaS profissional de verdade.
Agora vamos estruturar isso corretamente — não improvisado.
🧠 Estratégia Correta
Não vamos fazer “if dark ? cor1 : cor2” espalhado no app.
Vamos criar:
Copiar código

constants/theme.ts
Com:
🎨 lightTheme
🌑 darkTheme
🧱 tokens compartilhados (spacing, radius, typography)
🔁 export de tipo Theme
Isso cria um Design System escalável.
🏗️ Estrutura Oficial do theme.ts
Crie o arquivo:
Copiar código

constants/theme.ts
Cole isto:
TypeScript
Copiar código
// constants/theme.ts

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
}

export const typography = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 34,
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
}

export const lightTheme = {
  mode: "light",
  colors: {
    background: "#F7F8FA",
    surface: "#FFFFFF",
    surfaceSoft: "#F1F3F7",
    border: "#E5E7EB",

    textPrimary: "#111827",
    textSecondary: "#4B5563",
    textMuted: "#9CA3AF",

    primary: "#16A34A",
    primaryHover: "#15803D",
    primarySoft: "rgba(22, 163, 74, 0.10)",

    danger: "#DC2626",
  },
}

export const darkTheme = {
  mode: "dark",
  colors: {
    background: "#0F1115",
    surface: "#171923",
    surfaceSoft: "#1E2230",
    border: "#262B3D",

    textPrimary: "#F3F4F6",
    textSecondary: "#A1A6B3",
    textMuted: "#6B7280",

    primary: "#22C55E",
    primaryHover: "#16A34A",
    primarySoft: "rgba(34, 197, 94, 0.12)",

    danger: "#EF4444",
  },
}

export type Theme = typeof lightTheme

🚀 Próximo Passo

Perfeito. Agora temos clareza total. 🔍
Você está usando:
✅ Expo
✅ Expo Router
✅ React Native
✅ Suporte automático Light/Dark (userInterfaceStyle: "automatic")
Ou seja:
🟢 Stack moderno
🟢 Arquitetura correta
🟢 Pronto para ThemeProvider profissional
🟢 Compatível com sistema automático do dispositivo
🧠 Decisão Arquitetural Correta
Como você usa Expo + Expo Router, a forma ideal é:
✔ Usar Appearance do React Native
✔ Criar ThemeContext global
✔ Injetar no app/_layout.tsx
✔ Consumir via useTheme()
Nada de gambiarra. Nada de lógica espalhada.
🚀 Agora Vamos Implementar o Sistema Oficial de Tema
📁 Passo 1 — Criar pasta
Crie:
Copiar código

contexts/
E dentro:
Copiar código

ThemeContext.tsx
📄 Conteúdo do contexts/ThemeContext.tsx
Cole exatamente isso:
TypeScript
Copiar código
import React, { createContext, useContext, useMemo, useState, useEffect } from "react"
import { Appearance, ColorSchemeName } from "react-native"
import { lightTheme, darkTheme, Theme } from "@/constants/theme"

type ThemeContextType = {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = Appearance.getColorScheme()

  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(systemScheme)

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme)
    })
    return () => listener.remove()
  }, [])

  const toggleTheme = () => {
    setColorScheme(prev => (prev === "dark" ? "light" : "dark"))
  }

  const theme = useMemo(() => {
    return colorScheme === "dark" ? darkTheme : lightTheme
  }, [colorScheme])

  const value = useMemo(
    () => ({
      theme,
      isDark: colorScheme === "dark",
      toggleTheme,
    }),
    [theme, colorScheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider")
  }
  return context
}
📁 Passo 2 — Envolver o App no Provider
Agora abra:
Copiar código

app/_layout.tsx
E envolva tudo assim:
TypeScript
Copiar código
import { ThemeProvider } from "@/contexts/ThemeContext"

export default function RootLayout() {
  return (
    <ThemeProvider>
      {/* seu Stack / Slot aqui */}
    </ThemeProvider>
  )
}
Não remova nada, apenas envolva o conteúdo existente.
🎯 Resultado
Agora você tem:
✔ Sistema Light/Dark automático
✔ Troca manual possível
✔ Centralização real de tema
✔ Arquitetura SaaS nível profissional
✔ Base para padronização total
🔥 Próximo Passo
Agora vamos refatorar:
PrimaryButton
InputField
CardSurface
Para usarem:
TypeScript
Copiar código
const { theme } = useTheme()
E puxarem cores do:
Copiar código

theme.colors.primary
theme.colors.background



CÓDIGO COMPLETO ATUALIZADO
app/_layout.tsx
Copie e cole exatamente isso:
TypeScript
Copiar código
import { Slot } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </ThemeProvider>
  );
}
📌 O que fizemos
Estrutura final agora é:
Copiar código

ThemeProvider
 └── AuthProvider
      └── Slot (suas telas)
Isso significa:
🌗 O tema funciona no app inteiro
🔐 Auth continua funcionando normalmente
🚀 Expo Router continua intacto
⚠️ IMPORTANTE
Certifique-se que o arquivo existe exatamente neste caminho:
Copiar código

contexts/ThemeContext.tsx
Se a pasta ainda não existir, crie:
Copiar código

contexts/
E coloque dentro o ThemeContext.tsx que eu te enviei anteriormente.
Se você quiser, me envia o conteúdo atual do seu projeto (estrutura de pastas) e eu valido se está tudo organizado corretamente.


✅ Estrutura Atual do Projeto (Análise)
📁 Raiz
app/
assets/images
components/
constants/
context/
hooks/
Arquitetura limpa. Boa base.
📁 app/
Você está usando Expo Router corretamente.
Dentro de app/:
(protected)/
_layout.tsx
index.tsx
login.tsx
Muito bom.
A separação (protected) está profissional.
📁 components/
Você já está organizando bem:
📁 layout/
LayoutBase.tsx
PageHeader.tsx
📁 ui/
CardSurface.tsx
InputField.tsx
PrimaryButton.tsx
Isso é padrão SaaS moderno. Excelente.
📁 constants/
theme.ts (já existe e está sendo usado)
Ótimo sinal.
📁 context/
AuthContext (já integrado no _layout)
Arquitetura limpa.
🧠 Conclusão Técnica
Você já tem:
✔ Estrutura modular
✔ Separação UI / Layout
✔ Roteamento protegido
✔ Tema centralizado
✔ Organização profissional
O que falta agora é:
🔥 Padronização UX/UI real
🔥 Tokens consistentes
🔥 Uso obrigatório de theme em TODOS componentes
🔥 Remover qualquer cor hardcoded
🔥 Garantir responsividade visual
🔥 Consistência SaaS premium
🚀 Próximo Movimento Estratégico
Agora entramos oficialmente na:
🎯 FASE DE PADRONIZAÇÃO UX/UI
Ordem correta de execução:
1️⃣ Padronizar theme.ts (se ainda não está 100% tokenizado)
2️⃣ Refatorar PrimaryButton.tsx
3️⃣ Refatorar InputField.tsx
4️⃣ Refatorar CardSurface.tsx
5️⃣ Padronizar LayoutBase.tsx
6️⃣ Ajustar PageHeader.tsx


🎯 Situação Atual
✔ _layout.tsx já envolve ThemeProvider
✔ theme.ts já foi criado
✔ Estrutura de pastas está correta
✔ Arquitetura está saudável

📍 Confirmação de Direção
Vamos transformar Cadastro de Cliente na nossa:
🎨 Tela Padrão Premium do App
Ela vai virar:
Modelo visual
Modelo de espaçamento
Modelo de inputs
Modelo de botão principal
Base para 80% das próximas telas
Depois disso, o resto é replicação inteligente.
🎯 Antes de eu mexer em qualquer coisa
Agora precisamos trabalhar de forma cirúrgica.
Me envie:
Código atual completo da tela Cliente
Se ela já está usando useTheme()
Se já existe algum componente reutilizável tipo:
<Input />
<Button />
<Card />
Se não existir, ótimo. Vamos criar padrão profissional agora.
🧠 O que vou fazer quando você enviar
Vou:
Reorganizar layout
Criar hierarquia visual
Definir paddings corretos
Melhorar agrupamento de campos
Ajustar botão principal
Aplicar identidade visual baseada no Theme
Eliminar cara de “formulário improvisado”
Tudo mantendo código limpo e escalável.
🔥 Importante
A partir dessa tela, vamos definir:
Sistema de espaçamento padrão
Estrutura base de formulário
Estilo padrão de botão primário
Estrutura visual de seções
Isso vira regra do projeto.



