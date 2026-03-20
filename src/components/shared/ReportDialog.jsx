import React, { useState } from "react";
import { Report } from "@/entities/Report";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ReportDialog({ open, onOpenChange, reviewType, reviewId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("diffamation");
  const [details, setDetails] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await base44.auth.me();
      
      await Report.create({
        review_type: reviewType,
        review_id: reviewId,
        reporter_email: user.email,
        reporter_id: user.id,
        reason: reason,
        details: details,
        status: "pending"
      });

      toast.success("Signalement enregistré. Merci pour votre vigilance.");
      onSuccess();
      
      onOpenChange(false);
      setReason("diffamation");
      setDetails("");
    } catch (error) {
      console.error("Error reporting review:", error);
      toast.error("Erreur lors du signalement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF4D8D]" />
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Signaler ce contenu
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-1.5 sm:space-y-3">
            {[
              { value: "diffamation", label: "Diffamation ou mensonges", border: "border-red-200", bg: "bg-red-50/40", hover: "hover:bg-red-50 hover:border-red-300", radio: "border-red-400 text-red-600" },
              { value: "injure", label: "Insultes ou offensant", border: "border-orange-200", bg: "bg-orange-50/40", hover: "hover:bg-orange-50 hover:border-orange-300", radio: "border-orange-400 text-orange-600" },
              { value: "hors_sujet", label: "Hors sujet / Spam", border: "border-yellow-200", bg: "bg-yellow-50/40", hover: "hover:bg-yellow-50 hover:border-yellow-300", radio: "border-yellow-400 text-yellow-600" },
              { value: "fausse_info", label: "Fausses informations", border: "border-blue-200", bg: "bg-blue-50/40", hover: "hover:bg-blue-50 hover:border-blue-300", radio: "border-blue-400 text-blue-600" },
              { value: "autre", label: "Autre raison", border: "border-slate-200", bg: "bg-slate-50/40", hover: "hover:bg-slate-50 hover:border-slate-300", radio: "border-slate-400 text-slate-600" },
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
            id="details"
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm h-8 sm:h-9">
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md text-xs sm:text-sm font-semibold h-8 sm:h-9"
            >
              {loading ? "Envoi..." : "Envoyer le signalement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}