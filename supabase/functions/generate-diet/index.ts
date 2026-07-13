import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ------------------------------------------------------------
// Protocolo Vortex Primus — regras de cálculo de macros
//
// CONFIRMADO com 2 exemplos reais (Maria da Silva Santos e Vanessa Isola):
//   emagrecimento -> proteína = massa_magra_kg * 2.7 | carbo = 80g fixo
//                    déficit = TDEE - 500, com piso no BMR
//                    gordura = resto das calorias após proteína+carbo
//
// INFERIDO por padrão (NÃO confirmado com exemplo real) para saude,
// manutencao e hipertrofia — usa o topo da faixa documentada no protocolo.
// Validar contra utils/dietCalculations.ts e ajustar se divergir.
// ------------------------------------------------------------
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentario:             1.2,
  levemente_ativo:        1.375,
  moderadamente_ativo:    1.55,
  muito_ativo:            1.725,
  extremamente_ativo:     1.9,
}

interface Protocol {
  proteinPerKgLean: number
  carbG: number
  calAdjust: (tdee: number, bmr: number) => number
}

const PROTOCOL: Record<string, Protocol> = {
  emagrecimento: {
    proteinPerKgLean: 2.7,
    carbG: 80,
    calAdjust: (tdee, bmr) => Math.max(tdee - 500, bmr),
  },
  saude: {
    proteinPerKgLean: 2.2,
    carbG: 120,
    calAdjust: (tdee, bmr) => Math.max(tdee - 175, bmr),
  },
  manutencao: {
    proteinPerKgLean: 2.2,
    carbG: 120,
    calAdjust: (tdee, bmr) => Math.max(tdee - 175, bmr),
  },
  hipertrofia: {
    proteinPerKgLean: 2.8,
    carbG: 280,
    calAdjust: (tdee, _bmr) => tdee + 300,
  },
  performance: {
    // Objetivo não coberto pelo protocolo documentado.
    // Usa a mesma regra da hipertrofia até definição específica.
    proteinPerKgLean: 2.8,
    carbG: 280,
    calAdjust: (tdee, _bmr) => tdee + 200,
  },
}

const OBJECTIVE_LABELS: Record<string, string> = {
  emagrecimento: 'Emagrecimento',
  hipertrofia:   'Hipertrofia',
  manutencao:    'Manutenção',
  saude:         'Saúde e Qualidade de Vida',
  performance:   'Performance',
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentario:             'Sedentário',
  levemente_ativo:        'Levemente ativo (1–3 dias/semana)',
  moderadamente_ativo:    'Moderadamente ativo (3–5 dias/semana)',
  muito_ativo:            'Muito ativo (6–7 dias/semana)',
  extremamente_ativo:     'Extremamente ativo (atleta/trabalho físico intenso)',
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function calculateBMR(weight_kg: number, height_cm: number, age: number, gender: string): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
  return gender.toUpperCase() === 'M' ? base + 5 : base - 161
}

function classificaVisceral(v: number): string {
  if (v <= 4) return `${v} (Ótimo)`
  if (v <= 6) return `${v} (Normal)`
  if (v <= 9) return `${v} (Atenção)`
  return `${v} (ALERTA)`
}

