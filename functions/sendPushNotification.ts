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

        const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
        const oneSignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

        if (!oneSignalAppId || !oneSignalApiKey) {
            console.error('❌ OneSignal keys não configuradas');
        }

        if (!vapidPublicKey || !vapidPrivateKey) {
            console.error('❌ VAPID keys não configuradas');
        }

        // Configurar WebPush para iOS
        webpush.setVapidDetails(
            'mailto:contato@iacoachfitness.com.br',
            vapidPublicKey,
            vapidPrivateKey
        );

        // Buscar todas as subscriptions (iOS WebPush e Android OneSignal)
        const iosSubscriptions = await base44.asServiceRole.entities.PushSubscription.list();
        const androidSubscriptions = await base44.asServiceRole.entities.OneSignalSubscription.list();
        const activeIOS = iosSubscriptions.filter(s => s.is_active);
        const activeAndroid = androidSubscriptions.filter(s => s.is_active);

        console.log(`📤 Enviando para ${activeIOS.length} iOS + ${activeAndroid.length} Android`);

        let iosSent = 0;
        let iosFailed = 0;
        let androidSent = 0;
        let androidFailed = 0;

        // ===== ENVIAR PARA iOS VIA WEBPUSH =====
        const payload = JSON.stringify({ title, message });

        for (const sub of activeIOS) {
            try {
                if (target_audience === 'premium' || target_audience === 'free') {
                    const users = await base44.asServiceRole.entities.User.list();
                    const targetUser = users.find(u => u.email === sub.user_email);
                    
                    if (target_audience === 'premium' && targetUser?.subscription_status !== 'premium') continue;
                    if (target_audience === 'free' && targetUser?.subscription_status === 'premium') continue;
                }

                if (!sub.subscription?.endpoint) {
                    console.log('⚠️ iOS subscription inválida:', sub.user_email);
                    continue;
                }

                await webpush.sendNotification(sub.subscription, payload);
                iosSent++;
                console.log('✅ iOS enviado para:', sub.user_email);
            } catch (error) {
                iosFailed++;
                console.error('❌ Erro iOS:', sub.user_email, error.message);
                
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await base44.asServiceRole.entities.PushSubscription.update(sub.id, { is_active: false });
                }
            }
        }

        // ===== ENVIAR PARA ANDROID VIA ONESIGNAL =====
        if (oneSignalAppId && oneSignalApiKey && activeAndroid.length > 0) {
            const users = await base44.asServiceRole.entities.User.list();
            const targetPlayerIds = [];

            for (const sub of activeAndroid) {
                try {
                    if (target_audience === 'premium' || target_audience === 'free') {
                        const targetUser = users.find(u => u.email === sub.user_email);
                        
                        if (target_audience === 'premium' && targetUser?.subscription_status !== 'premium') continue;
                        if (target_audience === 'free' && targetUser?.subscription_status === 'premium') continue;
                    }

                    targetPlayerIds.push(sub.player_id);
                } catch (error) {
                    console.error('❌ Erro filtrando Android:', sub.user_email, error.message);
                }
            }

            if (targetPlayerIds.length > 0) {
                try {
                    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Basic ${oneSignalApiKey}`
                        },
                        body: JSON.stringify({
                            app_id: oneSignalAppId,
                            include_player_ids: targetPlayerIds,
                            headings: { en: title },
                            contents: { en: message },
                            android_channel_id: 'fitness-notifications'
                        })
                    });

                    const oneSignalData = await oneSignalResponse.json();
                    
                    if (oneSignalData.id) {
                        androidSent = oneSignalData.recipients || targetPlayerIds.length;
                        console.log('✅ OneSignal enviado para:', androidSent, 'dispositivos Android');
                    } else {
                        androidFailed = targetPlayerIds.length;
                        console.error('❌ Erro OneSignal:', oneSignalData);
                    }
                } catch (error) {
                    androidFailed = targetPlayerIds.length;
                    console.error('❌ Erro chamando OneSignal API:', error.message);
                }
            }
        }

        const totalSent = iosSent + androidSent;
        const totalFailed = iosFailed + androidFailed;

        console.log(`📊 Resultado: ${totalSent} enviados (${iosSent} iOS + ${androidSent} Android), ${totalFailed} falhas`);

        return Response.json({ 
            success: true, 
            sent: totalSent,
            ios_sent: iosSent,
            android_sent: androidSent,
            failed: totalFailed,
            total: activeIOS.length + activeAndroid.length
        });

    } catch (error) {
        console.error('❌ Erro:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});