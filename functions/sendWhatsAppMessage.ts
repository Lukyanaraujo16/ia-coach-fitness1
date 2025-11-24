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

    const allUsers = await base44.asServiceRole.entities.User.list();
    let targetUsers = allUsers.filter(u => u.whatsapp_coach_activated === true);

    if (target_audience === 'premium') {
      targetUsers = targetUsers.filter(u =>
        u.subscription_status === 'premium' ||
        u.subscription_status === 'trial'
      );
    } else if (target_audience === 'free') {
      targetUsers = targetUsers.filter(u => u.subscription_status === 'free');
    }

    console.log(`Tentando enviar WhatsApp para ${targetUsers.length} usuarios`);

    const results = { sent: 0, failed: 0, errors: [] };

    const formattedMessage = `*${title}*\n\n${message}`;

    for (const targetUser of targetUsers) {
      try {
        let conversation;

        try {
          const list = await base44.asServiceRole.agents.conversations.list({
            agent_name: "fitness_coach",
            user_email: targetUser.email,
          });

          if (list && list.data && list.data.length > 0) {
            conversation = list.data[0];
          }
        } catch (_) {}

        if (!conversation) {
          conversation = await base44.asServiceRole.agents.conversations.create({
            agent_name: "fitness_coach",
            user_email: targetUser.email,
            metadata: { source: "admin_broadcast" }
          });
        }

        await base44.asServiceRole.agents.sendMessage({
          agent_name: "fitness_coach",
          user_email: targetUser.email,
          channel: "whatsapp",
          text: formattedMessage
        });

        results.sent++;
        console.log(`✅ Enviado para ${targetUser.email}`);

      } catch (error) {
        console.error(`❌ Erro ao enviar para ${targetUser.email}:`, error);
        results.failed++;
        results.errors.push({ user: targetUser.email, error: error.message });
      }
    }

    return Response.json({
      success: true,
      ...results,
      total_target: targetUsers.length
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});
