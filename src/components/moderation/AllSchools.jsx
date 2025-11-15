import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { School, Search, Trash2, EyeOff, Eye, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

const formatDateWithTimezone = (dateString, formatStr) => {
  const date = new Date(dateString);
  return format(date, formatStr, { locale: fr });
};

const typeLabels = {
  college: "Collège",
  lycee: "Lycée",
  universite: "Université",
  ecole_privee: "École privée",
  ecole_commerce: "École de commerce",
  ecole_ingenieur: "École d'ingénieurs",
};

const typeColors = {
  college: "bg-blue-100 text-blue-800",
  lycee: "bg-green-100 text-green-800",
  universite: "bg-purple-100 text-purple-800",
  ecole_privee: "bg-orange-100 text-orange-800",
  ecole_commerce: "bg-red-100 text-red-800",
  ecole_ingenieur: "bg-pink-100 text-pink-800",
};

export default function AllSchools({ onUpdate }) {
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, school: null });

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = schools.filter((school) =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSchools(filtered);
    } else {
      setFilteredSchools(schools);
    }
  }, [searchTerm, schools]);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const allSchools = await base44.entities.School.list("-created_date", 500);
      setSchools(allSchools);
      setFilteredSchools(allSchools);
    } catch (error) {
      console.error("Error loading schools:", error);
      toast.error("Erreur lors du chargement des établissements");
    }
    setLoading(false);
  };

  const handleToggleStatus = async (school) => {
    setActionLoading(school.id);
    try {
      const newStatus = school.status === 'banned' ? 'approved' : 'banned';
      await base44.entities.School.update(school.id, { status: newStatus });
      toast.success(newStatus === 'banned' ? 'Établissement masqué' : 'Établissement réactivé');
      loadSchools();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error toggling school status:", error);
      toast.error("Erreur lors de la modification du statut");
    }
    setActionLoading(null);
    setConfirmDialog({ open: false, action: null, school: null });
  };

  const handleDelete = async (school) => {
    setActionLoading(school.id);
    try {
      await base44.entities.School.delete(school.id);
      toast.success("Établissement supprimé");
      loadSchools();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error deleting school:", error);
      toast.error("Erreur lors de la suppression");
    }
    setActionLoading(null);
    setConfirmDialog({ open: false, action: null, school: null });
  };

  const openConfirmDialog = (action, school) => {
    setConfirmDialog({ open: true, action, school });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <Search className="w-5 h-5 text-slate-400" />
        <Input
          placeholder="Rechercher un établissement ou une ville..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border-slate-300"
        />
        <Badge variant="outline" className="whitespace-nowrap">
          {filteredSchools.length} résultat(s)
        </Badge>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {filteredSchools.map((school) => (
          <div
            key={school.id}
            className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 truncate">{school.name}</h3>
                  <Badge className={typeColors[school.type]} variant="secondary">
                    {typeLabels[school.type]}
                  </Badge>
                  {school.status === 'banned' && (
                    <Badge variant="destructive">Masqué</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>{school.city}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Ajouté le {formatDateWithTimezone(school.created_date, 'dd/MM/yyyy')}
                </p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant={school.status === 'banned' ? 'default' : 'outline'}
                  onClick={() => openConfirmDialog('toggle', school)}
                  disabled={actionLoading === school.id}
                  className="whitespace-nowrap"
                >
                  {actionLoading === school.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : school.status === 'banned' ? (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      Réactiver
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" />
                      Masquer
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openConfirmDialog('delete', school)}
                  disabled={actionLoading === school.id}
                >
                  {actionLoading === school.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filteredSchools.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <School className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p>Aucun établissement trouvé</p>
          </div>
        )}
      </div>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, action: null, school: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === 'delete' ? 'Supprimer l\'établissement' : 
               confirmDialog.school?.status === 'banned' ? 'Réactiver l\'établissement' : 'Masquer l\'établissement'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'delete' 
                ? `Êtes-vous sûr de vouloir supprimer définitivement "${confirmDialog.school?.name}" ? Cette action est irréversible.`
                : confirmDialog.school?.status === 'banned'
                ? `Voulez-vous réactiver "${confirmDialog.school?.name}" et le rendre visible sur le site ?`
                : `Voulez-vous masquer "${confirmDialog.school?.name}" ? Il ne sera plus visible publiquement mais pourra être réactivé.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, action: null, school: null })}>
              Annuler
            </Button>
            <Button
              variant={confirmDialog.action === 'delete' ? 'destructive' : 'default'}
              onClick={() => {
                if (confirmDialog.action === 'delete') {
                  handleDelete(confirmDialog.school);
                } else {
                  handleToggleStatus(confirmDialog.school);
                }
              }}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}