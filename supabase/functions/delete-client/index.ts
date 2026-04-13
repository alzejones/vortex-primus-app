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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    })

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

    // 2. Busca o client verificando que pertence a este treinador.
    // Aceita trainer_id = trainer.id OU trainer_id IS NULL (registro órfão
    // após ON DELETE SET NULL — o treinador logado pode limpar).
    // Inclui email para fallback de busca em auth.users quando user_id for NULL.
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, user_id, email, name, trainer_id')
      .eq('id', client_id)
      .or(`trainer_id.eq.${trainer.id},trainer_id.is.null`)
      .single()

    if (clientError || !client) {
      throw new Error("Aluno não encontrado ou sem permissão para excluí-lo")
    }

    // 3. Resolve o ID do auth.users a deletar — dois cenários possíveis:
    //
    // Caso A: clients.user_id preenchido — aluno aceitou o convite.
    //         link_client_user_id() já vinculou o auth.users ao clients.
    //
    // Caso B: clients.user_id NULL — aluno foi convidado mas ainda não aceitou.
    //         invite-client já criou o auth.users no momento do convite,
    //         mas link_client_user_id() só preenche clients.user_id após
    //         o aluno confirmar o e-mail. Neste caso buscamos auth.users pelo email.
    let authUserIdToDelete: string | null = client.user_id ?? null

    if (!authUserIdToDelete && client.email) {
      const res = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(client.email)}`,
        {
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey,
          }
        }
      )
      const { users } = await res.json()
      // filter retorna correspondências parciais — garantir match exato
      const found = (users ?? []).find((u: any) => u.email === client.email)
      if (found?.id) {
        authUserIdToDelete = found.id
        console.log(`[delete-client] auth.users encontrado por email (user_id estava NULL). auth_user_id=${found.id}`)
      }
    }

    // 4. Remove auth.users ANTES de deletar clients.
    // Ordem intencional: se deleteUser falhar, clients ainda existe e a operação
    // pode ser retentada sem deixar auth.users órfão.
    if (authUserIdToDelete) {
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(authUserIdToDelete)
      if (deleteUserError) {
        throw new Error("Erro ao remover acesso do aluno: " + deleteUserError.message)
      }
    }

    // 5. Deleta o registro em clients (CASCADE remove meal_plans, diet_preferences, assessments)
    const { error: deleteClientError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', client_id)

    if (deleteClientError) {
      throw new Error("Erro ao excluir o aluno: " + deleteClientError.message)
    }

    console.log(`[delete-client] Aluno ${client.name} (${client_id}) excluído pelo treinador ${trainer.id}. auth.users removido: ${!!authUserIdToDelete}`)

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
