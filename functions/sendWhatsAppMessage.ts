import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { title, message, target_audience } = await req.json();

    if (!title || !message) {
      return Response.json({ error: 'Título e mensagem são obrigatórios' }, { status: 400 });
    }

    // Buscar usuários ativos com WhatsApp
    const allUsers = await base44.asServiceRole.entities.User.list();
    let targetUsers = allUsers.filter(u => u.whatsapp_coach_activated === true);

    // Filtrar por público alvo
    if (target_audience === 'premium') {
      targetUsers = targetUsers.filter(u => u.subscription_status === 'premium' || u.subscription_status === 'trial');
    } else if (target_audience === 'free') {
      targetUsers = targetUsers.filter(u => u.subscription_status === 'free');
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    // Enviar mensagem via Agent API
    for (const targetUser of targetUsers) {
      try {
        // Usar a API do agent para enviar mensagem
        await base44.asServiceRole.agents.sendMessage('fitness_coach', targetUser.email, {
          text: `*${title}*\n\n${message}`
        });
        results.sent++;
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