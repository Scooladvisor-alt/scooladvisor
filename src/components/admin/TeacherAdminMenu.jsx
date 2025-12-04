import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MoreVertical,
  EyeOff,
  Eye,
  UserMinus,
  UserCheck,
  Trash2,
  ImageIcon,
  Edit,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherAdminMenu({ teacher, user, onUpdate }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    name: teacher.name || "",
    subject: teacher.subject || "",
  });
  const [selectedAvatar, setSelectedAvatar] = useState(teacher.photo_url || "");

  const avatarGallery = [
    { id: "avatar1", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d8ad15814_a-humanized-black-graduation-cap-with-a-star-shape.png", name: "Bleu" },
    { id: "avatar2", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/639510ec4_a-humanized-black-graduation-cap-with-a-star-shape-2.png", name: "Violet" },
    { id: "avatar3", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png", name: "Jaune" },
    { id: "avatar4", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/cd2a7b336_a-humanized-black-graduation-cap-with-a-star-shape-4.png", name: "Vert" },
    { id: "avatar5", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5e2f6487e_a-humanized-black-graduation-cap-with-a-star-shape-5.png", name: "Cyan" },
    { id: "default_male", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face", name: "Homme 1" },
    { id: "default_female", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face", name: "Femme 1" },
    { id: "default_male2", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face", name: "Homme 2" },
    { id: "default_female2", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face", name: "Femme 2" },
    { id: "default_male3", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face", name: "Homme 3" },
    { id: "default_female3", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face", name: "Femme 3" },
    { id: "default_neutral", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face", name: "Pro 1" },
  ];

  const isAdmin = user && user.role === "admin";
  if (!isAdmin) return null;

  const logAction = async (actionType, details = "") => {
    try {
      await base44.entities.AuditLog.create({
        action_type: actionType,
        target_type: "teacher",
        target_id: teacher.id,
        target_name: teacher.name,
        admin_email: user.email,
        admin_id: user.id,
        details: details,
        previous_data: teacher,
      });
    } catch (error) {
      console.error("Error logging action:", error);
    }
  };

  const handleHide = async () => {
    setLoading(true);
    try {
      const newStatus = !teacher.is_deleted;
      await base44.entities.Teacher.update(teacher.id, { is_deleted: newStatus });
      await logAction(newStatus ? "hide" : "unhide", `Professeur ${newStatus ? "masqué" : "affiché"}`);
      toast.success(newStatus ? "Professeur masqué" : "Professeur affiché");
      setShowHideConfirm(false);
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de l'opération");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkFormer = async () => {
    setLoading(true);
    try {
      const newStatus = !teacher.is_former;
      await base44.entities.Teacher.update(teacher.id, { is_former: newStatus });
      await logAction(newStatus ? "mark_former" : "unmark_former", `Marqué comme ${newStatus ? "ancien" : "actuel"} professeur`);
      toast.success(newStatus ? "Marqué comme ancien professeur" : "Marqué comme professeur actuel");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de l'opération");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await logAction("delete", "Suppression définitive du professeur");
      await base44.entities.Teacher.delete(teacher.id);
      toast.success("Professeur supprimé définitivement");
      setShowDeleteConfirm(false);
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInfo = async () => {
    setLoading(true);
    try {
      await base44.entities.Teacher.update(teacher.id, editData);
      await logAction("update", `Informations modifiées: ${JSON.stringify(editData)}`);
      toast.success("Informations mises à jour");
      setShowEditDialog(false);
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAvatar = async () => {
    if (!selectedAvatar) return;
    setLoading(true);
    try {
      await base44.entities.Teacher.update(teacher.id, { photo_url: selectedAvatar });
      await logAction("update_avatar", `Avatar modifié: ${selectedAvatar}`);
      toast.success("Avatar mis à jour");
      setShowAvatarDialog(false);
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de l'avatar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56" asChild>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <DropdownMenuItem
              onClick={() => setShowHideConfirm(true)}
              className="cursor-pointer"
            >
              {teacher.is_deleted ? (
                <>
                  <Eye className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-green-700">Afficher le professeur</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-2 text-slate-600" />
                  <span>Masquer le professeur</span>
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleMarkFormer} className="cursor-pointer">
              {teacher.is_former ? (
                <>
                  <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-green-700">Marquer comme actuel</span>
                </>
              ) : (
                <>
                  <UserMinus className="w-4 h-4 mr-2 text-orange-600" />
                  <span className="text-orange-700">Marquer comme ancien</span>
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowAvatarDialog(true)}
              className="cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-blue-700">Modifier l'avatar</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setShowEditDialog(true)}
              className="cursor-pointer"
            >
              <Edit className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-blue-700">Modifier les infos</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowDeleteConfirm(true)}
              className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span>Supprimer définitivement</span>
            </DropdownMenuItem>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Masquer */}
      <Dialog open={showHideConfirm} onOpenChange={setShowHideConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {teacher.is_deleted ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-amber-600" />}
              {teacher.is_deleted ? "Afficher le professeur" : "Masquer le professeur"}
            </DialogTitle>
            <DialogDescription>
              {teacher.is_deleted
                ? "Le profil sera à nouveau visible pour tous les utilisateurs."
                : "Le profil sera caché du site mais conservé en base de données."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowHideConfirm(false)}>
              Annuler
            </Button>
            <Button onClick={handleHide} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Suppression */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Suppression définitive
            </DialogTitle>
          </DialogHeader>
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Cette action est irréversible. Le professeur <strong>{teacher.name}</strong> et tous ses avis seront supprimés définitivement.
            </AlertDescription>
          </Alert>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modifier Avatar - Galerie */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              Choisir un nouvel avatar
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {avatarGallery.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.url)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-3 transition-all hover:scale-105 ${
                    selectedAvatar === avatar.url
                      ? "border-blue-500 ring-2 ring-blue-300 shadow-lg"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedAvatar === avatar.url && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAvatarDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateAvatar} disabled={loading || !selectedAvatar}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modifier Infos */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Modifier les informations
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du professeur</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Nom complet"
              />
            </div>
            <div className="space-y-2">
              <Label>Matière</Label>
              <Input
                value={editData.subject}
                onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                placeholder="Matière enseignée"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateInfo} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}