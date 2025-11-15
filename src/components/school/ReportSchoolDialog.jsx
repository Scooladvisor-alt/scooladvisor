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

      await base44.entities.SchoolReport.create({
        school_id: schoolId,
        reporter_email: user.email,
        reason: reason,
        details: details,
        status: "pending"
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
      <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold">Signaler cet établissement</DialogTitle>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
          <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-red-200 hover:bg-red-50 transition-colors">
            <RadioGroupItem value="fake_school" id="fake" className="mt-1" />
            <Label htmlFor="fake" className="font-medium cursor-pointer flex-1 text-sm sm:text-base">
              Ce n'est pas un vrai établissement
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-orange-200 hover:bg-orange-50 transition-colors">
            <RadioGroupItem value="inappropriate" id="inappropriate" className="mt-1" />
            <Label htmlFor="inappropriate" className="font-medium cursor-pointer flex-1 text-sm sm:text-base">
              Contenu inapproprié
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-yellow-200 hover:bg-yellow-50 transition-colors">
            <RadioGroupItem value="duplicate" id="duplicate" className="mt-1" />
            <Label htmlFor="duplicate" className="font-medium cursor-pointer flex-1 text-sm sm:text-base">
              Doublon
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-slate-200 hover:bg-slate-50 transition-colors">
            <RadioGroupItem value="other" id="other" className="mt-1" />
            <Label htmlFor="other" className="font-medium cursor-pointer flex-1 text-sm sm:text-base">
              Autre raison
            </Label>
          </div>
        </RadioGroup>

        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Détails supplémentaires (optionnel)..."
          rows={3}
          className="text-sm"
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
            className="bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm"
          >
            {loading ? "Envoi..." : "Envoyer le signalement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}