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

    // Buscar usuarios que tem numero de WhatsApp salvo
    const allUsers = await base44.asServiceRole.entities.User.list();
    let targetUsers = allUsers.filter(u => u.whatsapp_phone_number);

    // Filtrar por publico alvo
    if (target_audience === 'premium') {
      targetUsers = targetUsers.filter(u => 
        u.subscription_status === 'premium' || u.subscription_status === 'trial'
      );
    } else if (target_audience === 'free') {
      targetUsers = targetUsers.filter(u => u.subscription_status === 'free');
    }

    console.log(`Tentando enviar WhatsApp para ${targetUsers.length} usuarios`);

    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    const formattedMessage = `*${title}*\n\n${message}`;

    // Buscar todas as conversas do agente
    const allConversations = await base44.asServiceRole.agents.listConversations({
      agent_name: 'fitness_coach'
    });

    console.log(`Total de conversas encontradas: ${allConversations.length}`);

    // Enviar mensagem para cada usuario
    for (const targetUser of targetUsers) {
      try {
        // Encontrar conversa do usuario
        const userConversation = allConversations.find(c => 
          c.user_email === targetUser.email
        );

        if (userConversation) {
          // Adicionar mensagem do assistente na conversa
          await base44.asServiceRole.agents.addMessage(userConversation, {
            role: 'assistant',
            content: formattedMessage
          });
          
          results.sent++;
          console.log(`✅ Enviado para ${targetUser.email}`);
        } else {
          console.log(`⚠️ Sem conversa WhatsApp para ${targetUser.email}`);
          results.failed++;
          results.errors.push({
            user: targetUser.email,
            error: 'Usuario nao tem conversa WhatsApp ativa'
          });
        }
      } catch (error) {
        console.error(`❌ Erro ao enviar para ${targetUser.email}:`, error);
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