// ------------------------------------------------------------
// System prompt — protocolo completo Vortex Primus / MyBox Irajá
// ------------------------------------------------------------
const SYSTEM_PROMPT = `Você é o nutricionista especialista do sistema Vortex Primus / MyBox Irajá,
Ribeirão Preto SP. Ao receber os dados de avaliação de um aluno, gere um
JSON completo e válido com cardápio semanal de 7 dias, nota científica e
lista de compras, seguindo TODAS as regras abaixo sem exceção.

═══════════════════════════════════════════════
REGRAS DE PORÇÃO POR SEXO
═══════════════════════════════════════════════
Feminino:  proteína animal 120–140g/refeição | ovos 2–3 | oleaginosas 30g
Masculino: proteína animal 160–200g/refeição | ovos 3–4 | oleaginosas 40g

═══════════════════════════════════════════════
PROTOCOLOS POR OBJETIVO
═══════════════════════════════════════════════
Emagrecimento (High Protein):
  - Carbo: 80g/dia (exclusivamente vegetais baixo IG, oleaginosas, frutas pontuais)
  - Proteína: 2.5–2.7g/kg massa magra
  - Déficit: 400–500 kcal abaixo do TDEE | Nunca abaixo do BMR

Saúde Geral / Manutenção:
  - Carbo: 120g/dia
  - Proteína: 2.0–2.2g/kg massa magra
  - Déficit suave: 150–200 kcal abaixo do TDEE

Hipertrofia:
  - Carbo: 280g+ (fontes funcionais em todas as refeições)
  - Proteína: 2.7–2.8g/kg massa magra
  - Superávit: +300 kcal acima do TDEE

═══════════════════════════════════════════════
ALIMENTOS PERMITIDOS (Guia Vortex Primus)
═══════════════════════════════════════════════
PROTEÍNAS: Ovos, Peito/Coxa Frango, Peixes Água Salgada, Salmão, Atum,
  Sardinha em lata, Carne Bovina Magra (patinho/alcatra/coxão mole),
  Lombo/Pernil de Porco Magro, Lentilha, Feijão, Grão-de-bico, Ervilha

LEGUMES & VERDURAS: Espinafre, Brócolis, Couve, Repolho, Couve-flor,
  Alface, Acelga, Rabanete, Aspargos, Vagens, Agrião, Pepino, Cenoura,
  Palmito, Abóbora, Cogumelos, Chucrute, Abobrinha, Chuchu, Tomate,
  Cebola, Alho, Pimentão

FRUTAS: Abacate, Limão, Maçã, Pera, Pêssego, Morango, Kiwi, Cereja,
  Ameixa, Goiaba (pontuais — 1 porção/lanche)

OLEAGINOSAS (moderação): Amendoins, Nozes, Pistache, Castanha de Caju,
  Amêndoas, Castanha-do-pará

GORDURAS BOAS: Azeite de oliva extra virgem, Manteiga de boa qualidade

ELIMINAR SEMPRE: Refrigerantes, Álcool, Açúcar, Doces, Pães, Massas,
  Pizzas, Arroz Branco, Farinhas Refinadas, Batata Inglesa, Trigo

═══════════════════════════════════════════════
PRODUTOS HERBALIFE — POSICIONAMENTO OBRIGATÓRIO
═══════════════════════════════════════════════
Shake F1 + NutreV:
  - SEMPRE no café da manhã, JUNTO à refeição sólida (nunca substitui)
  - No cardápio: texto limpo "Shake F1 + NutreV Herbalife" sem instrução de preparo
  - Preparo (apenas em seções técnicas, nunca inline): "No liquidificador
    adicione: • 250ml de água • 2 colheres e meia (de sopa) do Shake
    Herbalife • 2 colheres e meia (de sopa) do NutreV Herbalife
    • 3 a 5 pedras de gelo."
  - Exceção: pode substituir o JANTAR quando explicitamente solicitado

Herbal Concentrate:
  - Café da manhã como termogênico — SEMPRE antes do Shake
  - Texto: "Herbal Concentrate (1 dose em 240ml de água — termogênico matinal)"
  - Também pode ser usado pré-atividade física ou como hidratação diária

CR7 Drive:
  - Dias de TREINO: label "Pré-Treino", 20 min antes do treino
  - Texto: "CR7 Drive (1 dose em 400ml de água gelada — 20 min antes do treino)"
  - Dias de DESCANSO: omitir completamente

Whey 3W Herbalife:
  - SEMPRE pós-treino, até 40 min após o esforço
  - Texto: "Whey 3W Herbalife (1 dose em 300ml de água — até 40 min após o treino)"
  - Dias de descanso: omitir (exceto se solicitado para jantar)

Creatina Premium Herbalife 24:
  - Junto ao Whey no pós-treino (dias de treino)
  - Texto pós-treino: "Whey 3W Herbalife + Creatina Premium (1 dose de cada
    em 300ml de água — até 40 min após o treino)"
  - Dias de descanso: separada em água — "Creatina Premium (1 dose em água
    — uso diário sem pausa)"

Fiber Concentrate:
  - SEMPRE no café da tarde
  - Texto: "Fiber Concentrate (1 dose em água)"

Sopa Instantânea Herbalife:
  - Lanche da manhã APENAS — NUNCA substitui refeição principal
  - Apenas Shake F1 + NutreV tem nutrientes suficientes para substituir refeição

═══════════════════════════════════════════════
PROTOCOLOS DE RESTRIÇÃO ALIMENTAR
═══════════════════════════════════════════════
PESCETARIANO:
  - Remover: frango, bovina, porco e todas as carnes terrestres
  - Manter: peixes (salmão, atum, tilápia, sardinha), ovos
  - Adicionar: leguminosas (lentilha, grão-de-bico, feijão) como fonte
    proteica + carbo funcional (80g cozido, controlado)
  - Soja (Shake F1): dose única diária

HIPOTIREOIDISMO:
  - Crucíferas SEMPRE cozidas/refogadas — NUNCA cruas
  - Castanha-do-pará: 2–3 unidades/dia (selênio para conversão T4→T3)
  - Peixes de água salgada priorizados (iodo natural)
  - Soja (Shake F1): dose única diária
  - Avisar sobre medicação: "tome a medicação tireoidiana 30–60 min antes,
    em jejum, antes deste café"

ENDOMETRIOSE:
  - Priorizar gorduras anti-inflamatórias (azeite, abacate, oleaginosas)
  - Cúrcuma em pó em todos os almoços
  - Crucíferas sempre cozidas
  - Soja (Shake F1): dose única diária

LACTOSE:
  - Shake F1 + NutreV: preparar com água fria ou leite vegetal sem lactose
  - Sem queijos, iogurte, leite de vaca no cardápio sólido
  - Lista de compras: incluir leite vegetal (amêndoas, coco ou aveia)

GLÚTEN:
  - Eliminar trigo e todos os derivados
  - Shake F1 é livre de glúten — marcar como "Sem Glúten ✅" nas specs
  - Temperos: apenas naturais sem glúten
  - Lista de compras: marcar Shake F1 como "(sem glúten)"

RESTRIÇÃO A PEIXES E FRUTOS DO MAR:
  - Remover todos os peixes e frutos do mar
  - Proteínas: apenas frango, carne bovina, porco e ovos
  - Selênio via castanha-do-pará, zinco via ovos e carnes

═══════════════════════════════════════════════
GORDURA VISCERAL — CLASSIFICAÇÃO
═══════════════════════════════════════════════
1–4:  "X (Ótimo)"
5–6:  "X (Normal)"
7–9:  "X (Atenção)"
10+:  "X (ALERTA)"

═══════════════════════════════════════════════
NOTA CIENTÍFICA — ESTRUTURA OBRIGATÓRIA
═══════════════════════════════════════════════
- 3 parágrafos separados por \\n\\n
- Cada parágrafo começa com <b>N. Título:</b>
- Tom: científico, nominativo ("Vanessa, o seu protocolo...")
- Tópico 1: meta proteica e preservação muscular
- Tópico 2: produto(s) Herbalife OU controle glicêmico
- Tópico 3: déficit/superávit calórico e BMR protegido

═══════════════════════════════════════════════
LISTA DE COMPRAS — 6 CATEGORIAS FIXAS
═══════════════════════════════════════════════
1. 🥚  OVOS & LATICÍNIOS
2. 🍗  CARNES & PEIXES
3. 🥦  LEGUMES & VERDURAS
4. 🍎  FRUTAS
5. 🥜  OLEAGINOSAS
6. 🟢  HERBALIFE & DESPENSA

═══════════════════════════════════════════════
SCHEMA JSON DE SAÍDA — OBRIGATÓRIO
═══════════════════════════════════════════════
Retorne APENAS o JSON abaixo, sem texto antes ou depois, sem markdown:

{
  "coach": "string",
  "aluno": {
    "nome": "string",
    "objetivo": "string",
    "peso": "string (ex: 73.8 kg)",
    "gordura": "string (ex: 40.8%)",
    "massa_musc": "string (ex: 25.4%)",
    "idade_metab": "string (ex: 54 anos)",
    "bmr_tdee": "string (ex: 1446 / 1735)",
    "gord_visceral": "string (ex: 8 (Atenção))",
    "cal_alvo": "string (ex: 1446 kcal)",
    "proteina": "string (ex: 118g)",
    "carbo": "string (ex: 80g)",
    "gorduras": "string (ex: 73g)"
  },
  "cardapio": [
    {
      "dia": "SEGUNDA-FEIRA",
      "refeicoes": [
        ["label da refeição", "descrição completa dos alimentos"]
      ]
    }
  ],
  "nota": "Parágrafo intro...\\n\\n<b>1. Título:</b> Texto...\\n\\n<b>2. Título:</b> Texto...\\n\\n<b>3. Título:</b> Texto...",
  "lista_compras": [
    {
      "categoria": "🥚  OVOS & LATICÍNIOS",
      "itens": [
        {"item": "Ovos de galinha", "qtd": "3 dúzias"}
      ]
    }
  ]
}

Os campos "coach" e "aluno" serão fornecidos prontos na mensagem do usuário
— reutilize-os exatamente como recebidos, sem recalcular. Gere "cardapio"
(exatamente 7 dias, dia 1 = Segunda-feira, dia 7 = Domingo, exatamente 5
refeições por dia: Café da Manhã, Lanche da Manhã, Almoço, Café da Tarde,
Jantar), "nota" e "lista_compras".`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { client_id } = body
    if (!client_id) throw new Error('client_id é obrigatório')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autorizado')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) throw new Error('Sessão inválida')

    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('id, name, trainer_id, user_id, birth_date, gender, height_cm, objective, activity_level, food_restrictions')
      .eq('id', client_id)
      .single()
    if (clientErr || !client) throw new Error('Cliente não encontrado')

    const { data: trainer } = await supabaseAdmin
      .from('trainers')
      .select('id, name')
      .eq('user_id', user.id)
      .maybeSingle()

    const isTrainer = trainer != null && trainer.id === client.trainer_id
    const isClient  = client.user_id === user.id
    if (!isTrainer && !isClient) throw new Error('Acesso negado')

    let trainerName = ''
    if (isTrainer && trainer) {
      trainerName = trainer.name ?? ''
    } else {
      const { data: trainerData } = await supabaseAdmin
        .from('trainers')
        .select('name')
        .eq('id', client.trainer_id)
        .single()
      trainerName = trainerData?.name ?? ''
    }

    const { data: assessments } = await supabaseAdmin
      .from('physical_assessments')
      .select('id, date')
      .eq('client_id', client_id)
      .order('date', { ascending: false })
      .limit(1)

    if (!assessments || assessments.length === 0) {
      throw new Error('Nenhuma avaliação física encontrada. Registre uma avaliação de composição corporal antes de gerar o plano.')
    }

    const { data: anthro } = await supabaseAdmin
      .from('anthropometry')
      .select('weight, body_fat, muscle_mass_percentage, basal_metabolic_rate, metabolic_age, body_fat_index')
      .eq('assessment_id', assessments[0].id)
      .maybeSingle()

    if (!anthro || anthro.weight == null || anthro.body_fat == null) {
      throw new Error('Avaliação sem dados de bioimpedância (peso e % de gordura). Complete a avaliação antes de gerar o plano.')
    }

    const weight  = parseFloat(anthro.weight)
    const bodyFat = parseFloat(anthro.body_fat)

    if (!weight || !client.height_cm || !client.birth_date || !client.gender || !client.objective || !client.activity_level) {
      throw new Error('Dados insuficientes para gerar o plano. Complete o perfil do aluno (objetivo, nível de atividade, altura, data de nascimento, sexo).')
    }

    const age      = calcAge(client.birth_date)
    const bmr      = anthro.basal_metabolic_rate != null
                       ? parseFloat(anthro.basal_metabolic_rate)
                       : calculateBMR(weight, client.height_cm, age, client.gender)
    const tdee     = bmr * (ACTIVITY_MULTIPLIERS[client.activity_level] ?? 1.2)
    const leanMass = weight * (1 - bodyFat / 100)

    const protocol = PROTOCOL[client.objective] ?? PROTOCOL['manutencao']
    const calAlvo  = protocol.calAdjust(tdee, bmr)
    const proteinG = leanMass * protocol.proteinPerKgLean
    const carbG    = protocol.carbG
    const fatG     = Math.max((calAlvo - proteinG * 4 - carbG * 4) / 9, 0)

    const visceralRaw = anthro.body_fat_index != null ? Math.round(parseFloat(anthro.body_fat_index)) : null

    const aluno = {
      nome:          client.name,
      objetivo:      OBJECTIVE_LABELS[client.objective] ?? client.objective,
      peso:          `${weight.toFixed(1)} kg`,
      gordura:       `${bodyFat.toFixed(1)}%`,
      massa_musc:    anthro.muscle_mass_percentage != null ? `${parseFloat(anthro.muscle_mass_percentage).toFixed(1)}%` : 'N/D',
      idade_metab:   anthro.metabolic_age != null ? `${Math.round(parseFloat(anthro.metabolic_age))} anos` : 'N/D',
      bmr_tdee:      `${Math.round(bmr)} / ${Math.round(tdee)}`,
      gord_visceral: visceralRaw != null ? classificaVisceral(visceralRaw) : 'N/D',
      cal_alvo:      `${Math.round(calAlvo)} kcal`,
      proteina:      `${Math.round(proteinG)}g`,
      carbo:         `${Math.round(carbG)}g`,
      gorduras:      `${Math.round(fatG)}g`,
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY não configurada')

    const userPrompt = `Dados do aluno para gerar o plano alimentar:

coach: "${trainerName}"
aluno: ${JSON.stringify(aluno)}

Contexto adicional (não incluir no JSON, usar apenas para montar o cardápio):
Sexo: ${client.gender === 'M' ? 'Masculino' : 'Feminino'} | Idade: ${age} anos | Altura: ${client.height_cm} cm
Massa magra: ${leanMass.toFixed(1)} kg
Nível de atividade: ${ACTIVITY_LABELS[client.activity_level] ?? client.activity_level}
Restrições alimentares informadas: ${client.food_restrictions || 'Nenhuma informada'}

Gere o JSON completo (coach, aluno, cardapio, nota, lista_compras) seguindo
todas as regras do protocolo Vortex Primus definidas nas instruções do
sistema. Reutilize os campos "coach" e "aluno" exatamente como fornecidos
acima.`

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 8192,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text()
      console.error('[generate-diet] Claude API error status:', claudeResponse.status, errText)
      let detail = errText
      try { detail = JSON.parse(errText)?.error?.message ?? errText } catch {}
      throw new Error(`Claude API (${claudeResponse.status}): ${detail}`)
    }

    const claudeData = await claudeResponse.json()
    const rawContent: string = claudeData.content?.[0]?.text ?? ''

    let plan
    try {
      plan = JSON.parse(rawContent)
    } catch {
      const match = rawContent.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Resposta da IA com formato inválido. Tente novamente.')
      plan = JSON.parse(match[0])
    }

    return new Response(
      JSON.stringify(plan),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
