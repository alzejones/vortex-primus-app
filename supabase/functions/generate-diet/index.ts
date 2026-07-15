import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ------------------------------------------------------------
// Réplica exata de utils/dietCalculations.ts (confirmado via
// cat/sed direto no arquivo real do repo — não é dedução).
// ------------------------------------------------------------
type Objective = 'emagrecimento' | 'hipertrofia' | 'manutencao' | 'saude' | 'performance'
type ActivityLevel = 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso'

const PROTEIN_PER_KG_LBM: Record<Objective, number> = {
  emagrecimento: 2.7,
  hipertrofia:   2.8,
  manutencao:    2.2,
  saude:         2.0,
  performance:   2.6,
}

const CALORIE_ADJUSTMENT: Record<Objective, number> = {
  emagrecimento: -500,
  hipertrofia:   300,
  manutencao:    0,
  saude:         -200,
  performance:   200,
}

const CARB_CEILING_G: Record<Objective, number> = {
  emagrecimento: 80,
  saude:         120,
  manutencao:    180,
  hipertrofia:   280,
  performance:   300,
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentario:    1.2,
  leve:          1.375,
  moderado:      1.55,
  intenso:       1.725,
  muito_intenso: 1.9,
}

const OBJECTIVE_LABELS: Record<Objective, string> = {
  emagrecimento: 'Emagrecimento',
  hipertrofia:   'Hipertrofia',
  manutencao:    'Manutenção',
  saude:         'Saúde Geral',
  performance:   'Performance',
}

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario:    'Sedentário',
  leve:          'Leve (1-3x/semana)',
  moderado:      'Moderado (3-5x/semana)',
  intenso:       'Intenso (6-7x/semana)',
  muito_intenso: 'Muito Intenso (2x/dia)',
}

interface DietCalcResult {
  bmr: number
  tdee: number
  lean_mass: number
  macros: { calories: number; protein: number; carbs: number; fat: number }
}

function calculateDietPlan(p: {
  weight_kg: number; height_cm: number; age: number; gender: 'M' | 'F'
  body_fat_percent: number; activity: ActivityLevel; objective: Objective
  measured_bmr?: number
}): DietCalcResult {
  const { weight_kg, height_cm, age, gender, body_fat_percent, activity, objective, measured_bmr } = p

  let bmr: number
  if (measured_bmr && measured_bmr > 0) {
    bmr = measured_bmr
  } else if (gender === 'M') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activity] ?? 1.375
  const tdee = Math.max(bmr * multiplier, bmr)

  const rawTargetCalories = tdee + CALORIE_ADJUSTMENT[objective]
  const targetCalories = Math.max(rawTargetCalories, bmr)

  const fatPct = Math.min(Math.max(body_fat_percent, 0), 99)
  const lbm = weight_kg * (1 - fatPct / 100)

  let proteinG = Math.max(lbm * PROTEIN_PER_KG_LBM[objective], lbm * 1.6)

  const carbsG = Math.max(CARB_CEILING_G[objective], 30)

  const fatFloorG = weight_kg * 0.8
  const fatFromRemainder = (targetCalories - proteinG * 4 - carbsG * 4) / 9
  let fatG = Math.max(fatFromRemainder, fatFloorG)

  const totalCal = proteinG * 4 + carbsG * 4 + fatG * 9
  if (totalCal > targetCalories * 1.05) {
    const calForProtein = targetCalories - carbsG * 4 - fatFloorG * 9
    proteinG = Math.max(calForProtein / 4, lbm * 1.6)
    fatG = Math.max((targetCalories - proteinG * 4 - carbsG * 4) / 9, fatFloorG)
  }

  return {
    bmr:       Math.round(bmr),
    tdee:      Math.round(tdee),
    lean_mass: parseFloat(lbm.toFixed(1)),
    macros: {
      calories: Math.round(targetCalories),
      protein:  Math.round(proteinG),
      carbs:    Math.round(carbsG),
      fat:      Math.round(fatG),
    },
  }
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function classificaVisceral(v: number): string {
  if (v <= 4) return `${v} (Ótimo)`
  if (v <= 6) return `${v} (Normal)`
  if (v <= 9) return `${v} (Atenção)`
  return `${v} (ALERTA)`
}

