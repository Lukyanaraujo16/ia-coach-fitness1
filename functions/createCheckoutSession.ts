import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));

// Mapeamento de planos para price IDs
const PLAN_PRICES = {
  monthly: 'price_1SYD4eJ6x9PU8kTrIS9BEo5A',
  semiannual: 'price_1SYD7UJ6x9PU8kTrarXA9PYM',
  annual: 'price_1SYD87J6x9PU8kTrhzVipsp3',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, successUrl, cancelUrl } = await req.json();

    if (!plan || !PLAN_PRICES[plan]) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId = PLAN_PRICES[plan];

    // Criar ou recuperar customer no Stripe
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || user.nome_completo,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Salvar customer ID no usuário
      await base44.entities.User.update(user.id, {
        stripe_customer_id: customerId,
      });
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/page/Dashboard?payment=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/page/Subscription?payment=cancelled`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          user_email: user.email,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'pt-BR',
    });

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});