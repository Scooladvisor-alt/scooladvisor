import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, AlertTriangle, Trash2, Loader2, ExternalLink, School as SchoolIcon, Search } from "lucide-react";
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

async function enrichReports(reports, entityType) {
  if (!reports || reports.length === 0) return [];
  
  const entityIds = [...new Set(reports.map(r => r[`${entityType}_id`]).filter(id => id))];
  if (entityIds.length === 0) return reports;

  let entities = [];

  try {
    if (entityType === 'teacher') {
      entities = await base44.entities.Teacher.filter({id__in: entityIds});
    } else if (entityType === 'school') {
      entities = await base44.entities.School.filter({id__in: entityIds});
    }
  } catch (error) {
    console.error(`Error fetching ${entityType}s:`, error);
    return reports;
  }

  const entityMap = new Map(entities.map(e => [e.id, e]));

  let schoolsMap = new Map();
  if (entityType === 'teacher') {
    const schoolIds = [...new Set(entities.map(e => e.school_id).filter(id => id))];
    if (schoolIds.length > 0) {
      try {
        const schools = await base44.entities.School.filter({id__in: schoolIds});
        schoolsMap = new Map(schools.map(s => [s.id, s]));
      } catch (error) {
        console.error("Error fetching schools for teachers:", error);
      }
    }
  }

  return reports.map(report => ({
    ...report,
    entity: entityMap.get(report[`${entityType}_id`]),
    school: entityType === 'teacher' && entityMap.get(report[`${entityType}_id`]) 
      ? schoolsMap.get(entityMap.get(report[`${entityType}_id`]).school_id) 
      : null
  }));
}

async function enrichReviewReports(reports) {
  if (!reports || reports.length === 0) return [];
  
  const reviewIds = [...new Set(reports.map(r => r.review_id).filter(id => id))];
  if (reviewIds.length === 0) return reports;

  const teacherReviewIds = reports.filter(r => r.review_type === 'teacher').map(r => r.review_id);
  const schoolReviewIds = reports.filter(r => r.review_type === 'school').map(r => r.review_id);

  let teacherReviews = [];
  let schoolReviews = [];

  try {
    if (teacherReviewIds.length > 0) {
      teacherReviews = await base44.entities.TeacherReview.filter({id__in: teacherReviewIds});
    }
    if (schoolReviewIds.length > 0) {
      schoolReviews = await base44.entities.SchoolReview.filter({id__in: schoolReviewIds});
    }
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return reports;
  }

  const teacherReviewMap = new Map(teacherReviews.map(r => [r.id, r]));
  const schoolReviewMap = new Map(schoolReviews.map(r => [r.id, r]));

  const teacherIds = [...new Set(teacherReviews.map(r => r.teacher_id).filter(id => id))];
  const schoolIds = [...new Set([
    ...schoolReviews.map(r => r.school_id).filter(id => id),
    ...teacherReviews.map(r => r.school_id).filter(id => id)
  ])];

  let teachers = [];
  let schools = [];

  try {
    if (teacherIds.length > 0) {
      teachers = await base44.entities.Teacher.filter({id__in: teacherIds});
    }
    if (schoolIds.length > 0) {
      schools = await base44.entities.School.filter({id__in: schoolIds});
    }
  } catch (error) {
    console.error("Error fetching teachers/schools:", error);
  }

  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  const schoolMap = new Map(schools.map(s => [s.id, s]));

  return reports.map(report => {
    const review = report.review_type === 'teacher' 
      ? teacherReviewMap.get(report.review_id)
      : schoolReviewMap.get(report.review_id);
    
    let locationInfo = null;
    if (report.review_type === 'teacher' && review) {
      const teacher = teacherMap.get(review.teacher_id);
      const school = teacher ? schoolMap.get(teacher.school_id) : null;
      locationInfo = { teacher, school };
    } else if (report.review_type === 'school' && review) {
      const school = schoolMap.get(review.school_id);
      locationInfo = { school };
    }

    return {
      ...report,
      review,
      locationInfo
    };
  });
}

