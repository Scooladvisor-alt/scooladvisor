import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, ExternalLink, School, Users } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function HiddenItems({ onUpdate }) {
  const navigate = useNavigate();
  const [hiddenTeachers, setHiddenTeachers] = useState([]);
  const [hiddenSchools, setHiddenSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadHiddenItems();
  }, []);

  const loadHiddenItems = async () => {
    setLoading(true);
    try {
      const [allTeachers, allSchools] = await Promise.all([
        base44.entities.Teacher.list(),
        base44.entities.School.list(),
      ]);

      // Profs masqués : is_hidden:true (nouveau) ou is_deleted:true avec is_hidden != false (ancien)
      const teachers = allTeachers.filter(
        t => t.is_hidden === true || (t.is_deleted === true && t.is_hidden !== false)
      );

      // Établissements masqués : status "banned"
      const schools = allSchools.filter(s => s.status === "banned");

      // Enrichir les profs avec le nom de l'école
      const schoolIds = [...new Set(teachers.map(t => t.school_id))];
      const schoolsMap = {};
      for (const s of allSchools) schoolsMap[s.id] = s;

      setHiddenTeachers(teachers.map(t => ({ ...t, school: schoolsMap[t.school_id] })));
      setHiddenSchools(schools);
    } catch (error) {
      console.error("Error loading hidden items:", error);
      toast.error("Erreur lors du chargement");
    }
    setLoading(false);
  };

  const unhideTeacher = async (teacher) => {
    setActionLoading(teacher.id);
    try {
      await base44.entities.Teacher.update(teacher.id, {
        is_hidden: false,
        is_deleted: false,
        status: "approved",
      });

      // Restaurer les avis cachés
      const reviews = await base44.entities.TeacherReview.filter({ teacher_id: teacher.id });
      const hiddenReviews = reviews.filter(r => r.status === "hidden");
      for (const r of hiddenReviews) {
        await base44.entities.TeacherReview.update(r.id, { status: "published" });
      }

      toast.success(`${teacher.name} est de nouveau visible.`);
      setHiddenTeachers(prev => prev.filter(t => t.id !== teacher.id));
      if (onUpdate) onUpdate();
    } catch {
      toast.error("Erreur lors du démasquage.");
    }
    setActionLoading(null);
  };

  const unhideSchool = async (school) => {
    setActionLoading(school.id);
    try {
      await base44.entities.School.update(school.id, { status: "approved" });
      toast.success(`${school.name} est de nouveau visible.`);
      setHiddenSchools(prev => prev.filter(s => s.id !== school.id));
      if (onUpdate) onUpdate();
    } catch {
      toast.error("Erreur lors du démasquage.");
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const total = hiddenTeachers.length + hiddenSchools.length;

  if (total === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Aucun élément masqué</p>
        <p className="text-sm mt-1">Tout est visible sur le site.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {total} élément(s) masqué(s) sur le site.
      </p>

      {/* Établissements masqués */}
      {hiddenSchools.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200 mb-3 text-sm uppercase tracking-wide">
            <School className="w-4 h-4" />
            Établissements masqués ({hiddenSchools.length})
          </h3>
          <div className="space-y-3">
            {hiddenSchools.map(school => (
              <div
                key={school.id}
                className="flex items-center justify-between gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{school.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {school.city} · {school.type}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(createPageUrl(`SchoolDetail?id=${school.id}`))}
                    className="text-xs h-8"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Voir
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => unhideSchool(school)}
                    disabled={actionLoading === school.id}
                    className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {actionLoading === school.id ? (
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
        </div>
      )}

      {/* Professeurs masqués */}
      {hiddenTeachers.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200 mb-3 text-sm uppercase tracking-wide">
            <Users className="w-4 h-4" />
            Professeurs masqués ({hiddenTeachers.length})
          </h3>
          <div className="space-y-3">
            {hiddenTeachers.map(teacher => (
              <div
                key={teacher.id}
                className="flex items-center justify-between gap-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {teacher.photo_url && (
                    <img
                      src={teacher.photo_url}
                      alt={teacher.name}
                      className="w-10 h-10 rounded-full object-cover border border-pink-200 shrink-0"
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
                    disabled={actionLoading === teacher.id}
                    className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {actionLoading === teacher.id ? (
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
        </div>
      )}
    </div>
  );
}