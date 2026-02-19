import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200 py-6 mt-0 lg:mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} Scooladvisor. Tous droits réservés.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link
              to={createPageUrl("TermsOfService")}
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors">

              Conditions d'utilisation
            </Link>
            <Link
              to={createPageUrl("PrivacyPolicy")}
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors">

              Politique de confidentialité
            </Link>
            <Link to={createPageUrl("Contact")}>
              <Button variant="outline" size="sm" className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 rounded-md bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-semibold">
                <Mail className="w-4 h-4 mr-2" />
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </footer>);

}