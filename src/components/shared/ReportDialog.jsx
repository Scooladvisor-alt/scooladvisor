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

        <form onSubmit={handleSubmit} className="space-y-3">
          <RadioGroup value={reason} onValueChange={setReason} className="grid grid-cols-1 gap-2">
            {[
              { value: "diffamation", label: "Diffamation ou mensonges", border: "border-red-200", bg: "bg-red-50/50", hover: "hover:bg-red-50 hover:border-red-300", selectedBg: "data-selected:bg-red-100" },
              { value: "injure", label: "Insultes ou langage offensant", border: "border-orange-200", bg: "bg-orange-50/50", hover: "hover:bg-orange-50 hover:border-orange-300" },
              { value: "hors_sujet", label: "Hors sujet / Spam", border: "border-yellow-200", bg: "bg-yellow-50/50", hover: "hover:bg-yellow-50 hover:border-yellow-300" },
              { value: "fausse_info", label: "Fausses informations", border: "border-blue-200", bg: "bg-blue-50/50", hover: "hover:bg-blue-50 hover:border-blue-300" },
              { value: "autre", label: "Autre raison", border: "border-slate-200", bg: "bg-slate-50/50", hover: "hover:bg-slate-50 hover:border-slate-300" },
            ].map(({ value, label, border, bg, hover }) => (
              <label
                key={value}
                htmlFor={value}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl border-2 cursor-pointer transition-all ${border} ${bg} ${hover} ${reason === value ? 'ring-2 ring-purple-300 border-purple-300' : ''}`}
              >
                <RadioGroupItem value={value} id={value} className="shrink-0" />
                <span className="text-sm font-medium text-slate-800 leading-snug">{label}</span>
              </label>
            ))}
          </RadioGroup>

          <Textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Détails supplémentaires (optionnel)..."
            rows={2}
            className="text-sm placeholder:text-sm text-slate-900 dark:text-white"
          />

          <Alert className="bg-blue-50 border-blue-200 py-2 px-3">
            <AlertTriangle className="h-3.5 w-3.5 text-blue-600" />
            <AlertDescription className="text-blue-800 text-xs leading-snug">
              Les faux signalements peuvent entraîner la suspension de votre compte.
            </AlertDescription>
          </Alert>

          <DialogFooter className="flex-row gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 text-sm h-10">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white text-sm font-semibold h-10"
            >
              {loading ? "Envoi..." : "Signaler"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}