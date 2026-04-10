import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { client_id } = await req.json()

    if (!client_id) {
      throw new Error("client_id é obrigatório")
    }

    // Cliente com service_role para operações admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 1. Busca o email do cliente
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, name, email, trainer_id')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      throw new Error("Cliente não encontrado")
    }

    if (!client.email) {
      throw new Error("Este cliente não possui e-mail cadastrado")
    }

    // 2. Verifica se o requisitante é o treinador dono do cliente
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Não autorizado")

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) throw new Error("Sessão inválida")

    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (trainerError || !trainer || trainer.id !== client.trainer_id) {
      throw new Error("Acesso negado: este aluno não pertence ao seu perfil")
    }

    // 3. Envia o convite via Supabase Auth Admin
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      client.email,
      {
        data: {
          role: 'client',
          client_id: client.id,
        },
      }
    )

    if (inviteError) {
      // Erro comum: usuário já convidado ou já existe conta
      if (inviteError.message.includes('already been invited') || inviteError.message.includes('already registered')) {
        throw new Error("Este e-mail já possui um convite ou conta ativa")
      }
      throw inviteError
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
