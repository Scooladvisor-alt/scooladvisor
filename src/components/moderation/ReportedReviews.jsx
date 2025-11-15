import { useState, useEffect } from "react";
import { Report } from "@/entities/Report";
import { TeacherReview } from "@/entities/TeacherReview";
import { SchoolReview } from "@/entities/SchoolReview";
import { Teacher } from "@/entities/Teacher";
import { School } from "@/entities/School";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";

const reasonLabels = {
  diffamation: "Diffamation",
  injure: "Injure",
  hors_sujet: "Hors sujet",
  fausse_info: "Fausse information",
  autre: "Autre"
};

export default function ReportedReviews({ onUpdate }) {
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState({});
  const [entities, setEntities] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    
    const reportsData = await Report.filter({ status: "pending" }, "-created_date");
    const [teacherReviews, schoolReviews, teachers, schools] = await Promise.all([
      TeacherReview.list(),
      SchoolReview.list(),
      Teacher.list(),
      School.list()
    ]);

    const reviewsMap = {};
    const entitiesMap = {};

    teacherReviews.forEach(review => {
      reviewsMap[review.id] = { ...review, type: "teacher" };
    });
    schoolReviews.forEach(review => {
      reviewsMap[review.id] = { ...review, type: "school" };
    });

    teachers.forEach(teacher => {
      entitiesMap[teacher.id] = { ...teacher, type: "teacher" };
    });
    schools.forEach(school => {
      entitiesMap[school.id] = { ...school, type: "school" };
    });

    setReports(reportsData);
    setReviews(reviewsMap);
    setEntities(entitiesMap);
    setLoading(false);
  };

  const handleApprove = async (reportId, reviewId, reviewType) => {
    try {
      if (reviewType === "teacher") {
        await TeacherReview.update(reviewId, { status: "hidden" });
      } else {
        await SchoolReview.update(reviewId, { status: "hidden" });
      }
      await Report.update(reportId, { status: "approved" });
      toast.success("Avis masqué suite au signalement");
      loadReports();
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors du traitement");
    }
  };

  const handleReject = async (reportId) => {
    try {
      await Report.update(reportId, { status: "rejected" });
      toast.success("Signalement rejeté");
      loadReports();
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors du traitement");
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <p className="text-slate-600">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-slate-600">Aucun signalement en attente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report, index) => {
        const review = reviews[report.review_id];
        if (!review) return null;

        const entity = review.type === "teacher" 
          ? entities[review.teacher_id]
          : entities[review.school_id];

        return (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-red-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <CardTitle className="text-lg">Signalement</CardTitle>
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        {reasonLabels[report.reason]}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">
                          Avis {review.type === "teacher" ? "professeur" : "établissement"}: {entity?.name}
                        </p>
                        <p className="text-slate-700 leading-relaxed">{review.comment}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          Par: {review.is_anonymous ? "Anonyme" : review.created_by}
                        </p>
                      </div>

                      {report.details && (
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                          <p className="text-sm font-medium text-amber-900 mb-1">Détails du signalement:</p>
                          <p className="text-sm text-amber-800">{report.details}</p>
                        </div>
                      )}

                      <p className="text-xs text-slate-500">
                        Signalé le {format(new Date(report.created_date), "d MMMM yyyy à HH:mm", { locale: fr })} par {report.reporter_email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleApprove(report.id, review.id, review.type)}
                      className="bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Masquer l'avis
                    </Button>
                    <Button
                      onClick={() => handleReject(report.id)}
                      variant="outline"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}