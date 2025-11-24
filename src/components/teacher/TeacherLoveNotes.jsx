import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, Send, Loader2, Mail, Trash2 } from "lucide-react";
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
      const moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un modérateur pour une "boîte à mots doux".
Analyse le message : "${newMessage}"

Mission : Accepter TOUT message positif, encourageant, remerciement ou admiration.
Accepter : compliments, argot positif (boss, goat, masterclass, légende), humour bienveillant.
Rejeter : critiques, insultes, sarcasme, messages neutres/froids, harcèlement.

Réponds par JSON : { "decision": "approved" | "rejected", "reason": "raison courte" }`,
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
        toast.error(moderationResult.reason || "Message pas assez positif !");
        const violationCount = (user.violation_count || 0) + 1;
        await base44.auth.updateMe({ violation_count: violationCount });
        await base44.entities.Notification.create({
          user_email: user.email,
          title: "Message refusé",
          message: `Ton petit mot a été refusé : ${moderationResult.reason}`,
          type: "report",
          is_read: false
        });
        setSending(false);
        return;
      }

      await base44.entities.TeacherLoveNote.create({
        teacher_id: teacherId,
        message: newMessage,
        author_email: user.email,
        author_name: user.full_name,
        is_anonymous: true
      });

      setNewMessage("");
      setShowForm(false);
      toast.success("Message envoyé ! 💖");
      loadNotes();
    } catch (error) {
      console.error("Error sending note:", error);
      toast.error("Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!confirm("Supprimer votre petit mot ?")) return;
    try {
      await base44.entities.TeacherLoveNote.delete(noteId);
      toast.success("Message supprimé.");
      loadNotes();
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const hasUserPosted = user && notes.some(n => n.author_email === user.email);

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
          
          {!hasUserPosted ? (
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
          ) : (
            <span className="text-xs text-pink-600 font-medium bg-pink-50 px-3 py-1 rounded-full">
              Vous avez déjà posté 💌
            </span>
          )}
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
          <div className="space-y-3 h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
            {notes.map((note) => (
              <div key={note.id} className="bg-gradient-to-br from-white to-pink-50 p-3 rounded-lg border border-pink-100 shadow-sm relative group hover:shadow-md transition-all duration-200">
                {user && note.author_email === user.email && (
                  <button 
                    onClick={() => handleDelete(note.id)}
                    className="absolute top-2 right-2 p-1 text-pink-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Supprimer mon message"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                {!user || note.author_email !== user.email ? (
                  <Heart className="w-3 h-3 text-pink-300 absolute top-3 right-3 fill-pink-100" />
                ) : null}
                
                <p className="text-slate-700 text-sm italic leading-relaxed mb-2 pr-6">
                  "{note.message}"
                </p>
                <p className="text-xs text-pink-400 font-medium text-right">
                  — Anonyme
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}