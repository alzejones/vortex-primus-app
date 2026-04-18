import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Retorna sempre HTTP 200 — erros vêm em { error: "..." }
// Isso evita que o Supabase JS client trate 4xx/5xx como erro de auth e dispare SIGNED_OUT.
function ok(body: Record<string, any>) {
  return new Response(
    JSON.stringify(body),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  )
}

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

    if (!client_id)    return ok({ error: 'client_id é obrigatório' })
    if (!image_base64) return ok({ error: 'image_base64 é obrigatório' })

    // 2. Valida token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return ok({ error: 'Não autorizado' })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) return ok({ error: 'Sessão inválida. Faça login novamente.' })

    // 3. Busca o cliente e verifica autorização
    const { data: client, error: clientErr } = await supabaseAdmin
      .from('clients')
      .select('id, user_id, trainer_id')
      .eq('id', client_id)
      .single()

    if (clientErr || !client) return ok({ error: 'Cliente não encontrado' })

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

    if (!isClient && !isTrainer) return ok({ error: 'Acesso negado' })

    // 4. Detecta media type
    let mediaType = 'image/jpeg'
    if (image_base64.startsWith('iVBORw0KGgo') || image_base64.startsWith('data:image/png')) {
      mediaType = 'image/png'
    } else if (image_base64.startsWith('R0lGOD') || image_base64.startsWith('data:image/gif')) {
      mediaType = 'image/gif'
    } else if (image_base64.startsWith('UklGR') || image_base64.startsWith('data:image/webp')) {
      mediaType = 'image/webp'
    }

    const cleanBase64 = image_base64.includes(',')
      ? image_base64.split(',')[1]
      : image_base64

    // 5. Chama Claude API com timeout de 25 segundos
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) return ok({ error: 'Serviço de IA não configurado. Contate o suporte.' })

    const controller = new AbortController()
    const claudeTimeout = setTimeout(() => controller.abort(), 25000)

    let claudeResponse: Response
    try {
      claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
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
                { type: 'image', source: { type: 'base64', media_type: mediaType, data: cleanBase64 } },
                { type: 'text', text: VISION_PROMPT },
              ],
            },
          ],
        }),
      })
    } catch (fetchErr: any) {
      clearTimeout(claudeTimeout)
      const isTimeout = fetchErr?.name === 'AbortError'
      console.error('[analyze-meal-photo] erro fetch Claude:', fetchErr?.name, fetchErr?.message)
      return ok({ error: isTimeout ? 'Análise demorou muito. Tente com uma foto menor.' : 'Serviço de IA indisponível. Tente novamente.' })
    }
    clearTimeout(claudeTimeout)

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text()
      console.error('[analyze-meal-photo] Claude API status:', claudeResponse.status, errText.substring(0, 200))
      return ok({ error: `Erro na análise (${claudeResponse.status}). Tente novamente.` })
    }

    const claudeData = await claudeResponse.json()
    const rawContent = claudeData.content?.[0]?.text ?? ''

    // 6. Parse do JSON retornado pelo Claude
    let analysis: Record<string, any>
    try {
      const cleaned = rawContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      analysis = JSON.parse(cleaned)
    } catch {
      console.error('[analyze-meal-photo] JSON inválido do Claude:', rawContent.substring(0, 300))
      return ok({ error: 'Resposta da IA inválida. Tente novamente.' })
    }

    // 7. Imagem não é uma refeição
    if (analysis.error) {
      return ok({ error: analysis.error })
    }

    // 8. Formata os alimentos
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

    if (logErr || !logEntry) {
      console.error('[analyze-meal-photo] erro ao salvar meal_log:', logErr?.message)
      return ok({ error: 'Erro ao salvar registro. Tente novamente.' })
    }

    // 10. Persiste os alimentos
    if (foods.length > 0) {
      const { error: foodsErr } = await supabaseAdmin
        .from('meal_log_foods')
        .insert(foods.map((f) => ({
          meal_log_id:    logEntry.id,
          name:           f.name,
          quantity_grams: f.quantity_grams,
          calories:       f.calories,
          protein:        f.protein,
          carbs:          f.carbs,
          fat:            f.fat,
          order_index:    f.order_index,
        })))

      if (foodsErr) {
        console.error('[analyze-meal-photo] erro ao salvar meal_log_foods:', foodsErr.message)
        // Não falha — meal_log foi salvo, apenas os detalhes de alimentos falharam
      }
    }

    return ok({ meal_log_id: logEntry.id, ...result })

  } catch (err: any) {
    console.error('[analyze-meal-photo] erro inesperado:', err?.message)
    return ok({ error: err?.message ?? 'Erro interno inesperado. Tente novamente.' })
  }
})
