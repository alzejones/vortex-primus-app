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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error("Não autorizado")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 1. Valida o token do treinador
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      throw new Error("Sessão inválida")
    }

    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (trainerError || !trainer) {
      throw new Error("Perfil de treinador não encontrado")
    }

    // 2. Busca o client verificando que pertence a este treinador
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, user_id, name')
      .eq('id', client_id)
      .eq('trainer_id', trainer.id)
      .single()

    if (clientError || !client) {
      throw new Error("Aluno não encontrado ou sem permissão para excluí-lo")
    }

    const authUserId: string | null = client.user_id ?? null

    // 3. Deleta o registro em clients (CASCADE remove meal_plans, diet_preferences)
    const { error: deleteClientError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', client_id)

    if (deleteClientError) {
      throw new Error("Erro ao excluir o aluno: " + deleteClientError.message)
    }

    // 4. Se o aluno tinha conta em auth.users, remove para não deixar órfão
    if (authUserId) {
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(authUserId)
      if (deleteUserError) {
        // Loga mas não falha — o registro de clients já foi removido.
        // O órfão em auth.users pode ser limpo manualmente se necessário.
        console.error(`[delete-client] Aviso: clients removido mas falha ao deletar auth.users ${authUserId}:`, deleteUserError.message)
      }
    }

    console.log(`[delete-client] Aluno ${client.name} (${client_id}) excluído pelo treinador ${trainer.id}. auth.users removido: ${!!authUserId}`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
