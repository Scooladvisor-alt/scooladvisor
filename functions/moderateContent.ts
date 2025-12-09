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

        // A. Supprimer ou masquer le contenu
        if (type === 'school_review') {
            await adminClient.entities.SchoolReview.update(id, { status: 'rejected' });
        } else if (type === 'teacher_review') {
            await adminClient.entities.TeacherReview.update(id, { status: 'rejected' });
        } else if (type === 'chat_message') {
            await adminClient.entities.ChatMessage.update(id, { is_deleted: true });
        } else if (type === 'national_message') {
            await adminClient.entities.NationalMessage.update(id, { is_deleted: true });
        }

        // B. Gérer l'utilisateur (Avertissements & Ban)
        // On récupère l'utilisateur à jour via son email (le plus fiable pour trouver l'user record)
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