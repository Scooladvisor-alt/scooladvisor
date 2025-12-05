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
      <div className="my-6 sm:my-8 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-[#FF4D8D] via-purple-500 to-blue-500 shadow-lg cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden sticky bottom-4 z-10 group"
      onClick={() => setShowDialog(true)}>
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" style={{ transform: 'skewX(-20deg)' }} />

        <h2 className="text-sm sm:text-xl font-bold text-white flex items-center gap-2 mb-2 sm:mb-3">
          <span className="text-white">
            Micro National - L'espace libre des étudiants
          </span>
          <span className="hidden sm:inline">🎤</span>
        </h2>
        {loading ?
        <p className="text-white/80 text-sm">Chargement...</p> :
        lastMessage ?
        <div className="mt-2 p-3 rounded-xl bg-white shadow-md">
            <p className="text-sm font-semibold line-clamp-2">
              <span className="font-bold text-blue-600">
                {lastMessage.is_anonymous ? 'Anonyme' : lastMessage.author_name}:
              </span>{' '}
              <span className="text-black">{lastMessage.message}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1.5 text-right">
              {formatDateWithTimezone(lastMessage.created_date, "'Le' d MMM 'à' HH:mm")}
            </p>
          </div> :

        <p className="text-white/80 text-sm">Et si tu ouvrais la conversation ? 💬</p>
        }
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl h-[85vh] flex flex-col p-0 rounded-2xl">
          <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF4D8D]" />
              <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Micro National - L'espace libre
              </span>
              <span>🎤</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {messages.length === 0 ?
            <div className="text-center text-slate-500 py-16">
                <p className="text-lg mb-4">C'est calme ici... Prends le micro ! 🎤</p>
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

          <div className="border-t bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder={user ? "Exprime-toi librement (10 caractères min)... 🎤" : "Connecte-toi pour participer 👋"}
                  value={newMessage}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (text.length <= MAX_MESSAGE_LENGTH) {
                      setNewMessage(text);
                    }
                  }}
                  className="min-h-[80px] sm:min-h-[120px] text-sm sm:text-base"
                  disabled={!user} />

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>
                    {newMessage.length} / {MAX_MESSAGE_LENGTH} caractères
                    <span className="ml-1">(minimum 10)</span>
                  </span>
                  {newMessage.length >= MAX_MESSAGE_LENGTH &&
                  <span className="text-red-600 font-medium">Limite atteinte !</span>
                  }
                </div>
              </div>

              <div className="flex items-center justify-between">
                {user &&
                <div className="flex items-center space-x-2">
                    <Checkbox
                    id="anonymous_national"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous} />

                    <Label htmlFor="anonymous_national" className="text-xs sm:text-sm cursor-pointer">
                      Poster en anonyme 🕵️‍♂️
                    </Label>
                  </div>
                }
                {!user && <div />}

                <div className="flex gap-2 sm:gap-3">
                  <Button variant="ghost" onClick={() => setShowDialog(false)} size="sm" className="text-xs sm:text-base">
                    Annuler
                  </Button>
                {user ?
                <Button
                  onClick={handlePublish}
                  disabled={!newMessage.trim() || postLoading || newMessage.length > MAX_MESSAGE_LENGTH || newMessage.length < 10} className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 h-8 rounded-md px-3 bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white hover:opacity-90 text-xs sm:text-base"

                  size="sm">

                    {postLoading ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" /> : <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                    Publier
                  </Button> :

                <Button
                    onClick={() => base44.auth.redirectToLogin(window.location.href)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 text-xs sm:text-base"
                    size="sm">

                    <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Connecte-toi pour publier
                  </Button>
                }
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

  return (
    <div className="w-full mb-3">
      <div className="group relative bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-baseline gap-2">
            <p className="font-bold text-sm bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              {message.is_anonymous ? "Anonyme" : message.author_name}
            </p>
            <p className="text-[10px] text-slate-400">
              {formatDistanceWithTimezone(message.created_date)}
              {message.is_edited && " (modifié)"}
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="relative z-10">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="bg-slate-50 text-slate-900 text-sm min-h-[80px] mb-2"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-8 text-xs">
                Annuler
              </Button>
              <Button size="sm" onClick={() => onSave(message.id, editedContent, message.edit_count || 0)} className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white h-8 text-xs border-0">
                <Save className="w-3 h-3 mr-1" /> Enregistrer
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-700 font-medium mb-4">
            {message.message}
          </p>
        )}

        {!isEditing && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-50 mt-2">
            <div className="flex items-center gap-2">
              {/* Like button functionality not fully implemented for national messages but placeholders kept if needed, currently simplified to match SchoolChat structure */}
            </div>

            <div className="flex items-center gap-1">
              {isAuthor && canEdit && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full" onClick={() => onEdit(message)}>
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {isAuthor && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full" onClick={() => onDelete(message.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              {!isAuthor && user && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-full" onClick={() => onReport(message)}>
                  <Flag className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};