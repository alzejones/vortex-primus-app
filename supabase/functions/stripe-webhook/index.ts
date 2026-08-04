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
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`[Webhook] Received event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const trainerId = session.client_reference_id
        const subscriptionId = session.subscription as string

        if (!trainerId) {
          console.error('[Webhook] Missing trainerId in checkout.session.completed')
          return new Response('Missing trainerId', { status: 400 })
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id

        const { data: plan } = await supabase
          .from('plans')
          .select('id')
          .eq('stripe_price_id', priceId)
          .single()

        if (!plan) {
          console.error(`[Webhook] Plan not found for priceId: ${priceId}`)
          return new Response('Plan not found', { status: 404 })
        }

        await supabase
          .from('trainer_subscriptions')
          .update({ is_active: false })
          .eq('trainer_id', trainerId)
          .eq('is_active', true)

        const { error } = await supabase
          .from('trainer_subscriptions')
          .insert({
            trainer_id: trainerId,
            plan_id: plan.id,
            stripe_subscription_id: subscriptionId,
            is_active: true,
            start_date: new Date().toISOString(),
          })

        if (error) {
          console.error('[Webhook] Error inserting subscription:', error)
          return new Response('Database error', { status: 500 })
        }

        console.log(`[Webhook] Subscription created for trainer ${trainerId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id
        const status = subscription.status

        const { error } = await supabase
          .from('trainer_subscriptions')
          .update({ 
            is_active: status === 'active',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId)

        if (error) {
          console.error('[Webhook] Error updating subscription:', error)
        }

        console.log(`[Webhook] Subscription ${subscriptionId} updated to status: ${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        const { error } = await supabase
          .from('trainer_subscriptions')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId)

        if (error) {
          console.error('[Webhook] Error deactivating subscription:', error)
        }

        console.log(`[Webhook] Subscription ${subscriptionId} deleted`)
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('[Webhook] Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
