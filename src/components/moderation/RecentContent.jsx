import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Loader2, School as SchoolIcon, User, MessageSquare, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const formatDateWithTimezone = (dateString, formatStr) => {
  const date = new Date(dateString);
  return format(date, formatStr, { locale: fr });
};

export default function RecentContent({ onUpdate }) {
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(10);

  useEffect(() => {
    loadRecentContent();
  }, []);

  const loadRecentContent = async () => {
    setLoading(true);
    try {
      const [schools, teacherReviews, schoolReviews] = await Promise.all([
        base44.entities.School.list("-created_date", 50).catch(() => []),
        base44.entities.TeacherReview.list("-created_date", 50).catch(() => []),
        base44.entities.SchoolReview.list("-created_date", 50).catch(() => [])
      ]);

      const allItems = [
        ...schools.filter(s => !s.is_deleted).map(item => ({
          ...item,
          type: 'school',
          display_name: item.name,
          subtitle: `${item.city || 'Ville inconnue'} - ${item.type || 'Type inconnu'}`,
          date: item.created_date
        })),
        ...teacherReviews.map(item => ({
          ...item,
          type: 'teacher_review',
          display_name: `Avis professeur`,
          subtitle: `Par ${item.created_by || 'Utilisateur inconnu'}`,
          date: item.created_date,
          comment: item.comment
        })),
        ...schoolReviews.map(item => ({
          ...item,
          type: 'school_review',
          display_name: `Avis établissement`,
          subtitle: `Par ${item.created_by || 'Utilisateur inconnu'}`,
          date: item.created_date,
          comment: item.comment
        }))
      ];

      allItems.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentItems(allItems);
    } catch (error) {
      console.error("Error loading recent content:", error);
      toast.error("Erreur lors du chargement du contenu récent");
    }
    setLoading(false);
  };

  const handleDelete = async (item) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${item.display_name}" ?`)) return;

    try {
      if (item.type === 'school') {
        await base44.entities.School.update(item.id, { is_deleted: true, deleted_date: new Date().toISOString() });
        toast.success("Établissement déplacé dans la corbeille");
      } else if (item.type === 'teacher_review') {
        await base44.entities.TeacherReview.update(item.id, { status: 'rejected' });
        toast.success("Avis déplacé dans la corbeille");
      } else if (item.type === 'school_review') {
        await base44.entities.SchoolReview.update(item.id, { status: 'rejected' });
        toast.success("Avis déplacé dans la corbeille");
      }
      
      loadRecentContent();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getItemIcon = (type) => {
    if (type === 'school') return SchoolIcon;
    if (type === 'teacher_review') return User;
    if (type === 'school_review') return MessageSquare;
    return Eye;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (recentItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Eye className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun contenu récent</h3>
        <p className="text-slate-600">Les nouveaux contenus apparaîtront ici</p>
      </div>
    );
  }

  const displayedItems = recentItems.slice(0, displayCount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-slate-600" />
          <p className="text-sm text-slate-600">
            {recentItems.length} élément(s) récent(s) • Affichage de {displayedItems.length}
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {displayedItems.map((item, index) => {
          const Icon = getItemIcon(item.type);
          const isReview = item.type.includes('review');
          
          return (
            <motion.div
              key={`${item.type}-${item.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:border-purple-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <h3 className="font-semibold text-slate-900 truncate">{item.display_name}</h3>
                        
                        {item.type === 'school' && (
                          <Link to={createPageUrl(`SchoolDetail?id=${item.id}`)} target="_blank">
                            <ExternalLink className="w-4 h-4 text-blue-500" />
                          </Link>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Badge variant="outline" className={
                            item.type === 'school' ? 'bg-blue-50 text-blue-700' :
                            item.type === 'teacher_review' ? 'bg-purple-50 text-purple-700' : 
                            'bg-green-50 text-green-700'
                          }>
                            {item.type === 'school' ? '🏫 Établissement' : 
                             item.type === 'teacher_review' ? '👨‍🏫 Avis Professeur' : '🏫 Avis École'}
                          </Badge>
                          <span className="text-xs">{item.subtitle}</span>
                        </div>
                        
                        {isReview && item.status && (
                          <Badge variant={item.status === 'published' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {item.status}
                          </Badge>
                        )}
                        
                        {isReview && item.comment && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200 mt-2">
                            <p className="text-xs text-slate-700 line-clamp-2">{item.comment}</p>
                          </div>
                        )}
                        
                        <p className="text-xs text-slate-500 mt-2">
                          Ajouté le {formatDateWithTimezone(item.date, 'dd/MM/yyyy à HH:mm')}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {recentItems.length > displayCount && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => setDisplayCount(prev => prev + 20)}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            Afficher 20 de plus
          </Button>
        </div>
      )}
    </div>
  );
}