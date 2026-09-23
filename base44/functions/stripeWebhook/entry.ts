import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// Mapeamento de price IDs para planos
const PRICE_TO_PLAN = {
  'price_1SYD4eJ6x9PU8kTrIS9BEo5A': { plan: 'monthly', months: 1 },
  'price_1SYD7UJ6x9PU8kTrarXA9PYM': { plan: 'semiannual', months: 6 },
  'price_1SYD87J6x9PU8kTrhzVipsp3': { plan: 'annual', months: 12 },
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_email || session.customer_details?.email;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!customerEmail) {
          console.error('No customer email found in session');
          return Response.json({ error: 'No customer email' }, { status: 400 });
        }

        // Buscar usuário pelo email
        const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
        if (users.length === 0) {
          console.error('User not found:', customerEmail);
          return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const user = users[0];

        // Buscar detalhes da subscription para obter o price ID
        let planInfo = { plan: 'monthly', months: 1 };
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price?.id;
          if (priceId && PRICE_TO_PLAN[priceId]) {
            planInfo = PRICE_TO_PLAN[priceId];
          }
        }

        // Calcular data de fim da assinatura
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + planInfo.months);

        // Atualizar usuário
        await base44.asServiceRole.entities.User.update(user.id, {
          subscription_status: 'premium',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_plan: planInfo.plan,
          subscription_end_date: endDate.toISOString(),
          payment_failed: false,
          payment_failed_date: null,
        });

        console.log(`User ${customerEmail} upgraded to premium (${planInfo.plan})`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Buscar usuário pelo stripe_customer_id
        const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
        if (users.length === 0) {
          console.error('User not found for customer:', customerId);
          return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const user = users[0];

        // Marcar pagamento como falho
        await base44.asServiceRole.entities.User.update(user.id, {
          payment_failed: true,
          payment_failed_date: new Date().toISOString(),
        });

        console.log(`Payment failed for user ${user.email}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Buscar usuário pelo stripe_customer_id
        const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
        if (users.length === 0) {
          console.error('User not found for customer:', customerId);
          return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const user = users[0];

        // Verificar se não é vitalício antes de rebaixar
        if (user.subscription_status !== 'lifetime') {
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'free',
            stripe_subscription_id: null,
            subscription_plan: null,
            subscription_end_date: null,
          });

          console.log(`Subscription cancelled for user ${user.email}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Buscar usuário pelo stripe_customer_id
        const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
        if (users.length === 0) {
          console.error('User not found for customer:', customerId);
          return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const user = users[0];

        // Se a subscription foi renovada com sucesso, limpar flag de falha
        if (subscription.status === 'active') {
          const priceId = subscription.items.data[0]?.price?.id;
          let planInfo = { plan: 'monthly', months: 1 };
          if (priceId && PRICE_TO_PLAN[priceId]) {
            planInfo = PRICE_TO_PLAN[priceId];
          }

          const endDate = new Date(subscription.current_period_end * 1000);

          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'premium',
            subscription_plan: planInfo.plan,
            subscription_end_date: endDate.toISOString(),
            payment_failed: false,
            payment_failed_date: null,
          });

          console.log(`Subscription updated for user ${user.email}`);
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});