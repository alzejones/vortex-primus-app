import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function friendlyInviteError(msg: string): string | null {
  if (
    msg.includes('already been invited') ||
    msg.includes('already been registered') ||
    msg.includes('already registered')
  ) return "Este aluno já possui acesso ao sistema. Oriente-o a usar a opção Esqueci minha senha."

  if (msg.includes('Database error saving new user'))
    return "Erro ao criar acesso. Tente novamente ou contate o suporte."

  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { client_id, channel = 'email' } = body

    const authHeader = req.headers.get('Authorization')
    console.log('[invite-client] body recebido:', JSON.stringify(body))
    console.log('[invite-client] Authorization header presente:', !!authHeader)
    console.log('[invite-client] Token (primeiros 27 chars):', authHeader?.slice(0, 27) ?? 'AUSENTE')

    if (!client_id) {
      console.error('[invite-client] ERRO: client_id ausente no body')
      throw new Error("client_id é obrigatório")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 1. Busca o cliente
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, name, email, trainer_id')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      console.error('[invite-client] ERRO: cliente não encontrado. client_id:', client_id, '| DB error:', clientError?.message)
      throw new Error("Cliente não encontrado")
    }

    console.log('[invite-client] Cliente encontrado:', client.id, '| email:', client.email, '| trainer_id:', client.trainer_id)

    if (!client.email) {
      console.error('[invite-client] ERRO: cliente sem e-mail. client_id:', client_id)
      throw new Error("Este cliente não possui e-mail cadastrado")
    }

    // 2. Valida o treinador
    if (!authHeader) {
      console.error('[invite-client] ERRO: Authorization header ausente')
      throw new Error("Não autorizado")
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      console.error('[invite-client] ERRO: token inválido. userError:', userError?.message)
      throw new Error("Sessão inválida")
    }

    console.log('[invite-client] Usuário autenticado:', user.id)

    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (trainerError || !trainer || trainer.id !== client.trainer_id) {
      console.error('[invite-client] ERRO: acesso negado. trainer:', trainer?.id, '| client.trainer_id:', client.trainer_id)
      throw new Error("Acesso negado: este aluno não pertence ao seu perfil")
    }

    console.log('[invite-client] Autorização OK. Canal:', channel)

    const inviteOptions = {
      data: { role: 'client', client_id: client.id },
      redirectTo: 'https://vortex-primus-app.vercel.app/',
    }

    // 3a. Canal e-mail: Supabase envia o e-mail automaticamente
    if (channel === 'email') {
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        client.email,
        inviteOptions
      )

      if (inviteError) {
        console.error('[invite-client] ERRO: inviteUserByEmail falhou:', inviteError.message)
        const friendly = friendlyInviteError(inviteError.message)
        throw new Error(friendly ?? "Erro ao enviar convite: " + inviteError.message)
      }

      console.log('[invite-client] E-mail de convite enviado para:', client.email)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 3b. Canal WhatsApp: gera o link sem enviar e-mail
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: client.email,
      options: inviteOptions,
    })

    if (linkError) {
      console.error('[invite-client] ERRO: generateLink falhou:', linkError.message)
      const friendly = friendlyInviteError(linkError.message)
      throw new Error(friendly ?? "Erro ao gerar link de convite: " + linkError.message)
    }

    const invite_link = linkData?.properties?.action_link
    if (!invite_link) {
      console.error('[invite-client] ERRO: action_link ausente na resposta do generateLink')
      throw new Error("Erro ao gerar link de convite. Tente novamente.")
    }

    console.log('[invite-client] Link de convite gerado com sucesso para:', client.email)

    return new Response(
      JSON.stringify({ success: true, invite_link }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
