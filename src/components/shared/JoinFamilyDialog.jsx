import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Heart, Sparkles } from "lucide-react";

export default function JoinFamilyDialog({ open, onOpenChange, actionDescription = "faire ça" }) {
  const handleJoin = async () => {
    try {
      await base44.auth.redirectToLogin(window.location.href);
    } catch (error) {
      console.error("Error redirecting to login:", error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md rounded-3xl p-0 overflow-hidden border-0">
        {/* Background gradient animé */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D8D] via-purple-500 to-blue-500 opacity-10 animate-pulse" />
        
        <div className="relative p-6 sm:p-8">
          {/* Icône centrale avec animation */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 rounded-full blur-xl opacity-60 animate-pulse" />
              <div className="relative bg-white rounded-full p-4 shadow-lg">
                <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-[#FF4D8D] fill-[#FF4D8D] animate-bounce" />
              </div>
            </div>
          </div>

          {/* Titre */}
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Rejoins la famille ! 
            </span>
            <Sparkles className="inline-block w-5 h-5 ml-1 text-yellow-500 fill-yellow-500" />
          </h2>

          {/* Message */}
          <p className="text-center text-slate-600 text-sm sm:text-base mb-6">
            Pour <strong>{actionDescription}</strong>, connecte-toi et deviens membre de la communauté Scooladvisor !
          </p>

          {/* Avantages */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-4 mb-6 space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
              <span className="text-green-500">✓</span>
              <span>Partage ton expérience</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
              <span className="text-green-500">✓</span>
              <span>Aide les autres à choisir</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
              <span className="text-green-500">✓</span>
              <span>Participe au chat national</span>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleJoin}
              className="w-full bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white font-semibold py-5 sm:py-6 text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              Oui, je rejoins ! 🚀
            </Button>
            
            <Button
              onClick={handleCancel}
              variant="ghost"
              className="w-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 py-2 text-xs sm:text-sm rounded-xl"
            >
              Non, j'ai la flemme... 😴
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}