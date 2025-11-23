import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação (apenas admin ou chamadas automáticas)
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        return Response.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }
    
    // Obter todos os usuários ativos
    const users = await base44.asServiceRole.entities.User.list();
    const activeUsers = users.filter(u => u.onboarding_completed && u.is_active !== false);
    
    const results = [];
    
    for (const user of activeUsers) {
      try {
        // Buscar treinos dos últimos 7 dias
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        const allLogs = await base44.asServiceRole.entities.WorkoutLog.list('-date');
        const userLogs = allLogs.filter(log => 
          (log.user_email === user.email || log.created_by === user.email) &&
          log.date >= weekAgoStr
        );
        
        // Pular usuários sem treinos na semana
        if (userLogs.length === 0) {
          continue;
        }
        
        const allProgress = await base44.asServiceRole.entities.ProgressEntry.list('-date');
        const userProgress = allProgress.filter(entry => 
          entry.created_by === user.email &&
          entry.date >= weekAgoStr
        );
        
        // Preparar contexto para a IA
        const context = {
          user: {
            name: user.nome_completo,
            goal: user.fitness_goal,
            level: user.fitness_level,
            weekly_goal: user.weekly_goal,
            current_weight: user.current_weight,
            weight_goal: user.weight_goal,
          },
          workouts_this_week: userLogs.length,
          workouts_data: userLogs.map(log => ({
            title: log.workout_title,
            date: log.date,
            duration: log.duration_minutes,
            exercises: log.exercises_completed?.map(ex => ({
              name: ex.exercise_name,
              sets: ex.sets_completed,
              max_weight: ex.max_weight,
            })) || [],
          })),
          progress_data: userProgress.map(p => ({
            date: p.date,
            weight: p.weight,
            mood: p.mood,
            notes: p.notes,
          })),
        };

        const prompt = `Você é um treinador fitness experiente analisando o progresso semanal de um aluno.

CONTEXTO DO ALUNO:
${JSON.stringify(context, null, 2)}

Analise o desempenho desta semana e forneça insights detalhados sobre:

1. **Consistência**: O aluno atingiu a meta semanal de ${user.weekly_goal} treinos?
2. **Progressão de Carga**: Houve aumento nas cargas utilizadas?
3. **Pontos Fortes**: O que o aluno está fazendo bem?
4. **Áreas de Melhoria**: Onde pode melhorar?
5. **Tendências**: Padrões observados no comportamento de treino
6. **Recomendações Específicas**: 3 ações práticas para a próxima semana

Seja específico, use dados concretos e seja motivacional mas realista.`;

        const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: prompt,
          response_json_schema: {
            type: "object",
            properties: {
              consistency_score: {
                type: "number",
                description: "Score de 0-10 de consistência"
              },
              consistency_analysis: {
                type: "string",
                description: "Análise da consistência"
              },
              load_progression: {
                type: "string",
                description: "Análise de progressão de carga"
              },
              strengths: {
                type: "array",
                items: { type: "string" },
                description: "Pontos fortes identificados"
              },
              improvements: {
                type: "array",
                items: { type: "string" },
                description: "Áreas para melhorar"
              },
              trends: {
                type: "string",
                description: "Tendências observadas"
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
                description: "Recomendações para próxima semana"
              },
              motivational_message: {
                type: "string",
                description: "Mensagem motivacional personalizada"
              }
            }
          }
        });
        
        // Salvar análise como se fosse criada pelo usuário
        const analysisData = {
          analysis_data: response,
          week_start: weekAgoStr,
          workouts_count: userLogs.length,
          created_by: user.email,
        };
        
        await base44.asServiceRole.entities.WeeklyAnalysis.create(analysisData);
        
        results.push({
          user_email: user.email,
          status: 'success',
          workouts: userLogs.length
        });
        
      } catch (error) {
        results.push({
          user_email: user.email,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return Response.json({
      success: true,
      processed: results.length,
      results: results
    });
    
  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});