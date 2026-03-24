import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { entityType, entityId, content, context } = await req.json();

    // Vérifier si c'est l'admin (exemption)
    const user = await base44.auth.me();
    if (user && user.email === 'antownin@gmail.com') {
      return Response.json({ status: 'approved' });
    }

    // Définir les prompts selon le type de contenu
    let moderationPrompt = '';
    
    if (entityType === 'TeacherReview' || entityType === 'SchoolReview') {
      moderationPrompt = `Tu es Modérateur, l'IA de ScoolAdvisor.

Contenu à analyser : "${content}"

Mission : Vérifier si cet avis respecte les règles.

🚫 INTERDIT :
- Grossièretés, insultes, vulgarité
- Discrimination (sexe, origine, religion, physique)
- Harcèlement ou moquerie
- Diffamation grave
- Informations personnelles
- Propos sexuels, violents ou politiques extrêmes
- Langage dénigrant ou humiliant

✅ AUTORISÉ :
- Critiques constructives et respectueuses
- Opinions personnelles exprimées avec respect
- Retours d'expérience honnêtes

Réponds par JSON : { "decision": "approved" | "rejected", "reason": "raison courte si rejeté" }`;
    } else if (entityType === 'ChatMessage' || entityType === 'NationalMessage') {
      moderationPrompt = `Tu es Modérateur, l'IA de ScoolAdvisor.

Contenu à analyser : "${content}"

Type: Message dans ${entityType === 'ChatMessage' ? 'chat établissement' : 'micro national'}

🚫 INTERDIT :
- Grossièretés, insultes, vulgarité
- Discrimination
- Harcèlement
- Diffamation
- Infos personnelles
- Propos sexuels/violents
- Spam

✅ AUTORISÉ :
- Messages respectueux
- Partage de souvenirs positifs
- Opinions constructives

Réponds par JSON : { "decision": "approved" | "rejected", "reason": "raison courte si rejeté" }`;
    } else if (entityType === 'TeacherLoveNote') {
      moderationPrompt = `Tu es modérateur pour une boîte à mots doux.

Contenu : "${content}"

Mission : Accepter TOUT message positif, encourageant, remerciement.
Accepter : compliments, argot positif (boss, goat, légende), humour bienveillant.
Rejeter : critiques, insultes, sarcasme, messages neutres/froids.

Réponds par JSON : { "decision": "approved" | "rejected", "reason": "raison courte si rejeté" }`;
    }

    // Appeler l'IA de modération
    const moderationResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: moderationPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          decision: { type: "string", enum: ["approved", "rejected"] },
          reason: { type: "string", nullable: true }
        },
        required: ["decision"]
      }
    });

    if (moderationResult.decision === 'rejected') {
      // Mettre à jour l'entité pour la marquer comme rejetée
      if (entityType === 'TeacherReview' || entityType === 'SchoolReview') {
        await base44.asServiceRole.entities[entityType].update(entityId, {
          status: 'hidden'
        });
      } else if (entityType === 'ChatMessage' || entityType === 'NationalMessage') {
        await base44.asServiceRole.entities[entityType].update(entityId, {
          is_deleted: true
        });
      } else if (entityType === 'TeacherLoveNote') {
        await base44.asServiceRole.entities[entityType].delete(entityId);
      }

      // Notifier l'utilisateur
      if (user) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: user.email,
          title: "Contenu modéré",
          message: `Votre ${getContentLabel(entityType)} a été supprimé : ${moderationResult.reason || 'non conforme aux règles'}`,
          type: "warning",
          is_read: false
        });

        // Incrémenter le compteur de violations
        const violations = (user.violation_count || 0) + 1;
        await base44.asServiceRole.entities.User.update(user.id, {
          violation_count: violations
        });
      }
    }

    return Response.json({ 
      status: moderationResult.decision,
      reason: moderationResult.reason 
    });

  } catch (error) {
    console.error("Error in async moderation:", error);
    return Response.json({ 
      error: error.message,
      status: 'error' 
    }, { status: 500 });
  }
});

function getContentLabel(entityType) {
  const labels = {
    TeacherReview: 'avis professeur',
    SchoolReview: 'avis établissement',
    ChatMessage: 'message',
    NationalMessage: 'message',
    TeacherLoveNote: 'petit mot'
  };
  return labels[entityType] || 'contenu';
}