// ------------------------------------------------------------
// Matriz de decisão de suplementação Herbalife (confirmada com
// Alzejones em 2026-07 — cortes numéricos validados em código
// real: client-assessments.tsx / tabela Omron / classificaVisceral).
// O objetivo cadastrado no perfil do aluno SEMPRE tem prioridade
// máxima. Nenhuma decisão aqui é deixada para a IA — o modelo
// apenas aplica o texto de posicionamento aos produtos já
// marcados como INCLUIR/modo definido.
// ------------------------------------------------------------
type UsoShake = 'substituto' | 'adicionado' | 'complemento' | 'nenhum'

function massaMuscularBaixa(percent: number, gender: 'M' | 'F'): boolean {
  const normalMin = gender === 'M' ? 33.1 : 24.3
  return percent < normalMin
}

function mencionaFuncaoIntestinal(foodRestrictions: string): boolean {
  const texto = (foodRestrictions || '').toLowerCase()
  return /intestin|digest|constipa[çc][aã]o|inflama[çc][aã]o intestinal/.test(texto)
}

function decidirUsoShake(objective: Objective): UsoShake {
  if (objective === 'emagrecimento') return 'substituto'
  if (objective === 'hipertrofia') return 'adicionado'
  if (objective === 'manutencao' || objective === 'saude') return 'complemento'
  return 'nenhum'
}

interface HerbalifeDecision {
  usoShake: UsoShake
  incluirWhey: boolean
  incluirCreatina: boolean
  incluirCR7: boolean
  incluirFiberConcentrate: boolean
  incluirHerbalConcentrate: boolean
}

function decidirProtocoloHerbalife(p: {
  objective: Objective
  activityLevel: ActivityLevel
  gender: 'M' | 'F'
  muscleMassPercent: number | null
  visceralRaw: number | null
  foodRestrictions: string
}): HerbalifeDecision {
  const activityIntensa = p.activityLevel === 'intenso' || p.activityLevel === 'muito_intenso'

  const incluirWhey =
    p.objective === 'hipertrofia' ||
    p.objective === 'performance' ||
    activityIntensa ||
    (p.muscleMassPercent != null && massaMuscularBaixa(p.muscleMassPercent, p.gender))

  const incluirCreatina = p.objective === 'performance'
  const incluirCR7 = activityIntensa || p.objective === 'performance'
  const incluirFiberConcentrate =
    (p.visceralRaw != null && p.visceralRaw > 6) ||
    mencionaFuncaoIntestinal(p.foodRestrictions)
  const incluirHerbalConcentrate = p.activityLevel === 'sedentario'

  return {
    usoShake: decidirUsoShake(p.objective),
    incluirWhey,
    incluirCreatina,
    incluirCR7,
    incluirFiberConcentrate,
    incluirHerbalConcentrate,
  }
}

