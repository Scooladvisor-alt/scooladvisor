
import { useState, useEffect } from "react";
import { School } from "@/entities/School";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, MapPin, Calendar, Flag } from "lucide-react"; // Added Flag icon
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";

const typeLabels = {
  college: "Collège",
  lycee: "Lycée",
  universite: "Université",
  ecole_privee: "École privée"
};

export default function PendingSchools({ onUpdate }) {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setLoading(true);
    // Assuming the School.filter method can now return a reportCount if available for pending schools
    const data = await School.filter({ status: "pending" }, "-created_date");
    setSchools(data);
    setLoading(false);
  };

  const handleApprove = async (schoolId) => {
    try {
      await School.update(schoolId, { status: "approved" });
      toast.success("Établissement approuvé");
      loadSchools();
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleReject = async (schoolId) => {
    try {
      await School.update(schoolId, { status: "rejected" });
      toast.success("Établissement rejeté");
      loadSchools();
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

  if (schools.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-slate-600">Aucun établissement en attente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {schools.map((school, index) => (
        <motion.div
          key={school.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{school.name}</CardTitle>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {typeLabels[school.type]}
                    </Badge>
                    {/* Display report count if the school has been reported */}
                    {school.reportCount > 0 && (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 flex items-center">
                        <Flag className="w-3 h-3 mr-1" />
                        {school.reportCount} signalement{school.reportCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{school.address}, {school.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Ajouté le {format(new Date(school.created_date), "d MMMM yyyy", { locale: fr })}</span>
                    </div>
                    <p className="text-xs text-slate-500">Par: {school.created_by}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(school.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                  <Button
                    onClick={() => handleReject(school.id)}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              </div>
            </CardHeader>
            {school.description && (
              <CardContent>
                <p className="text-slate-700">{school.description}</p>
              </CardContent>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
