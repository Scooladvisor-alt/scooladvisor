import React, { useState, useEffect } from "react";
import { NationalMessage } from "@/entities/NationalMessage";
import { Report } from "@/entities/Report";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Send, Loader2, Edit, Trash2, Save, Flag, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
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
      const msgs = allMessages.filter(msg => !msg.is_deleted);
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

    setPostLoading(true);

    let formattedMessage = newMessage.trim();
    if (formattedMessage.length > 0) {
      formattedMessage = formattedMessage.charAt(0).toUpperCase() + formattedMessage.slice(1);
    }

    const moderationResponse = await sendToModerationWebhook(formattedMessage);

    if (moderationResponse.decision === 'rejected') {
      const banReason = moderationResponse.reason ? `: ${moderationResponse.reason}` : '';
      toast.error(`Ton message n'a pas pu être publié${banReason}. Essaie avec un ton plus constructif 💬🙂`);
      const violationCount = (user.violation_count || 0) + 1;
      await base44.auth.updateMe({ violation_count: violationCount });
      setNewMessage("");
      setPostLoading(false);
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
      toast.success("Message publié pour toute la France ! 🎉");
    } catch (error) {
      toast.error("Erreur lors de la publication du message.");
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
      const banReason = moderationResponse.reason ? `: ${moderationResponse.reason}` : '';
      toast.error(`Ta modification a été refusée par la modération${banReason}.`);
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
      toast.success("Message modifié !");
    } catch (error) {
      toast.error("Erreur lors de la modification.");
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

  const handleSubmitReport = async () => {
    if (!reportReason) {
      toast.error("Veuillez sélectionner une raison.");
      return;
    }

    try {
      await Report.create({
        review_type: "national_message",
        review_id: reportingMessage.id,
        reporter_email: user.email,
        reason: reportReason,
        details: reportDetails || `Message signalé: "${reportingMessage.message.substring(0, Math.min(reportingMessage.message.length, 100))}"`,
        status: "pending"
      });
      toast.success("Message signalé. Merci pour votre vigilance.");
      setShowReportDialog(false);
      setReportingMessage(null);
      setReportReason("");
      setReportDetails("");
    } catch (error) {
      toast.error("Erreur lors du signalement.");
    }
  };

  return (
    <>
      <div
        className="my-6 sm:my-8 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 shadow-lg cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden"
        onClick={() => setShowDialog(true)}>

        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine-slow pointer-events-none"
        style={{ backgroundSize: '200% 100%' }} />


        <h2 className="text-xs sm:text-xl font-bold flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3 relative z-10">
          <span className="text-white whitespace-nowrap">
            Prends le micro des étudiants
          </span>
          <span>🎤</span>
        </h2>
        {loading ?
        <p className="text-white/80 text-xs sm:text-sm relative z-10">Chargement...</p> :
        lastMessage ?
        <div className="mt-2 sm:mt-3 p-2 sm:p-3 rounded-xl bg-white shadow-md relative z-10">
            <p className="text-xs sm:text-sm font-semibold line-clamp-2">
              <span className="font-bold text-blue-600">
                {lastMessage.is_anonymous ? 'Anonyme' : lastMessage.author_name}:
              </span>{' '}
              <span className="text-slate-900">{lastMessage.message}</span>
            </p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 text-right">
              {formatDateWithTimezone(lastMessage.created_date, "'Le' d MMM 'à' HH:mm")}
            </p>
          </div> :

        <p className="text-white/80 text-xs sm:text-sm relative z-10">Et si tu ouvrais la conversation ? 💬</p>
        }
      </div>

      <style>{`
        @keyframes shine-slow {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .animate-shine-slow {
          animation: shine-slow 3s ease-in-out infinite;
        }
      `}</style>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl h-[90vh] flex flex-col p-0 rounded-3xl bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 shadow-2xl border-2 border-purple-200/50">
          <style>{`
            .chat-messages::-webkit-scrollbar {
              width: 8px;
            }
            .chat-messages::-webkit-scrollbar-track {
              background: transparent;
            }
            .chat-messages::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #ec4899, #8b5cf6);
              border-radius: 10px;
            }
            .chat-messages::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #db2777, #7c3aed);
            }
          `}</style>

          <DialogHeader className="px-4 sm:px-8 py-4 sm:py-6 bg-white/90 backdrop-blur-md border-b-2 border-purple-200/50 rounded-t-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-purple-500/10" />
            <div className="relative z-10">
              <DialogTitle className="text-xl sm:text-3xl font-extrabold flex items-center justify-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Micro National
                </span>
              </DialogTitle>
              <p className="text-center text-xs sm:text-sm text-slate-600 font-medium">
                Partage ton expérience avec tous les étudiants de France 🎓
              </p>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 chat-messages bg-gradient-to-b from-transparent to-white/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
                  <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500" />
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">
                  Sois le premier à t'exprimer ! 🎤
                </h3>
                <p className="text-sm sm:text-base text-slate-600 max-w-md">
                  Lance la conversation et partage ton vécu avec toute la communauté étudiante française
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
                {messages.map((msg, index) => (
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
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/95 backdrop-blur-md border-t-2 border-purple-200/50 px-3 sm:px-6 py-3 sm:py-5 rounded-b-3xl">
            <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    placeholder={user ? "Ton message ici... Partage ton expérience, tes conseils, tes anecdotes ! 💭" : "Connecte-toi pour participer 👋"}
                    value={newMessage}
                    onChange={(e) => {
                      const text = e.target.value;
                      if (text.length <= MAX_MESSAGE_LENGTH) {
                        setNewMessage(text);
                      }
                    }}
                    className="min-h-[70px] sm:min-h-[100px] text-sm sm:text-base pr-12 resize-none border-2 border-purple-200 focus:border-purple-400 rounded-2xl bg-white/90 shadow-sm"
                    disabled={!user}
                  />
                  <div className="absolute bottom-2 right-2 flex items-center gap-2">
                    <span className={`text-[10px] sm:text-xs font-medium ${newMessage.length >= MAX_MESSAGE_LENGTH ? 'text-red-500' : newMessage.length >= MAX_MESSAGE_LENGTH * 0.9 ? 'text-orange-500' : 'text-slate-400'}`}>
                      {newMessage.length}/{MAX_MESSAGE_LENGTH}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {user && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-50/80 rounded-xl border border-purple-200">
                    <Checkbox
                      id="anonymous_national"
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                      className="border-purple-300"
                    />
                    <Label htmlFor="anonymous_national" className="text-xs sm:text-sm cursor-pointer font-medium text-slate-700">
                      🕵️ Mode anonyme
                    </Label>
                  </div>
                )}

                <div className="flex gap-2 sm:gap-3">
                  {user ? (
                    <Button
                      onClick={handlePublish}
                      disabled={!newMessage.trim() || postLoading || newMessage.length > MAX_MESSAGE_LENGTH || newMessage.length < 10}
                      className="flex-1 sm:flex-initial bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:via-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 text-xs sm:text-base font-semibold py-5 sm:py-6 rounded-xl"
                      size="lg"
                    >
                      {postLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                          Publication...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Publier gratuitement 🎉
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => base44.auth.redirectToLogin(window.location.href)}
                      className="flex-1 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:via-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 text-xs sm:text-base font-semibold py-5 sm:py-6 rounded-xl"
                      size="lg"
                    >
                      <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Connecte-toi pour publier 🚀
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Signaler ce message
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Raison du signalement *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diffamation">Diffamation</SelectItem>
                  <SelectItem value="injure">Injure ou vulgarité</SelectItem>
                  <SelectItem value="hors_sujet">Hors sujet</SelectItem>
                  <SelectItem value="fausse_info">Fausse information</SelectItem>
                  <SelectItem value="harcelement">Harcèlement ou moquerie</SelectItem>
                  <SelectItem value="contenu_sensible">Contenu sensible/choquant</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Détails (optionnel)</Label>
              <Textarea
                placeholder="Expliquez pourquoi vous signalez ce message..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3} />

            </div>
            {reportingMessage &&
            <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                <p className="font-semibold">Message signalé:</p>
                <p className="italic">"{reportingMessage.message}"</p>
              </div>
            }
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowReportDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitReport} className="bg-red-600 hover:bg-red-700 text-white">
              Envoyer le signalement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);

}

const NationalMessageBubble = ({ message, user, onEdit, onSave, onCancelEdit, onDelete, onReport, editingMessageId, setEditedContent, editedContent, index }) => {
  const isAuthor = user && message.author_email === user.email;
  const isEditing = editingMessageId === message.id;
  const canEdit = isAuthor && (message.edit_count || 0) < 3;
  const MAX_MESSAGE_LENGTH_EDIT = 300;

  const getAvatarColor = (name) => {
    const colors = [
      'from-rose-400 to-pink-500',
      'from-purple-400 to-indigo-500',
      'from-blue-400 to-cyan-500',
      'from-emerald-400 to-teal-500',
      'from-amber-400 to-orange-500',
      'from-fuchsia-400 to-purple-500'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const avatarGradient = getAvatarColor(message.author_name || 'Anonymous');

  return (
    <div className={`flex ${isAuthor ? 'justify-end' : 'justify-start'} animate-fadeIn`} style={{ animationDelay: `${index * 0.05}s` }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      <div className={`flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[75%] ${isAuthor ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-md border-2 border-white`}>
          <span className="text-white font-bold text-xs sm:text-sm">
            {message.is_anonymous ? '🕵️' : (message.author_name?.charAt(0).toUpperCase() || '?')}
          </span>
        </div>

        {/* Message Content */}
        <div className="flex-1">
          <div className={`flex items-baseline gap-2 mb-1 ${isAuthor ? 'flex-row-reverse' : 'flex-row'}`}>
            <p className={`font-bold text-xs sm:text-sm ${isAuthor ? 'text-slate-700' : 'text-slate-700'}`}>
              {message.is_anonymous ? '🕵️ Anonyme' : message.author_name}
            </p>
            <p className="text-[9px] sm:text-[10px] text-slate-400">
              {formatDistanceWithTimezone(message.created_date)}
              {message.is_edited && ' • modifié'}
            </p>
          </div>

          {isEditing ? (
            <div className="bg-slate-50 rounded-2xl p-3 shadow-md border-2 border-slate-200">
              <Textarea
                value={editedContent}
                onChange={(e) => {
                  const text = e.target.value;
                  if (text.length <= MAX_MESSAGE_LENGTH_EDIT) {
                    setEditedContent(text);
                  }
                }}
                className="bg-white text-slate-900 text-sm border-slate-200 focus:border-slate-400"
                rows={3}
              />
              <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-slate-400 mt-2">
                <span className={editedContent.length >= MAX_MESSAGE_LENGTH_EDIT ? 'text-red-500 font-medium' : ''}>
                  {editedContent.length}/{MAX_MESSAGE_LENGTH_EDIT}
                </span>
              </div>
              <div className="flex gap-2 mt-3 justify-end">
                <Button size="sm" variant="outline" onClick={onCancelEdit} className="h-8 text-xs rounded-lg">
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSave(message.id, editedContent, message.edit_count || 0)}
                  className="h-8 text-xs bg-slate-700 hover:bg-slate-800 text-white rounded-lg"
                  disabled={!editedContent.trim() || editedContent.length > MAX_MESSAGE_LENGTH_EDIT}
                >
                  <Save className="w-3 h-3 mr-1" /> Enregistrer
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative group">
                <div className={`${isAuthor ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-white text-slate-900 border-slate-200'} border-2 rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2 sm:py-3 shadow-sm hover:shadow-md transition-all`}>
                  <p className="text-sm sm:text-base leading-relaxed break-words">{message.message}</p>
                  
                  {/* Bouton signaler intégré dans le message */}
                  {!isAuthor && user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 hover:bg-orange-100 text-slate-400 hover:text-orange-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onReport(message)}
                    >
                      <Flag className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Actions */}
              {isAuthor && (
                <div className="flex gap-1 mt-1.5 justify-end flex-wrap">
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs hover:bg-slate-100 text-slate-600 rounded-lg"
                      onClick={() => onEdit(message)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Modifier
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs hover:bg-red-100 text-red-600 rounded-lg"
                    onClick={() => onDelete(message.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Supprimer
                  </Button>
                </div>
              )}

              {isAuthor && !canEdit && (
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 text-right">
                  ⚠️ Limite de 3 modifications atteinte
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};