function formatarBlocoDecisaoHerbalife(d: HerbalifeDecision): string {
  const shakeLabel: Record<UsoShake, string> = {
    substituto: 'SUBSTITUTO de refeição (café da manhã E jantar)',
    adicionado: 'ADICIONADO após café da manhã, almoço E jantar',
    complemento: 'COMPLEMENTO apenas no café da manhã',
    nenhum: 'NÃO incluir (upsell "Performance + Alta Nutrição" fica só no catálogo, fora do cardápio)',
  }

  return `Protocolo de Suplementação Herbalife (decidido em código — NÃO recalcular, apenas aplicar):
- Shake F1 + NutreV: modo = ${d.usoShake.toUpperCase()} → ${shakeLabel[d.usoShake]}
- Whey 3W: ${d.incluirWhey ? 'INCLUIR' : 'NÃO incluir'}
- Creatina Premium: ${d.incluirCreatina ? 'INCLUIR' : 'NÃO incluir'}
- CR7 Drive: ${d.incluirCR7 ? 'INCLUIR' : 'NÃO incluir'}
- Fiber Concentrate: ${d.incluirFiberConcentrate ? 'INCLUIR' : 'NÃO incluir'}
- Herbal Concentrate: ${d.incluirHerbalConcentrate ? 'INCLUIR' : 'NÃO incluir'}`
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
IMPORTANTE: a DECISÃO de incluir cada produto (e o modo do Shake) já vem
PRONTA no bloco "Protocolo de Suplementação Herbalife" da mensagem do
usuário — foi calculada em código a partir do objetivo, nível de
atividade, % de massa muscular e gordura visceral do aluno. Você NUNCA
decide isso sozinho: apenas aplica o texto de posicionamento abaixo aos
produtos marcados INCLUIR e ao modo do Shake indicado. Produtos NÃO
marcados como INCLUIR não devem aparecer em nenhuma refeição do cardápio.

Shake F1 + NutreV — 4 modos possíveis (use o modo exato informado):
  • Modo SUBSTITUTO: substitui a refeição sólida no café da manhã E no
    jantar. Texto no cardápio: "Shake F1 + NutreV Herbalife (substitui a
    refeição)".
  • Modo ADICIONADO: entra ADICIONADO (sem substituir nada) após café da
    manhã, almoço E jantar — 3x ao dia. Texto: "Shake F1 + NutreV
    Herbalife" logo após a refeição sólida de cada uma dessas 3 refeições.
  • Modo COMPLEMENTO: entra apenas no café da manhã, junto à refeição
    sólida (nunca substitui). Texto: "Shake F1 + NutreV Herbalife".
  • Modo NENHUM: não incluir o Shake F1 + NutreV em nenhuma refeição do
    cardápio.
  - Preparo (apenas em seções técnicas, nunca inline, quando o modo não
    for NENHUM): "No liquidificador adicione: • 250ml de água • 2
    colheres e meia (de sopa) do Shake Herbalife • 2 colheres e meia (de
    sopa) do NutreV Herbalife • 3 a 5 pedras de gelo."

Herbal Concentrate (incluir apenas se marcado INCLUIR):
  - Café da manhã como termogênico — SEMPRE antes do Shake (se houver)
  - Texto: "Herbal Concentrate (1 dose em 240ml de água — termogênico matinal)"

CR7 Drive (incluir apenas se marcado INCLUIR):
  - Dias de TREINO: label "Pré-Treino", 20 min antes do treino
  - Texto: "CR7 Drive (1 dose em 400ml de água gelada — 20 min antes do treino)"
  - Dias de DESCANSO: omitir completamente

Whey 3W Herbalife (incluir apenas se marcado INCLUIR):
  - SEMPRE pós-treino, até 40 min após o esforço
  - Texto: "Whey 3W Herbalife (1 dose em 300ml de água — até 40 min após o treino)"
  - Dias de descanso: omitir (exceto se solicitado para jantar)
  - Se Creatina também estiver INCLUIR, combine no mesmo texto (ver abaixo)

Creatina Premium Herbalife 24 (incluir apenas se marcado INCLUIR):
  - Junto ao Whey no pós-treino (dias de treino), se Whey também INCLUIR:
    "Whey 3W Herbalife + Creatina Premium (1 dose de cada em 300ml de água
    — até 40 min após o treino)"
  - Se Whey NÃO estiver incluído, usar sozinha: "Creatina Premium (1 dose
    em 300ml de água — até 40 min após o treino)"
  - Dias de descanso: separada em água — "Creatina Premium (1 dose em água
    — uso diário sem pausa)"

Fiber Concentrate (incluir apenas se marcado INCLUIR):
  - SEMPRE no café da tarde
  - Texto: "Fiber Concentrate (1 dose em água)"

Sopa Instantânea Herbalife:
  - Lanche da manhã APENAS — NUNCA substitui refeição principal
  - Apenas o Shake F1 + NutreV (modo SUBSTITUTO) tem nutrientes
    suficientes para substituir refeição

═══════════════════════════════════════════════
PROTOCOLOS DE RESTRIÇÃO ALIMENTAR
═══════════════════════════════════════════════
PESCETARIANO:
  - Remover: frango, bovina, porco e todas as carnes terrestres
  - Manter: peixes (salmão, atum, tilápia, sardinha), ovos
  - Adicionar: leguminosas (lentilha, grão-de-bico, feijão) como fonte
    proteica + carbo funcional (80g cozido, controlado)
  - Soja (Shake F1, se incluído): dose única diária

