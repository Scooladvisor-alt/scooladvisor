import React, { useState } from "react";
import { TeacherStatusReport } from "@/entities/TeacherStatusReport";
import { TeacherFraudReport } from "@/entities/TeacherFraudReport";
import { Teacher } from "@/entities/Teacher";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, UserX, XCircle, Flag } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function ReportTeacherButton({ teacher, onUpdate, variant = "default" }) {
  const [showDialog, setShowDialog] = useState(false);
  const [reportType, setReportType] = useState("former");
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      
      if (reportType === "former") {
        // Signaler comme ancien prof
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

        await TeacherStatusReport.create({
          teacher_id: teacher.id,
          reporter_email: user.email,
          reason: "Ne fait plus partie de l'établissement",
          status: "pending",
          teacher_name: teacher.name
        });

        const newCount = (teacher.status_report_count || 0) + 1;
        
        if (newCount >= 3) {
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
      } else {
        // Signaler comme faux prof
        const existingFraudReports = await TeacherFraudReport.filter({
          teacher_id: teacher.id,
          reporter_email: user.email
        });

        if (existingFraudReports.length > 0) {
          toast.error("Vous avez déjà signalé ce professeur comme faux");
          setLoading(false);
          setShowDialog(false);
          return;
        }

        await TeacherFraudReport.create({
          teacher_id: teacher.id,
          reporter_email: user.email,
          reason: "Faux professeur",
          status: "pending",
          teacher_name: teacher.name
        });

        // Compter le nombre total de signalements fraude
        const allFraudReports = await TeacherFraudReport.filter({
          teacher_id: teacher.id
        });

        if (allFraudReports.length >= 3) {
          // Supprimer le professeur
          await Teacher.delete(teacher.id);
          toast.success("Ce professeur a été supprimé après vérification");
        } else {
          toast.success("Signalement enregistré");
        }
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
      {variant === "flag" ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDialog(true);
          }}
          className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
          title="Signaler ce professeur"
        >
          <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
          className="border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Signaler
        </Button>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">Signaler ce professeur</DialogTitle>
          </DialogHeader>

          <RadioGroup value={reportType} onValueChange={setReportType} className="space-y-3">
            <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-amber-200 hover:bg-amber-50 transition-colors">
              <RadioGroupItem value="former" id="former" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="former" className="font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                  <UserX className="w-4 h-4 text-amber-600" />
                  Ne fait plus partie de l'établissement
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-red-200 hover:bg-red-50 transition-colors">
              <RadioGroupItem value="fraud" id="fraud" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="fraud" className="font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Ce n'est pas un vrai professeur
                </Label>
              </div>
            </div>
          </RadioGroup>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              Les faux signalements peuvent entraîner la suspension de votre compte.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleReport} 
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? "Signalement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}