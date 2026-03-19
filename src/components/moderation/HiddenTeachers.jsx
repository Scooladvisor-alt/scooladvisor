import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function HiddenTeachers({ onUpdate }) {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unhiding, setUnhiding] = useState({});

  useEffect(() => {
    loadHiddenTeachers();
  }, []);

  const loadHiddenTeachers = async () => {
    setLoading(true);
    try {
      const allTeachers = await base44.entities.Teacher.list();
      // Profs masqués : is_hidden: true (nouveau) OU is_deleted: true avec is_hidden != false (ancienne logique avant migration)
      const hiddenTeachers = allTeachers.filter(t =>
        t.is_hidden === true || t.status === "hidden" || (t.is_deleted === true && t.is_hidden !== false)
      );
      
      // Enrichir avec le nom de l'école
      const schoolIds = [...new Set(hiddenTeachers.map(t => t.school_id))];
      const schoolsMap = {};
      for (const id of schoolIds) {
        try {
          const schools = await base44.entities.School.filter({ id });
          if (schools.length > 0) schoolsMap[id] = schools[0];
        } catch {}
      }

      setTeachers(hiddenTeachers.map(t => ({ ...t, school: schoolsMap[t.school_id] })));
    } catch (error) {
      console.error("Error loading hidden teachers:", error);
    }
    setLoading(false);
  };

  const unhideTeacher = async (teacher) => {
    setUnhiding(prev => ({ ...prev, [teacher.id]: true }));
    try {
      // Remettre le prof visible : is_hidden: false et status: "approved"
      await base44.entities.Teacher.update(teacher.id, {
        is_hidden: false,
        is_deleted: false,
        status: "approved"
      });

      // Remettre tous ses avis visibles (status hidden -> published)
      const reviews = await base44.entities.TeacherReview.filter({ teacher_id: teacher.id });
      const hiddenReviews = reviews.filter(r => r.status === "hidden");
      for (const review of hiddenReviews) {
        await base44.entities.TeacherReview.update(review.id, { status: "published" });
      }

      toast.success(`${teacher.name} est de nouveau visible avec ${hiddenReviews.length} avis restauré(s).`);
      setTeachers(prev => prev.filter(t => t.id !== teacher.id));
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Erreur lors du démasquage.");
    }
    setUnhiding(prev => ({ ...prev, [teacher.id]: false }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Aucun professeur masqué</p>
        <p className="text-sm mt-1">Tous les professeurs sont actuellement visibles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        {teachers.length} professeur(s) actuellement masqué(s) sur le site.
      </p>
      {teachers.map(teacher => (
        <div
          key={teacher.id}
          className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-3 min-w-0">
            {teacher.photo_url && (
              <img
                src={teacher.photo_url}
                alt={teacher.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{teacher.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {teacher.subject} · {teacher.school?.name || "École inconnue"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(createPageUrl(`TeacherDetail?id=${teacher.id}`))}
              className="text-xs h-8"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Voir
            </Button>
            <Button
              size="sm"
              onClick={() => unhideTeacher(teacher)}
              disabled={unhiding[teacher.id]}
              className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
            >
              {unhiding[teacher.id] ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Démasquer
                </>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}