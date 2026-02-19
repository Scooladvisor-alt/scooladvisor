import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, User, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-50 md:hidden"
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
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              <div className="relative">
                <Icon 
                  className={`w-6 h-6 transition-colors ${
                    active ? 'text-[#FF4D8D]' : 'text-slate-400'
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#FF4D8D] rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span 
                className={`text-[10px] mt-1 font-medium ${
                  active ? 'text-[#FF4D8D]' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}