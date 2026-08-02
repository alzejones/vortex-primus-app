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
    const { clients: fineshapeClients } = await req.json() as { clients: FineshapeClient[] }

    if (!fineshapeClients || !Array.isArray(fineshapeClients)) {
      throw new Error('Invalid clients array')
    }

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

    const byPhone10 = new Map<string, string>()
    const byName = new Map<string, string>()

    for (const client of existingClients) {
      if (client.phone) {
        const normalized = client.phone.replace(/\D/g, '').slice(-10)
        if (normalized.length === 10) {
          byPhone10.set(normalized, client.id)
        }
      }
      if (client.name) {
        const normalized = client.name.trim().toLowerCase()
        byName.set(normalized, client.id)
      }
    }

    const toCreate: any[] = []
    const toUpdate: any[] = []
    const skipped: string[] = []

    for (const fc of fineshapeClients) {
      if (!fc.name || fc.name.trim() === '') {
        skipped.push('(sem nome)')
        continue
      }

      let matchId: string | undefined

      if (fc.phone) {
        const phone10 = fc.phone.replace(/\D/g, '').slice(-10)
        if (phone10.length === 10) {
          matchId = byPhone10.get(phone10)
        }
      }

      if (!matchId) {
        const name = fc.name.trim().toLowerCase()
        matchId = byName.get(name)
      }

      const clientData = {
        name: fc.name.trim(),
        phone: fc.phone || null,
        email: fc.email || null,
        birth_date: fc.birth_date || null,
        gender: fc.gender || null,
        trainer_id: trainerId,
      }

      if (matchId) {
        toUpdate.push({ id: matchId, ...clientData })
      } else {
        toCreate.push(clientData)
      }
    }

    let created = 0
    let updated = 0

    if (toCreate.length > 0) {
      const { error: createError, data: createData } = await supabaseAdmin
        .from('clients')
        .insert(toCreate)
        .select('id')

      if (createError) {
        throw createError
      }

      created = createData?.length || 0
    }

    if (toUpdate.length > 0) {
      for (const update of toUpdate) {
        const { id, ...updateData } = update
        const { error: updateError } = await supabaseAdmin
          .from('clients')
          .update(updateData)
          .eq('id', id)

        if (!updateError) {
          updated++
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total: fineshapeClients.length,
          created,
          updated,
          skipped: skipped.length,
          existingClientsFound: existingClients.length,
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
