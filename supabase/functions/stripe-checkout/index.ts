import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "npm:stripe@14.14.0"
import { createClient } from "npm:@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { priceId, email, name, trainerId } = await req.json()

    if (!priceId) throw new Error("ID do Preço do Stripe é obrigatório")
    if (!trainerId) throw new Error("ID do Treinador é obrigatório")

    // 1. Busca o trainer no banco
    const { data: trainer } = await supabase
      .from('trainers')
      .select('stripe_customer_id')
      .eq('id', trainerId)
      .single()

    // 2. Reutiliza customer existente ou cria novo
    let customerId: string
    if (trainer?.stripe_customer_id) {
      customerId = trainer.stripe_customer_id
      console.log(`[Checkout] Reutilizando customer: ${customerId}`)
    } else {
      const customer = await stripe.customers.create({
        email: email || 'treinador@vortexprimus.com',
        name: name || 'Treinador Vortex',
      })
      customerId = customer.id
      console.log(`[Checkout] Novo customer criado: ${customerId}`)

      // Salva o customer_id no banco
      await supabase
        .from('trainers')
        .update({ stripe_customer_id: customerId })
        .eq('id', trainerId)
    }

    // 3. Verifica assinatura ativa existente
    const { data: existingSub } = await supabase
      .from('trainer_subscriptions')
      .select('stripe_subscription_id, plan_id, plans!inner(stripe_price_id)')
      .eq('trainer_id', trainerId)
      .eq('is_active', true)
      .in('status', ['active', 'trialing'])
      .not('stripe_subscription_id', 'is', null)
      .maybeSingle()

    if (existingSub?.stripe_subscription_id) {
      const existingPriceId = (existingSub as any).plans?.stripe_price_id

      // Se priceId diferente, cancela assinatura antiga
      if (existingPriceId && existingPriceId !== priceId) {
        console.log(`[Checkout] Cancelando assinatura antiga: ${existingSub.stripe_subscription_id}`)
        await stripe.subscriptions.cancel(existingSub.stripe_subscription_id, {
          prorate: true,
        })
      } else if (existingPriceId === priceId) {
        console.log(`[Checkout] Usuário já possui plano ${priceId}, prosseguindo normalmente`)
      }
    }

    // 4. Gera a Sessão Universal de Checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      client_reference_id: trainerId,
      // Links para onde o Stripe vai devolver o usuário após pagar ou cancelar
      success_url: 'https://vortex-primus.vercel.app/(protected)', 
      cancel_url: 'https://vortex-primus.vercel.app/upgrade',
    })

    // 3. Devolve apenas a URL (Link) da página de pagamento
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

