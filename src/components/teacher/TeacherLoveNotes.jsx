import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, Send, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherLoveNotes({ teacherId, user }) {
  const [notes, setNotes] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (teacherId) {
      loadNotes();
    }
  }, [teacherId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.TeacherLoveNote.filter({ teacher_id: teacherId }, "-created_date");
      setNotes(data);
    } catch (error) {
      console.error("Error loading love notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (!newMessage.trim()) return;

    setSending(true);

    try {
      // Modération positive stricte
      const moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un modérateur de bienveillance stricte.
Analyse le message suivant destiné à un professeur : "${newMessage}"

Ta mission : Accepter UNIQUEMENT les messages positifs, gentils, encourageants, de remerciement ou d'amour.
Tout ce qui est négatif, critique, insultant, neutre-froid, ou sarcastique doit être REJETÉ.
C'est une boîte à "mots doux", pas une boîte à critiques.

Réponds uniquement par un JSON :
{
  "decision": "approved" | "rejected",
  "reason": "raison du rejet en une phrase courte et gentille" (null si approved)
}`,
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
        toast.error(moderationResult.reason || "Oups ! Seuls les messages 100% positifs et bienveillants sont acceptés ici. ❤️");
        setSending(false);
        return;
      }

      await base44.entities.TeacherLoveNote.create({
        teacher_id: teacherId,
        message: newMessage,
        author_email: user.email,
        author_name: user.full_name,
        is_anonymous: false
      });

      setNewMessage("");
      setShowForm(false);
      toast.success("Message envoyé ! Merci pour cette bienveillance 💖");
      loadNotes();
    } catch (error) {
      console.error("Error sending note:", error);
      toast.error("Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-pink-200 shadow-lg w-full overflow-hidden relative">
      {/* Effet enveloppe décoratif */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-300 via-red-300 to-pink-300" />
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl text-pink-700">
            <Mail className="w-5 h-5" />
            Petit mot ❤️
          </CardTitle>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
            onClick={() => {
                if (!user) {
                    base44.auth.redirectToLogin(window.location.href);
                    return;
                }
                setShowForm(!showForm)
            }}
          >
            {showForm ? "Fermer" : "Écrire un mot"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                <p className="text-xs text-pink-600 mb-2 font-medium">
                  ✨ Ici, on ne partage que du love. Les messages négatifs sont automatiquement bloqués.
                </p>
                <Textarea
                  placeholder="Merci pour tout, vous êtes le meilleur prof..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="bg-white border-pink-200 focus:border-pink-400 min-h-[100px] mb-2"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSend} 
                    disabled={sending || !newMessage.trim()}
                    className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-md"
                    size="sm"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Envoyer du love
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-pink-300 animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-pink-400/70 italic text-sm">
            La boîte aux lettres est vide... Soyez le premier à déposer un petit mot ! 💌
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
            {notes.map((note) => (
              <div key={note.id} className="bg-gradient-to-br from-white to-pink-50 p-3 rounded-lg border border-pink-100 shadow-sm relative group hover:-translate-y-0.5 transition-transform duration-200">
                <Heart className="w-3 h-3 text-pink-300 absolute top-3 right-3 fill-pink-100" />
                <p className="text-slate-700 text-sm italic leading-relaxed mb-2">
                  "{note.message}"
                </p>
                <p className="text-xs text-pink-400 font-medium text-right">
                  — {note.is_anonymous ? "Anonyme" : note.author_name}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}