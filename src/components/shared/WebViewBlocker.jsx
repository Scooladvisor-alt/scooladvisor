import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function WebViewBlocker({ open, onOpenChange, appName = "l'application" }) {
  const [copied, setCopied] = useState(false);
  const siteUrl = window.location.origin;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erreur lors de la copie");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Connexion impossible
          </DialogTitle>
        </DialogHeader>
        
        <div className="pt-4 space-y-6">
          <div className="space-y-3 text-center">
            <p className="text-slate-700 font-medium leading-relaxed">
              La connexion Google ne fonctionne pas dans {appName}.
            </p>
            <p className="text-sm text-slate-600">
              Ouvrez Scooladvisor dans Safari ou Chrome pour vous connecter.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-600 mb-2 font-medium">Copiez ce lien :</p>
              <p className="text-sm font-mono text-blue-600 break-all">{siteUrl}</p>
            </div>
            
            <Button
              onClick={handleCopy}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copier le lien
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-slate-500">
              Puis collez-le dans Safari ou Chrome
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}