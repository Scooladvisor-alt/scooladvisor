import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, MessageSquare, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const typeColors = {
  college: { bg: "bg-[#3498DB]", text: "#3498DB", label: "Collège" },
  lycee: { bg: "bg-[#1ABC9C]", text: "#1ABC9C", label: "Lycée" },
  universite: { bg: "bg-[#27AE60]", text: "#27AE60", label: "Université" },
  ecole_privee: { bg: "bg-[#F39C12]", text: "#F39C12", label: "École privée" },
  ecole_commerce: { bg: "bg-[#E74C3C]", text: "#E74C3C", label: "École de commerce" },
  ecole_ingenieur: { bg: "bg-[#FF6B35]", text: "#FF6B35", label: "École d'ingénieurs" }
};

const podiumConfig = [
{ rank: 2, height: "h-24 sm:h-28", color: "from-slate-300 to-slate-400", crown: "🥈", textColor: "text-slate-600", delay: 0.1 },
{ rank: 1, height: "h-32 sm:h-36", color: "from-yellow-300 to-amber-400", crown: "🥇", textColor: "text-amber-700", delay: 0 },
{ rank: 3, height: "h-16 sm:h-20", color: "from-orange-300 to-amber-500", crown: "🥉", textColor: "text-orange-700", delay: 0.2 }];


export default function RankingDialog({ open, onOpenChange }) {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) loadRanking();
  }, [open]);

  const loadRanking = async () => {
    setLoading(true);
    try {
      const allSchools = await base44.entities.School.list();
      const active = allSchools.
      filter((s) => !s.is_deleted && !s.is_hidden && (s.review_count || 0) > 0).
      sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
      setSchools(active);
    } catch (e) {
      setSchools([]);
    }
    setLoading(false);
  };

  const top3 = schools.slice(0, 3);
  const rest = schools.slice(3, 20);

  const handleSchoolClick = (school) => {
    onOpenChange(false);
    navigate(createPageUrl(`SchoolDetail?id=${school.id}`));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col bg-white dark:bg-slate-900 border-none shadow-2xl rounded-2xl overflow-hidden">
        
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-blue-950/30 shrink-0">
          




          
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Classement</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Par nombre d'avis</p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {loading ?
          <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
            </div> :
          schools.length === 0 ?
          <div className="text-center py-16 text-slate-500">Aucun établissement avec des avis</div> :

          <>
              {/* PODIUM */}
              <div className="px-4 sm:px-8 pt-6 pb-2 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-800/50">
                <div className="flex items-end justify-center gap-2 sm:gap-3 mb-0">
                  {podiumConfig.map(({ rank, height, color, crown, textColor, delay }) => {
                  const school = top3[rank - 1];
                  if (!school) return null;
                  const typeInfo = typeColors[school.type] || { text: "#8B5CF6", label: school.type };
                  return (
                    <motion.div
                      key={rank}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay, duration: 0.4, type: "spring" }}
                      className="flex flex-col items-center flex-1 max-w-[160px] cursor-pointer group"
                      onClick={() => handleSchoolClick(school)}>
                      
                        {/* School info card */}
                        <div className="mb-2 text-center w-full px-1">
                          <div className="text-xl mb-1">{crown}</div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors">
                            {school.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{school.city}</div>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <MessageSquare className="w-3 h-3 text-slate-400" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{school.review_count}</span>
                            <span className="text-[10px] text-slate-400">avis</span>
                          </div>
                        </div>

                        {/* Podium block */}
                        <div className={`w-full ${height} rounded-t-xl bg-gradient-to-b ${color} flex items-center justify-center shadow-lg relative overflow-hidden group-hover:scale-105 transition-transform duration-200`}>
                          <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-all" />
                          <span className={`text-2xl sm:text-3xl font-black ${textColor} relative z-10`}>{rank}</span>
                          {/* Shine effect */}
                          <div className="absolute top-0 left-0 w-full h-1/3 bg-white/30 rounded-t-xl" />
                        </div>
                      </motion.div>);

                })}
                </div>
              </div>

              {/* Rest of ranking */}
              {rest.length > 0 &&
            <div className="px-4 sm:px-6 py-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Suite du classement</div>
                  <div className="space-y-2">
                    {rest.map((school, idx) => {
                  const typeInfo = typeColors[school.type] || { bg: "bg-purple-500", text: "#8B5CF6", label: school.type };
                  return (
                    <motion.div
                      key={school.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx }}
                      onClick={() => handleSchoolClick(school)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer group transition-all">
                      
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{idx + 4}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {school.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400">{school.city}</span>
                              <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: typeInfo.text }}>
                            
                                {typeInfo.label}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{school.review_count}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-400 transition-colors shrink-0" />
                        </motion.div>);

                })}
                  </div>
                </div>
            }
            </>
          }
        </div>
      </DialogContent>
    </Dialog>);

}