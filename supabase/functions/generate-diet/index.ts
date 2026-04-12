import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ------------------------------------------------------------
// Replicar lógica de dietCalculations.ts (Mifflin-St Jeor)
// ------------------------------------------------------------
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentario:             1.2,
  levemente_ativo:        1.375,
  moderadamente_ativo:    1.55,
  muito_ativo:            1.725,
  extremamente_ativo:     1.9,
}

const CALORIE_ADJUSTMENT: Record<string, number> = {
  emagrecimento: -500,
  hipertrofia:   +300,
  manutencao:      0,
  saude:         -100,
  performance:   +200,
}

const PROTEIN_PER_KG_LEAN: Record<string, number> = {
  emagrecimento: 2.2,
  hipertrofia:   2.4,
  manutencao:    1.8,
  saude:         2.0,
  performance:   2.2,
}

function calculateBMR(weight_kg: number, height_cm: number, age: number, gender: string): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
  return gender.toUpperCase() === 'M' ? base + 5 : base - 161
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// ------------------------------------------------------------
// Handler principal
// ------------------------------------------------------------
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

    // 1. Valida token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) throw new Error('Sessão inválida')

    // 2. Busca o cliente
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('id, name, trainer_id, user_id, birth_date, gender, height_cm, objective, activity_level, food_restrictions')
      .eq('id', client_id)
      .single()

    if (clientErr || !client) throw new Error('Cliente não encontrado')

    // 3. Verifica autorização: treinador do aluno OU o próprio aluno
    const { data: trainer } = await supabaseAdmin
      .from('trainers')
      .select('id, name')
      .eq('user_id', user.id)
      .maybeSingle()

    const isTrainer = trainer != null && trainer.id === client.trainer_id
    const isClient  = client.user_id === user.id

    if (!isTrainer && !isClient) throw new Error('Acesso negado')

    // 4. Nome do treinador
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

    // 5. Última avaliação com bioimpedância
    let lastBio = null
    let weight  = 0
    let bodyFat = 20

    const { data: assessments } = await supabaseAdmin
      .from('physical_assessments')
      .select('id')
      .eq('client_id', client_id)
      .order('date', { ascending: false })
      .limit(1)

    if (assessments && assessments.length > 0) {
      const { data: anthro } = await supabaseAdmin
        .from('anthropometry')
        .select('weight, body_fat, muscle_mass_percentage, basal_metabolic_rate, metabolic_age')
        .eq('assessment_id', assessments[0].id)
        .maybeSingle()

      if (anthro) {
        weight  = parseFloat(anthro.weight)   || 0
        bodyFat = parseFloat(anthro.body_fat) || 20
        lastBio = {
          weight,
          body_fat:               parseFloat(anthro.body_fat) || 0,
          muscle_mass_percentage: anthro.muscle_mass_percentage != null ? parseFloat(anthro.muscle_mass_percentage) : null,
          basal_metabolic_rate:   anthro.basal_metabolic_rate   != null ? parseFloat(anthro.basal_metabolic_rate)   : null,
          metabolic_age:          anthro.metabolic_age          != null ? parseFloat(anthro.metabolic_age)          : null,
        }
      }
    }

    // 6. Valida dados mínimos
    if (!weight || !client.height_cm || !client.birth_date || !client.gender || !client.objective || !client.activity_level) {
      throw new Error('Dados insuficientes para gerar o plano. Complete o perfil do aluno (objetivo, nível de atividade) e registre uma avaliação física.')
    }

    // 7. Calcula metas
    const age            = calcAge(client.birth_date)
    const bmr            = calculateBMR(weight, client.height_cm, age, client.gender)
    const tdee           = bmr * (ACTIVITY_MULTIPLIERS[client.activity_level] ?? 1.2)
    const targetCalories = tdee + (CALORIE_ADJUSTMENT[client.objective] ?? 0)
    const leanMass       = weight * (1 - bodyFat / 100)
    const protein        = leanMass * (PROTEIN_PER_KG_LEAN[client.objective] ?? 2.0)
    const fat            = (targetCalories * 0.25) / 9
    const carbs          = Math.max((targetCalories - protein * 4 - fat * 9) / 4, 0)

    const macros = {
      calories: Math.round(targetCalories),
      protein:  Math.round(protein),
      carbs:    Math.round(carbs),
      fat:      Math.round(fat),
    }

    // 8. Chama Claude API
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY não configurada')

    const systemPrompt = `Você é um nutricionista esportivo brasileiro experiente. Gere planos alimentares detalhados, equilibrados e culturalmente adequados para o Brasil, priorizando alimentos acessíveis da dieta brasileira. Responda APENAS com JSON válido, sem texto adicional, sem markdown, sem blocos de código.`

    const objectiveLabels: Record<string, string> = {
      emagrecimento: 'Emagrecimento',
      hipertrofia:   'Hipertrofia',
      manutencao:    'Manutenção',
      saude:         'Saúde e Qualidade de Vida',
      performance:   'Performance',
    }

    const activityLabels: Record<string, string> = {
      sedentario:             'Sedentário',
      levemente_ativo:        'Levemente ativo (1–3 dias/semana)',
      moderadamente_ativo:    'Moderadamente ativo (3–5 dias/semana)',
      muito_ativo:            'Muito ativo (6–7 dias/semana)',
      extremamente_ativo:     'Extremamente ativo (atleta/trabalho físico intenso)',
    }

    const userPrompt = `Gere um plano alimentar completo para 7 dias para o seguinte aluno:

**Perfil:**
- Nome: ${client.name}
- Gênero: ${client.gender === 'M' ? 'Masculino' : 'Feminino'}
- Idade: ${age} anos
- Objetivo: ${objectiveLabels[client.objective] ?? client.objective}
- Nível de atividade: ${activityLabels[client.activity_level] ?? client.activity_level}${client.food_restrictions ? `\n- Restrições alimentares: ${client.food_restrictions}` : ''}

**Dados corporais (última avaliação):**
- Peso: ${weight} kg
- Percentual de gordura: ${bodyFat}%
- Massa magra estimada: ${leanMass.toFixed(1)} kg${lastBio?.muscle_mass_percentage != null ? `\n- Percentual de músculo: ${lastBio.muscle_mass_percentage}%` : ''}${lastBio?.basal_metabolic_rate != null ? `\n- Metabolismo basal (bioimpedância): ${lastBio.basal_metabolic_rate} kcal` : ''}${lastBio?.metabolic_age != null ? `\n- Idade metabólica: ${lastBio.metabolic_age} anos` : ''}

**Metas calóricas e de macros:**
- Calorias alvo: ${macros.calories} kcal/dia
- Proteína: ${macros.protein} g/dia
- Carboidratos: ${macros.carbs} g/dia
- Gordura: ${macros.fat} g/dia

Retorne EXATAMENTE neste formato JSON (sem texto antes ou depois):
{
  "observations": "parágrafo com observações nutricionais personalizadas para este aluno, mencionando o objetivo e dicas relevantes",
  "days": [
    {
      "day": 1,
      "label": "Segunda-feira",
      "total_calories": 2200,
      "meals": [
        {
          "name": "Café da Manhã",
          "time_suggestion": "07:00",
          "foods": [
            {
              "name": "nome do alimento",
              "quantity": "100g",
              "calories": 150,
              "protein": 10,
              "carbs": 20,
              "fat": 3
            }
          ]
        }
      ]
    }
  ]
}

Regras obrigatórias:
- Exatamente 7 dias (dia 1 = Segunda-feira, dia 7 = Domingo)
- Exatamente 5 refeições por dia nesta ordem: "Café da Manhã", "Lanche da Manhã", "Almoço", "Lanche da Tarde", "Jantar"
- Cada refeição deve ter entre 2 e 5 alimentos
- Use alimentos brasileiros comuns (arroz, feijão, frango, ovo, etc.)
- O total de calorias de cada dia deve ficar entre ${macros.calories - 100} e ${macros.calories + 100} kcal
- Varie os alimentos entre os dias (não repita exatamente as mesmas refeições)
- Respeite ESTRITAMENTE as restrições alimentares informadas
- Retorne APENAS o JSON, sem qualquer texto fora do objeto JSON`

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':          anthropicKey,
        'anthropic-version':  '2023-06-01',
        'content-type':       'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 8192,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text()
      console.error('[generate-diet] Claude API error status:', claudeResponse.status, errText)
      // Expõe o erro real para diagnóstico
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
      // Tenta extrair JSON caso a IA adicione texto extra
      const match = rawContent.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Resposta da IA com formato inválido. Tente novamente.')
      plan = JSON.parse(match[0])
    }

    return new Response(
      JSON.stringify({ plan, trainer_name: trainerName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
