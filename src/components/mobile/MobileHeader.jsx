import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MobileHeader({ title, onBack, subtitle, badge, ratingWidget, adminMenu, reportButton, avatar }) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 md:hidden">
      <div className="px-2 py-3 flex items-center gap-1.5">
        <button
          onClick={handleBack}
          className="flex-shrink-0 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        </button>
        {avatar && (
          <Avatar className="w-10 h-10 border-2 border-white shadow-sm flex-shrink-0">
            <AvatarImage src={avatar.photoUrl} />
            <AvatarFallback className="bg-gradient-to-br from-[#FF4D8D] to-blue-500 text-white text-sm font-semibold">
              {avatar.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-900 dark:text-white truncate flex-1 leading-tight">{title}</h1>
            {ratingWidget && <div className="flex-shrink-0">{ratingWidget}</div>}
          </div>
          {subtitle && (
            <div className="flex items-center gap-1">
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
              {reportButton && <div className="flex-shrink-0 scale-75">{reportButton}</div>}
              {adminMenu && <div className="flex-shrink-0 ml-auto">{adminMenu}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}