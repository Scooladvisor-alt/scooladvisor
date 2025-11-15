import { useState, useEffect } from "react";
import { CustomSubject } from "@/entities/CustomSubject";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function CustomSubjects({ onUpdate }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    const subjectsData = await CustomSubject.filter({ status: "pending" }, "-created_date");
    setSubjects(subjectsData);
    setLoading(false);
  };

  const handleApprove = async (subjectId) => {
    try {
      await CustomSubject.update(subjectId, { status: "approved" });
      toast.success("Matière approuvée");
      loadSubjects();
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleReject = async (subjectId) => {
    try {
      await CustomSubject.update(subjectId, { status: "rejected" });
      toast.success("Matière rejetée");
      loadSubjects();
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors du rejet");
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

  if (subjects.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-slate-600">Aucune matière personnalisée en attente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {subjects.map((subject, index) => (
        <motion.div
          key={subject.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-xl">{subject.subject_name}</CardTitle>
                  </div>
                  <p className="text-sm text-slate-600">
                    Proposé par : {subject.proposed_by}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Le {format(new Date(subject.created_date), "d MMMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(subject.id)}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                  <Button
                    onClick={() => handleReject(subject.id)}
                    variant="destructive"
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
      ))}
    </div>
  );
}