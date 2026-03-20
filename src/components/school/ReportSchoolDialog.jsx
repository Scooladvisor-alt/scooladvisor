import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ReportSchoolDialog({ open, onOpenChange, schoolId }) {
  const [reason, setReason] = useState("fake_school");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      const existingReports = await base44.entities.SchoolReport.filter({
        school_id: schoolId,
        reporter_email: user.email
      });

      if (existingReports.length > 0) {
        toast.error("Vous avez déjà signalé cet établissement");
        setLoading(false);
        onOpenChange(false);
        return;
      }

      // Récupérer le nom de l'établissement
      const schools = await base44.entities.School.filter({ id: schoolId });
      const schoolName = schools[0]?.name || "Établissement inconnu";

      await base44.entities.SchoolReport.create({
        school_id: schoolId,
        reporter_email: user.email,
        reporter_id: user.id,
        reason: reason,
        details: details,
        status: "pending",
        school_name: schoolName
      });

      toast.success("Signalement enregistré. Un modérateur va l'examiner.");
      onOpenChange(false);
      setDetails("");
    } catch (error) {
      toast.error("Erreur lors du signalement");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF4D8D]" />
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Signaler cet établissement
            </span>
          </DialogTitle>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={setReason} className="space-y-1.5 sm:space-y-3">
          {[
            { value: "fake_school", label: "Ce n'est pas un vrai établissement", border: "border-pink-200", bg: "bg-pink-50/40", hover: "hover:bg-pink-50 hover:border-pink-300", radio: "border-pink-400 text-pink-600" },
            { value: "inappropriate", label: "Contenu inapproprié", border: "border-purple-200", bg: "bg-purple-50/40", hover: "hover:bg-purple-50 hover:border-purple-300", radio: "border-purple-400 text-purple-600" },
            { value: "duplicate", label: "Doublon", border: "border-indigo-200", bg: "bg-indigo-50/40", hover: "hover:bg-indigo-50 hover:border-indigo-300", radio: "border-indigo-400 text-indigo-600" },
            { value: "other", label: "Autre raison", border: "border-blue-200", bg: "bg-blue-50/40", hover: "hover:bg-blue-50 hover:border-blue-300", radio: "border-blue-400 text-blue-600" },
          ].map(({ value, label, border, bg, hover, radio }) => (
            <div key={value} className={`flex items-center space-x-2.5 px-2.5 py-2 sm:p-3 rounded-lg border-2 ${border} ${bg} ${hover} transition-all cursor-pointer`}>
              <RadioGroupItem value={value} id={value} className={radio} />
              <Label htmlFor={value} className="font-medium cursor-pointer flex-1 text-xs sm:text-base text-slate-800">
                {label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Détails supplémentaires (optionnel)..."
          rows={2}
          className="text-xs placeholder:text-xs text-slate-900 dark:text-white"
        />

        <Alert className="bg-blue-50 border-blue-200 p-2">
          <AlertTriangle className="h-3 w-3 text-blue-600" />
          <AlertDescription className="text-blue-800 text-xs">
            Les faux signalements peuvent entraîner la suspension de votre compte.
          </AlertDescription>
        </Alert>

        <DialogFooter className="gap-2 pt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm h-8 sm:h-9">
            Annuler
          </Button>
          <Button 
            onClick={handleReport} 
            disabled={loading}
            className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md text-xs sm:text-sm font-semibold h-8 sm:h-9"
          >
            {loading ? "Envoi..." : "Envoyer le signalement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}