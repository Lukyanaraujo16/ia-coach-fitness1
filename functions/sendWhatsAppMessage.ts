import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { title, message, target_audience } = await req.json();

    if (!title || !message) {
      return Response.json({ error: 'Titulo e mensagem sao obrigatorios' }, { status: 400 });
    }

    // Buscar usuarios ativos com WhatsApp
    const allUsers = await base44.asServiceRole.entities.User.list();
    let targetUsers = allUsers.filter(u => 
      u.whatsapp_coach_activated === true && 
      u.whatsapp && 
      u.whatsapp.trim() !== ''
    );

    // Filtrar por publico alvo
    if (target_audience === 'premium') {
      targetUsers = targetUsers.filter(u => 
        u.subscription_status === 'premium' || u.subscription_status === 'trial'
      );
    } else if (target_audience === 'free') {
      targetUsers = targetUsers.filter(u => u.subscription_status === 'free');
    }

    console.log(`Enviando para ${targetUsers.length} usuarios via WhatsApp`);

    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    // Enviar mensagem via WhatsApp usando o numero do usuario
    // Nota: Base44 agents envia automaticamente via WhatsApp para usuarios conectados
    for (const targetUser of targetUsers) {
      try {
        const formattedMessage = `*${title}*\n\n${message}`;
        
        // Tentar enviar via API do WhatsApp do agent
        const response = await fetch(
          `https://base44.app/api/apps/${Deno.env.get('BASE44_APP_ID')}/agents/fitness_coach/send-message`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({
              user_email: targetUser.email,
              message: formattedMessage
            })
          }
        );

        if (response.ok) {
          results.sent++;
          console.log(`Enviado para ${targetUser.email}`);
        } else {
          const error = await response.text();
          console.error(`Erro ao enviar para ${targetUser.email}:`, error);
          results.failed++;
          results.errors.push({
            user: targetUser.email,
            error: error
          });
        }
      } catch (error) {
        console.error(`Erro ao enviar para ${targetUser.email}:`, error);
        results.failed++;
        results.errors.push({
          user: targetUser.email,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      total_target: targetUsers.length,
      errors: results.errors
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});