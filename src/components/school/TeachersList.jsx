
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, BookOpen, ChevronRight, Loader2, Star, Award, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function TeachersList({ schoolId }) {
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
      const teachersData = await base44.entities.Teacher.filter({ school_id: schoolId, status: "approved" });
      
      const sortedTeachers = teachersData.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      setTeachers(sortedTeachers);
      setLoading(false);
    };
    if (schoolId) {
      loadTeachers();
    }
  }, [schoolId]);

  const podiumStyles = [
    'bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 border-amber-300',
    'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 border-slate-300',
    'bg-gradient-to-r from-orange-200 via-orange-100 to-orange-200 border-orange-300'
  ];

  const podiumIconColors = ['text-amber-500', 'text-slate-500', 'text-orange-500'];

  const filteredTeachers = teachers.filter(teacher => 
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine initial number of teachers to display based on screen size
  const initialDisplayCount = isMobile ? 4 : 10; 

  const displayedTeachers = showAll ? filteredTeachers : filteredTeachers.slice(0, initialDisplayCount);
  const hasMore = filteredTeachers.length > initialDisplayCount && !showAll;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg w-full">
      <style>{`
        .teachers-list-scrollable {
          max-height: 500px;
          overflow-y: auto;
          scroll-behavior: smooth;
        }
        
        @media (max-width: 639px) {
          .teachers-list-scrollable {
            max-height: 360px;
          }
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
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <span className="text-base sm:text-2xl">Professeurs ❤️ ({teachers.length})</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
        
        {showSearch && (
          <div className="mt-3">
            <Input
              placeholder="Rechercher un professeur ou une matière..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600">
              {searchQuery ? "Aucun professeur trouvé" : "Aucun professeur ajouté pour le moment"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 pr-2 teachers-list-scrollable">
              {displayedTeachers.map((teacher, index) => {
                const isPodium = teacher.review_count > 0 && index < 3;
                const podiumClass = isPodium ? podiumStyles[index] : 'hover:border-blue-300 bg-white';
                
                return (
                  <motion.div
                    key={teacher.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={createPageUrl(`TeacherDetail?id=${teacher.id}`)}>
                      <div className={`group flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl border hover:shadow-md transition-all ${podiumClass}`}>
                        <Avatar className="w-10 h-10 sm:w-14 sm:h-14 border-2 border-white shadow-sm flex-shrink-0">
                          <AvatarImage src={teacher.photo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white font-semibold text-sm sm:text-base">
                            {teacher.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                            {isPodium && <Award className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${podiumIconColors[index]}`} />}
                            <span className="truncate">{teacher.name}</span>
                          </h3>
                          <div className="flex items-center gap-1 sm:gap-2 mt-1">
                            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-slate-600 truncate">{teacher.subject}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          {teacher.average_rating > 0 && (
                            <div className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-full border border-slate-200">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">{teacher.average_rating.toFixed(1)}</span>
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  Voir {filteredTeachers.length - initialDisplayCount} professeurs de plus
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
