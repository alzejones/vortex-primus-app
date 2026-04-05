import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "npm:stripe@14.14.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { priceId, email, name } = await req.json()

    if (!priceId) throw new Error("ID do Preço do Stripe é obrigatório")

    // 1. Cria ou recupera o cliente
    const customer = await stripe.customers.create({
      email: email || 'treinador@vortexprimus.com',
      name: name || 'Treinador Vortex',
    })

    // 2. Gera a Sessão Universal de Checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      // Links para onde o Stripe vai devolver o usuário após pagar ou cancelar
      success_url: 'https://vortex-primus-app.vercel.app/(protected)', 
      cancel_url: 'https://vortex-primus-app.vercel.app/upgrade',
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

