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
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#FF4D8D]" />
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Signaler cet établissement
            </span>
          </DialogTitle>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
          <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-pink-200 bg-pink-50/40 hover:bg-pink-50 hover:border-pink-300 transition-all cursor-pointer">
            <RadioGroupItem value="fake_school" id="fake" className="mt-1 border-pink-400 text-pink-600" />
            <Label htmlFor="fake" className="font-medium cursor-pointer flex-1 text-sm sm:text-base text-slate-800">
              Ce n'est pas un vrai établissement
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-purple-200 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer">
            <RadioGroupItem value="inappropriate" id="inappropriate" className="mt-1 border-purple-400 text-purple-600" />
            <Label htmlFor="inappropriate" className="font-medium cursor-pointer flex-1 text-sm sm:text-base text-slate-800">
              Contenu inapproprié
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer">
            <RadioGroupItem value="duplicate" id="duplicate" className="mt-1 border-indigo-400 text-indigo-600" />
            <Label htmlFor="duplicate" className="font-medium cursor-pointer flex-1 text-sm sm:text-base text-slate-800">
              Doublon
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer">
            <RadioGroupItem value="other" id="other" className="mt-1 border-blue-400 text-blue-600" />
            <Label htmlFor="other" className="font-medium cursor-pointer flex-1 text-sm sm:text-base text-slate-800">
              Autre raison
            </Label>
          </div>
        </RadioGroup>

        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Détails supplémentaires (optionnel)..."
          rows={3}
          className="text-xs placeholder:text-xs"
        />

        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-xs sm:text-sm">
            Les faux signalements peuvent entraîner la suspension de votre compte.
          </AlertDescription>
        </Alert>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm">
            Annuler
          </Button>
          <Button 
            onClick={handleReport} 
            disabled={loading}
            className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md text-xs sm:text-sm font-semibold"
          >
            {loading ? "Envoi..." : "Envoyer le signalement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}