import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, ExternalLink, Chrome, Globe } from "lucide-react";
import { openInExternalBrowser } from "./WebViewDetector";

export default function WebViewBlocker({ open, onOpenChange, appName = "l'application" }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900">
            Action requise
          </DialogTitle>
        </DialogHeader>
        
        <div className="pt-4 space-y-6">
          <div className="space-y-3 text-center">
            <p className="text-slate-700 font-medium">
              Pour vous connecter avec Google, vous devez ouvrir Scooladvisor dans votre navigateur (Safari ou Chrome).
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Les applications comme {appName} ne permettent pas la connexion Google.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={openInExternalBrowser}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Ouvrir dans le navigateur
            </Button>
            
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Chrome className="w-4 h-4" />
                <span>Chrome</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Globe className="w-4 h-4" />
                <span>Safari</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 text-center leading-relaxed">
              💡 <strong>Astuce :</strong> Dans la plupart des apps, appuyez sur les 3 points (⋯) puis "Ouvrir dans le navigateur"
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}