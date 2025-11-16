import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, message, target_audience } = await req.json();

        if (!title || !message) {
            return Response.json({ error: 'Title and message required' }, { status: 400 });
        }

        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

        if (!vapidPublicKey || !vapidPrivateKey) {
            return Response.json({ error: 'VAPID keys not configured' }, { status: 500 });
        }

        webpush.setVapidDetails(
            'mailto:contato@iacoachfitness.com.br',
            vapidPublicKey,
            vapidPrivateKey
        );

        const subscriptions = await base44.asServiceRole.entities.PushSubscription.list();
        const activeSubscriptions = subscriptions.filter(s => s.is_active);

        console.log(`📤 Enviando para ${activeSubscriptions.length} subscriptions`);

        let sent = 0;
        let failed = 0;

        const payload = JSON.stringify({ 
            title, 
            message,
            badge: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png'
        });

        for (const sub of activeSubscriptions) {
            try {
                if (target_audience === 'premium' || target_audience === 'free') {
                    const users = await base44.asServiceRole.entities.User.list();
                    const targetUser = users.find(u => u.email === sub.user_email);
                    
                    if (target_audience === 'premium' && targetUser?.subscription_status !== 'premium') continue;
                    if (target_audience === 'free' && targetUser?.subscription_status === 'premium') continue;
                }

                if (!sub.subscription?.endpoint) {
                    console.log('⚠️ Subscription inválida:', sub.user_email);
                    continue;
                }

                await webpush.sendNotification(sub.subscription, payload);
                sent++;
                console.log('✅ Enviado para:', sub.user_email);
            } catch (error) {
                failed++;
                console.error('❌ Erro enviando para', sub.user_email, ':', error.message);
                
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await base44.asServiceRole.entities.PushSubscription.update(sub.id, { is_active: false });
                }
            }
        }

        console.log(`📊 Resultado: ${sent} enviados, ${failed} falhas`);

        return Response.json({ 
            success: true, 
            sent, 
            failed,
            total: activeSubscriptions.length 
        });

    } catch (error) {
        console.error('❌ Erro:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});