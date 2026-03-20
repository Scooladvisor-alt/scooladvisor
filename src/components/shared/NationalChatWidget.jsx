import React, { useState, useEffect, useRef } from "react";
import { NationalMessage } from "@/entities/NationalMessage";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Send, Edit, Trash2, Save, Flag, Compass, MessageCircle, ChevronRight, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import ReportDialog from "@/components/shared/ReportDialog";
import JoinFamilyDialog from "@/components/shared/JoinFamilyDialog";
import { useJoinFamily } from "@/components/shared/useJoinFamily";

const formatDistance = (dateString) =>
  formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });

const MAX_LENGTH = 500;

export default function NationalChatWidget() {
  const [messages, setMessages] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [reportingMessage, setReportingMessage] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const messagesEndRef = useRef(null);
  const { showJoinDialog, actionDescription, requireAuth, closeDialog } = useJoinFamily();

  useEffect(() => {
    loadMessages();
    loadUser();
  }, []);

  useEffect(() => {
    if (showDialog) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showDialog]);

  const loadUser = async () => {
    try {
      setUser(await base44.auth.me());
    } catch {
      setUser(null);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.NationalMessage.list("-created_date", 50);
      const msgs = all.filter((m) => !m.is_deleted).reverse();
      setMessages(msgs);
      setLastMessage(msgs[msgs.length - 1] || null);
    } catch {
      setMessages([]);
      setLastMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!requireAuth(user, "publier un message")) return;
    if (!newMessage.trim() || newMessage.length < 10) return toast.error("Message trop court (10 caractères min).");
    if (newMessage.length > MAX_LENGTH) return toast.error(`Limite de ${MAX_LENGTH} caractères dépassée.`);

    const now = Date.now();
    const recent = messages.filter((m) => m.author_email === user.email && new Date(m.created_date).getTime() > now - 60000);
    if (recent.length >= 5) {
      const warns = (user.spam_warning_count || 0) + 1;
      await base44.auth.updateMe({ spam_warning_count: warns });
      if (warns >= 2) { await base44.auth.updateMe({ is_banned: true }); toast.error("Banni pour spam."); setTimeout(() => window.location.reload(), 2000); return; }
      return toast.error("Trop de messages d'un coup !");
    }

    setPostLoading(true);
    const colors = ["pink", "purple", "blue", "green", "orange", "red"];
    const formatted = newMessage.trim().charAt(0).toUpperCase() + newMessage.trim().slice(1);
    try {
      const msg = await base44.entities.NationalMessage.create({
        message: formatted,
        author_email: user.email,
        author_name: user.full_name,
        color: colors[Math.floor(Math.random() * colors.length)],
        is_anonymous: isAnonymous,
        edit_count: 0,
      });
      setNewMessage("");
      setIsAnonymous(false);
      await loadMessages();
      base44.functions.invoke("moderateAsync", { entityType: "NationalMessage", entityId: msg.id, content: formatted, context: {} }).catch(() => {});
    } catch {
      toast.error("Erreur technique.");
    } finally {
      setPostLoading(false);
    }
  };

  const handleSaveEdit = async (id, count) => {
    if (count >= 3) return toast.error("Limite de 3 modifications atteinte.");
    if (!editedContent.trim()) return;
    setPostLoading(true);
    const formatted = editedContent.trim().charAt(0).toUpperCase() + editedContent.trim().slice(1);
    try {
      await NationalMessage.update(id, { message: formatted, is_edited: true, edit_count: (count || 0) + 1 });
      setEditingId(null);
      setEditedContent("");
      await loadMessages();
      base44.functions.invoke("moderateAsync", { entityType: "NationalMessage", entityId: id, content: formatted, context: {} }).catch(() => {});
    } catch {
      toast.error("Erreur technique.");
    } finally {
      setPostLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce message ?")) return;
    try {
      await base44.entities.NationalMessage.update(id, { is_deleted: true });
      toast.success("Message supprimé.");
      loadMessages();
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleReport = (msg) => {
    if (!requireAuth(user, "signaler un message")) return;
    setReportingMessage(msg);
    setOpenMenuId(null);
  };

  return (
    <>
      {/* Widget preview */}
      <div
        className="my-6 rounded-2xl overflow-hidden shadow-lg cursor-pointer group hover:shadow-xl transition-all duration-300"
        onClick={() => setShowDialog(true)}
      >
        <div className="relative bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 px-4 py-3 flex items-center justify-between overflow-hidden">
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-white" />
            <span className="font-bold text-white text-sm">Mon Orientation</span>
          </div>
          <div className="flex items-center gap-1 text-white/80 text-xs">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{messages.length} message{messages.length !== 1 ? "s" : ""}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-2xl px-4 py-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Discute d'orientation, pose tes questions et trouve des conseils avec d'autres élèves &amp; étudiants.
          </p>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs"><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Chargement...</span></div>
          ) : lastMessage ? (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700">
              <p className="text-xs line-clamp-2 text-slate-700 dark:text-slate-200">
                <span className="font-semibold text-purple-600 dark:text-purple-400">{lastMessage.is_anonymous ? "Anonyme" : lastMessage.author_name} :</span>{" "}{lastMessage.message}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">{formatDistance(lastMessage.created_date)}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Sois le premier à poser une question !</p>
          )}
        </div>
      </div>

      {/* Dialog chat */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 rounded-2xl overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-700" style={{ maxHeight: "90vh" }}>
          {/* Header */}
          <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between bg-white dark:bg-slate-900 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #FF4D8D, #a855f7, #3b82f6)" }}>
                <Compass className="w-4 h-4 text-white" />
              </div>
              <div className="text-base font-bold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #FF4D8D, #a855f7, #3b82f6)" }}>
                Mon Orientation
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-white dark:bg-slate-900" onClick={() => setOpenMenuId(null)}>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-400">
                <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                  <Compass className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">C'est calme ici... Lance la discussion !</p>
                <p className="text-xs text-slate-400">Pose ta première question d'orientation.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = user && msg.created_by === user.email;
                const isMenuOpen = openMenuId === msg.id;
                const canEdit = isOwn && (msg.edit_count || 0) < 3;

                return (
                  <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                    {/* Avatar */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 select-none"
                      style={{
                        background: msg.is_anonymous ? "#94a3b8" : isOwn
                          ? "linear-gradient(135deg, #FF4D8D, #a855f7)"
                          : "linear-gradient(135deg, #3b82f6, #a855f7)",
                      }}
                    >
                      {msg.is_anonymous ? "?" : (msg.author_name || "?").charAt(0).toUpperCase()}
                    </div>

                    {/* Bubble + actions */}
                    <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-1.5">
                        {!isOwn && <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{msg.is_anonymous ? "Anonyme" : msg.author_name}</span>}
                        <span className="text-[9px] text-slate-400">{formatDistance(msg.created_date)}{msg.is_edited ? " (modifié)" : ""}</span>
                      </div>

                      {editingId === msg.id ? (
                        <div className="w-full min-w-[200px]">
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full text-xs rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 resize-none focus:outline-none focus:ring-1 focus:ring-purple-400"
                            rows={3}
                            style={{ fontFamily: "inherit" }}
                          />
                          <div className="flex gap-1.5 mt-1 justify-end">
                            <button onClick={() => setEditingId(null)} className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">Annuler</button>
                            <button onClick={() => handleSaveEdit(msg.id, msg.edit_count || 0)} disabled={postLoading} className="text-[10px] px-2 py-1 rounded-lg text-white flex items-center gap-1" style={{ background: "linear-gradient(90deg, #FF4D8D, #a855f7, #3b82f6)" }}>
                              {postLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <><Save className="w-2.5 h-2.5" /> Enregistrer</>}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group/bubble">
                          <div
                            className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${isOwn ? "text-white rounded-tr-sm" : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm"}`}
                            style={isOwn ? { background: "linear-gradient(135deg, #FF4D8D, #a855f7, #3b82f6)" } : {}}
                          >
                            {msg.message}
                          </div>
                          {/* Menu discret intégré dans la bulle */}
                          <div className={`absolute -top-3 ${isOwn ? "left-0" : "right-0"} opacity-0 group-hover/bubble:opacity-100 transition-opacity`}>
                            <div className="relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : msg.id); }}
                                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-sm"
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </button>
                              {isMenuOpen && (
                                <div className={`absolute z-50 top-6 ${isOwn ? "left-0" : "right-0"} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg py-1 min-w-[120px]`}>
                                  {isOwn ? (
                                    <>
                                      {canEdit && (
                                        <button onClick={() => { setEditingId(msg.id); setEditedContent(msg.message); setOpenMenuId(null); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                                          <Edit className="w-3 h-3" /> Modifier
                                        </button>
                                      )}
                                      <button onClick={() => { handleDelete(msg.id); setOpenMenuId(null); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                                        <Trash2 className="w-3 h-3" /> Supprimer
                                      </button>
                                    </>
                                  ) : (
                                    <button onClick={() => handleReport(msg)} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                                      <Flag className="w-3 h-3" /> Signaler
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 flex-shrink-0">
            <div className="relative">
              <textarea
                placeholder={user ? "Pose ta question ou partage un conseil d'orientation..." : "Connecte-toi pour participer"}
                value={newMessage}
                onChange={(e) => { if (e.target.value.length <= MAX_LENGTH) setNewMessage(e.target.value); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePublish(); } }}
                disabled={!user}
                rows={1}
                className="w-full pr-20 pb-6 pl-3 pt-2 resize-none rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white text-slate-900 outline-none focus:border-purple-300 dark:focus:border-purple-600 transition-colors placeholder:text-[9px]"
                style={{ fontFamily: "inherit", minHeight: 44, fontSize: "11px" }}
              />

              {/* Anonyme toggle */}
              <div className="absolute bottom-2 left-2">
                {user && (
                  <label className="flex items-center gap-1 cursor-pointer bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded-md border border-slate-100 dark:border-slate-600 select-none">
                    <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-3 h-3 accent-purple-500" />
                    <span className="text-[10px] font-bold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #FF4D8D, #a855f7, #3b82f6)" }}>
                      Anonyme
                    </span>
                  </label>
                )}
              </div>

              {/* Counter + send */}
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <span className={`text-[9px] ${newMessage.length >= MAX_LENGTH ? "text-red-500" : "text-slate-400"}`}>
                  {newMessage.length}/{MAX_LENGTH}
                </span>
                {user ? (
                  <button
                    onClick={handlePublish}
                    disabled={!newMessage.trim() || newMessage.length < 10 || newMessage.length > MAX_LENGTH || postLoading}
                    className="h-6 px-2.5 text-white text-[10px] rounded-lg flex items-center justify-center disabled:opacity-40 transition-opacity"
                    style={{ background: "linear-gradient(90deg, #FF4D8D, #a855f7, #3b82f6)" }}
                  >
                    {postLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
                  </button>
                ) : (
                  <button
                    onClick={() => base44.auth.redirectToLogin(window.location.href)}
                    className="h-6 px-2.5 text-white text-[10px] rounded-lg"
                    style={{ background: "linear-gradient(90deg, #3b82f6, #a855f7)" }}
                  >
                    Connexion
                  </button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {reportingMessage && (
        <ReportDialog
          open={!!reportingMessage}
          onOpenChange={(v) => { if (!v) setReportingMessage(null); }}
          reviewType="national_message"
          reviewId={reportingMessage.id}
          onSuccess={() => setReportingMessage(null)}
        />
      )}

      <JoinFamilyDialog open={showJoinDialog} onOpenChange={closeDialog} actionDescription={actionDescription} />
    </>
  );
}