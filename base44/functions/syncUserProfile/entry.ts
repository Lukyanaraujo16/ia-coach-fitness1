import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Buscar se já existe um UserProfile para este usuário
        const existingProfiles = await base44.asServiceRole.entities.UserProfile.filter({
            user_email: user.email
        });

        const profileData = {
            user_email: user.email,
            nome_completo: user.nome_completo || user.full_name || '',
            objetivo: user.fitness_goal || null,
            nivel_fitness: user.fitness_level || null,
            peso_atual: user.current_weight || null,
            peso_meta: user.target_weight || null,
            altura: user.height || null,
            meta_calorica_diaria: user.daily_calorie_goal || null,
            meta_proteina: user.macro_protein_percentage ? Math.round((user.daily_calorie_goal || 2000) * (user.macro_protein_percentage / 100) / 4) : null,
            meta_treinos_semana: user.weekly_goal || null,
            restricoes_alimentares: user.allergies || [],
            preferencias_dieta: user.diet_preference || null,
            local_treino: user.training_location || null,
            subscription_status: user.subscription_status || 'free'
        };

        let result;
        if (existingProfiles && existingProfiles.length > 0) {
            // Atualizar perfil existente
            result = await base44.asServiceRole.entities.UserProfile.update(
                existingProfiles[0].id,
                profileData
            );
        } else {
            // Criar novo perfil
            result = await base44.asServiceRole.entities.UserProfile.create(profileData);
        }

        return Response.json({ 
            success: true, 
            message: existingProfiles?.length > 0 ? 'Perfil atualizado' : 'Perfil criado',
            profile: result 
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});