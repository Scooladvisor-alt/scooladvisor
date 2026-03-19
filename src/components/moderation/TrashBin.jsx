import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCcw, Loader2, AlertCircle, MapPin, MessageSquare, User, Mic, Users } from "lucide-react";
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

export default function TrashBin({ onUpdate }) {
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, item: null });

  useEffect(() => {
    loadDeletedItems();
  }, []);

  const loadDeletedItems = async () => {
    setLoading(true);
    try {
      const [schools, teacherReviews, schoolReviews, teachers, chatMessages, nationalMessages] = await Promise.all([
        base44.entities.School.list("-updated_date", 200).catch(() => []),
        base44.entities.TeacherReview.filter({ status: "rejected" }, "-updated_date", 100).catch(() => []),
        base44.entities.SchoolReview.filter({ status: "rejected" }, "-updated_date", 100).catch(() => []),
        base44.entities.Teacher.list("-updated_date", 100).catch(() => []),
        base44.entities.ChatMessage.list("-updated_date", 100).catch(() => []),
        base44.entities.NationalMessage.list("-updated_date", 100).catch(() => [])
      ]);
      
      // Écoles supprimées
      const deletedSchools = schools.filter(s => s.is_deleted).map(item => ({
        ...item,
        entity_type: 'School',
        display_name: item.name,
        subtitle: `${item.city || 'Ville inconnue'} - ${item.type || 'Type inconnu'}`,
        content: null
      }));

      // Avis professeurs rejetés
      const rejectedTeacherReviews = teacherReviews.map(item => ({
        ...item,
        entity_type: 'TeacherReview',
        display_name: `Avis professeur`,
        subtitle: `Par ${item.created_by || 'Utilisateur inconnu'}`,
        content: item.comment
      }));

      // Avis écoles rejetés
      const rejectedSchoolReviews = schoolReviews.map(item => ({
        ...item,
        entity_type: 'SchoolReview',
        display_name: `Avis établissement`,
        subtitle: `Par ${item.created_by || 'Utilisateur inconnu'}`,
        content: item.comment
      }));

      // Professeurs supprimés (exclure les masqués qui ont is_hidden: true)
      const deletedTeachers = teachers.filter(t => t.is_deleted && !t.is_hidden).map(item => ({
        ...item,
        entity_type: 'Teacher',
        display_name: item.name,
        subtitle: `${item.subject || 'Matière inconnue'} - ${item.school_id || 'École inconnue'}`,
        content: null
      }));

      // Messages de chat supprimés
      const deletedChatMessages = chatMessages.filter(m => m.is_deleted).map(item => ({
        ...item,
        entity_type: 'ChatMessage',
        display_name: 'Message Chat Établissement',
        subtitle: `Par ${item.author_name || 'Anonyme'} - ${item.is_anonymous ? '🕵️ Anonyme' : ''}`,
        content: item.message
      }));

      // Messages nationaux supprimés
      const deletedNationalMessages = nationalMessages.filter(m => m.is_deleted).map(item => ({
        ...item,
        entity_type: 'NationalMessage',
        display_name: 'Prends le micro des étudiants',
        subtitle: `Par ${item.author_name || 'Anonyme'} - ${item.is_anonymous ? '🕵️ Anonyme' : ''}`,
        content: item.message
      }));
      
      const allDeleted = [
        ...deletedSchools, 
        ...rejectedTeacherReviews, 
        ...rejectedSchoolReviews,
        ...deletedTeachers,
        ...deletedChatMessages,
        ...deletedNationalMessages
      ];
      allDeleted.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
      
      setDeletedItems(allDeleted);
    } catch (error) {
      console.error("Error loading deleted items:", error);
      toast.error("Erreur lors du chargement de la corbeille");
    }
    setLoading(false);
  };

  const handleRestore = async (item) => {
    setActionLoading(item.id);
    try {
      if (item.entity_type === 'School') {
        await base44.entities.School.update(item.id, { 
          is_deleted: false,
          deleted_date: null 
        });
        toast.success("Établissement restauré");
      } else if (item.entity_type === 'TeacherReview') {
        await base44.entities.TeacherReview.update(item.id, { 
          status: 'published'
        });
        toast.success("Avis professeur restauré");
      } else if (item.entity_type === 'SchoolReview') {
        await base44.entities.SchoolReview.update(item.id, { 
          status: 'published'
        });
        toast.success("Avis établissement restauré");
      } else if (item.entity_type === 'Teacher') {
        await base44.entities.Teacher.update(item.id, { 
          is_deleted: false
        });
        toast.success("Professeur restauré");
      } else if (item.entity_type === 'ChatMessage') {
        await base44.entities.ChatMessage.update(item.id, { 
          is_deleted: false
        });
        toast.success("Message de chat restauré");
      } else if (item.entity_type === 'NationalMessage') {
        await base44.entities.NationalMessage.update(item.id, { 
          is_deleted: false
        });
        toast.success("Message national restauré");
      }
      
      loadDeletedItems();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error restoring item:", error);
      toast.error("Erreur lors de la restauration");
    }
    setActionLoading(null);
    setConfirmDialog({ open: false, action: null, item: null });
  };

  const handlePermanentDelete = async (item) => {
    setActionLoading(item.id);
    try {
      await base44.entities[item.entity_type].delete(item.id);
      toast.success("Élément supprimé définitivement");
      loadDeletedItems();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error permanently deleting item:", error);
      toast.error("Erreur lors de la suppression définitive");
    }
    setActionLoading(null);
    setConfirmDialog({ open: false, action: null, item: null });
  };

  const getItemIcon = (entityType) => {
    if (entityType === 'School') return MapPin;
    if (entityType === 'TeacherReview') return User;
    if (entityType === 'SchoolReview') return MessageSquare;
    if (entityType === 'Teacher') return Users;
    if (entityType === 'ChatMessage') return MessageSquare;
    if (entityType === 'NationalMessage') return Mic;
    return Trash2;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (deletedItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Trash2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Corbeille vide</h3>
        <p className="text-slate-600">Aucun élément supprimé récemment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Trash2 className="w-5 h-5 text-slate-600" />
        <p className="text-sm text-slate-600">
          {deletedItems.length} élément(s) dans la corbeille
        </p>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {deletedItems.map((item) => {
          const Icon = getItemIcon(item.entity_type);
          const isReview = item.entity_type.includes('Review');
          
          return (
            <div
              key={`${item.entity_type}-${item.id}`}
              className="bg-red-50 rounded-lg border border-red-200 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <h3 className="font-semibold text-slate-900 truncate">{item.display_name}</h3>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                        {item.entity_type === 'School' ? 'Établissement' : 
                         item.entity_type === 'TeacherReview' ? 'Avis Professeur' : 
                         item.entity_type === 'SchoolReview' ? 'Avis École' :
                         item.entity_type === 'Teacher' ? 'Professeur' :
                         item.entity_type === 'ChatMessage' ? 'Chat École' :
                         item.entity_type === 'NationalMessage' ? 'Micro National' : 'Autre'}
                      </Badge>
                      <span className="text-xs">{item.subtitle}</span>
                    </div>
                    
                    {item.content && (
                      <div className="bg-white p-2 rounded border border-red-200 mt-2">
                        <p className="text-xs text-slate-700 line-clamp-3">{item.content}</p>
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-500 mt-2">
                      Supprimé le {formatDateWithTimezone(item.updated_date, 'dd/MM/yyyy à HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDialog({ open: true, action: 'restore', item })}
                    disabled={actionLoading === item.id}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    {actionLoading === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restaurer
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmDialog({ open: true, action: 'permanent', item })}
                    disabled={actionLoading === item.id}
                  >
                    {actionLoading === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, action: null, item: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.action === 'restore' ? (
                <>
                  <RotateCcw className="w-5 h-5 text-green-600" />
                  Restaurer l'élément
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Suppression définitive
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'restore' 
                ? `Voulez-vous restaurer "${confirmDialog.item?.display_name}" ? Il redeviendra visible sur le site.`
                : `Êtes-vous sûr de vouloir supprimer définitivement "${confirmDialog.item?.display_name}" ? Cette action est IRRÉVERSIBLE.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, action: null, item: null })}>
              Annuler
            </Button>
            <Button
              variant={confirmDialog.action === 'restore' ? 'default' : 'destructive'}
              onClick={() => {
                if (confirmDialog.action === 'restore') {
                  handleRestore(confirmDialog.item);
                } else {
                  handlePermanentDelete(confirmDialog.item);
                }
              }}
            >
              {confirmDialog.action === 'restore' ? 'Restaurer' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}