HIPOTIREOIDISMO:
  - Crucíferas SEMPRE cozidas/refogadas — NUNCA cruas
  - Castanha-do-pará: 2–3 unidades/dia (selênio para conversão T4→T3)
  - Peixes de água salgada priorizados (iodo natural)
  - Soja (Shake F1, se incluído): dose única diária
  - Avisar sobre medicação: "tome a medicação tireoidiana 30–60 min antes,
    em jejum, antes deste café"

ENDOMETRIOSE:
  - Priorizar gorduras anti-inflamatórias (azeite, abacate, oleaginosas)
  - Cúrcuma em pó em todos os almoços
  - Crucíferas sempre cozidas
  - Soja (Shake F1, se incluído): dose única diária

LACTOSE:
  - Shake F1 + NutreV (se incluído): preparar com água fria ou leite
    vegetal sem lactose
  - Sem queijos, iogurte, leite de vaca no cardápio sólido
  - Lista de compras: incluir leite vegetal (amêndoas, coco ou aveia)

GLÚTEN:
  - Eliminar trigo e todos os derivados
  - Shake F1 é livre de glúten — marcar como "Sem Glúten ✅" nas specs (se incluído)
  - Temperos: apenas naturais sem glúten
  - Lista de compras: marcar Shake F1 como "(sem glúten)" (se incluído)

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
- 3 parágrafos separados por \n\n
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
  "nota": "Parágrafo intro...\n\n<b>1. Título:</b> Texto...\n\n<b>2. Título:</b> Texto...\n\n<b>3. Título:</b> Texto...",
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

    const age = calcAge(client.birth_date)

    const calc = calculateDietPlan({
      weight_kg:        weight,
      height_cm:        client.height_cm,
      age,
      gender:           client.gender as 'M' | 'F',
      body_fat_percent: bodyFat,
      activity:         client.activity_level as ActivityLevel,
      objective:        client.objective as Objective,
      measured_bmr:     anthro.basal_metabolic_rate != null ? parseFloat(anthro.basal_metabolic_rate) : undefined,
    })

    const visceralRaw = anthro.body_fat_index != null ? Math.round(parseFloat(anthro.body_fat_index)) : null
    const muscleMassPercent = anthro.muscle_mass_percentage != null ? parseFloat(anthro.muscle_mass_percentage) : null

    const herbalifeDecision = decidirProtocoloHerbalife({
      objective:         client.objective as Objective,
      activityLevel:     client.activity_level as ActivityLevel,
      gender:            client.gender as 'M' | 'F',
      muscleMassPercent,
      visceralRaw,
      foodRestrictions:  client.food_restrictions || '',
    })

    const aluno = {
      nome:          client.name,
      objetivo:      OBJECTIVE_LABELS[client.objective as Objective] ?? client.objective,
      peso:          `${weight.toFixed(1)} kg`,
      gordura:       `${bodyFat.toFixed(1)}%`,
      massa_musc:    anthro.muscle_mass_percentage != null ? `${parseFloat(anthro.muscle_mass_percentage).toFixed(1)}%` : 'N/D',
      idade_metab:   anthro.metabolic_age != null ? `${Math.round(parseFloat(anthro.metabolic_age))} anos` : 'N/D',
      bmr_tdee:      `${calc.bmr} / ${calc.tdee}`,
      gord_visceral: visceralRaw != null ? classificaVisceral(visceralRaw) : 'N/D',
      cal_alvo:      `${calc.macros.calories} kcal`,
      proteina:      `${calc.macros.protein}g`,
      carbo:         `${calc.macros.carbs}g`,
      gorduras:      `${calc.macros.fat}g`,
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY não configurada')

    const userPrompt = `Dados do aluno para gerar o plano alimentar:

coach: "${trainerName}"
aluno: ${JSON.stringify(aluno)}

Contexto adicional (não incluir no JSON, usar apenas para montar o cardápio):
Sexo: ${client.gender === 'M' ? 'Masculino' : 'Feminino'} | Idade: ${age} anos | Altura: ${client.height_cm} cm
Massa magra: ${calc.lean_mass.toFixed(1)} kg
Nível de atividade: ${ACTIVITY_LABELS[client.activity_level as ActivityLevel] ?? client.activity_level}
Restrições alimentares informadas: ${client.food_restrictions || 'Nenhuma informada'}

${formatarBlocoDecisaoHerbalife(herbalifeDecision)}

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
