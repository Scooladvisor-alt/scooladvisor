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
  Edit,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SchoolAdminMenu({ school, user, onUpdate }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    name: school.name || "",
    address: school.address || "",
    city: school.city || "",
    type: school.type || "",
    region: school.region || "",
  });


  const isAdmin = user && user.role === "admin";
  const canAccess = user && (user.role === "admin" || user.role === "moderator");
  if (!canAccess) return null;

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
      const newHidden = !school.is_hidden;
      await base44.entities.School.update(school.id, { is_hidden: newHidden });
      await logAction(newHidden ? "hide" : "unhide", `Établissement ${newHidden ? "masqué" : "affiché"}`);
      toast.success(newHidden ? "Établissement masqué" : "Établissement affiché");
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
          <button className="flex items-center gap-0.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5 md:hidden">
            <span className="text-xs">•</span>
            <span className="text-xs">•</span>
            <span className="text-xs">•</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuTrigger asChild className="hidden md:block">
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

    </>
  );
}