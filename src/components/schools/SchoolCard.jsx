import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Star, MessageSquare, Users, Globe } from "lucide-react"; 
import { Badge } from "@/components/ui/badge";

const typeLabels = {
  college: "Collège",
  lycee: "Lycée",
  universite: "Université",
  ecole_privee: "École privée",
  ecole_commerce: "École de commerce",
  ecole_ingenieur: "École d'ingénieurs",
};

const typeColors = {
  college: "bg-[#3498DB] text-white border-[#3498DB]",
  lycee: "bg-[#1ABC9C] text-white border-[#1ABC9C]",
  universite: "bg-[#27AE60] text-white border-[#27AE60]",
  ecole_privee: "bg-[#F39C12] text-white border-[#F39C12]",
  ecole_commerce: "bg-[#E74C3C] text-white border-[#E74C3C]",
  ecole_ingenieur: "bg-[#FF6B35] text-white border-[#FF6B35]",
};

export default function SchoolCard({ school, teacherCount }) {
  const hasRating = school.review_count > 0 && school.average_rating > 0;

  return (
    <Link 
      to={createPageUrl(`SchoolDetail?id=${school.id}`)} 
      className="block h-full w-full group"
    >
      <style>{`
        @keyframes shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.95; }
        }
        
        @keyframes badge-shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(400%) rotate(45deg); }
        }
        
        .stat-widget {
          position: relative;
          overflow: hidden;
        }
        
        .stat-widget::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%
          );
          transition: left 0.5s ease;
        }
        
        .stat-widget:hover::before {
          left: 100%;
        }
        
        .type-badge {
          animation: pulse-soft 3s ease-in-out infinite;
        }
        
        .note-widget {
          position: relative;
          overflow: hidden;
        }
        
        .note-widget::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 50%;
          height: 200%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.5),
            transparent
          );
          animation: badge-shimmer 3s infinite;
          pointer-events: none;
        }
      `}</style>
      
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 h-full flex flex-col relative z-10">
        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div className="flex-1 min-w-0">
              <Badge className={`mb-3 text-xs border-2 font-semibold shadow-md type-badge ${typeColors[school.type]}`}>
                {typeLabels[school.type]}
              </Badge>
            </div>

            {hasRating ? (
              <div className="flex-shrink-0 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 px-3 py-2 flex items-center gap-1.5 note-widget">
                <Star className="w-4 h-4 text-amber-600 fill-amber-600 flex-shrink-0" />
                <span className="text-base font-bold text-amber-900 leading-none">
                  {school.average_rating.toFixed(1)}
                </span>
                <span className="text-xs text-amber-700">/20</span>
              </div>
            ) : (
              <div className="flex-shrink-0 bg-slate-100 rounded-lg border border-slate-200 px-2 py-1 flex items-center gap-1">
                <Star className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Pas noté</span>
              </div>
            )}
          </div>

          <h3 className="font-bold text-slate-900 text-lg sm:text-xl mb-3 leading-tight">
            {school.name}
          </h3>

          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">{school.city}</span>
          </div>
          
          {school.region && school.region.trim().toLowerCase() === "international" && (
            <div className="flex items-center gap-1.5 mb-4">
              <Globe className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <span className="text-xs font-medium text-indigo-600">International</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <div className="stat-widget bg-blue-50 rounded-xl p-2.5 border border-blue-100 flex items-center justify-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-blue-700">{school.review_count || 0}</span>
              <span className="text-xs text-blue-600 font-medium">Avis</span>
            </div>
          </div>

          <div className="stat-widget bg-[#FF4D8D]/5 rounded-xl p-2.5 border border-[#FF4D8D]/20 flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-[#FF4D8D] flex-shrink-0" />
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[#FF4D8D]">{teacherCount}</span>
              <span className="text-xs text-[#FF4D8D] font-medium">Profs</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}