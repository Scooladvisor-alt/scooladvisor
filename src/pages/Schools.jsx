import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Search, Filter, TrendingUp, ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import SchoolCard from "../components/schools/SchoolCard";
import AddSchoolDialog from "../components/schools/AddSchoolDialog";
import NationalChatWidget from "../components/shared/NationalChatWidget";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEO from "@/components/shared/SEO";

export default function SchoolsPage() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherCounts, setTeacherCounts] = useState({});
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [displayedSchools, setDisplayedSchools] = useState([]);
  const [displayCount, setDisplayCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTeacherRoom, setShowTeacherRoom] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [internationalOnly, setInternationalOnly] = useState(false);

  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [teacherSuggestions, setTeacherSuggestions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSchools();
  }, [schools, searchTerm, typeFilter, internationalOnly]);

  useEffect(() => {
    setDisplayedSchools(filteredSchools.slice(0, displayCount));
  }, [filteredSchools, displayCount]);

  useEffect(() => {
    if (teacherSearchTerm) {
      const normalizedSearch = normalizeString(teacherSearchTerm);
      const matchingTeachers = teachers.filter((teacher) => {
        const school = schools.find((s) => s.id === teacher.school_id);
        if (!school) return false;

        const normalizedTeacherName = normalizeString(teacher.name);
        const normalizedSubject = normalizeString(teacher.subject || "");
        return normalizedTeacherName.includes(normalizedSearch) || normalizedSubject.includes(normalizedSearch);
      }).slice(0, 8);
      setTeacherSuggestions(matchingTeachers);
    } else {
      setTeacherSuggestions([]);
    }
  }, [teacherSearchTerm, teachers, schools]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }

    try {
      const allSchools = await base44.entities.School.list("-created_date");
      const teachersData = await base44.entities.Teacher.filter({ status: "approved" });

      const uniqueSchools = [];
      const seenNames = new Set();

      for (const school of allSchools) {
        const normalizedName = normalizeString(school.name);
        if (!seenNames.has(normalizedName)) {
          seenNames.add(normalizedName);
          uniqueSchools.push(school);
        }
      }

      const counts = {};
      for (const teacher of teachersData) {
        counts[teacher.school_id] = (counts[teacher.school_id] || 0) + 1;
      }

      setSchools(uniqueSchools);
      setTeachers(teachersData);
      setTeacherCounts(counts);
    } catch (error) {
      console.error("Error loading data:", error);
      setSchools([]);
      setTeachers([]);
      setTeacherCounts({});
    }

    setLoading(false);
  };

  const normalizeString = (str) => {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const filterSchools = () => {
    let filtered = [...schools];

    // Exclure uniquement les écoles supprimées
    filtered = filtered.filter((school) => !school.is_deleted);

    if (searchTerm) {
      const normalizedSearch = normalizeString(searchTerm);

      filtered = filtered.filter((school) => {
        const normalizedName = normalizeString(school.name);
        const normalizedCity = normalizeString(school.city || "");
        return normalizedName.includes(normalizedSearch) || normalizedCity.includes(normalizedSearch);
      });

      filtered.sort((a, b) => {
        const normalizedNameA = normalizeString(a.name);
        const normalizedNameB = normalizeString(b.name);

        if (normalizedNameA.startsWith(normalizedSearch) && !normalizedNameB.startsWith(normalizedSearch)) {
          return -1;
        }
        if (!normalizedNameA.startsWith(normalizedSearch) && normalizedNameB.startsWith(normalizedSearch)) {
          return 1;
        }

        return a.name.localeCompare(b.name);
      });
    } else {
      filtered.sort((a, b) => {
        const ratingA = a.average_rating || 0;
        const ratingB = b.average_rating || 0;

        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }

        return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
      });
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((school) => school.type === typeFilter);
    }

    if (internationalOnly) {
      filtered = filtered.filter((school) => {
        return school.region && school.region.trim().toLowerCase() === "international";
      });
    }

    setFilteredSchools(filtered);
  };

  const handleShowMore = () => {
    setDisplayCount((prev) => prev + 50);
  };

  const handleShowAll = () => {
    setDisplayCount(filteredSchools.length);
  };

  const handleTeacherClick = (teacher) => {
    setShowTeacherRoom(false);
    setTeacherSearchTerm("");
    navigate(createPageUrl(`TeacherDetail?id=${teacher.id}`));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <SEO 
        title="ScoolAdvisor - L'avis des étudiants sur leurs écoles et professeurs"
        description="Recherchez votre établissement, consultez les avis des étudiants et notez vos professeurs. Le 1er site d'avis scolaires vérifiés."
        canonicalPath="/"
      />
      <style>{`
        @keyframes rotating-shine {
          0% { 
            transform: rotate(0deg); 
          }
          100% { 
            transform: rotate(360deg); 
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 8px rgba(148, 163, 184, 0.15);
          }
          50% { 
            box-shadow: 0 0 12px rgba(148, 163, 184, 0.25);
          }
        }
        
        @keyframes border-shimmer {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        
        .rotating-shine-widget {
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            90deg,
            rgba(148, 163, 184, 0.15) 0%,
            rgba(203, 213, 225, 0.2) 25%,
            rgba(148, 163, 184, 0.15) 50%,
            rgba(203, 213, 225, 0.2) 75%,
            rgba(148, 163, 184, 0.15) 100%
          );
          background-size: 200% 100%;
          animation: border-shimmer 4s linear infinite, pulse-glow 3s ease-in-out infinite;
          padding: 2px;
        }
        
        .rotating-shine-widget::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(255, 255, 255, 0.3) 30deg,
            transparent 60deg
          );
          animation: rotating-shine 4s linear infinite;
          pointer-events: none;
          z-index: 1;
        }
        
        .search-widget-content {
          position: relative;
          z-index: 10;
          background: white;
          border-radius: 1.25rem;
        }
        
        .gradient-border-button {
          position: relative;
          background: transparent;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.2s ease;
        }
        
        .gradient-border-button::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 0.75rem;
          padding: 2px;
          background: linear-gradient(90deg, #FF4D8D, #8B5CF6, #3B82F6);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        
        .gradient-border-button:hover {
          transform: scale(1.04);
        }
        
        .gradient-border-button:hover::before {
          background: linear-gradient(90deg, #e53e7d, #7c3aed, #2563eb);
        }
        
        .gradient-text {
          background: linear-gradient(90deg, #FF4D8D, #8B5CF6, #3B82F6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-border-button:hover .gradient-text {
          background: linear-gradient(90deg, #e53e7d, #7c3aed, #2563eb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12">

          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-100 shadow-sm mb-6 relative z-10">
            <TrendingUp className="w-4 h-4 text-[#FF4D8D]" />
            <span className="text-sm font-medium bg-gradient-to-r from-[#FF4D8D] to-purple-600 bg-clip-text text-transparent">
              Le réseau social des étudiants
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight relative z-10">
            <span className="block text-5xl sm:text-5xl md:text-7xl lg:text-8xl bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">
              L'avis des étudiants
            </span>
            <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-slate-900">sur leurs écoles et professeurs</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-3xl mx-auto mb-4 sm:mb-8 relative z-10">Les profs notent, les élèves aussi 😎</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rotating-shine-widget rounded-2xl shadow-lg mb-6 sm:mb-8">

          <div className="search-widget-content p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-400 z-10" />
                <Input
                  placeholder="Rechercher un établissement ou une ville..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 h-9 sm:h-12 border-slate-200 focus:border-blue-400 text-xs sm:text-base w-full" />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 sm:h-12 text-xs sm:text-base w-full sm:w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" sideOffset={4}>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="college">Collège</SelectItem>
                  <SelectItem value="lycee">Lycée</SelectItem>
                  <SelectItem value="universite">Université</SelectItem>
                  <SelectItem value="ecole_privee">École privée</SelectItem>
                  <SelectItem value="ecole_commerce">École de commerce</SelectItem>
                  <SelectItem value="ecole_ingenieur">École d'ingénieurs</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden sm:flex items-center space-x-2 whitespace-nowrap">
                <Checkbox
                  id="international"
                  checked={internationalOnly}
                  onCheckedChange={setInternationalOnly} />
                <Label
                  htmlFor="international"
                  className="text-xs sm:text-sm text-slate-600 cursor-pointer flex items-center gap-1">
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>International</span>
                </Label>
              </div>
            </div>

            <div className="flex sm:hidden items-center gap-2 mt-2">
              <Button
                onClick={() => {
                  if (!user) {
                    base44.auth.redirectToLogin(window.location.href);
                    return;
                  }
                  setShowAddDialog(true);
                }}
                size="sm"
                className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md h-7 px-2 text-[10px] font-semibold flex-1">
                <Plus className="w-3 h-3 mr-1" />
                Ajouter mon école
              </Button>

              <Button
                size="sm"
                onClick={() => setShowTeacherRoom(true)}
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-[#FF4D8D] hover:from-blue-500/90 hover:via-purple-500/90 hover:to-[#FF4D8D]/90 text-white shadow-md h-7 px-2 text-[10px] font-semibold flex-1">
                <span>Salle des profs</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-3">
              <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-sm text-slate-600">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{filteredSchools.length} établissement(s)</span>
              </div>

              <div className="flex sm:hidden items-center space-x-2 whitespace-nowrap">
                <Checkbox
                  id="international-mobile"
                  checked={internationalOnly}
                  onCheckedChange={setInternationalOnly} />
                <Label
                  htmlFor="international-mobile"
                  className="text-[10px] text-slate-600 cursor-pointer flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>International</span>
                </Label>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <Button
                  onClick={() => {
                    if (!user) {
                      base44.auth.redirectToLogin(window.location.href);
                      return;
                    }
                    setShowAddDialog(true);
                  }}
                  size="sm"
                  className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md h-8 px-3 text-xs font-semibold">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Ajouter mon école
                </Button>

                <Button
                  size="sm"
                  onClick={() => setShowTeacherRoom(true)}
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-[#FF4D8D] hover:from-blue-500/90 hover:via-purple-500/90 hover:to-[#FF4D8D]/90 text-white shadow-md h-8 px-3 text-xs font-semibold">
                  <span>Visiter la salle des profs</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {loading ?
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) =>
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded mb-4" />
                <div className="h-4 bg-slate-200 rounded mb-2" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
          )}
          </div> :
        schools.length === 0 ?
        <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun établissement trouvé</h3>
            <p className="text-slate-600 mb-4">Commencez par ajouter des établissements.</p>
            {user &&
          <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un établissement
              </Button>
          }
          </div> :
        filteredSchools.length === 0 && searchTerm ?
        <div className="text-center py-20">
            <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto">

              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Ton école n'est pas là ?
              </h3>
              <p className="text-slate-600 mb-6">
                Ajoute-la maintenant et sois le premier à donner ton avis ! 🚀
              </p>
              <Button
              onClick={() => {
                if (!user) {
                  base44.auth.redirectToLogin(window.location.href);
                  return;
                }
                setShowAddDialog(true);
              }}
              className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 font-semibold">

                <Plus className="w-5 h-5 mr-2" />
                Ajouter mon école
              </Button>
            </motion.div>
          </div> :

        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedSchools.map((school, index) =>
            <motion.div
              key={school.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}>

                  <SchoolCard
                school={school}
                teacherCount={teacherCounts[school.id] || 0} />

                </motion.div>
            )}
            </div>

            {filteredSchools.length > displayCount &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8">

                <div 
                  onClick={handleShowMore}
                  className="flex items-center w-full gap-4 cursor-pointer group py-4"
                >
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#FF4D8D] to-purple-500 opacity-30 group-hover:opacity-100 transition-all duration-300" />
                  <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent whitespace-nowrap transform group-hover:scale-105 transition-transform duration-300">
                    Voir 50 écoles +
                  </span>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-purple-500 via-blue-500 to-transparent opacity-30 group-hover:opacity-100 transition-all duration-300" />
                </div>
              </motion.div>
          }

            {filteredSchools.length > 6 &&
          <div className="mt-8">
                <NationalChatWidget isHomePage={true} />
              </div>
          }
          </>
        }
      </div>

      <AddSchoolDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={loadData} />


      <Dialog open={showTeacherRoom} onOpenChange={setShowTeacherRoom}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white border-none shadow-2xl">
          <style>{`
            @keyframes gentle-float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
            
            @keyframes soft-shimmer {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
            
            @keyframes card-glow {
              0%, 100% { box-shadow: 0 4px 15px rgba(255, 77, 141, 0.1); }
              50% { box-shadow: 0 8px 25px rgba(255, 77, 141, 0.2); }
            }
            
            .teacher-card-shimmer {
              position: relative;
              overflow: hidden;
            }
            
            .teacher-card-shimmer::before {
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
              transition: left 0.6s ease;
            }
            
            .teacher-card-shimmer:hover::before {
              left: 100%;
            }
          `}</style>
          
          {/* En-tête redesigné */}
          <div className="relative px-6 sm:px-8 pt-8 pb-6 text-center bg-gradient-to-br from-white via-pink-50/30 to-blue-50/30">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
                <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-[#4DA6FF] bg-clip-text text-transparent">
                  Salle des profs
                </span>
                <span className="ml-2">🧑‍🏫</span>
              </h1>
              <p className="text-base md:text-lg text-gray-600">
                Explorez l'ensemble des établissements pour dénicher les profs les mieux notés 🎓
              </p>
            </motion.div>
          </div>

          {/* Barre de recherche */}
          <div className="px-6 sm:px-8 pb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative">

              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
              <Input
                placeholder="Nom du professeur ou matière..."
                value={teacherSearchTerm}
                onChange={(e) => setTeacherSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base border-2 border-slate-200 focus:border-pink-300 rounded-2xl bg-white shadow-sm transition-all"
                autoFocus />

            </motion.div>
          </div>

          {/* Zone de résultats */}
          <div className="px-6 sm:px-8 pb-6 overflow-y-auto" style={{ maxHeight: '50vh' }}>
            {teacherSearchTerm && teacherSuggestions.length === 0 ?
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16">

                <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-lg font-medium text-slate-700">Aucun professeur trouvé</p>
                <p className="text-sm text-slate-500 mt-1">Essaie une autre recherche</p>
              </motion.div> :
            teacherSearchTerm && teacherSuggestions.length > 0 ?
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {teacherSuggestions.map((teacher, index) => {
                const school = schools.find((s) => s.id === teacher.school_id);
                return (
                  <motion.button
                    key={teacher.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => handleTeacherClick(teacher)}
                    className="teacher-card-shimmer group p-2 sm:p-4 text-left bg-white rounded-2xl border-2 border-slate-100 hover:border-pink-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

                      <div className="flex flex-col items-center text-center gap-3">
                        {/* Photo de profil */}
                        <div className="relative">
                          <img
                          src={teacher.photo_url}
                          alt={teacher.name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md group-hover:border-pink-200 transition-all" />

                          {teacher.average_rating > 0 &&
                        <div className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-gradient-to-br from-amber-300 to-amber-400 px-2 py-1 rounded-full border-2 border-white shadow-md">
                              <span className="text-xs font-bold text-white">
                                {teacher.average_rating.toFixed(1)}
                              </span>
                              <span className="text-[10px] text-white/90">⭐️</span>
                            </div>
                        }
                        </div>

                        {/* Infos prof */}
                        <div className="w-full">
                          <h3 className="font-bold text-slate-900 text-base mb-1 truncate">
                            {teacher.name}
                          </h3>
                          
                          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-100 to-blue-100 px-3 py-1 rounded-full mb-2">
                            <span className="text-xs font-semibold bg-gradient-to-r from-[#FF4D8D] to-[#4DA6FF] bg-clip-text text-transparent">
                              {teacher.subject}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-500 truncate">
                            📍 {school?.name || "Établissement inconnu"}
                          </p>
                        </div>

                        {/* Bouton voir profil */}
                        <div className="w-full mt-2 pt-3 border-t border-slate-100">
                          <div className="text-xs font-semibold text-center bg-gradient-to-r from-[#FF4D8D] to-[#4DA6FF] bg-clip-text text-transparent group-hover:from-pink-600 group-hover:to-blue-600 transition-all">
                            Voir le profil →
                          </div>
                        </div>
                      </div>
                    </motion.button>);

              })}
              </div> :

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16">

                <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 0, 10, 0],
                      scale: [1, 1.1, 1],
                      x: [0, -3, 3, 0],
                      y: [0, -3, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Search className="w-10 h-10 text-[#FF4D8D]" />
                  </motion.div>
                </div>
                <p className="text-lg font-semibold text-slate-900 mb-2">Commence à chercher un prof</p>
                <p className="text-sm text-slate-500">Tape son nom ou sa matière pour découvrir son profil 🔍</p>
              </motion.div>
            }
          </div>

          {/* Footer avec bouton de sortie */}
          <div className="relative border-t border-slate-100 bg-gradient-to-r from-pink-50/20 to-blue-50/20 px-6 py-4">
            <div className="flex justify-center">
              <Button
                onClick={() => setShowTeacherRoom(false)}
                variant="outline"
                className="border-2 border-slate-200 hover:border-pink-300 hover:bg-pink-50 transition-all px-6 py-2 rounded-xl">

                <span className="bg-gradient-to-r from-[#FF4D8D] to-[#4DA6FF] bg-clip-text text-transparent font-semibold">
                  Quitter la salle
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}