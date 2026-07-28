import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { prefetchPage } from "@/components/shared/LinkPrefetch";
import { createPageUrl } from "@/utils";
import { MapPin, MessageSquare, Users, Globe } from "lucide-react";

const typeLabels = {
  college: "Collège",
  lycee: "Lycée",
  universite: "Université",
  ecole_privee: "École privée",
  ecole_commerce: "École de commerce",
  ecole_ingenieur: "École d'ingénieurs",
};

const typeLabelsShort = {
  college: "Collège",
  lycee: "Lycée",
  universite: "Université",
  ecole_privee: "Éc. privée",
  ecole_commerce: "Éc. commerce",
  ecole_ingenieur: "Éc. ingénieurs",
};

// Rubans façon diplôme
const typeRibbons = {
  college: "bg-ink",
  lycee: "bg-grade-high",
  universite: "bg-pen",
  ecole_privee: "bg-grade-mid",
  ecole_commerce: "bg-ink",
  ecole_ingenieur: "bg-grade-mid",
};

export default function SchoolCard({ school, teacherCount }) {
  const hasRating = school.review_count > 0 && school.average_rating > 0;

  const handleMouseEnter = useCallback(() => {
    prefetchPage('SchoolDetail');
  }, []);

  return (
    <Link
      to={createPageUrl(`SchoolDetail?id=${school.id}`)}
      className="block h-full w-full group"
      onMouseEnter={handleMouseEnter}
    >
      <div className="card-notebook p-2.5 sm:p-5 h-full flex flex-col relative z-10">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
            <span className={`ribbon text-[8px] sm:text-[11px] ${typeRibbons[school.type]}`}>
              <span className="sm:hidden">{typeLabelsShort[school.type]}</span>
              <span className="hidden sm:inline">{typeLabels[school.type]}</span>
            </span>

            {hasRating ? (
              <div className="grade-circle flex-shrink-0 mr-1.5 mt-0.5">
                <span className="handwritten text-lg sm:text-2xl">
                  {school.average_rating.toFixed(1)}
                  <span className="text-[10px] sm:text-sm">/20</span>
                </span>
              </div>
            ) : (
              <span className="handwritten text-base sm:text-xl opacity-50 flex-shrink-0 mr-1">
                n.n.
              </span>
            )}
          </div>

          <h3 className="font-heading font-extrabold text-ink text-xs sm:text-lg mb-1 sm:mb-2 leading-tight line-clamp-2">
            {school.name}
          </h3>

          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-sm text-ink/60 mb-2 sm:mb-4">
            <MapPin className="w-2.5 h-2.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{school.city}</span>
            {school.region && school.region.trim().toLowerCase() === "international" && (
              <Globe className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-pen flex-shrink-0" title="International" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 mt-auto">
          <div className="rounded-lg border-2 border-ink/20 bg-highlight/25 p-1 sm:p-2 flex items-center justify-center gap-1 sm:gap-1.5">
            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-pen flex-shrink-0" />
            <span className="text-sm sm:text-lg font-heading font-extrabold text-ink">{school.review_count || 0}</span>
            <span className="text-[9px] sm:text-xs text-ink/60 font-medium hidden sm:inline">Avis</span>
          </div>

          <div className="rounded-lg border-2 border-ink/20 bg-ink/[0.04] p-1 sm:p-2 flex items-center justify-center gap-1 sm:gap-1.5">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-ink flex-shrink-0" />
            <span className="text-sm sm:text-lg font-heading font-extrabold text-ink">{teacherCount}</span>
            <span className="text-[9px] sm:text-xs text-ink/60 font-medium hidden sm:inline">Profs</span>
          </div>
        </div>
      </div>
    </Link>
  );
}