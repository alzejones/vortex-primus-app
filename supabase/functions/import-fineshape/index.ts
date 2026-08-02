import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FineshapeClient {
  name: string
  phone?: string
  email?: string
  birth_date?: string
  gender?: string
  [key: string]: any
}

interface FineshapeAssessment {
  client_name: string
  date?: string
  weight?: number
  height?: number
  body_fat_percentage?: number
  muscle_mass?: number
  visceral_fat?: number
  bmr?: number
  [key: string]: any
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 ? digits.slice(-10) : null
}

function normalizeName(name: string | null | undefined): string | null {
  if (!name) return null
  return name.trim().toLowerCase()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Invalid token')
    }

    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (trainerError || !trainer) {
      throw new Error('Trainer not found')
    }

    const trainerId = trainer.id
    const { clients: fineshapeClients, assessments: fineshapeAssessments } = await req.json() as {
      clients: FineshapeClient[]
      assessments: FineshapeAssessment[]
    }

    if (!fineshapeClients || !Array.isArray(fineshapeClients)) {
      throw new Error('Invalid clients array')
    }
    if (!fineshapeAssessments || !Array.isArray(fineshapeAssessments)) {
      throw new Error('Invalid assessments array')
    }

    // PASSO 1: Buscar clientes existentes do treinador (com paginação)
    const PAGE_SIZE = 1000
    let existingClients: any[] = []
    let from = 0
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('id, name, phone')
        .eq('trainer_id', trainerId)
        .range(from, from + PAGE_SIZE - 1)

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        existingClients = existingClients.concat(data)
        from += PAGE_SIZE
        hasMore = data.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }

    // Mapas de deduplicação por telefone (últimos 10 dígitos) e nome
    const byPhone10 = new Map<string, string>()
    const byName = new Map<string, string>()

    for (const client of existingClients) {
      const phone10 = normalizePhone(client.phone)
      if (phone10) {
        byPhone10.set(phone10, client.id)
      }
      const name = normalizeName(client.name)
      if (name) {
        byName.set(name, client.id)
      }
    }

    // PASSO 2: Processar clientes do arquivo
    const clientsCreated: string[] = []
    const clientsAlreadyExisting: string[] = []
    const clientsInvalid: string[] = []
    const clientsDuplicatedInFile = new Set<string>()
    const seenInFile = new Map<string, boolean>()

    for (const fc of fineshapeClients) {
      if (!fc.name || fc.name.trim() === '') {
        clientsInvalid.push('(sem nome)')
        continue
      }

      const phone10 = normalizePhone(fc.phone)
      const name = normalizeName(fc.name)

      // Deduplicação dentro do próprio arquivo
      const fileKey = phone10 ? `phone:${phone10}` : `name:${name}`
      if (seenInFile.has(fileKey)) {
        clientsDuplicatedInFile.add(fc.name)
        continue
      }
      seenInFile.set(fileKey, true)

      // Verificar se cliente já existe no banco (match por telefone ou nome)
      let matchId: string | undefined
      if (phone10) {
        matchId = byPhone10.get(phone10)
      }
      if (!matchId && name) {
        matchId = byName.get(name)
      }

      if (matchId) {
        // Cliente já existe: PULAR (não atualizar)
        clientsAlreadyExisting.push(fc.name)
      } else {
        // Cliente novo: criar
        const { data: newClient, error: createError } = await supabaseAdmin
          .from('clients')
          .insert({
            name: fc.name.trim(),
            phone: fc.phone || null,
            email: fc.email || null,
            birth_date: fc.birth_date || null,
            gender: fc.gender || null,
            trainer_id: trainerId,
          })
          .select('id, name, phone')
          .single()

        if (createError) {
          clientsInvalid.push(fc.name)
          console.error('Error creating client:', createError)
        } else {
          clientsCreated.push(fc.name)
          // Adicionar aos mapas para uso nas avaliações
          const newPhone10 = normalizePhone(newClient.phone)
          if (newPhone10) {
            byPhone10.set(newPhone10, newClient.id)
          }
          const newName = normalizeName(newClient.name)
          if (newName) {
            byName.set(newName, newClient.id)
          }
        }
      }
    }

    // PASSO 3: Processar avaliações do arquivo
    const assessmentsImported: string[] = []
    const assessmentsAlreadyImported: string[] = []
    const assessmentsWithoutClient: string[] = []
    const assessmentsInvalidDate: string[] = []

    for (const fa of fineshapeAssessments) {
      if (!fa.client_name || fa.client_name.trim() === '') {
        assessmentsWithoutClient.push('(sem nome de cliente)')
        continue
      }

      // Encontrar cliente correspondente
      const clientName = normalizeName(fa.client_name)
      const clientId = clientName ? byName.get(clientName) : null

      if (!clientId) {
        assessmentsWithoutClient.push(fa.client_name)
        continue
      }

      // Validar data
      if (!fa.date || fa.date.trim() === '') {
        assessmentsInvalidDate.push(fa.client_name)
        continue
      }

      // Verificar se avaliação já foi importada antes (mesmo client_id + mesma data)
      const { data: existingAssessment, error: checkError } = await supabaseAdmin
        .from('physical_assessments')
        .select('id')
        .eq('client_id', clientId)
        .eq('assessment_date', fa.date)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing assessment:', checkError)
        continue
      }

      if (existingAssessment) {
        assessmentsAlreadyImported.push(`${fa.client_name} - ${fa.date}`)
        continue
      }

      // Criar avaliação física
      const { data: newAssessment, error: createAssessmentError } = await supabaseAdmin
        .from('physical_assessments')
        .insert({
          client_id: clientId,
          trainer_id: trainerId,
          assessment_date: fa.date,
          date: fa.date,
          weight: fa.weight || null,
          height: fa.height || null,
        })
        .select('id')
        .single()

      if (createAssessmentError) {
        console.error('Error creating assessment:', createAssessmentError)
        continue
      }

      // Criar registro de antropometria (se houver dados)
      if (fa.body_fat_percentage || fa.muscle_mass || fa.visceral_fat || fa.bmr) {
        const { error: createAnthroError } = await supabaseAdmin
          .from('anthropometry')
          .insert({
            assessment_id: newAssessment.id,
            body_fat_percentage: fa.body_fat_percentage || null,
            muscle_mass: fa.muscle_mass || null,
            visceral_fat: fa.visceral_fat || null,
            bmr: fa.bmr || null,
          })

        if (createAnthroError) {
          console.error('Error creating anthropometry:', createAnthroError)
        }
      }

      assessmentsImported.push(`${fa.client_name} - ${fa.date}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        clientes: {
          criados: clientsCreated.length,
          ja_existiam: clientsAlreadyExisting.length,
          invalidos: clientsInvalid.length,
          duplicados_no_arquivo: clientsDuplicatedInFile.size,
        },
        avaliacoes: {
          importadas: assessmentsImported.length,
          ja_importadas_antes: assessmentsAlreadyImported.length,
          sem_cliente_correspondente: assessmentsWithoutClient.length,
          data_invalida: assessmentsInvalidDate.length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in import-fineshape:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
