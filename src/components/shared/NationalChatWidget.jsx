import React, { useState, useEffect } from "react";
import { NationalMessage } from "@/entities/NationalMessage";
import { Report } from "@/entities/Report";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Edit, Trash2, Save, Flag, Compass, MessageCircle, ChevronRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ReportDialog from "@/components/shared/ReportDialog";
import JoinFamilyDialog from "@/components/shared/JoinFamilyDialog";
import { useJoinFamily } from "@/components/shared/useJoinFamily";

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
  const { showJoinDialog, actionDescription, requireAuth, closeDialog } = useJoinFamily();

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
    if (!requireAuth(user, "publier un message")) {
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

    try {
      const colors = ["pink", "purple", "blue", "green", "orange", "red"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newMsg = await base44.entities.NationalMessage.create({
        message: formattedMessage,
        author_email: user.email,
        author_name: user.full_name,
        color: randomColor,
        is_anonymous: isAnonymous,
        edit_count: 0
      });

      setNewMessage("");
      setIsAnonymous(false);
      await loadMessages();
      toast.success("✅ Message publié !");
      
      // Modération asynchrone en arrière-plan
      base44.functions.invoke('moderateAsync', {
        entityType: 'NationalMessage',
        entityId: newMsg.id,
        content: formattedMessage,
        context: {}
      }).catch(err => console.error('Async moderation error:', err));
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
      
      // Modération asynchrone en arrière-plan
      base44.functions.invoke('moderateAsync', {
        entityType: 'NationalMessage',
        entityId: messageId,
        content: formattedEditedContent,
        context: {}
      }).catch(err => console.error('Async moderation error:', err));
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
    if (!requireAuth(user, "signaler un message")) {
      return;
    }
    setReportingMessage(message);
    setShowReportDialog(true);
  };



  return (
    <>
      <div
        className="my-6 rounded-2xl overflow-hidden shadow-lg cursor-pointer group hover:shadow-xl transition-all duration-300"
        onClick={() => setShowDialog(true)}
      >
        {/* Header bande colorée */}
        <div className="relative bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 px-4 py-3 flex items-center justify-between overflow-hidden">
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-white" />
            <span className="font-bold text-white text-sm">Mon Orientation</span>
          </div>
          <div className="flex items-center gap-1 text-white/80 text-xs">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Corps blanc */}
        <div className="bg-white dark:bg-slate-800 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-2xl px-4 py-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Discute d'orientation, pose tes questions et trouve des conseils avec d'autres élèves &amp; étudiants.
          </p>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Chargement...</span>
            </div>
          ) : lastMessage ? (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700">
              <p className="text-xs line-clamp-2 text-slate-700 dark:text-slate-200">
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {lastMessage.is_anonymous ? 'Anonyme' : lastMessage.author_name} :
                </span>{' '}
                {lastMessage.message}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {formatDistanceWithTimezone(lastMessage.created_date)}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Sois le premier à poser une question !</p>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] flex flex-col p-0 rounded-2xl overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader className="border-b dark:border-slate-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4D8D] via-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  Mon Orientation
                </DialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pose tes questions, partage tes conseils d'orientation.</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 ?
            <div className="text-center text-slate-500 dark:text-slate-400 py-16 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
                  <Compass className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-sm font-medium">C'est calme ici... Lance la discussion !</p>
                <p className="text-xs text-slate-400">Pose ta première question d'orientation.</p>
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

          <div className="border-t dark:border-slate-700 bg-white dark:bg-slate-800 p-2">
            <div className="relative">
              <Textarea
                placeholder={user ? "Pose ta question ou partage un conseil d'orientation..." : "Connecte-toi pour participer"}
                value={newMessage}
                onChange={(e) => {
                  const text = e.target.value;
                  if (text.length <= MAX_MESSAGE_LENGTH) {
                    setNewMessage(text);
                  }
                }}
                className="min-h-[60px] text-xs pr-20 pb-8 resize-none rounded-2xl text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                disabled={!user} 
              />
              
              <div className="absolute bottom-2 left-2 flex items-center gap-2">
                {user && (
                  <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-100 dark:border-slate-600">
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

      <JoinFamilyDialog
        open={showJoinDialog}
        onOpenChange={closeDialog}
        actionDescription={actionDescription}
      />
    </>);

}

const NationalMessageBubble = ({ message, user, onEdit, onSave, onCancelEdit, onDelete, onReport, editingMessageId, setEditedContent, editedContent, index }) => {
  const isAuthor = user && message.created_by === user.email;
  const isEditing = editingMessageId === message.id;
  const canEdit = isAuthor && (message.edit_count || 0) < 3;

  return (
    <div className="w-full mb-1.5">
      <div className="group relative bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-baseline gap-2 flex-1">
            <p className="font-bold text-xs bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              {message.is_anonymous ? "Anonyme" : message.author_name}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {formatDistanceWithTimezone(message.created_date)}
              {message.is_edited && " (modifié)"}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5">
            {!isAuthor && user && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950" 
                onClick={() => onReport(message)}
              >
                <Flag className="w-3.5 h-3.5" />
              </Button>
            )}
            {user && isAuthor && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950 font-semibold shadow-sm" 
                  onClick={() => onDelete(message.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span className="text-[10px] font-medium">Supprimer</span>
                </Button>
                {canEdit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-2 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950" 
                    onClick={() => onEdit(message)}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    <span className="text-[10px] font-medium">Modifier</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="relative z-10">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm min-h-[60px] mb-2 dark:border-slate-600"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-7 text-xs dark:text-slate-300 dark:hover:bg-slate-700">
                Annuler
              </Button>
              <Button size="sm" onClick={() => onSave(message.id, editedContent, message.edit_count || 0)} className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white h-7 text-xs border-0">
                <Save className="w-3 h-3 mr-1" /> Enregistrer
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
            {message.message}
          </p>
        )}
      </div>
    </div>
  );
};