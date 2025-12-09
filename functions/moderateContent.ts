import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { text, type, id, userId, userEmail } = await req.json();

        // 1. Modération via LLM
        const moderationPrompt = `
        Tu es un modérateur de contenu pour une plateforme scolaire.
        Analyse le texte suivant : "${text}"
        
        Règles :
        - Les critiques sont autorisées si elles ne sont pas insultantes.
        - Refuse : Insultes, haine, racisme, harcèlement, données privées (numéro de tél, adresse perso), spam.
        - Accepte : Avis négatifs constructifs, argot léger, critiques sur l'enseignement ou la cantine.
        
        Réponds UNIQUEMENT un JSON :
        {
            "allowed": boolean,
            "reason": "string (court, en français, expliquant le refus si false, sinon null)"
        }`;

        const llmResponse = await base44.integrations.Core.InvokeLLM({
            prompt: moderationPrompt,
            response_json_schema: {
                type: "object",
                properties: {
                    allowed: { type: "boolean" },
                    reason: { type: "string" }
                }
            }
        });

        const result = typeof llmResponse === 'string' ? JSON.parse(llmResponse) : llmResponse;

        // 2. Si contenu accepté, on s'arrête là
        if (result.allowed) {
            return Response.json({ allowed: true });
        }

        // 3. Si contenu refusé : Actions via Service Role (Admin)
        const adminClient = base44.asServiceRole;

        // Récupérer l'élément pour avoir les IDs parents (school_id, teacher_id) avant suppression
        let item = null;
        let parentId = null;

        if (type === 'school_review') {
            const items = await adminClient.entities.SchoolReview.filter({ id });
            item = items[0];
            parentId = item?.school_id;
        } else if (type === 'teacher_review') {
            const items = await adminClient.entities.TeacherReview.filter({ id });
            item = items[0];
            parentId = item?.teacher_id;
        }

        // A. Supprimer le contenu (Suppression de la base de données comme demandé)
        if (type === 'school_review') {
            await adminClient.entities.SchoolReview.delete(id);
        } else if (type === 'teacher_review') {
            await adminClient.entities.TeacherReview.delete(id);
        } else if (type === 'chat_message') {
            await adminClient.entities.ChatMessage.delete(id);
        } else if (type === 'national_message') {
            await adminClient.entities.NationalMessage.delete(id);
        }

        // B. Recalculer les statistiques si c'est un avis
        if (parentId) {
            if (type === 'school_review') {
                const reviews = await adminClient.entities.SchoolReview.filter({ school_id: parentId, status: 'published' });
                const count = reviews.length;
                const avgRating = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
                
                await adminClient.entities.School.update(parentId, {
                    average_rating: avgRating,
                    review_count: count
                });
            } else if (type === 'teacher_review') {
                const reviews = await adminClient.entities.TeacherReview.filter({ teacher_id: parentId, status: 'published' });
                const count = reviews.length;
                
                if (count === 0) {
                    await adminClient.entities.Teacher.update(parentId, {
                        workload_avg: 0,
                        friendliness_avg: 0,
                        teaching_avg: 0,
                        grading_avg: 0,
                        average_rating: 0,
                        review_count: 0
                    });
                } else {
                    const avg = (key) => reviews.reduce((sum, r) => sum + r[key], 0) / count;
                    const workload_avg = avg('workload');
                    const friendliness_avg = avg('friendliness');
                    const teaching_avg = avg('teaching_method');
                    const grading_avg = avg('grading_severity');
                    const average_rating = workload_avg + friendliness_avg + teaching_avg + grading_avg;

                    await adminClient.entities.Teacher.update(parentId, {
                        workload_avg,
                        friendliness_avg,
                        teaching_avg,
                        grading_avg,
                        average_rating,
                        review_count: count
                    });
                }
            }
        }

        // C. Notification à l'utilisateur
        await adminClient.entities.Notification.create({
            user_email: userEmail,
            title: "Avis supprimé par la modération",
            message: `Votre contenu a été supprimé car il ne respectait pas nos règles : ${result.reason || "Non-respect de la charte"}.`,
            type: "system",
            is_read: false
        });

        // D. Gérer l'utilisateur (Avertissements & Ban)
        const users = await adminClient.entities.User.filter({ email: userEmail });
        const user = users[0];

        if (user) {
            const newWarningsCount = (user.warnings_count || 0) + 1;
            let updates = { warnings_count: newWarningsCount };

            // Si 3 avertissements ou plus -> BAN
            if (newWarningsCount >= 3) {
                const banEndDate = new Date();
                banEndDate.setDate(banEndDate.getDate() + 7); // Ban de 7 jours
                
                updates.is_banned = true;
                updates.banned_until = banEndDate.toISOString();
            }

            await adminClient.entities.User.update(user.id, updates);
            
            return Response.json({ 
                allowed: false, 
                reason: result.reason,
                warnings_count: newWarningsCount,
                is_banned: updates.is_banned || false,
                banned_until: updates.banned_until
            });
        }

        return Response.json({ allowed: false, reason: result.reason });

    } catch (error) {
        console.error("Moderation error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});