import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Prompt estruturado para o Claude Vision
const VISION_PROMPT = `Você é um nutricionista especializado em culinária brasileira. Analise esta foto de refeição e retorne APENAS um JSON válido (sem markdown, sem explicações) com esta estrutura:

{
  "foods": [
    { "name": "nome do alimento em português", "quantity_grams": número, "calories": número, "protein": número, "carbs": número, "fat": número }
  ],
  "total_calories": número,
  "total_protein": número,
  "total_carbs": número,
  "total_fat": número,
  "notes": "observações sobre a refeição (máx 100 caracteres)"
}

Regras:
- Use nomes de alimentos comuns no Brasil (arroz, feijão, bife, frango grelhado, etc.)
- Estime porções visualmente. Se não conseguir estimar, assuma porção padrão brasileira
- Valores sempre com 1 casa decimal
- Se a imagem não for comida, retorne { "error": "Imagem não é uma refeição" }
- Nunca invente alimentos que não estão visíveis`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Parse do body
    const body = await req.json()
    const { client_id, image_base64, meal_type } = body

    if (!client_id)     throw new Error('client_id é obrigatório')
    if (!image_base64)  throw new Error('image_base64 é obrigatório')

    // 2. Valida token
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

    console.log('[analyze-meal-photo] iniciando análise para client_id:', client_id)

    // 3. Busca o cliente e verifica autorização
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('id, user_id, trainer_id')
      .eq('id', client_id)
      .single()

    if (clientErr || !client) throw new Error('Cliente não encontrado')

    // Aceita: o próprio aluno OU o treinador responsável
    const isClient = client.user_id === user.id

    let isTrainer = false
    if (!isClient) {
      const { data: trainer } = await supabaseAdmin
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      isTrainer = trainer != null && trainer.id === client.trainer_id
    }

    if (!isClient && !isTrainer) throw new Error('Acesso negado')

    // 4. Detecta o media type da imagem a partir do prefixo base64
    //    Aceita jpeg, png, gif, webp (formatos suportados pela Claude Vision)
    let mediaType = 'image/jpeg'
    if (image_base64.startsWith('/9j/') || image_base64.startsWith('data:image/jpeg')) {
      mediaType = 'image/jpeg'
    } else if (image_base64.startsWith('iVBORw0KGgo') || image_base64.startsWith('data:image/png')) {
      mediaType = 'image/png'
    } else if (image_base64.startsWith('R0lGOD') || image_base64.startsWith('data:image/gif')) {
      mediaType = 'image/gif'
    } else if (image_base64.startsWith('UklGR') || image_base64.startsWith('data:image/webp')) {
      mediaType = 'image/webp'
    }

    // Remove prefixo data URI se presente (ex: "data:image/jpeg;base64,")
    const cleanBase64 = image_base64.includes(',')
      ? image_base64.split(',')[1]
      : image_base64

    // 5. Chama Claude API com Vision
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY não configurada')

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: cleanBase64,
                },
              },
              {
                type: 'text',
                text: VISION_PROMPT,
              },
            ],
          },
        ],
      }),
    })

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text()
      throw new Error(`Claude API error: ${claudeResponse.status} — ${errText}`)
    }

    const claudeData = await claudeResponse.json()
    const rawContent = claudeData.content?.[0]?.text ?? ''

    // 6. Parse do JSON retornado pelo Claude
    let analysis: Record<string, any>
    try {
      // Remove possível markdown (```json ... ```) por segurança
      const cleaned = rawContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      analysis = JSON.parse(cleaned)
    } catch {
      throw new Error(`Resposta da IA inválida: ${rawContent.substring(0, 200)}`)
    }

    // 7. Se Claude detectou que não é comida, retorna o erro sem salvar
    if (analysis.error) {
      return new Response(
        JSON.stringify({ error: analysis.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 }
      )
    }

    // 8. Garante campos obrigatórios e formata valores numéricos
    const foods: any[] = (analysis.foods ?? []).map((f: any, idx: number) => ({
      name:           String(f.name ?? 'Alimento desconhecido'),
      quantity_grams: parseFloat(Number(f.quantity_grams ?? 100).toFixed(1)),
      calories:       parseFloat(Number(f.calories ?? 0).toFixed(1)),
      protein:        parseFloat(Number(f.protein  ?? 0).toFixed(1)),
      carbs:          parseFloat(Number(f.carbs    ?? 0).toFixed(1)),
      fat:            parseFloat(Number(f.fat      ?? 0).toFixed(1)),
      order_index:    idx,
    }))

    const result = {
      foods,
      total_calories: parseFloat(Number(analysis.total_calories ?? 0).toFixed(1)),
      total_protein:  parseFloat(Number(analysis.total_protein  ?? 0).toFixed(1)),
      total_carbs:    parseFloat(Number(analysis.total_carbs    ?? 0).toFixed(1)),
      total_fat:      parseFloat(Number(analysis.total_fat      ?? 0).toFixed(1)),
      notes:          String(analysis.notes ?? '').substring(0, 100),
      meal_type:      meal_type ?? null,
    }

    // 9. Persiste no meal_log
    const { data: logEntry, error: logErr } = await supabaseAdmin
      .from('meal_log')
      .insert({
        client_id,
        meal_type:      result.meal_type,
        ai_analysis:    analysis,
        total_calories: result.total_calories,
        total_protein:  result.total_protein,
        total_carbs:    result.total_carbs,
        total_fat:      result.total_fat,
        notes:          result.notes,
      })
      .select('id')
      .single()

    if (logErr || !logEntry) throw new Error('Erro ao salvar registro: ' + logErr?.message)

    // 10. Persiste os alimentos individuais
    if (foods.length > 0) {
      const foodRows = foods.map((f) => ({
        meal_log_id:   logEntry.id,
        name:          f.name,
        quantity_grams: f.quantity_grams,
        calories:       f.calories,
        protein:        f.protein,
        carbs:          f.carbs,
        fat:            f.fat,
        order_index:    f.order_index,
      }))

      const { error: foodsErr } = await supabaseAdmin
        .from('meal_log_foods')
        .insert(foodRows)

      if (foodsErr) throw new Error('Erro ao salvar alimentos: ' + foodsErr.message)
    }

    // 11. Retorna análise + id do registro salvo
    return new Response(
      JSON.stringify({ meal_log_id: logEntry.id, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? 'Erro interno' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