export default function AllReports({ onUpdate }) {
  const [reviewReports, setReviewReports] = useState([]);
  const [teacherReports, setTeacherReports] = useState([]);
  const [schoolReports, setSchoolReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      let reviews = [];
      let teacherStatus = [];
      let teacherFraud = [];
      let schools = [];

      try {
        reviews = await base44.entities.Report.filter({ status: "pending" }, "-created_date");
      } catch (error) {
        console.warn("Could not load Report entity:", error);
      }

      try {
        teacherStatus = await base44.entities.TeacherStatusReport.filter({ status: "pending" });
      } catch (error) {
        console.warn("Could not load TeacherStatusReport entity:", error);
      }

      try {
        teacherFraud = await base44.entities.TeacherFraudReport.filter({ status: "pending" });
      } catch (error) {
        console.warn("Could not load TeacherFraudReport entity:", error);
      }

      try {
        schools = await base44.entities.SchoolReport.filter({ status: "pending" }, "-created_date");
      } catch (error) {
        console.warn("Could not load SchoolReport entity:", error);
      }

      const allTeacherReports = [...teacherStatus, ...teacherFraud];
      const enrichedTeacherReports = await enrichReports(allTeacherReports, 'teacher');
      const enrichedSchoolReports = await enrichReports(schools, 'school');
      const enrichedReviewReports = await enrichReviewReports(reviews);

      setReviewReports(enrichedReviewReports);
      setTeacherReports(enrichedTeacherReports);
      setSchoolReports(enrichedSchoolReports);
    } catch (error) {
      console.error("Failed to load reports:", error);
      toast.error("Impossible de charger les signalements.");
    } finally {
      setLoading(false);
      onUpdate();
    }
  };

  const handleDeleteReview = async (report) => {
    try {
      if (report.review_type === 'teacher') {
        await base44.entities.TeacherReview.update(report.review_id, { status: 'rejected' });
      } else {
        await base44.entities.SchoolReview.update(report.review_id, { status: 'rejected' });
      }
      await base44.entities.Report.update(report.id, { status: "approved" });
      toast.success("Avis rejeté et déplacé dans la corbeille");
      loadAllReports();
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'avis");
    }
  };

  const handleRejectReport = async (reportId, reportType) => {
    try {
      if (reportType === 'review') {
        await base44.entities.Report.update(reportId, { status: "rejected" });
      } else if (reportType === 'teacher_status') {
        await base44.entities.TeacherStatusReport.update(reportId, { status: "rejected" });
      } else if (reportType === 'teacher_fraud') {
        await base44.entities.TeacherFraudReport.update(reportId, { status: "rejected" });
      } else if (reportType === 'school') {
        await base44.entities.SchoolReport.update(reportId, { status: "rejected" });
      }
      toast.success("Signalement rejeté");
      loadAllReports();
    } catch (error) {
      toast.error("Erreur lors du rejet du signalement");
    }
  };

  const handleDeleteTeacher = async (teacherId, reportId, reportType) => {
    try {
      await base44.entities.Teacher.delete(teacherId);
      
      if (reportType === 'teacher_fraud') {
        await base44.entities.TeacherFraudReport.update(reportId, { status: "processed" });
      } else {
        await base44.entities.TeacherStatusReport.update(reportId, { status: "processed" });
      }

      toast.success("Professeur supprimé");
      loadAllReports();
    } catch (error) {
      toast.error("Erreur lors de la suppression du professeur");
    }
  };

  const handleUpdateTeacherStatus = async (teacherId, reportId) => {
    try {
      await base44.entities.Teacher.update(teacherId, { is_former: true });
      await base44.entities.TeacherStatusReport.update(reportId, { status: "processed" });
      toast.success("Professeur marqué comme 'ancien'");
      loadAllReports();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleDeleteSchool = async (schoolId, reportId) => {
    try {
      await base44.entities.School.update(schoolId, { is_deleted: true, deleted_date: new Date().toISOString() });
      await base44.entities.SchoolReport.update(reportId, { status: "processed" });
      toast.success("Établissement déplacé dans la corbeille");
      loadAllReports();
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'établissement");
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center flex justify-center items-center">
          <Loader2 className="w-8 h-8 mr-2 text-slate-400 animate-spin" />
          <p className="text-slate-600">Chargement des signalements...</p>
        </CardContent>
      </Card>
    );
  }

  const totalReports = (reviewReports?.length || 0) + (teacherReports?.length || 0) + (schoolReports?.length || 0);

  if (totalReports === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900">Tout est en ordre !</h3>
          <p className="text-slate-600">Aucun nouveau signalement à traiter.</p>
        </CardContent>
      </Card>
    );
  }

  const filteredTeacherReports = teacherReports.filter(report => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.teacher_name?.toLowerCase().includes(query) ||
      report.teacher_id?.toLowerCase().includes(query) ||
      report.entity?.name?.toLowerCase().includes(query) ||
      report.school?.name?.toLowerCase().includes(query)
    );
  });

  const filteredSchoolReports = schoolReports.filter(report => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.school_name?.toLowerCase().includes(query) ||
      report.school_id?.toLowerCase().includes(query) ||
      report.entity?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Rechercher par nom de professeur, établissement ou ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/90 backdrop-blur-sm border-slate-300 focus:border-blue-500 h-11"
        />
      </div>
      
      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reviews">
            Avis ({reviewReports?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="teachers">
            Professeurs ({filteredTeacherReports?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="schools">
            Établissements ({filteredSchoolReports?.length || 0})
          </TabsTrigger>
        </TabsList>

      <TabsContent value="reviews" className="space-y-4">
        {(!reviewReports || reviewReports.length === 0) && <p className="text-center text-slate-500 py-4">Aucun signalement d'avis.</p>}
        {reviewReports && reviewReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-red-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <h3 className="text-xl font-bold text-slate-900">Signalement d'avis</h3>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-amber-900 mb-2">📋 Détails du signalement</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium text-slate-700">Signalé par:</span> {report.reporter_email}</p>
                      <p><span className="font-medium text-slate-700">Raison:</span> <span className="font-semibold text-red-700">{report.reason}</span></p>
                      <p><span className="font-medium text-slate-700">Date:</span> {formatDateWithTimezone(report.created_date, "d MMM yyyy 'à' HH:mm")}</p>
                      {report.details && (
                        <div className="mt-2 pt-2 border-t border-amber-300">
                          <p className="font-medium text-slate-700 mb-1">💬 Commentaire du signaleur:</p>
                          <p className="text-slate-800 italic bg-white p-2 rounded">{report.details}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {report.review && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-red-900 mb-3">🚨 Contenu de l'avis signalé</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={report.review_type === 'teacher' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
                            {report.review_type === 'teacher' ? '👨‍🏫 Avis Professeur' : '🏫 Avis École'}
                          </Badge>
                          <Badge variant={report.review.status === 'published' ? 'default' : 'destructive'}>
                            {report.review.status}
                          </Badge>
                        </div>

                        <div className="bg-white/80 p-3 rounded-lg border border-red-200">
                          <p className="text-xs font-semibold text-slate-600 mb-2">👤 Informations sur l'auteur de l'avis:</p>
                          <p className="text-sm"><span className="font-medium text-slate-700">Auteur:</span> {report.review.created_by}</p>
                          <p className="text-sm"><span className="font-medium text-slate-700">Publié le:</span> {formatDateWithTimezone(report.review.created_date, "d MMM yyyy 'à' HH:mm")}</p>
                        </div>

                        {report.review.comment && (
                          <div className="bg-white p-3 rounded-lg border-2 border-red-300">
                            <p className="text-xs font-semibold text-red-700 mb-2">📝 Commentaire signalé:</p>
                            <p className="text-sm text-slate-900 leading-relaxed">{report.review.comment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {report.locationInfo && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-blue-900 mb-3">📍 Emplacement sur le site</h4>
                      {report.review_type === 'teacher' && report.locationInfo.teacher && (
                        <div className="text-sm space-y-2">
                          <p className="font-semibold text-slate-900 text-base">
                            👨‍🏫 {report.locationInfo.teacher.name}
                          </p>
                          <p className="text-slate-600">📚 Matière: <span className="font-medium">{report.locationInfo.teacher.subject}</span></p>
                          {report.locationInfo.school && (
                            <p className="text-slate-600">🏫 École: <span className="font-medium">{report.locationInfo.school.name}</span></p>
                          )}
                          <Link 
                            to={createPageUrl(`TeacherDetail?id=${report.locationInfo.teacher.id}`)} 
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline font-semibold mt-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 transition-all"
                          >
                            Voir le profil du professeur <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                      {report.review_type === 'school' && report.locationInfo.school && (
                        <div className="text-sm space-y-2">
                          <p className="font-semibold text-slate-900 text-base">
                            🏫 {report.locationInfo.school.name}
                          </p>
                          <p className="text-slate-600">📍 Ville: <span className="font-medium">{report.locationInfo.school.city}</span></p>
                          <p className="text-slate-600">🏷️ Type: <span className="font-medium">{report.locationInfo.school.type}</span></p>
                          <Link 
                            to={createPageUrl(`SchoolDetail?id=${report.locationInfo.school.id}`)} 
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline font-semibold mt-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 transition-all"
                          >
                            Voir la page de l'école <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button
                      onClick={() => handleRejectReport(report.id, 'review')}
                      variant="outline"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter le signalement
                    </Button>
                    <Button
                      onClick={() => handleDeleteReview(report)}
                      className="bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer l'avis signalé
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </TabsContent>

      <TabsContent value="teachers" className="space-y-4">
        {(!filteredTeacherReports || filteredTeacherReports.length === 0) && <p className="text-center text-slate-500 py-4">Aucun signalement de professeur.</p>}
        {filteredTeacherReports && filteredTeacherReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    <h3 className="text-xl font-bold text-slate-900">Signalement professeur</h3>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-amber-900 mb-2">📋 Détails du signalement</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium text-slate-700">Professeur signalé:</span> <span className="font-bold text-slate-900 text-base">{report.teacher_name || "Nom non disponible"}</span></p>
                      <p><span className="font-medium text-slate-700">Signalé par:</span> {report.reporter_email}</p>
                      <p><span className="font-medium text-slate-700">Raison:</span> <span className="font-semibold text-orange-700">{report.reason}</span></p>
                      <p><span className="font-medium text-slate-700">Date:</span> {formatDateWithTimezone(report.created_date, "d MMM yyyy 'à' HH:mm")}</p>
                    </div>
                  </div>

                  {report.entity && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-blue-900 mb-3">👨‍🏫 Professeur signalé</h4>
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold text-slate-900 text-base">
                          {report.entity.name}
                        </p>
                        <p className="text-slate-600">📚 Matière: <span className="font-medium">{report.entity.subject}</span></p>
                        <p className="text-slate-600">🆔 ID: <span className="font-mono text-xs">{report.teacher_id}</span></p>
                        {report.school && (
                          <p className="text-slate-600">🏫 Établissement: <span className="font-medium">{report.school.name}</span></p>
                        )}
                        <Link 
                          to={createPageUrl(`TeacherDetail?id=${report.teacher_id}`)} 
                          target="_blank"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline font-semibold mt-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 transition-all"
                        >
                          Voir le profil du professeur <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {!report.entity && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-700">⚠️ Professeur non trouvé (ID: {report.teacher_id})</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button
                      onClick={() => handleRejectReport(report.id, report.reason === "Faux professeur" ? "teacher_fraud" : "teacher_status")}
                      variant="outline"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter le signalement
                    </Button>
                    {report.reason === "Ne fait plus partie de l'établissement" ? (
                      <Button
                        onClick={() => handleUpdateTeacherStatus(report.teacher_id, report.id)}
                        className="bg-orange-500 hover:bg-orange-600"
                        size="sm"
                      >
                        Marquer comme "Ancien"
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleDeleteTeacher(report.teacher_id, report.id, report.reason === "Faux professeur" ? "teacher_fraud" : "teacher_status")}
                        className="bg-red-600 hover:bg-red-700"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer le professeur
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </TabsContent>

      <TabsContent value="schools" className="space-y-4">
        {(!filteredSchoolReports || filteredSchoolReports.length === 0) && <p className="text-center text-slate-500 py-4">Aucun signalement d'établissement.</p>}
        {filteredSchoolReports && filteredSchoolReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-red-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <h3 className="text-xl font-bold text-slate-900">Signalement établissement</h3>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-amber-900 mb-2">📋 Détails du signalement</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium text-slate-700">Établissement signalé:</span> <span className="font-bold text-slate-900 text-base">{report.school_name || "Nom non disponible"}</span></p>
                      <p><span className="font-medium text-slate-700">Signalé par:</span> {report.reporter_email}</p>
                      <p><span className="font-medium text-slate-700">Raison:</span> <span className="font-semibold text-red-700">{report.reason}</span></p>
                      <p><span className="font-medium text-slate-700">Date:</span> {formatDateWithTimezone(report.created_date, "d MMM yyyy 'à' HH:mm")}</p>
                      {report.details && (
                        <div className="mt-2 pt-2 border-t border-amber-300">
                          <p className="font-medium text-slate-700 mb-1">💬 Commentaire du signaleur:</p>
                          <p className="text-slate-800 italic bg-white p-2 rounded">{report.details}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {report.entity && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-blue-900 mb-3">🏫 Établissement signalé</h4>
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold text-slate-900 text-base">
                          {report.entity.name}
                        </p>
                        <p className="text-slate-600">📍 Ville: <span className="font-medium">{report.entity.city}</span></p>
                        <p className="text-slate-600">🏷️ Type: <span className="font-medium">{report.entity.type}</span></p>
                        <p className="text-slate-600">🆔 ID: <span className="font-mono text-xs">{report.school_id}</span></p>
                        <Link 
                          to={createPageUrl(`SchoolDetail?id=${report.school_id}`)} 
                          target="_blank"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline font-semibold mt-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 transition-all"
                        >
                          Voir la page de l'établissement <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {!report.entity && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-700">⚠️ Établissement non trouvé (ID: {report.school_id})</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button
                      onClick={() => handleRejectReport(report.id, 'school')}
                      variant="outline"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter le signalement
                    </Button>
                    <Button
                      onClick={() => handleDeleteSchool(report.school_id, report.id)}
                      className="bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer l'établissement
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </TabsContent>
    </Tabs>
    </div>
  );
}