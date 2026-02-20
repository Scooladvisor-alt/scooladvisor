import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MobileHeader({ title, onBack, subtitle, badge }) {
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
          <h1 className="text-base font-semibold text-slate-900 truncate">{title}</h1>
          {subtitle && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
              {badge && badge}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}