import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { type, id, text, userId, userEmail } = await req.json();

        // 1. Select Prompt based on type
        let prompt = "";
        let systemPrompt = "Tu es Modérator, l'IA de modération de ScoolAdvisor.";
        
        if (type === 'teacher_review') {
            prompt = `
📝 Contenu à analyser : "${text}"
Type: Avis sur un professeur

🎯 Mission : Analyser ce contenu et décider s'il respecte la charte de ScoolAdvisor avec FLEXIBILITÉ MAXIMALE.
RÈGLES :
✅ Accepter LARGEMENT : Ton direct/familier/sévère, critique MÊME TRÈS SÉVÈRE, opinions/ressentis personnels, termes descriptifs comme "incompétent", "sévère", "dur", "strict", "note sévèrement", "notation difficile", "exigeant", "gauchiste" (si pas haineux), descriptions comportementales négatives ("crie", "stresse", "fait des différences").
❌ Rejeter UNIQUEMENT : Insultes violentes/déshumanisantes ("merde humaine", "rat", "déchet"), attaques personnelles visant à détruire la personne, discrimination (origine/religion/genre/handicap), appel à la haine/violence, données personnelles privées, accusations criminelles graves sans preuve (viol, harcèlement sexuel).

EN CAS DE DOUTE → APPROUVE. La modération doit filtrer seulement ce qui est CLAIREMENT haineux/violent/illégal.

Réponds UNIQUEMENT par JSON : { "decision": "approved" | "rejected", "reason": "motif si rejeté" }
`;
        } else if (type === 'school_review') {
            prompt = `
📝 Contenu à analyser : "${text}"
Type: Avis sur un établissement

🎯 Mission : Analyser ce contenu et décider s'il respecte la charte.
RÈGLES :
✅ Accepter : Ton cash/familier, critique organisation/ambiance, généralisations culturelles (si pas haineux).
❌ Rejeter : Insultes violentes, discrimination, haine, diffamation grave, données personnelles.

Réponds UNIQUEMENT par JSON : { "decision": "approved" | "rejected", "reason": "motif si rejeté" }
`;
        } else if (type === 'teacher_creation') {
             prompt = `
📝 Contenu à analyser : Nom: "${text.name}", Matière: "${text.subject}"
Type: Création de professeur

🎯 Mission : Vérifier si le nom et la matière semblent légitimes.
RÈGLES :
✅ Accepter : Noms crédibles, matières scolaires.
❌ Rejeter : Noms injurieux, faux noms évidents ("M. Caca"), matières absurdes ou insultantes.

Réponds UNIQUEMENT par JSON : { "decision": "approved" | "rejected", "reason": "motif si rejeté" }
`;
        }

        // 2. Invoke LLM
        const moderationResult = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    decision: { type: "string", enum: ["approved", "rejected"] },
                    reason: { type: "string" }
                },
                required: ["decision"]
            }
        });

        const decision = moderationResult.decision;
        console.log(`Moderation result for ${type} ${id}: ${decision}`);

        // 3. If Rejected, Update Entity & Notify
        if (decision === 'rejected') {
            // Use service role to ensure we can update regardless of RLS (though user should be able to update own)
            // But 'status' might be protected in future RLS.
            const adminClient = base44.asServiceRole;

            if (type === 'teacher_review') {
                await adminClient.entities.TeacherReview.update(id, { status: 'rejected' });
            } else if (type === 'school_review') {
                await adminClient.entities.SchoolReview.update(id, { status: 'rejected' });
            } else if (type === 'teacher_creation') {
                 // For teachers, maybe we mark as rejected or deleted?
                 // User said "message bloqué... grisé". For teacher creation usually we might just hide it.
                 await adminClient.entities.Teacher.update(id, { status: 'rejected' });
            }

            // Notification
            if (userEmail) {
                await adminClient.entities.Notification.create({
                    user_email: userEmail,
                    title: "Contenu refusé",
                    message: `Votre publication a été refusée par la modération : ${moderationResult.reason || "Non-respect de la charte"}.`,
                    type: "report",
                    is_read: false
                });
            }
        }

        return Response.json({ success: true, decision, reason: moderationResult.reason });

    } catch (error) {
        console.error("Moderation function error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});