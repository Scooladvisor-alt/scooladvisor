import React, { useState } from "react";
import { BanAppeal } from "@/entities/BanAppeal";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle, AlertTriangle } from "lucide-react";

export default function BanDialog({ open, user }) {
  const [appealMessage, setAppealMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    await base44.auth.logout();
  };

  const handleAppeal = async () => {
    if (!appealMessage.trim()) {
      alert("Veuillez expliquer votre situation");
      return;
    }

    setLoading(true);
    try {
      await BanAppeal.create({
        user_email: user.email,
        appeal_message: appealMessage,
        status: "pending"
      });

      alert("Votre contestation a été envoyée. Un modérateur l'examinera prochainement.");
      await base44.auth.logout();
    } catch (error) {
      alert("Erreur lors de l'envoi de la contestation");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-red-600">
            <XCircle className="w-6 h-6" />
            Compte Suspendu
          </DialogTitle>
        </DialogHeader>

        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="font-medium">
            Votre compte a été suspendu car il ne respecte pas nos conditions d'utilisation.
            Vous avez eu 3 avertissements suite à la suppression de contenus inappropriés.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            Vous pouvez accepter cette décision ou la contester en expliquant votre situation.
          </p>

          <Textarea
            value={appealMessage}
            onChange={(e) => setAppealMessage(e.target.value)}
            placeholder="Expliquez pourquoi vous contestez cette décision..."
            rows={4}
            className="w-full"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={handleAccept}
            className="w-full sm:w-auto"
          >
            Accepter
          </Button>
          <Button 
            onClick={handleAppeal}
            disabled={loading || !appealMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            {loading ? "Envoi..." : "Contester cette décision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}