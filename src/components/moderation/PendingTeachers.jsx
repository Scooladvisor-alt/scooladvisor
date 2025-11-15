
import { useState, useEffect } from "react";
import { Teacher } from "@/entities/Teacher";
import { School } from "@/entities/School";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, BookOpen, School as SchoolIcon, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function PendingTeachers({ onUpdate }) {
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    const teachersData = await Teacher.filter({ status: "pending" }, "-created_date");
    const schoolsData = await School.list();
    
    const schoolsMap = {};
    schoolsData.forEach(school => {
      schoolsMap[school.id] = school;
    });
    
    setTeachers(teachersData);
    setSchools(schoolsMap);
    setLoading(false);
  };

  const handleApprove = async (teacherId) => {
    try {
      await Teacher.update(teacherId, { status: "approved" });
      toast.success("Professeur approuvé");
      loadTeachers();
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleReject = async (teacherId) => {
    try {
      await Teacher.update(teacherId, { status: "rejected" });
      toast.success("Professeur rejeté");
      loadTeachers();
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

  if (teachers.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-slate-600">Aucun professeur en attente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {teachers.map((teacher, index) => (
        <motion.div
          key={teacher.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="w-16 h-16 border-2 border-slate-200">
                    <AvatarImage src={teacher.photo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-green-600 to-green-800 text-white text-xl font-bold">
                      {teacher.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{teacher.name}</CardTitle>
                    <div className="space-y-1 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span>{teacher.subject}</span>
                      </div>
                      {schools[teacher.school_id] && (
                        <div className="flex items-center gap-2">
                          <SchoolIcon className="w-4 h-4" />
                          <span>{schools[teacher.school_id].name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Ajouté le {format(new Date(teacher.created_date), "d MMMM yyyy", { locale: fr })}</span>
                      </div>
                      <p className="text-xs text-slate-500">Par: {teacher.created_by}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(teacher.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                  <Button
                    onClick={() => handleReject(teacher.id)}
                    variant="destructive"
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
