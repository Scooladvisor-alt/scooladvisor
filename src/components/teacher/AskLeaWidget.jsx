import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AskLeaWidget({ teacherName, reviews, showLeaDialog, setShowLeaDialog }) {
  const [loadingLea, setLoadingLea] = useState(true);
  const [leaSummary, setLeaSummary] = useState("");

  useEffect(() => {
    // Only attempt to fetch summary if the dialog is open
    if (!showLeaDialog) {
      setLeaSummary(""); // Clear summary when dialog is closed
      return;
    }

    let unsubscribe = () => {}; // Initialize unsubscribe function

    const fetchLeaSummary = async () => {
      setLoadingLea(true);
      setLeaSummary(""); // Clear previous summary while loading

      try {
        const conv = await base44.agents.createConversation({
          agent_name: "lea",
          metadata: { name: `Analyse de ${teacherName}` }
        });

        let firstMessageContent;

        if (!reviews || reviews.length === 0) {
          firstMessageContent = "Pas encore d'avis sur ce prof ! Sois le premier à donner ton ressenti 😎";
        } else {
          const reviewsSummary = reviews.map(r => ({
            workload: r.workload,
            friendliness: r.friendliness,
            teaching_method: r.teaching_method,
            grading_severity: r.grading_severity,
            total_rating: r.total_rating,
            comment: r.comment
          }));

          firstMessageContent = `Tu es Léa, une IA qui résume les avis des étudiants sur les profs et les établissements.

Ton rôle : faire une synthèse courte, stylée et pleine de personnalité, comme si tu racontais ça à un pote, avec de l'humour, du bon sens et des images qui parlent.

⚙️ Style et ton :
- 3 phrases max., rythmées et naturelles.
- Écris comme un étudiant malin, drôle et sincère.
- Utilise des expressions familières seulement si elles collent au contexte ("dinguerie" pour un prof ou une école très appréciés, "pas ouf" pour un ressenti moyen, "à côté de la plaque" pour un prof perdu, etc.).
- Ajoute parfois des métaphores originales liées à :
  • des animaux → "doux comme un agneau", "rapide comme un un faucon", "têtu comme une mule"...
  • des personnages historiques → "un vrai Napoléon de la pédagogie", "Socrate version 2025", "Colomb de la salle de classe".
  • des situations imagées → "c'est à se demander si c'est pas une boîte de nuit tellement l'ambiance est bonne", "on dirait une ruche tellement ça bosse ici", "c'est plus calme qu'un monastère un lundi matin".
- Les métaphores doivent avoir du sens et faire sourire, sans jamais être méchantes.
- Le ton est positif, sincère et un peu taquin, jamais moqueur ni sec.

🧭 Règle d'or :
- Toujours drôle, jamais gratuit.
- Toujours imagé, jamais faux.
- Et toujours avec le ton unique de L'avis de Léa.

Voici les avis sur ce professeur : ${JSON.stringify(reviewsSummary)}

Fais ton résumé maintenant en 3 phrases max.`;
        }

        await base44.agents.addMessage(conv, { role: "user", content: firstMessageContent });

        const waitForAssistantResponse = new Promise((resolve, reject) => {
          unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
            const assistantCompletedMessage = data.messages.find(
              (m) => m.role === 'assistant' && m.status === 'completed'
            );
            if (assistantCompletedMessage) {
              resolve(assistantCompletedMessage.content);
              unsubscribe(); // Unsubscribe after getting response
            }
            const assistantErrorMessage = data.messages.find(
              (m) => m.role === 'assistant' && m.status === 'error'
            );
            if (assistantErrorMessage) {
              reject(new Error("Antonin encountered an error: " + assistantErrorMessage.content));
              unsubscribe(); // Stop listening on error
            }
          });
        });

        const summary = await waitForAssistantResponse;
        setLeaSummary(summary);

      } catch (error) {
        console.error("Erreur lors de la génération du résumé d'Antonin", error);
        setLeaSummary("Désolé, Antonin est parti en pause café et n'a pas pu générer le résumé. Réessaye plus tard !");
      } finally {
        setLoadingLea(false);
      }
    };

    fetchLeaSummary();

    // Cleanup function: unsubscribe if component unmounts or dialog closes prematurely
    return () => {
      unsubscribe();
    };

  }, [teacherName, reviews, showLeaDialog]);

  return (
    <Dialog open={showLeaDialog} onOpenChange={setShowLeaDialog}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-2xl">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            L'avis d'Antonin 🤖 sur {teacherName}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 sm:py-6">
          {loadingLea ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-slate-600 text-sm sm:text-base">Antonin 🤖 analyse les avis...</p>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none prose-sm sm:prose-base">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 sm:p-6 border-2 border-purple-200">
                <p className="text-slate-800 leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
                  {leaSummary}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}