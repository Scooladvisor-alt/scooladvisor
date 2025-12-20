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
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#FF4D8D]" />
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Signaler ce contenu
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-red-200 bg-red-50/40 hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer">
              <RadioGroupItem value="diffamation" id="diffamation" className="mt-1 border-red-400 text-red-600" />
              <Label htmlFor="diffamation" className="font-medium cursor-pointer flex-1 text-sm sm:text-base text-slate-800">
                Diffamation ou mensonges
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-orange-200 bg-orange-50/40 hover:bg-orange-50 hover:border-orange-300 transition-all cursor-pointer">
              <RadioGroupItem value="injure" id="injure" className="mt-1 border-orange-400 text-orange-600" />
              <Label htmlFor="injure" className="font-medium cursor-pointer flex-1 text-sm sm:text-base text-slate-800">
                Insultes ou offensant
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-yellow-200 bg-yellow-50/40 hover:bg-yellow-50 hover:border-yellow-300 transition-all cursor-pointer">
              <RadioGroupItem value="hors_sujet" id="hors_sujet" className="mt-1 border-yellow-400 text-yellow-600" />
              <Label htmlFor="hors_sujet" className="font-medium cursor-pointer flex-1 text-sm sm:text-base text-slate-800">
                Hors sujet / Spam
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer">
              <RadioGroupItem value="fausse_info" id="fausse_info" className="mt-1 border-blue-400 text-blue-600" />
              <Label htmlFor="fausse_info" className="font-medium cursor-pointer flex-1 text-sm sm:text-base text-slate-800">
                Fausses informations
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer">
              <RadioGroupItem value="autre" id="autre" className="mt-1 border-slate-400 text-slate-600" />
              <Label htmlFor="autre" className="font-medium cursor-pointer flex-1 text-sm sm:text-base text-slate-800">
                Autre raison
              </Label>
            </div>
          </RadioGroup>

          <Textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Détails supplémentaires (optionnel)..."
            rows={3}
            className="text-xs placeholder:text-xs"
          />

          <Alert className="bg-blue-50 border-blue-200 p-2 sm:p-4">
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-xs sm:text-sm">
              Les faux signalements peuvent entraîner la suspension de votre compte.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm">
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md text-xs sm:text-sm font-semibold"
            >
              {loading ? "Envoi..." : "Envoyer le signalement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}