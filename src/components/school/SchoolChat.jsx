import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { security } from "../shared/security";
import { MessageSquare, Send, Loader2, Edit, Save, Trash2, Flag, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ReportDialog from "@/components/shared/ReportDialog";

const ChatBubble = ({ message, user, onEdit, onSave, onCancelEdit, onDelete, onReport, onLike, editingMessageId, setEditedContent, editedContent, isLiked, likeCount }) => {
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
              {formatDistanceToNow(new Date(message.created_date), { addSuffix: true, locale: fr })}
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
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike(message)}
                  className={`h-8 px-3 rounded-full border transition-all ${
                    isLiked
                      ? "bg-white border-transparent shadow-sm ring-1 ring-pink-100"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <ThumbsUp
                    className="w-4 h-4 mr-1.5 transition-all duration-300"
                    style={isLiked ? { stroke: "url(#chat-gradient)", fill: "none" } : { stroke: "#94a3b8", fill: "none" }}
                  />
                  <span className={`text-xs font-bold ${isLiked ? "text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500" : "text-slate-500"}`}>
                    {likeCount}
                  </span>
                </Button>
              )}
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
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-full" onClick={() => onReport(message.id)}>
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

export default function SchoolChat({ schoolId, isHomePage = false }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [postLoading, setPostLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [localLikes, setLocalLikes] = useState({});
  const [userLikes, setUserLikes] = useState(new Set());
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  const MAX_MESSAGE_LENGTH = 300;
  const MIN_MESSAGE_LENGTH = 10;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Charger les messages UNIQUEMENT quand le dialog s'ouvre
  useEffect(() => {
    if (showDialog && schoolId && messages.length === 0) {
      loadMessages();
    }
  }, [showDialog, schoolId]);

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (user) {
      loadUserLikes();
    }
  }, [user, messages]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const loadMessages = async () => {
    if (!schoolId) return;
    setLoading(true);
    // Charger seulement les 20 derniers messages initialement
    const allMessages = await base44.entities.ChatMessage.filter({ school_id: schoolId }, "-created_date", 20);
    const data = allMessages.filter((msg) => !msg.is_deleted);
    setMessages(data);
    setLoading(false);
  };

  const loadUserLikes = async () => {
    if (!user) return;
    try {
      const likes = await base44.entities.ReviewLike.filter({
        review_type: "chat_message",
        user_email: user.email
      });
      setUserLikes(new Set(likes.map((l) => l.review_id)));
    } catch (error) {
      console.error("Error loading user likes:", error);
    }
  };

  const handleLike = async (message) => {
    if (!user) {
      await base44.auth.redirectToLogin(window.location.href);
      return;
    }

    const messageId = message.id;
    const isCurrentlyLiked = userLikes.has(messageId);

    setUserLikes((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });

    const currentDisplayedLikes = localLikes[messageId] !== undefined ? localLikes[messageId] : message.like_count || 0;

    setLocalLikes((prev) => ({
      ...prev,
      [messageId]: currentDisplayedLikes + (isCurrentlyLiked ? -1 : 1)
    }));

    try {
      const existingLikes = await base44.entities.ReviewLike.filter({
        review_type: "chat_message",
        review_id: messageId,
        user_email: user.email
      });

      if (existingLikes.length > 0) {
        await base44.entities.ReviewLike.delete(existingLikes[0].id);
        await base44.entities.ChatMessage.update(messageId, {
          like_count: Math.max(0, (message.like_count || 0) - 1)
        });
      } else {
        await base44.entities.ReviewLike.create({
          review_type: "chat_message",
          review_id: messageId,
          user_email: user.email
        });
        await base44.entities.ChatMessage.update(messageId, {
          like_count: (message.like_count || 0) + 1
        });
      }
    } catch (error) {
      console.error("Error liking message:", error);
      setUserLikes((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(messageId);
        } else {
          newSet.delete(messageId);
        }
        return newSet;
      });
      setLocalLikes((prev) => ({
        ...prev,
        [messageId]: currentDisplayedLikes
      }));
    }
  };

  const getLikeCount = (message) => {
    return localLikes[message.id] !== undefined ? localLikes[message.id] : message.like_count || 0;
  };

  const sendToModerationWebhook = async (content, messageId, isEdit = false) => {
    const currentUser = await base44.auth.me();
    if (currentUser && currentUser.email === 'antownin@gmail.com') {
      return { decision: 'approved', reason: null };
    }

    try {
      const moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `🧠 Tu es Modérateur, l'agent d'intelligence artificielle officiel de ScoolAdvisor.

📝 Contenu à analyser :
"${content}"

Type: ${isEdit ? 'Modification de message' : 'Nouveau message'} dans le chat d'établissement

🎯 Mission : Analyser ce contenu et décider s'il respecte la charte de ScoolAdvisor.

🚫 Contenu INTERDIT (à rejeter) :
- Grossièretés, insultes, vulgarité
- Discrimination (sexe, origine, religion, physique, etc.)
- Harcèlement ou moquerie
- Diffamation ou atteinte grave à la réputation
- Informations personnelles (adresses, téléphones, etc.)
- Propos sexuels, violents ou politiques extrêmes
- Langage dénigrant ou humiliant

✅ Contenu AUTORISÉ :
- Messages constructifs et respectueux
- Partage de souvenirs positifs
- Opinions personnelles exprimées avec respect

📊 Décision requise :
Réponds UNIQUEMENT par un objet JSON avec deux clés : "decision" ("approved" ou "rejected") et "reason" (une chaîne de caractères explicative POURQUOI le contenu a été rejeté, ou null si approuvé).
En cas de doute, privilégie la sécurité et rejette.
Si la décision est "rejected", la "reason" doit être concise et utile pour l'utilisateur, par exemple : "Ton message contient des propos injurieux." ou "Ton message divulgue des informations personnelles."
Si la décision est "approved", la "reason" doit être null.`,
        response_json_schema: {
          type: "object",
          properties: {
            decision: { type: "string", enum: ["approved", "rejected"] },
            reason: { type: "string", description: "A concise explanation if the decision is 'rejected', otherwise null.", nullable: true }
          },
          required: ["decision"]
        }
      });

      return moderationResult || { decision: 'rejected', reason: 'Erreur de la modération automatique, veuillez réessayer ou modifier votre message.' };
    } catch (error) {
      console.error("Error in moderation:", error);
      return { decision: 'rejected', reason: 'Erreur interne de la modération. Veuillez contacter le support si le problème persiste.' };
    }
  };

  const handlePublish = async () => {
    if (!user || !newMessage.trim()) return;

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

    // SECURITY: Rate Limiting
    if (!security.checkRateLimit('chat_post', 10)) {
        toast.error("Doucement ! Attends quelques secondes avant de reposter.");
        return;
    }

    // SECURITY: Sanitize
    const cleanMessage = security.sanitize(newMessage);
    if (cleanMessage.length < MIN_MESSAGE_LENGTH) {
      toast.error("Message invalide ou trop court.");
      return;
    }

    if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Le message dépasse la limite de ${MAX_MESSAGE_LENGTH} caractères.`);
      return;
    }

    setPostLoading(true);

    const moderationResult = await sendToModerationWebhook(cleanMessage, null, false);
    const { decision, reason } = moderationResult;

    if (decision === 'rejected') {
      toast.error("❌ Votre message ne respecte pas les règles de la communauté.", { duration: 5000 });
      setPostLoading(false);
      const currentUser = await base44.auth.me();
      const violationCount = (currentUser.violation_count || 0) + 1;
      await base44.auth.updateMe({ violation_count: violationCount });
      return;
    }

    try {
      const colors = ['#EF4444', '#EC4899', '#8B5CF6', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      await base44.entities.ChatMessage.create({
        school_id: schoolId,
        message: cleanMessage,
        author_email: user.email,
        author_name: user.full_name,
        color: randomColor,
        is_anonymous: isAnonymous,
        edit_count: 0,
        like_count: 0
      });

      setNewMessage("");
      setIsAnonymous(false);
      setShowDialog(false);
      loadMessages();
      toast.success("✅ Message publié !");
    } catch (error) {
      console.error('Error publishing message:', error);
      toast.error("❌ Erreur technique. Réessayez.");
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

    setPostLoading(true);

    const moderationResult = await sendToModerationWebhook(newContent, messageId, true);
    const { decision, reason } = moderationResult;

    if (decision === 'rejected') {
      toast.error("❌ Votre message ne respecte pas les règles de la communauté.");
      setPostLoading(false);
      setEditingMessageId(null);
      setEditedContent("");
      return;
    }

    try {
      await base44.entities.ChatMessage.update(messageId, {
        message: newContent,
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
      await base44.entities.ChatMessage.update(messageId, { is_deleted: true });
      toast.success("Message supprimé avec succès.");
      loadMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Erreur lors de la suppression du message.");
    }
  };

  const handleReport = (messageId) => {
    if (!user) {
      toast.error("Vous devez être connecté pour signaler un message.");
      return;
    }
    setReportingMessageId(messageId);
    setShowReportDialog(true);
  };

  const lastMessage = messages[0];

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
      
      {/* SVG Gradient Definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="chat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4D8D" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      <div className="mt-2 mb-0 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-[#FF4D8D] via-purple-500 to-blue-500 shadow-lg cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden sticky bottom-2 z-10 group"

      onClick={() => setShowDialog(true)}>
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" style={{ transform: 'skewX(-20deg)' }} />

        <h2 className="text-sm sm:text-xl font-bold text-white flex items-center gap-2 mb-2 sm:mb-3">
          <span className="text-white">
            Chat Général de l'Établissement
          </span>
          <span className="hidden sm:inline">💌</span>
        </h2>
        {lastMessage ?
        <div className="mt-2 p-3 rounded-xl bg-white shadow-md">
            <p className="text-sm font-semibold line-clamp-2">
              <span className="font-bold text-blue-600">
                {lastMessage.is_anonymous ? 'Anonyme' : lastMessage.author_name}:
              </span>{' '}
              <span className="text-black">{lastMessage.message}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1.5 text-right">
              {format(new Date(lastMessage.created_date), "'Le' d MMM 'à' HH:mm", { locale: fr })}
            </p>
          </div> :

        <p className="text-white/80 text-sm">Clique pour ouvrir le chat 💬</p>
        }
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl h-[85vh] flex flex-col p-0 rounded-2xl">
          <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" style={{ stroke: "url(#chat-gradient)" }} />
              <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Chat Général de l'École
              </span>
              <span>💌</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {messages.length === 0 ?
            <div className="text-center text-slate-500 py-16">
                <p className="text-lg mb-4">Et si tu ouvrais la conversation ? 💬</p>
              </div> :

            <div className="space-y-3">
                {messages.map((msg) =>
              <ChatBubble
                key={msg.id}
                message={msg}
                user={user}
                onEdit={handleEdit}
                onSave={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onDelete={handleDelete}
                onReport={handleReport}
                onLike={handleLike}
                editingMessageId={editingMessageId}
                setEditedContent={setEditedContent}
                editedContent={editedContent}
                isLiked={userLikes.has(msg.id)}
                likeCount={getLikeCount(msg)} />

              )}
                <div ref={messagesEndRef} />
              </div>
            }
          </div>

          <div className="border-t bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 p-2 sm:p-6">
            <div className="space-y-2">
              <div className="relative">
                <Textarea
                  placeholder={user ? "Partage un souvenir, une anecdote... 💬" : "Connecte-toi pour écrire"}
                  value={newMessage}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (text.length <= MAX_MESSAGE_LENGTH) {
                      setNewMessage(text);
                    }
                  }}
                  className="min-h-[70px] sm:min-h-[100px] text-xs sm:text-base pr-2 sm:pr-4"
                  disabled={!user} />
                <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-slate-400 mt-1 px-1">
                  <span>
                    {newMessage.length}/{MAX_MESSAGE_LENGTH}
                    <span className="hidden sm:inline ml-1">(min 10)</span>
                  </span>
                  {newMessage.length >= MAX_MESSAGE_LENGTH &&
                  <span className="text-red-600 font-medium text-[9px] sm:text-[10px]">Max !</span>
                  }
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                {user && (
                  <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg border border-slate-200 flex-shrink-0">
                    <Checkbox
                      id="anonymous_chat"
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                      className="w-3 h-3 sm:w-4 sm:h-4" />
                    <Label htmlFor="anonymous_chat" className="text-[10px] sm:text-xs cursor-pointer whitespace-nowrap">
                      Anonyme
                    </Label>
                  </div>
                )}
                
                <div className="flex gap-1 sm:gap-2 ml-auto">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowDialog(false)} 
                    size="sm" 
                    className="text-[10px] sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
                    Annuler
                  </Button>
                  {user ? (
                    <Button
                      onClick={handlePublish}
                      disabled={!newMessage.trim() || postLoading || newMessage.length > MAX_MESSAGE_LENGTH || newMessage.length < 10}
                      className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white hover:opacity-90 text-[10px] sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                      size="sm">
                      {postLoading ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" /> : <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                      <span className="hidden sm:inline">Publier</span>
                      <span className="sm:hidden">OK</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => base44.auth.redirectToLogin(window.location.href)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 text-[10px] sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                      size="sm">
                      <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Connexion
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showReportDialog && reportingMessageId && (
        <ReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          reviewType="chat_message"
          reviewId={reportingMessageId}
          onSuccess={() => setReportingMessageId(null)}
        />
      )}
    </>);

}