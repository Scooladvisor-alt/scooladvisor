import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MobileHeader({ title, onBack, subtitle, badge, ratingWidget, adminMenu }) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 md:hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex-shrink-0 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-900 truncate flex-1">{title}</h1>
            {adminMenu && <div className="flex-shrink-0">{adminMenu}</div>}
          </div>
          {subtitle && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500 truncate flex-1">{subtitle}</p>
              {ratingWidget && <div className="flex-shrink-0">{ratingWidget}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}