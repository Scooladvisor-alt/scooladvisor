import React, { useState } from "react";
import { TeacherStatusReport } from "@/entities/TeacherStatusReport";
import { Teacher } from "@/entities/Teacher";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ReportTeacherStatusButton({ teacher, onUpdate }) {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      
      // Vérifier si l'utilisateur n'a pas déjà signalé
      const existingReports = await TeacherStatusReport.filter({
        teacher_id: teacher.id,
        reporter_email: user.email
      });

      if (existingReports.length > 0) {
        toast.error("Vous avez déjà signalé ce professeur");
        setLoading(false);
        setShowDialog(false);
        return;
      }

      // Créer le signalement
      await TeacherStatusReport.create({
        teacher_id: teacher.id,
        reporter_email: user.email,
        reason: "Ne fait plus partie de l'établissement",
        status: "pending",
        teacher_name: teacher.name
      });

      // Incrémenter le compteur
      const newCount = (teacher.status_report_count || 0) + 1;
      
      // Si 5 signalements ou plus, marquer comme ancien professeur
      if (newCount >= 5) {
        await Teacher.update(teacher.id, {
          status_report_count: newCount,
          is_former: true
        });
        toast.success("Ce professeur a été marqué comme ancien professeur");
      } else {
        await Teacher.update(teacher.id, {
          status_report_count: newCount
        });
        toast.success("Signalement enregistré");
      }

      setShowDialog(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Erreur lors du signalement");
    }
    setLoading(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="border-orange-200 text-orange-600 hover:bg-orange-50"
      >
        <AlertTriangle className="w-4 h-4 mr-2" />
        Signaler (ne fait plus partie)
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#FF4D8D]" />
              <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Signaler ce professeur
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
             <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-amber-200 bg-amber-50/40">
                <div className="mt-1">
                   <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm sm:text-base">Ne fait plus partie de l'établissement</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Vous signalez que <strong>{teacher.name}</strong> n'enseigne plus ici.
                  </p>
                </div>
             </div>

             <Alert className="bg-blue-50 border-blue-200">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-xs sm:text-sm">
                Après 5 signalements confirmés, ce professeur sera automatiquement marqué comme "Ancien professeur".
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="text-xs sm:text-sm">
              Annuler
            </Button>
            <Button 
              onClick={handleReport} 
              disabled={loading}
              className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md text-xs sm:text-sm font-semibold"
            >
              {loading ? "Signalement..." : "Confirmer le signalement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}