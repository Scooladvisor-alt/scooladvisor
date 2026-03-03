import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, User } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import JoinFamilyDialog from "@/components/shared/JoinFamilyDialog";

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(undefined); // undefined = loading
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const tabs = [
    { 
      id: "home", 
      label: "Accueil", 
      icon: Home, 
      path: createPageUrl("Schools") 
    },
    { 
      id: "profile", 
      label: "Profil", 
      icon: User, 
      path: createPageUrl("Profile") 
    }
  ];

  const isActive = (path) => location.pathname === path;

  const handleTabClick = (tab) => {
    const active = isActive(tab.path);
    
    if (tab.id === "profile" && !user) {
      setShowJoinDialog(true);
      return;
    }

    if (active) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('tabReset', { detail: { path: tab.path } }));
    } else {
      navigate(tab.path);
    }
  };

  return (
    <>
      <style>{`
        .tab-icon-active {
          background: linear-gradient(135deg, #FF4D8D, #a855f7, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .tab-label-active {
          background: linear-gradient(135deg, #FF4D8D, #a855f7, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .tab-dot-gradient {
          background: linear-gradient(135deg, #FF4D8D, #a855f7, #3b82f6);
        }
      `}</style>

      <div 
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 z-50 md:hidden"
        style={{
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
              >
                <div className="relative">
                  {active ? (
                    <svg width="0" height="0" className="absolute">
                      <defs>
                        <linearGradient id={`tab-grad-${tab.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FF4D8D" />
                          <stop offset="50%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>
                  ) : null}
                  <Icon 
                    className={`w-6 h-6 transition-all ${active ? '' : 'text-slate-400'}`}
                    strokeWidth={active ? 2.5 : 2}
                    style={active ? { stroke: `url(#tab-grad-${tab.id})` } : {}}
                  />
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full tab-dot-gradient"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span 
                  className={`text-[10px] mt-1 font-medium ${active ? 'tab-label-active' : 'text-slate-400'}`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <JoinFamilyDialog
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        actionDescription="accéder à ton profil"
      />
    </>
  );
}