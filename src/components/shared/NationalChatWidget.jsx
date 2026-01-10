import React, { useState, useEffect } from "react";
import { NationalMessage } from "@/entities/NationalMessage";
import { Report } from "@/entities/Report";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Send, Loader2, Edit, Trash2, Save, Flag } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ReportDialog from "@/components/shared/ReportDialog";

// Helper function pour corriger le fuseau horaire
const formatDateWithTimezone = (dateString, formatStr) => {
  const date = new Date(dateString);
  return format(date, formatStr, { locale: fr });
};

const formatDistanceWithTimezone = (dateString) => {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
};

export default function NationalChatWidget() {
  const [messages, setMessages] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [reportingMessage, setReportingMessage] = useState(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const MAX_MESSAGE_LENGTH = 300;

  useEffect(() => {
    loadMessages();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    setError(false);
    try {
      const allMessages = await base44.entities.NationalMessage.list("-created_date", 50);
      const msgs = allMessages.filter((msg) => !msg.is_deleted);
      setMessages(msgs);
      setLastMessage(msgs[0] || null);
    } catch (error) {
      console.error("Error loading national messages:", error);
      setError(true);
      setMessages([]);
      setLastMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const sendToModerationWebhook = async (content) => {
    const currentUser = await base44.auth.me();
    if (currentUser && currentUser.email === 'antownin@gmail.com') {
      return { decision: 'approved', reason: 'Exempted user' };
    }

    try {
      const moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `🧠 Tu es Modérateur, l'agent d'intelligence artificielle officiel de ScoolAdvisor.

📝 Contenu à analyser :
"${content}"

Type: Message dans "Prends le micro des étudiants" (espace libre d'expression national)

🎯 Mission : Analyser ce contenu et décider s'il respecte la charte de ScoolAdvisor.

🚫 Contenu INTERDIT (à rejeter) :
- Grossièretés, insultes, vulgarité, propos choquants (même atténués)
- Discrimination (sexe, origine, religion, physique, âge, identité, opinions)
- Harcèlement moral ou moquerie ciblée
- Diffamation ou atteinte grave à la réputation
- Informations personnelles (noms complets, coordonnées, adresses)
- Propos sexuels, violents ou politiques extrêmes
- Langage ironique, dénigrant ou humiliant visant à blesser
- Spam ou hors-sujet

✅ Contenu AUTORISÉ :
- Expressions libres et respectueuses
- Opinions personnelles constructives
- Messages bienveillants ou humoristiques sans méchanceté
- Témoignages honnêtes et polis

⚠️ Prudence :
- Critiques constructives = OK
- Propos blessants = NON
- En cas de doute, privilégie la sécurité et rejette.

📊 Décision requise :
Réponds par un objet JSON avec deux propriétés: "decision" et "reason".
"decision" doit être "approved" ou "rejected".
Si la décision est "rejected", "reason" doit contenir une brève explication (en français) de la raison du rejet.
Si la décision est "approved", "reason" peut être vide ou null.`,
        response_json_schema: {
          type: "object",
          properties: {
            decision: { type: "string", enum: ["approved", "rejected"] },
            reason: { type: "string", nullable: true }
          },
          required: ["decision"]
        }
      });

      if (!moderationResult || typeof moderationResult.decision === 'undefined') {
        console.error("Invalid moderation result received from LLM:", moderationResult);
        return { decision: 'approved', reason: 'Moderation system error, defaulted to approved.' };
      }

      return moderationResult;
    } catch (error) {
      console.error("Error in moderation:", error);
      return { decision: 'approved', reason: 'Moderation API error, defaulted to approved.' };
    }
  };

  const handlePublish = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour publier un message.");
      return;
    }
    if (!newMessage.trim()) {
      toast.error("Le message ne peut pas être vide.");
      return;
    }
    if (newMessage.length < 10) {
      toast.error("Le message doit contenir au moins 10 caractères.");
      return;
    }
    if (newMessage.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Le message dépasse la limite de ${MAX_MESSAGE_LENGTH} caractères.`);
      return;
    }

    // SECURITY: Spam detection - 5 messages per minute
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentMessages = messages.filter(
      (msg) => msg.author_email === user.email && new Date(msg.created_date).getTime() > oneMinuteAgo
    );

    if (recentMessages.length >= 5) {
      // Incrémenter le compteur d'avertissements spam
      const spamWarnings = (user.spam_warning_count || 0) + 1;
      await base44.auth.updateMe({ spam_warning_count: spamWarnings });

      if (spamWarnings >= 2) {
        // Ban après 2 avertissements
        await base44.auth.updateMe({ is_banned: true });
        toast.error("Vous avez été banni pour spam.");
        setTimeout(() => window.location.reload(), 2000);
        return;
      }

      toast.error("Merci de ne pas envoyer trop de messages en même temps.");
      return;
    }

    setPostLoading(true);

    let formattedMessage = newMessage.trim();
    if (formattedMessage.length > 0) {
      formattedMessage = formattedMessage.charAt(0).toUpperCase() + formattedMessage.slice(1);
    }

    const moderationResponse = await sendToModerationWebhook(formattedMessage);

    if (moderationResponse.decision === 'rejected') {
      toast.error("❌ Votre message ne respecte pas les règles de la communauté.", { duration: 5000 });
      setPostLoading(false);
      const violationCount = (user.violation_count || 0) + 1;
      await base44.auth.updateMe({ violation_count: violationCount });
      setNewMessage("");
      return;
    }

    try {
      const colors = ["pink", "purple", "blue", "green", "orange", "red"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      await base44.entities.NationalMessage.create({
        message: formattedMessage,
        author_email: user.email,
        author_name: user.full_name,
        color: randomColor,
        is_anonymous: isAnonymous,
        edit_count: 0
      });

      setNewMessage("");
      setIsAnonymous(false);
      setShowDialog(false);
      loadMessages();
      toast.success("✅ Message publié !");
    } catch (error) {
      toast.error("❌ Erreur technique. Réessayez.");
      console.error("Error publishing message:", error);
    } finally {
      setPostLoading(false);
    }
  };

  const handleEdit = (message) => {
    if ((message.edit_count || 0) >= 3) {
      toast.error("Limite de 3 modifications atteinte.");
      return;
    }
    setEditingMessageId(message.id);
    setEditedContent(message.message);
  };

  const handleSaveEdit = async (messageId, newContent, currentEditCount) => {
    if (currentEditCount >= 3) {
      toast.error("Vous avez atteint la limite de 3 modifications.");
      return;
    }

    if (newContent.length > MAX_MESSAGE_LENGTH) {
      toast.error(`La modification dépasse la limite de ${MAX_MESSAGE_LENGTH} caractères.`);
      return;
    }

    setPostLoading(true);

    let formattedEditedContent = newContent.trim();
    if (formattedEditedContent.length > 0) {
      formattedEditedContent = formattedEditedContent.charAt(0).toUpperCase() + formattedEditedContent.slice(1);
    }

    const moderationResponse = await sendToModerationWebhook(formattedEditedContent);
    if (moderationResponse.decision === 'rejected') {
      toast.error("❌ Votre message ne respecte pas les règles de la communauté.");
      setPostLoading(false);
      setEditingMessageId(null);
      setEditedContent("");
      return;
    }

    try {
      await NationalMessage.update(messageId, {
        message: formattedEditedContent,
        is_edited: true,
        edit_count: (currentEditCount || 0) + 1
      });
      setEditingMessageId(null);
      setEditedContent("");
      loadMessages();
      toast.success("✅ Message modifié !");
    } catch (error) {
      toast.error("❌ Erreur technique. Réessayez.");
    } finally {
      setPostLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent("");
  };

  const handleDelete = async (messageId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) return;

    try {
      await base44.entities.NationalMessage.update(messageId, { is_deleted: true });
      toast.success("Message supprimé.");
      loadMessages();
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleReportClick = (message) => {
    if (!user) {
      toast.error("Vous devez être connecté pour signaler.");
      return;
    }
    setReportingMessage(message);
    setShowReportDialog(true);
  };



  return (
    <>
      <div className="my-4 sm:my-6 p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-[#FF4D8D] via-purple-500 to-blue-500 shadow-lg cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden sticky bottom-4 z-10 group"
      onClick={() => setShowDialog(true)}>
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" style={{ transform: 'skewX(-20deg)' }} />

        <h2 className="text-xs sm:text-base font-bold text-white flex items-center gap-2 mb-1.5 sm:mb-2">
          <span className="text-white">
            Micro National
          </span>
        </h2>
        {loading ?
        <p className="text-white/80 text-xs">Chargement...</p> :
        lastMessage ?
        <div className="mt-1.5 p-2 rounded-lg bg-white shadow-sm">
            <p className="text-xs font-semibold line-clamp-2">
              <span className="font-bold text-blue-600">
                {lastMessage.is_anonymous ? 'Anonyme' : lastMessage.author_name}:
              </span>{' '}
              <span className="text-black">{lastMessage.message}</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1 text-right">
              {formatDateWithTimezone(lastMessage.created_date, "'Le' d MMM 'à' HH:mm")}
            </p>
          </div> :

        <p className="text-white/80 text-xs">Et si tu ouvrais la conversation ? 💬</p>
        }
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl h-[85vh] flex flex-col p-0 rounded-2xl overflow-hidden">
          <DialogHeader className="p-3 border-b">
            <DialogTitle className="text-base font-bold">
              <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Micro National
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 ?
            <div className="text-center text-slate-500 py-16">
                <p className="text-lg mb-4 text-slate-500">C'est calme ici... Prends le micro !</p>
              </div> :

            <div className="space-y-3">
                {messages.map((msg, index) =>
              <NationalMessageBubble
                key={msg.id}
                message={msg}
                user={user}
                onEdit={handleEdit}
                onSave={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onDelete={handleDelete}
                onReport={handleReportClick}
                editingMessageId={editingMessageId}
                setEditedContent={setEditedContent}
                editedContent={editedContent}
                index={index} />

              )}
              </div>
            }
          </div>

          <div className="border-t bg-white p-2">
            <div className="relative">
              <Textarea
                placeholder={user ? "Ton message..." : "Connecte-toi pour participer"}
                value={newMessage}
                onChange={(e) => {
                  const text = e.target.value;
                  if (text.length <= MAX_MESSAGE_LENGTH) {
                    setNewMessage(text);
                  }
                }}
                className="min-h-[60px] text-xs pr-20 pb-8 resize-none rounded-2xl"
                disabled={!user} 
              />
              
              <div className="absolute bottom-2 left-2 flex items-center gap-2">
                {user && (
                  <div className="flex items-center space-x-1 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                    <Checkbox
                      id="anonymous_national"
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous} 
                      className="h-3.5 w-3.5"
                    />
                    <Label htmlFor="anonymous_national" className="text-[10px] cursor-pointer font-bold bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
                      Anonyme
                    </Label>
                  </div>
                )}
              </div>

              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                 <span className={`text-[9px] mr-1 ${newMessage.length >= MAX_MESSAGE_LENGTH ? 'text-red-500' : 'text-slate-400'}`}>
                    {newMessage.length}/{MAX_MESSAGE_LENGTH}
                 </span>
                 
                 {user ? (
                   <Button
                    onClick={handlePublish}
                    disabled={!newMessage.trim() || postLoading || newMessage.length > MAX_MESSAGE_LENGTH || newMessage.length < 10}
                    className="h-6 px-2.5 bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white text-[10px] rounded-lg"
                    size="sm"
                   >
                     {postLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
                   </Button>
                 ) : (
                   <Button
                    onClick={() => base44.auth.redirectToLogin(window.location.href)}
                    className="h-6 px-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] rounded-lg"
                    size="sm"
                   >
                     Connexion
                   </Button>
                 )}
              </div>
            </div>
          </div>
                </DialogContent>
                </Dialog>

      {showReportDialog && reportingMessage && (
        <ReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          reviewType="national_message"
          reviewId={reportingMessage.id}
          onSuccess={() => setReportingMessage(null)}
        />
      )}
    </>);

}

const NationalMessageBubble = ({ message, user, onEdit, onSave, onCancelEdit, onDelete, onReport, editingMessageId, setEditedContent, editedContent, index }) => {
  const isAuthor = user && message.author_email === user.email;
  const isEditing = editingMessageId === message.id;
  const canEdit = isAuthor && (message.edit_count || 0) < 3;

  return (
    <div className="w-full mb-1.5">
      <div className="group relative bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-baseline gap-2 flex-1">
            <p className="font-bold text-xs bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              {message.is_anonymous ? "Anonyme" : message.author_name}
            </p>
            <p className="text-[10px] text-slate-400">
              {formatDistanceWithTimezone(message.created_date)}
              {message.is_edited && " (modifié)"}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5">
            {isAuthor && canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100" 
                onClick={() => onEdit(message)}
              >
                <Edit className="w-3.5 h-3.5 mr-1" />
                <span className="text-[10px] font-medium">Modifier</span>
              </Button>
            )}
            {isAuthor && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 bg-red-50 border-red-200 text-red-600 hover:bg-red-100" 
                onClick={() => onDelete(message.id)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span className="text-[10px] font-medium">Supprimer</span>
              </Button>
            )}
            {!isAuthor && user && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-orange-500 hover:bg-orange-50" 
                onClick={() => onReport(message)}
              >
                <Flag className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="relative z-10">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="bg-slate-50 text-slate-900 text-sm min-h-[60px] mb-2"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-7 text-xs">
                Annuler
              </Button>
              <Button size="sm" onClick={() => onSave(message.id, editedContent, message.edit_count || 0)} className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white h-7 text-xs border-0">
                <Save className="w-3 h-3 mr-1" /> Enregistrer
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-700 font-medium">
            {message.message}
          </p>
        )}
      </div>
    </div>
  );
};