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

        console.log(`📤 Total de subscriptions: ${activeSubscriptions.length}`);
        console.log(`🎯 Target audience: ${target_audience || 'all'}`);

        // Buscar usuários uma vez só
        const allUsers = await base44.asServiceRole.entities.User.list();

        let sent = 0;
        let failed = 0;
        let skipped = 0;

        const payload = JSON.stringify({ title, message });

        for (const sub of activeSubscriptions) {
            try {
                console.log(`\n📧 Processando: ${sub.user_email}`);
                
                // Filtrar por target_audience
                if (target_audience && target_audience !== 'all') {
                    const targetUser = allUsers.find(u => u.email === sub.user_email);
                    console.log(`👤 User status: ${targetUser?.subscription_status || 'free'}`);
                    
                    if (target_audience === 'premium') {
                        const isPremium = targetUser?.subscription_status === 'premium' || 
                                        targetUser?.subscription_status === 'trial' || 
                                        targetUser?.subscription_status === 'lifetime';
                        if (!isPremium) {
                            console.log('⏭️ Pulando: não é premium');
                            skipped++;
                            continue;
                        }
                    } else if (target_audience === 'free') {
                        const isPremium = targetUser?.subscription_status === 'premium' || 
                                        targetUser?.subscription_status === 'trial' || 
                                        targetUser?.subscription_status === 'lifetime';
                        if (isPremium) {
                            console.log('⏭️ Pulando: é premium');
                            skipped++;
                            continue;
                        }
                    }
                }

                if (!sub.endpoint) {
                    console.log('⚠️ Subscription sem endpoint');
                    skipped++;
                    continue;
                }

                // Parse subscription JSON
                let subscriptionObj;
                try {
                    subscriptionObj = JSON.parse(sub.subscription_json);
                    console.log('📦 Subscription parseada:', subscriptionObj.endpoint);
                } catch (e) {
                    console.error('❌ Erro ao parsear subscription:', e);
                    skipped++;
                    continue;
                }

                console.log('📮 Enviando push...');
                await webpush.sendNotification(subscriptionObj, payload);
                sent++;
                console.log('✅ Enviado com sucesso!');
            } catch (error) {
                failed++;
                console.error('❌ Erro:', error.message);
                console.error('Stack:', error.stack);
                
                if (error.statusCode === 410 || error.statusCode === 404) {
                    console.log('🗑️ Desativando subscription inválida');
                    await base44.asServiceRole.entities.PushSubscription.update(sub.id, { is_active: false });
                }
            }
        }
        
        console.log(`\n📊 RESULTADO FINAL:`);
        console.log(`✅ Enviados: ${sent}`);
        console.log(`❌ Falhas: ${failed}`);
        console.log(`⏭️ Pulados: ${skipped}`);

        return Response.json({ 
            success: true, 
            sent, 
            failed,
            skipped,
            total: activeSubscriptions.length 
        });

    } catch (error) {
        console.error('❌ Erro:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});