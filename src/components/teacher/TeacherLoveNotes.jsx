import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, Send, Loader2, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import JoinFamilyDialog from "@/components/shared/JoinFamilyDialog";
import { useJoinFamily } from "@/components/shared/useJoinFamily";

export default function TeacherLoveNotes({ teacherId, user }) {
  const [notes, setNotes] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { showJoinDialog, actionDescription, requireAuth, closeDialog } = useJoinFamily();

  useEffect(() => {
    if (teacherId) {
      loadNotes();
      
      const savedNote = localStorage.getItem('pending_love_note_teacher_' + teacherId);
      if (savedNote) {
        try {
          const parsed = JSON.parse(savedNote);
          if (parsed && typeof parsed === 'object') {
            setNewMessage(parsed.message || "");
            setIsAnonymous(!!parsed.isAnonymous);
            setShowForm(true);
          }
          localStorage.removeItem('pending_love_note_teacher_' + teacherId);
        } catch (e) {
          console.error("Failed to parse saved love note", e);
          localStorage.removeItem('pending_love_note_teacher_' + teacherId);
        }
      }
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
    if (!requireAuth(user, "écrire un petit mot")) {
      localStorage.setItem('pending_love_note_teacher_' + teacherId, JSON.stringify({ message: newMessage, isAnonymous }));
      return;
    }

    if (!newMessage.trim()) return;

    setSending(true);

    try {
      const newNote = await base44.entities.TeacherLoveNote.create({
        teacher_id: teacherId,
        message: newMessage,
        author_email: user.email,
        author_id: user.id,
        author_name: user.full_name,
        is_anonymous: isAnonymous
      });

      setNewMessage("");
      setIsAnonymous(false);
      setShowForm(false);
      toast.success("Message envoyé ! 💖");
      loadNotes();
      
      // Modération asynchrone en arrière-plan
      base44.functions.invoke('moderateAsync', {
        entityType: 'TeacherLoveNote',
        entityId: newNote.id,
        content: newMessage,
        context: { teacherId }
      }).catch(err => console.error('Async moderation error:', err));
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

  const hasUserPosted = user && notes.some((n) => n.author_email === user.email);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-pink-200 shadow-lg w-full overflow-hidden relative lg:rounded-2xl rounded-t-2xl rounded-b-none border-x-0 lg:border-x border-b-0 lg:border-b">
      {/* Effet enveloppe décoratif */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-300 via-red-300 to-pink-300" />
      
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-pink-700">
            <Mail className="w-5 h-5" />
            <span>Petit mot ❤️</span>
          </CardTitle>
          
          {!hasUserPosted &&
          <Button
            variant="ghost"
            size="sm"
            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 text-xs sm:text-sm"
            onClick={() => setShowForm(!showForm)}>
              {showForm ? "Fermer" : "Écrire"}
            </Button>
          }
        </div>
      </CardHeader>

      <CardContent className="pt-2 px-3 sm:px-6 pb-4">
        <AnimatePresence>
          {showForm &&
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3">

              <div className="bg-pink-50 p-3 rounded-lg border border-pink-100">
                <Textarea
                placeholder="Merci pour tout, meilleur prof..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-white border-pink-200 focus:border-pink-400 min-h-[60px] mb-2 text-sm text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-white" />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 bg-white/50 px-2 py-1 rounded border border-pink-100">
                    <Checkbox
                    id="anonymous-mode"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                    className="border-pink-300 data-[state=checked]:bg-pink-500 w-3.5 h-3.5" />
                    <Label htmlFor="anonymous-mode" className="text-xs text-pink-700 cursor-pointer">
                      Anonyme
                    </Label>
                  </div>

                  <Button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white h-8 text-xs"
                  size="sm">
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                    Envoyer
                  </Button>
                </div>
              </div>
            </motion.div>
          }
        </AnimatePresence>

        {loading ?
        <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-pink-300 animate-spin" />
          </div> :
        notes.length === 0 ?
        <div className="text-center py-6 text-pink-400/70 italic text-sm">
            Soyez le premier à laisser un mot ! 💌
          </div> :

        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {notes.map((note) =>
          <div key={note.id} className="bg-gradient-to-br from-white to-pink-50 p-2.5 rounded-lg border border-pink-100 shadow-sm relative group hover:shadow-md transition-all">
                {user && note.author_email === user.email &&
            <button
              onClick={() => handleDelete(note.id)}
              className="absolute top-1.5 right-1.5 p-1 text-pink-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Supprimer">
                    <Trash2 className="w-3 h-3" />
                  </button>
            }
                {!user || note.author_email !== user.email &&
            <Heart className="w-3 h-3 text-pink-300 absolute top-2 right-2 fill-pink-100" />
            }
                
                <p className="text-slate-700 text-sm italic leading-relaxed mb-1.5 pr-6">
                  "{note.message}"
                </p>
                <p className="text-xs text-pink-400 font-medium text-right">
                  — {note.is_anonymous ? "Anonyme" : note.author_name}
                </p>
              </div>
          )}
          </div>
        }
      </CardContent>
      
      <JoinFamilyDialog
        open={showJoinDialog}
        onOpenChange={closeDialog}
        actionDescription={actionDescription}
      />
    </Card>);

}

const getAvatarUrl = (avatar) => {
  const avatarUrls = {
    avatar1: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d8ad15814_a-humanized-black-graduation-cap-with-a-star-shape.png",
    avatar2: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/639510ec4_a-humanized-black-graduation-cap-with-a-star-shape-2.png",
    avatar3: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png",
    avatar4: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/cd2a7b336_a-humanized-black-graduation-cap-with-a-star-shape-4.png",
    avatar5: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5e2f6487e_a-humanized-black-graduation-cap-with-a-star-shape-5.png"
  };
  // Default to avatar3 (yellow) if avatar is 'letter' or undefined
  if (!avatar || avatar === 'letter') {
    return avatarUrls.avatar3;
  }
  return avatarUrls[avatar] || avatarUrls.avatar3;
};