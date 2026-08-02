import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ------------------------------------------------------------
// Import de dados exportados pelo concorrente Fineshape
// (clientes.csv + avaliacoes-1.csv) para o schema do Vortex
// Primus.
//
// Notas importantes de robustez:
// 1. O Fineshape repete a mesma pessoa em várias linhas do
//    clientes.csv (uma linha por grupo/tag). A dedupe de cliente
//    considera o banco E outras linhas do mesmo arquivo nesta
//    mesma execução (pendingByName/pendingByPhone).
// 2. Como avaliacoes.csv só tem o nome (sem telefone), duas
//    pessoas reais diferentes com nome idêntico podem acabar
//    casando no mesmo client_id. Se isso gerar uma avaliação
//    duplicada (mesma data), o INSERT usa upsert com
//    ignoreDuplicates para pular só aquele registro em vez de
//    abortar o lote inteiro.
// ------------------------------------------------------------

function parseNum(v: any): number | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (s === '') return null
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function parseDateOnly(v: any): string | null {
  if (!v) return null
  const s = String(v).trim()
  if (s === '') return null
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const [, yStr, moStr, dStr] = m
  const y = parseInt(yStr, 10)
  const mo = parseInt(moStr, 10)
  const d = parseInt(dStr, 10)
  if (y < 1900 || y > 2100) return null
  if (mo < 1 || mo > 12) return null
  if (d < 1 || d > 31) return null
  return `${yStr}-${moStr}-${dStr}`
}

function parseGender(v: any): 'M' | 'F' | null {
  const s = String(v || '').trim().toLowerCase()
  if (s.startsWith('m')) return 'M'
  if (s.startsWith('f')) return 'F'
  return null
}

function normalizePhone(v: any): { full: string | null; last10: string | null } {
  if (!v) return { full: null, last10: null }
  let digits = String(v).replace(/\D/g, '')
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2)
  if (digits.length < 8) return { full: null, last10: null }
  return { full: digits, last10: digits.slice(-10) }
}

