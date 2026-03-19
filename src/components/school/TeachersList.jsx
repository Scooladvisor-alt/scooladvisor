import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, BookOpen, ChevronRight, Loader2, Star, Award, ChevronDown, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import GradientSpinner from "@/components/shared/GradientSpinner";

export default function TeachersList({ schoolId, onAddTeacher }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // New state for mobile detection

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // Tailwind's 'sm' breakpoint is 640px
    };

    checkMobile(); // Check on initial render
    window.addEventListener('resize', checkMobile); // Add event listener for resize

    return () => window.removeEventListener('resize', checkMobile); // Clean up
  }, []);

  useEffect(() => {
    const loadTeachers = async () => {
      setLoading(true);
      // Charger TOUS les professeurs sans limite (5000 max par sécurité technique, mais c'est énorme)
      const teachersData = await base44.entities.Teacher.filter({ school_id: schoolId, status: "approved", is_deleted: false }, "-average_rating", 5000);
      // Exclure uniquement les profs explicitement masqués (is_hidden === true)
      setTeachers(teachersData.filter(t => t.is_hidden !== true));
      setLoading(false);
    };
    if (schoolId) {
      loadTeachers();
    }
  }, [schoolId]);

  const podiumIconColors = ['text-yellow-500', 'text-slate-400', 'text-orange-600'];

  const filteredTeachers = teachers.filter((teacher) =>
  teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  teacher.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Afficher tous les professeurs sans aucune limite d'affichage
  const displayedTeachers = filteredTeachers;

  return (
    <>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="teacherGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4D8D" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-slate-200 dark:border-slate-700 shadow-xl w-full flex flex-col hover:shadow-2xl transition-shadow duration-300 h-auto lg:h-full">
        <style>{`
          .teachers-list-scrollable {
            overflow-y: auto;
            scroll-behavior: smooth;
            flex: 1;
          }
          
          .teachers-list-scrollable::-webkit-scrollbar {
            width: 6px;
          }
          
          .teachers-list-scrollable::-webkit-scrollbar-thumb {
            background-color: rgba(148, 163, 184, 0.6);
            border-radius: 10px;
          }
          
          .teachers-list-scrollable::-webkit-scrollbar-track {
            background-color: rgba(0,0,0,0.05);
            border-radius: 10px;
          }
        `}</style>
        
        <CardHeader className="border-b border-slate-100 dark:border-slate-700 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" style={{ stroke: "url(#teacherGradient)" }} />
              <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">Professeurs</span>
              <span className="text-base sm:text-xl">❤️</span>
              <span className="text-sm text-slate-400 dark:text-slate-500 font-normal">({teachers.length})</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950">
              <Search className="w-5 h-5" />
            </Button>
          </div>
          
          {showSearch &&
          <div className="mt-3">
              <Input
              placeholder="Rechercher un professeur ou une matière..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
          }
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
          {loading ?
          <div className="flex justify-center items-center py-12">
              <GradientSpinner size="w-8 h-8" />
            </div> :
          filteredTeachers.length === 0 ?
          <div className="py-16 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Users className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-slate-700 dark:text-slate-200 font-medium mb-2">
                  {searchQuery ? "Aucun professeur trouvé" : "Aucun professeur pour le moment"}
                </p>
                {!searchQuery &&
            <>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                      Sois le premier à ajouter les profs de cet établissement ! 🚀
                    </p>
                    <Button onClick={onAddTeacher} className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md">
                      <Users className="w-4 h-4 mr-2" />
                      Ajouter le premier prof
                    </Button>
                  </>
            }
              </div> :
          <>
                <div className="teachers-list-scrollable">
                  {displayedTeachers.map((teacher, index) => {
                const isPodium = index < 3;
                const podiumClass = 'hover:border-blue-300 bg-white';

                return (
                  <motion.div
                    key={teacher.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}>
                        <Link to={createPageUrl(`TeacherDetail?id=${teacher.id}`)}>
                          <div className={`group flex items-center gap-2 sm:gap-4 p-4 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all ${podiumClass} dark:bg-slate-800`}>
                            <Avatar className="w-10 h-10 sm:w-14 sm:h-14 border-2 border-white shadow-sm flex-shrink-0">
                              <AvatarImage src={teacher.photo_url} loading="lazy" />
                              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white font-semibold text-sm sm:text-base">
                                {teacher.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                                {isPodium && <Award className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${podiumIconColors[index]}`} />}
                                <span className="truncate">{teacher.name}</span>
                              </h3>
                              <div className="flex items-center gap-1 sm:gap-2 mt-1">
                                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 truncate">{teacher.subject}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                              {teacher.average_rating > 0 &&
                          <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-700/50 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-600">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm">{teacher.average_rating.toFixed(1)}</span>
                                </div>
                          }
                              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                        </Link>
                      </motion.div>);

              })}
                </div>

{/* Plus de bouton "Voir plus", tous les profs sont affichés */}
              </>
          }
        </CardContent>
      </Card>
    </>);

}