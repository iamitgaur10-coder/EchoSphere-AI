
// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    if (!STRIPE_SECRET_KEY) {
        console.error("Missing STRIPE_SECRET_KEY");
        throw new Error("Server Configuration Error: STRIPE_SECRET_KEY is missing from Supabase Secrets.")
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { plan } = await req.json()
    
    // --- CONFIGURATION REQUIRED ---
    // 1. Create a Product in Stripe Dashboard
    // 2. Create a Price for that product
    // 3. Copy the Price ID (starts with price_...)
    // 4. Paste it below
    const prices: Record<string, string> = {
        'pro': 'price_REPLACE_WITH_REAL_ID_PRO',      
        'enterprise': 'price_REPLACE_WITH_REAL_ID_ENT' 
    }

    const priceId = prices[plan]
    
    // Check for unconfigured IDs
    if (priceId && priceId.includes('REPLACE_WITH_REAL_ID')) {
        throw new Error(`Stripe Price ID for '${plan}' plan is not configured in the Edge Function. Please update create-checkout-session/index.ts`);
    }

    if (!priceId && plan !== 'free') throw new Error("Invalid plan selected")

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/?status=success`,
      cancel_url: `${req.headers.get('origin')}/?status=cancelled`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Stripe Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})