import { useState } from "react";
import { TeacherStatusReport } from "@/entities/TeacherStatusReport";
import { Teacher } from "@/entities/Teacher";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
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
        status: "pending"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler ce professeur</DialogTitle>
          </DialogHeader>

          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Vous êtes sur le point de signaler que <strong>{teacher.name}</strong> ne fait plus partie de cet établissement.
              <br /><br />
              Après 5 signalements, ce professeur sera automatiquement marqué comme "Ancien professeur".
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
              {loading ? "Signalement..." : "Confirmer le signalement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}