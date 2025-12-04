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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreVertical,
  EyeOff,
  Eye,
  Trash2,
  ImageIcon,
  Edit,
  BarChart3,
  AlertTriangle,
  Loader2,
  Star,
  MessageSquare,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SchoolAdminMenu({ school, user, onUpdate }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [editData, setEditData] = useState({
    name: school.name || "",
    address: school.address || "",
    city: school.city || "",
    type: school.type || "",
    region: school.region || "",
  });
  const [avatarUrl, setAvatarUrl] = useState(school.logo_url || "");

  const isAdmin = user && (user.role === "admin" || user.role === "moderator");
  if (!isAdmin) return null;

  const logAction = async (actionType, details = "") => {
    try {
      await base44.entities.AuditLog.create({
        action_type: actionType,
        target_type: "school",
        target_id: school.id,
        target_name: school.name,
        admin_email: user.email,
        admin_id: user.id,
        details: details,
        previous_data: school,
      });
    } catch (error) {
      console.error("Error logging action:", error);
    }
  };

  const handleHide = async () => {
    setLoading(true);
    try {
      const newStatus = school.status === "banned" ? "approved" : "banned";
      await base44.entities.School.update(school.id, { status: newStatus });
      await logAction(newStatus === "banned" ? "hide" : "unhide", `Établissement ${newStatus === "banned" ? "masqué" : "affiché"}`);
      toast.success(newStatus === "banned" ? "Établissement masqué" : "Établissement affiché");
      setShowHideConfirm(false);
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
      await logAction("delete", "Suppression définitive de l'établissement");
      await base44.entities.School.delete(school.id);
      toast.success("Établissement supprimé définitivement");
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
      await base44.entities.School.update(school.id, editData);
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
    setLoading(true);
    try {
      await base44.entities.School.update(school.id, { logo_url: avatarUrl });
      await logAction("update_avatar", `Logo modifié: ${avatarUrl}`);
      toast.success("Logo mis à jour");
      setShowAvatarDialog(false);
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAvatarUrl(file_url);
      toast.success("Image uploadée");
    } catch (error) {
      toast.error("Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const [reviews, teachers] = await Promise.all([
        base44.entities.SchoolReview.filter({ school_id: school.id }),
        base44.entities.Teacher.filter({ school_id: school.id }),
      ]);

      setStats({
        totalReviews: reviews.length,
        publishedReviews: reviews.filter((r) => r.status === "published").length,
        averageRating: school.average_rating || 0,
        totalTeachers: teachers.length,
        approvedTeachers: teachers.filter((t) => t.status === "approved").length,
      });
      setShowStatsDialog(true);
    } catch (error) {
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  const typeLabels = {
    college: "Collège",
    lycee: "Lycée",
    universite: "Université",
    ecole_privee: "École privée",
    ecole_commerce: "École de commerce",
    ecole_ingenieur: "École d'ingénieurs",
  };

  const isHidden = school.status === "banned";

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
              {isHidden ? (
                <>
                  <Eye className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-green-700">Afficher l'établissement</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-2 text-slate-600" />
                  <span>Masquer l'établissement</span>
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowAvatarDialog(true)}
              className="cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-blue-700">Modifier le logo</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setShowEditDialog(true)}
              className="cursor-pointer"
            >
              <Edit className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-blue-700">Modifier les infos</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={loadStats} className="cursor-pointer">
              <BarChart3 className="w-4 h-4 mr-2 text-purple-600" />
              <span className="text-purple-700">Voir les statistiques</span>
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
              {isHidden ? <Eye className="w-5 h-5 text-green-600" /> : <EyeOff className="w-5 h-5 text-amber-600" />}
              {isHidden ? "Afficher l'établissement" : "Masquer l'établissement"}
            </DialogTitle>
            <DialogDescription>
              {isHidden
                ? "L'établissement sera à nouveau visible pour tous les utilisateurs."
                : "L'établissement sera caché du site mais conservé en base de données."}
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
              Cette action est irréversible. L'établissement <strong>{school.name}</strong>, tous ses professeurs et avis seront supprimés définitivement.
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

      {/* Modal Modifier Logo */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              Modifier le logo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Preview" className="w-32 h-32 rounded-xl object-cover border-4 border-slate-200" />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-slate-200 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-slate-400" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Uploader une image</Label>
              <Input type="file" accept="image/*" onChange={handleFileUpload} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Ou coller une URL</Label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAvatarDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateAvatar} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modifier Infos */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Modifier les informations
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de l'établissement</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Nom de l'établissement"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={editData.type} onValueChange={(value) => setEditData({ ...editData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Type d'établissement" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                placeholder="Adresse complète"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={editData.city}
                  onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                  placeholder="Ville"
                />
              </div>
              <div className="space-y-2">
                <Label>Région</Label>
                <Input
                  value={editData.region}
                  onChange={(e) => setEditData({ ...editData, region: e.target.value })}
                  placeholder="Région"
                />
              </div>
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

      {/* Modal Statistiques */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Statistiques de {school.name}
            </DialogTitle>
          </DialogHeader>
          {stats && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
                <Star className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-900">{stats.averageRating.toFixed(1)}</p>
                <p className="text-xs text-amber-700">Note moyenne /20</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">{stats.publishedReviews}</p>
                <p className="text-xs text-blue-700">Avis publiés</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
                <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">{stats.approvedTeachers}</p>
                <p className="text-xs text-purple-700">Professeurs</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                <MessageSquare className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{stats.totalReviews}</p>
                <p className="text-xs text-slate-700">Total avis</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowStatsDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}