function normalizeName(v: any): string {
  return String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const clientRows: any[] = Array.isArray(body.clients) ? body.clients : []
    const assessmentRows: any[] = Array.isArray(body.assessments) ? body.assessments : []

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

    const { data: trainer, error: trainerErr } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (trainerErr || !trainer) throw new Error('Treinador não encontrado para este usuário')

    const trainerId = trainer.id

    // ---------- 1. Clientes existentes do treinador (paginado, PostgREST limita a 1000/consulta) ----------
    const existingClients: any[] = []
    {
      const PAGE_SIZE = 1000
      let from = 0
      let hasMore = true
      while (hasMore) {
        const { data: page, error: existingErr } = await supabaseAdmin
          .from('clients')
          .select('id, name, phone')
          .eq('trainer_id', trainerId)
          .range(from, from + PAGE_SIZE - 1)
        if (existingErr) throw existingErr
        if (page && page.length > 0) {
          existingClients.push(...page)
          from += PAGE_SIZE
          hasMore = page.length === PAGE_SIZE
        } else {
          hasMore = false
        }
      }
    }

    const byPhone10 = new Map<string, string>()
    const byName = new Map<string, string>()
    for (const c of existingClients ?? []) {
      if (c.phone) {
        const p = normalizePhone(c.phone)
        if (p.last10) byPhone10.set(p.last10, c.id)
      }
      byName.set(normalizeName(c.name), c.id)
    }

    // ---------- 2. Processa clientes.csv ----------
    let clientsInvalid = 0
    let clientsMatched = 0
    let clientsDuplicateInFile = 0
    const toInsertClients: any[] = []
    const toInsertMeta: string[] = []
    const pendingByName = new Set<string>()
    const pendingByPhone = new Set<string>()

    for (const row of clientRows) {
      const name = (row['Nome'] || '').trim()
      if (!name) { clientsInvalid++; continue }
      const nName = normalizeName(name)

      const phoneInfo = normalizePhone(row['Telefone'])
      let matchedId: string | undefined
      if (phoneInfo.last10) matchedId = byPhone10.get(phoneInfo.last10)
      if (!matchedId) matchedId = byName.get(nName)

      if (matchedId) {
        clientsMatched++
        byName.set(nName, matchedId)
        continue
      }

      const dupInFile = pendingByName.has(nName) || (phoneInfo.last10 !== null && pendingByPhone.has(phoneInfo.last10))
      if (dupInFile) {
        clientsDuplicateInFile++
        continue
      }

      const grupos = (row['Grupos'] || '').trim()
      const anotacoes = (row['Anotacoes'] || row['Anotações'] || '').trim()
      const obsParts = []
      if (grupos) obsParts.push(`Grupos Fineshape: ${grupos}`)
      if (anotacoes) obsParts.push(anotacoes)

      toInsertClients.push({
        trainer_id: trainerId,
        name,
        gender: parseGender(row['Gênero'] || row['Genero']),
        height_cm: parseNum(row['Altura']),
        birth_date: parseDateOnly(row['Dta Nasc.']),
        phone: phoneInfo.full,
        email: (row['Email'] || '').trim() || null,
        observation: obsParts.join(' | ') || null,
        is_active: true,
        import_source: 'fineshape',
      })
      toInsertMeta.push(nName)
      pendingByName.add(nName)
      if (phoneInfo.last10) pendingByPhone.add(phoneInfo.last10)
    }

    let clientsCreated = 0
    const clientBatches = chunk(toInsertClients, 500)
    const metaBatches = chunk(toInsertMeta, 500)
    for (let i = 0; i < clientBatches.length; i++) {
      const batch = clientBatches[i]
      const metaBatch = metaBatches[i]
      if (batch.length === 0) continue
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from('clients')
        .insert(batch)
        .select('id')
      if (insErr) throw insErr
      inserted?.forEach((row: any, idx: number) => {
        byName.set(metaBatch[idx], row.id)
      })
      clientsCreated += inserted?.length ?? 0
    }

    // ---------- 3. Duplicatas já importadas (reexecução segura) ----------
    const alreadyImported = new Set<string>()
    {
      const { data: existingAssessments, error: eaErr } = await supabaseAdmin
        .from('physical_assessments')
        .select('client_id, assessment_date')
        .eq('trainer_id', trainerId)
        .eq('import_source', 'fineshape')
      if (eaErr) throw eaErr
      for (const a of existingAssessments ?? []) {
        alreadyImported.add(`${a.client_id}|${a.assessment_date}`)
      }
    }

    // ---------- 4. Processa avaliacoes-1.csv ----------
    let assessmentsUnmatchedClient = 0
    let assessmentsInvalidDate = 0
    let assessmentsSkippedDuplicate = 0

    const assessmentInserts: any[] = []
    const draftByKey = new Map<string, any>() // "clientId|data" -> dados de anthropometry

    for (const row of assessmentRows) {
      const name = (row['Nome'] || '').trim()
      const clientId = name ? byName.get(normalizeName(name)) : undefined
      if (!clientId) { assessmentsUnmatchedClient++; continue }

      const dateOnly = parseDateOnly(row['Dta Aval.'])
      if (!dateOnly) { assessmentsInvalidDate++; continue }

      const key = `${clientId}|${dateOnly}`
      if (alreadyImported.has(key)) { assessmentsSkippedDuplicate++; continue }
      alreadyImported.add(key)

      const metodo = (row['Método'] || row['Metodo'] || '').trim()
      const formula = (row['Fórmula'] || row['Formula'] || '').trim()
      const protocolo = (row['Protocolo'] || '').trim()
      const notesParts = ['Importado do Fineshape']
      if (metodo) notesParts.push(`Método: ${metodo}`)
      if (formula) notesParts.push(`Fórmula: ${formula}`)

      assessmentInserts.push({
        client_id: clientId,
        trainer_id: trainerId,
        assessment_date: dateOnly,
        date: dateOnly,
        notes: notesParts.join(' | '),
        scale_protocol: protocolo || null,
        import_source: 'fineshape',
      })

      const bodyFat = parseNum(row['%Gordura Bio']) ?? parseNum(row['%Gordura Medidas'])

      draftByKey.set(key, {
        weight: parseNum(row['Peso']),
        height: parseNum(row['Altura']),
        bmi: parseNum(row['IMC']),
        body_fat_percent: bodyFat,
        body_fat: bodyFat,
        muscle_mass_kg: parseNum(row['Massa Muscular']),
        muscle_mass_percentage: parseNum(row['Músculo Esquel.'] || row['Musculo Esquel.']),
        water_percent: parseNum(row['Água'] || row['Agua']),
        bone_mass: parseNum(row['Massa Óssea'] || row['Massa Ossea']),
        basal_metabolic_rate: parseNum(row['TMB']),
        metabolic_age: (() => { const n = parseNum(row['Idade Corporal']); return n !== null ? Math.round(n) : null })(),
        body_fat_index: parseNum(row['Gor. Visceral']),
        chest_cm: parseNum(row['Tórax'] || row['Torax']),
        chest: parseNum(row['Tórax'] || row['Torax']),
        waist_cm: parseNum(row['Cintura']),
        waist: parseNum(row['Cintura']),
        hips_cm: parseNum(row['Quadril']),
        hip: parseNum(row['Quadril']),
        abdomen: parseNum(row['Abdomen']),
        right_arm_cm: parseNum(row['Braço D.'] || row['Braco D.']),
        arm_right: parseNum(row['Braço D.'] || row['Braco D.']),
        left_arm_cm: parseNum(row['Braço E.'] || row['Braco E.']),
        arm_left: parseNum(row['Braço E.'] || row['Braco E.']),
        right_forearm_cm: parseNum(row['Antebraco D.']),
        left_forearm_cm: parseNum(row['Antebraco E.']),
        right_thigh_cm: parseNum(row['Coxa D.']),
        thigh_right: parseNum(row['Coxa D.']),
        left_thigh_cm: parseNum(row['Coxa E.']),
        thigh_left: parseNum(row['Coxa E.']),
        right_calf_cm: parseNum(row['Panturrilha D.']),
        calf_right: parseNum(row['Panturrilha D.']),
        left_calf_cm: parseNum(row['Panturrilha E.']),
        calf_left: parseNum(row['Panturrilha E.']),
        view_count: (() => { const n = parseNum(row['Total Visualizações'] || row['Total Visualizacoes']); return n !== null ? Math.round(n) : null })(),
        source: 'fineshape_import',
      })
    }

    let assessmentsImported = 0
    let assessmentsSkippedConflict = 0
    const assessBatches = chunk(assessmentInserts, 300)

    for (const aBatch of assessBatches) {
      if (aBatch.length === 0) continue

      // upsert + ignoreDuplicates: se, mesmo depois da dedupe em memória,
      // sobrar uma colisão real no banco (ex: dois clientes reais diferentes
      // com nome idêntico que acabaram casando no mesmo client_id), o
      // PostgREST pula só aquele registro em vez de abortar o lote inteiro.
      const { data: insertedAssessments, error: aErr } = await supabaseAdmin
        .from('physical_assessments')
        .upsert(aBatch, {
          onConflict: 'client_id,assessment_date,import_source',
          ignoreDuplicates: true,
        })
        .select('id, client_id, assessment_date')
      if (aErr) throw aErr

      const returnedKeys = new Set<string>()
      const anthroBatch: any[] = []
      for (const row of insertedAssessments ?? []) {
        const key = `${row.client_id}|${row.assessment_date}`
        returnedKeys.add(key)
        const draft = draftByKey.get(key)
        if (draft) anthroBatch.push({ assessment_id: row.id, ...draft })
      }

      assessmentsSkippedConflict += aBatch.length - (insertedAssessments?.length ?? 0)

      if (anthroBatch.length > 0) {
        const { error: anErr } = await supabaseAdmin.from('anthropometry').insert(anthroBatch)
        if (anErr) throw anErr
      }

      assessmentsImported += insertedAssessments?.length ?? 0
    }

    return new Response(
      JSON.stringify({
        clientes: {
          no_arquivo: clientRows.length,
          invalidos: clientsInvalid,
          duplicados_no_arquivo: clientsDuplicateInFile,
          ja_existiam: clientsMatched,
          criados: clientsCreated,
        },
        avaliacoes: {
          no_arquivo: assessmentRows.length,
          sem_cliente_correspondente: assessmentsUnmatchedClient,
          data_invalida: assessmentsInvalidDate,
          ja_importadas_antes: assessmentsSkippedDuplicate,
          colisao_mesmo_nome_mesma_data: assessmentsSkippedConflict,
          importadas: assessmentsImported,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('[import-fineshape] erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
