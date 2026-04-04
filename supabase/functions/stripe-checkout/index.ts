import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"

// Puxa a chave secreta que vamos esconder no Supabase
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  // Configuração para permitir que o aplicativo converse com esta função (CORS)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Responde rapidamente a verificações de segurança do navegador/app
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Recebe qual plano o treinador quer assinar
    const { priceId, email, name } = await req.json()

    if (!priceId) throw new Error("ID do Preço do Stripe é obrigatório")

    // 1. Cria ou recupera o cliente no painel do Stripe
    const customer = await stripe.customers.create({
      email: email || 'treinador@vortexprimus.com',
      name: name || 'Treinador Vortex',
    })

    // 2. Cria uma chave temporária (efêmera) para o App
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { stripe_version: '2023-10-16' }
    )

    // 3. Prepara a Assinatura (fica aguardando o cartão no app)
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    const invoice = subscription.latest_invoice as any
    const paymentIntent = invoice.payment_intent

    // 4. Devolve os cadeados abertos para a tela do celular!
    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
      }),
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

