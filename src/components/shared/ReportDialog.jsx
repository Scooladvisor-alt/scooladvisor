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
      <DialogContent className="sm:max-w-md max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Signaler cet avis</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-sm">Raison du signalement *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              <div className="flex items-start space-x-2 p-2 sm:p-3 rounded-lg border-2 border-red-200 hover:bg-red-50 transition-colors">
                <RadioGroupItem value="diffamation" id="diffamation" className="mt-0.5" />
                <Label htmlFor="diffamation" className="font-medium cursor-pointer flex-1 text-xs sm:text-sm">
                  Diffamation ou propos mensongers
                </Label>
              </div>

              <div className="flex items-start space-x-2 p-2 sm:p-3 rounded-lg border-2 border-orange-200 hover:bg-orange-50 transition-colors">
                <RadioGroupItem value="injure" id="injure" className="mt-0.5" />
                <Label htmlFor="injure" className="font-medium cursor-pointer flex-1 text-xs sm:text-sm">
                  Insultes ou langage offensant
                </Label>
              </div>

              <div className="flex items-start space-x-2 p-2 sm:p-3 rounded-lg border-2 border-yellow-200 hover:bg-yellow-50 transition-colors">
                <RadioGroupItem value="hors_sujet" id="hors_sujet" className="mt-0.5" />
                <Label htmlFor="hors_sujet" className="font-medium cursor-pointer flex-1 text-xs sm:text-sm">
                  Hors sujet ou spam
                </Label>
              </div>

              <div className="flex items-start space-x-2 p-2 sm:p-3 rounded-lg border-2 border-blue-200 hover:bg-blue-50 transition-colors">
                <RadioGroupItem value="fausse_info" id="fausse_info" className="mt-0.5" />
                <Label htmlFor="fausse_info" className="font-medium cursor-pointer flex-1 text-xs sm:text-sm">
                  Informations fausses
                </Label>
              </div>

              <div className="flex items-start space-x-2 p-2 sm:p-3 rounded-lg border-2 border-slate-200 hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="autre" id="autre" className="mt-0.5" />
                <Label htmlFor="autre" className="font-medium cursor-pointer flex-1 text-xs sm:text-sm">
                  Autre raison
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-sm">Détails supplémentaires (optionnel)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Expliquez pourquoi cet avis devrait être examiné..."
              rows={3}
              className="text-sm"
            />
          </div>

          <Alert className="bg-blue-50 border-blue-200 p-2 sm:p-4">
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-xs sm:text-sm">
              Les faux signalements peuvent entraîner la suspension de votre compte.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="sm" className="text-xs sm:text-sm">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm" size="sm">
              {loading ? "Envoi..." : "Envoyer le signalement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}