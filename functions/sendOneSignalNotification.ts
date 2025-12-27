import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, message, target_audience, user_emails } = await req.json();

        if (!title || !message) {
            return Response.json({ error: 'Title and message required' }, { status: 400 });
        }

        const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
        const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

        if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
            return Response.json({ error: 'OneSignal not configured' }, { status: 500 });
        }

        // Preparar notificação
        const notification = {
            app_id: ONESIGNAL_APP_ID,
            headings: { en: title },
            contents: { en: message },
            url: 'https://iacoachfitness.com.br',
        };

        // Definir filtros de público
        if (user_emails && user_emails.length > 0) {
            // Enviar para usuários específicos
            notification.include_external_user_ids = user_emails;
        } else if (target_audience === 'all') {
            notification.included_segments = ['Subscribed Users'];
        } else if (target_audience === 'premium') {
            // Buscar usuários premium
            const users = await base44.asServiceRole.entities.User.list();
            const premiumEmails = users
                .filter(u => u.subscription_status === 'premium' || u.subscription_status === 'trial')
                .map(u => u.email);
            notification.include_external_user_ids = premiumEmails;
        } else if (target_audience === 'free') {
            // Buscar usuários free
            const users = await base44.asServiceRole.entities.User.list();
            const freeEmails = users
                .filter(u => !u.subscription_status || u.subscription_status === 'free')
                .map(u => u.email);
            notification.include_external_user_ids = freeEmails;
        } else {
            notification.included_segments = ['Subscribed Users'];
        }

        console.log('📤 Enviando notificação via OneSignal...');

        // Enviar via OneSignal API
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(notification),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Erro OneSignal:', result);
            return Response.json({ error: result.errors || 'Failed to send' }, { status: 500 });
        }

        console.log('✅ Notificação enviada:', result);

        return Response.json({ 
            success: true,
            recipients: result.recipients,
            id: result.id
        });

    } catch (error) {
        console.error('❌ Erro:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});