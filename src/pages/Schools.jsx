import React, { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Search, Filter, TrendingUp, ArrowRight, Globe, Loader2, Star } from "lucide-react";
import { usePullToRefresh } from "@/components/mobile/usePullToRefresh";
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
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEO from "@/components/shared/SEO";

// Lazy load des composants lourds
const AddSchoolDialog = lazy(() => import("../components/schools/AddSchoolDialog"));
const NationalChatWidget = lazy(() => import("../components/shared/NationalChatWidget"));

export default function SchoolsPage() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherCounts, setTeacherCounts] = useState({});
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [displayedSchools, setDisplayedSchools] = useState([]);
  const [displayCount, setDisplayCount] = useState(6);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allSchoolsLoaded, setAllSchoolsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTeacherRoom, setShowTeacherRoom] = useState(false);
  const [totalSchoolCount, setTotalSchoolCount] = useState(0);
  const [filteredTotalCount, setFilteredTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [internationalOnly, setInternationalOnly] = useState(false);
  const [internationalSchoolsLoaded, setInternationalSchoolsLoaded] = useState(false);

  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [teacherSuggestions, setTeacherSuggestions] = useState([]);



  useEffect(() => {
    loadData();
    const savedSchool = localStorage.getItem('pending_school_submission');
    if (savedSchool) {
      setShowAddDialog(true);
    }
  }, []);

  useEffect(() => {
    if ((typeFilter !== "all" || internationalOnly) && !allSchoolsLoaded) {
      loadAllSchoolsForFiltering();
    } else {
      filterSchools();
    }
    updateFilteredTotalCount();
  }, [schools, searchTerm, typeFilter, internationalOnly, teacherCounts]);

  const updateFilteredTotalCount = async () => {
    try {
      let query = {};

      if (typeFilter !== "all") {
        query.type = typeFilter;
      }

      if (internationalOnly) {
        query.region = "International";
      }

      const allMatchingSchools = await base44.entities.School.filter(query);
      const activeSchools = allMatchingSchools.filter((s) => !s.is_deleted);

      if (searchTerm) {
        const normalizedSearch = normalizeString(searchTerm);
        const searchFiltered = activeSchools.filter((school) => {
          const normalizedName = normalizeString(school.name);
          const normalizedCity = normalizeString(school.city || "");
          return normalizedName.includes(normalizedSearch) || normalizedCity.includes(normalizedSearch);
        });
        setFilteredTotalCount(searchFiltered.length);
      } else {
        setFilteredTotalCount(activeSchools.length);
      }
    } catch (error) {
      console.error("Error counting filtered schools:", error);
      setFilteredTotalCount(filteredSchools.length);
    }
  };

  const loadAllSchoolsForFiltering = async () => {
    if (allSchoolsLoaded) return;

    try {
      const allSchools = await base44.entities.School.list();
      const uniqueSchools = removeDuplicates(allSchools);
      setSchools(uniqueSchools);
      setAllSchoolsLoaded(true);
      setInternationalSchoolsLoaded(true);
    } catch (error) {
      console.error("Error loading all schools:", error);
    }
  };

  const removeDuplicates = (schoolsList) => {
    const uniqueSchools = [];
    const seenKeys = new Set();
    const duplicateIds = new Set();

    for (const school of schoolsList) {
      if (school.is_deleted) continue;

      const normalizedName = normalizeString(school.name);
      const normalizedAddress = normalizeString(school.address);
      const uniqueKey = `${normalizedName}||${normalizedAddress}||${school.city}`;

      if (seenKeys.has(uniqueKey)) {
        duplicateIds.add(school.id);
      } else {
        seenKeys.add(uniqueKey);
        uniqueSchools.push(school);
      }
    }

    if (duplicateIds.size > 0) {
      deleteDuplicates(Array.from(duplicateIds));
    }

    return uniqueSchools;
  };

  const deleteDuplicates = async (ids) => {
    try {
      for (const id of ids) {
        await base44.entities.School.update(id, { is_deleted: true });
      }
      console.log(`Suppression de ${ids.length} doublons effectuée`);
    } catch (error) {
      console.error("Error deleting duplicates:", error);
    }
  };

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
      // Charger les profs d'abord pour avoir les counts avant le tri
      const teachersData = await base44.entities.Teacher.filter({ status: "approved" });
      const counts = {};
      for (const teacher of teachersData) {
        counts[teacher.school_id] = (counts[teacher.school_id] || 0) + 1;
      }
      setTeacherCounts(counts);
      setTeachers(teachersData);

      // Puis charger les écoles (le tri aura accès aux teacherCounts)
      const initialSchools = await base44.entities.School.list();
      const uniqueSchools = removeDuplicates(initialSchools);

      setSchools(uniqueSchools);
      setAllSchoolsLoaded(initialSchools.length < 50);

      loadTotalSchoolCount();
    } catch (error) {
      console.error("Error loading data:", error);
      setSchools([]);
    }

    setLoading(false);
  };

  const loadTotalSchoolCount = async () => {
    try {
      const allSchools = await base44.entities.School.list();
      const activeSchools = allSchools.filter((s) => !s.is_deleted);
      const uniqueSchools = new Set();

      for (const school of activeSchools) {
        const normalizedName = normalizeString(school.name);
        uniqueSchools.add(normalizedName);
      }

      setTotalSchoolCount(uniqueSchools.size);
    } catch (error) {
      console.error("Error loading total school count:", error);
    }
  };



  const loadMoreSchools = async () => {
    if (allSchoolsLoaded) {
      setDisplayCount((prev) => prev + 50);
      return;
    }

    setLoadingMore(true);
    try {
      const allSchools = await base44.entities.School.list();
      const uniqueSchools = removeDuplicates(allSchools);
      setSchools(uniqueSchools);
      setAllSchoolsLoaded(true);
    } catch (error) {
      console.error("Error loading more schools:", error);
    }
    setLoadingMore(false);
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
        // Vérifier si l'école a des avis
        const hasReviewA = (a.review_count || 0) > 0;
        const hasReviewB = (b.review_count || 0) > 0;
        
        // Priorité 1 : Les écoles notées passent toujours en premier
        if (hasReviewA && !hasReviewB) return -1;
        if (!hasReviewA && hasReviewB) return 1;
        
        // Priorité 2 : Trier par score de popularité
        const getPopularityScore = (school) => {
          const schoolReviews = school.review_count || 0;
          const teacherCount = teacherCounts[school.id] || 0;
          
          // Score = (nombre d'avis * 2) + nombre de profs
          return (schoolReviews * 2) + teacherCount;
        };
        
        const scoreA = getPopularityScore(a);
        const scoreB = getPopularityScore(b);

        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }

        // En cas d'égalité, trier par date de création
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

  const handleShowMore = async () => {
    if (!allSchoolsLoaded) {
      await loadMoreSchools();
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

      <SEO
        title="ScoolAdvisor - L'avis des étudiants sur leurs écoles et professeurs"
        description="Recherchez votre établissement, consultez les avis des étudiants et notez vos professeurs. Le 1er site d'avis scolaires vérifiés."
        canonicalPath="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "ScoolAdvisor",
          "description": "Le réseau social des étudiants - Avis authentiques sur écoles et professeurs",
          "url": window.location.origin,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${window.location.origin}?search={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        }} />

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

          @keyframes shine-sweep {
            0% { transform: translateX(-100%) skewX(-15deg); }
            100% { transform: translateX(200%) skewX(-15deg); }
          }

          .btn-shine-hover {
            position: relative;
            overflow: hidden;
          }

          .btn-shine-hover::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 50%;
            height: 100%;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
            transform: translateX(-150%) skewX(-15deg);
            transition: transform 0.5s;
          }

          .btn-shine-hover:hover::after {
            animation: shine-sweep 0.75s ease-in-out;
          }


        `}</style>
      
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-0 md:pt-12 md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12">

          <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-100 dark:border-slate-700 shadow-sm mb-6 relative z-10">
            <TrendingUp className="w-4 h-4 text-[#FF4D8D]" />
            <span className="text-sm font-medium bg-gradient-to-r from-[#FF4D8D] to-purple-600 bg-clip-text text-transparent">
              Le réseau social des étudiants
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 leading-tight relative z-10 cursor-default">
            <span className="btn-shine-hover inline-block text-6xl sm:text-5xl md:text-7xl lg:text-8xl bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">
              L'avis des étudiants
            </span>
            <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-slate-900 dark:text-white">sur leurs écoles et professeurs</span>
          </h1>

          <p className="hidden sm:block text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-4 sm:mb-8 relative z-10">Les profs notent, les élèves aussi 😎</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rotating-shine-widget rounded-2xl shadow-lg mb-6 sm:mb-8">

          <div className="search-widget-content p-3 sm:p-6 dark:bg-slate-800">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500 z-10" />
                <Input
                  placeholder="Chercher école ou ville..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 h-9 sm:h-12 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-blue-400 text-xs sm:text-base w-full" />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 sm:h-12 text-xs sm:text-base w-full sm:w-[220px] border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <SelectValue placeholder="Type">
                    {typeFilter === "all" ? (
                      <span className="text-slate-600 font-medium text-xs sm:text-sm">Tous les types</span>
                    ) : typeFilter === "college" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#3498DB] text-white border-[#3498DB]">
                        Collège
                      </span>
                    ) : typeFilter === "lycee" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#1ABC9C] text-white border-[#1ABC9C]">
                        Lycée
                      </span>
                    ) : typeFilter === "universite" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#27AE60] text-white border-[#27AE60]">
                        Université
                      </span>
                    ) : typeFilter === "ecole_privee" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#F39C12] text-white border-[#F39C12]">
                        École privée
                      </span>
                    ) : typeFilter === "ecole_commerce" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#E74C3C] text-white border-[#E74C3C]">
                        École de commerce
                      </span>
                    ) : typeFilter === "ecole_ingenieur" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#FF6B35] text-white border-[#FF6B35]">
                        École d'ingénieurs
                      </span>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="college">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#3498DB] text-white border-[#3498DB]">
                      Collège
                    </span>
                  </SelectItem>
                  <SelectItem value="lycee">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#1ABC9C] text-white border-[#1ABC9C]">
                      Lycée
                    </span>
                  </SelectItem>
                  <SelectItem value="universite">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#27AE60] text-white border-[#27AE60]">
                      Université
                    </span>
                  </SelectItem>
                  <SelectItem value="ecole_privee">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#F39C12] text-white border-[#F39C12]">
                      École privée
                    </span>
                  </SelectItem>
                  <SelectItem value="ecole_commerce">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#E74C3C] text-white border-[#E74C3C]">
                      École de commerce
                    </span>
                  </SelectItem>
                  <SelectItem value="ecole_ingenieur">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 shadow-md bg-[#FF6B35] text-white border-[#FF6B35]">
                      École d'ingénieurs
                    </span>
                  </SelectItem>
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
                  setShowAddDialog(true);
                }}
                size="sm"
                className="btn-shine-hover bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md h-7 px-2 text-[10px] font-semibold flex-1 hover:scale-105 transition-transform duration-200">
                <Plus className="w-3 h-3 mr-1" />
                Ajouter mon école
              </Button>

              <Button
                size="sm"
                onClick={() => setShowTeacherRoom(true)}
                className="btn-shine-hover bg-gradient-to-r from-blue-500 via-purple-500 to-[#FF4D8D] hover:from-blue-500/90 hover:via-purple-500/90 hover:to-[#FF4D8D]/90 text-white shadow-md h-7 px-2 text-[10px] font-semibold flex-1 hover:scale-105 transition-transform duration-200">
                <span>Salle des profs</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-3">
              <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-sm text-slate-600 dark:text-slate-300">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{filteredTotalCount} établissement(s)</span>
              </div>

              <div className="flex sm:hidden items-center space-x-2 whitespace-nowrap">
                <Checkbox
                  id="international-mobile"
                  checked={internationalOnly}
                  onCheckedChange={setInternationalOnly} />
                <Label
                  htmlFor="international-mobile"
                  className="text-[10px] text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>International</span>
                </Label>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <Button
                  onClick={() => {
                    setShowAddDialog(true);
                  }}
                  size="sm"
                  className="btn-shine-hover bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md h-8 px-3 text-xs font-semibold hover:scale-105 transition-transform duration-200">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Ajouter mon école
                </Button>

                <Button
                  size="sm"
                  onClick={() => setShowTeacherRoom(true)}
                  className="btn-shine-hover bg-gradient-to-r from-blue-500 via-purple-500 to-[#FF4D8D] hover:from-blue-500/90 hover:via-purple-500/90 hover:to-[#FF4D8D]/90 text-white shadow-md h-8 px-3 text-xs font-semibold hover:scale-105 transition-transform duration-200">
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
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Aucun établissement trouvé</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">Commencez par ajouter des établissements.</p>
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

              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Ton école n'est pas là ?
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Ajoute-la maintenant et sois le premier à donner ton avis ! 🚀
              </p>
              <Button
              onClick={() => {
                setShowAddDialog(true);
              }}
              className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 font-semibold">

                <Plus className="w-5 h-5 mr-2" />
                Ajouter mon école
              </Button>
            </motion.div>
          </div> :

        <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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

            {(filteredSchools.length > displayCount || !allSchoolsLoaded) &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8">

                  <div
              onClick={handleShowMore}
              className="flex items-center w-full gap-4 cursor-pointer group py-4">

                    <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#FF4D8D] to-purple-500 opacity-30 group-hover:opacity-100 transition-all duration-300" />
                    {loadingMore ?
              <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                        <span className="text-sm text-purple-500">Chargement...</span>
                      </div> :

              <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent whitespace-nowrap transform group-hover:scale-105 transition-transform duration-300">
                        Voir 50 établissements +
                      </span>
              }
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-purple-500 via-blue-500 to-transparent opacity-30 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                </motion.div>
          }

            {filteredSchools.length > 6 &&
          <div className="mt-4 mb-0">
                <Suspense fallback={<div className="h-24 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl animate-pulse" />}>
                  <NationalChatWidget isHomePage={true} />
                </Suspense>
              </div>
          }
          </>
        }
      </div>

      <Suspense fallback={null}>
        <AddSchoolDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={loadData} />
      </Suspense>


      <Dialog open={showTeacherRoom} onOpenChange={setShowTeacherRoom}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl h-[85vh] p-0 gap-0 flex flex-col bg-white dark:bg-slate-800 border-none shadow-2xl rounded-2xl overflow-hidden dark:border-slate-700">
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
          <div className="relative px-4 sm:px-8 pt-6 pb-6 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-blue-950/20 z-10 shrink-0">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto">

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-center">
                <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-[#4DA6FF] bg-clip-text text-transparent">
                  Salle des profs
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-center mb-6">
                Tes profs, parmi toutes les scools 😎
              </p>
              
              {/* Barre de recherche intégrée dans le header */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                <Input
                  placeholder="Chercher un prof ou une matière..."
                  value={teacherSearchTerm}
                  onChange={(e) => setTeacherSearchTerm(e.target.value)}
                  className="pl-11 pr-4 h-12 text-sm sm:text-base border-2 border-slate-200 dark:border-slate-600 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900 rounded-xl bg-white dark:bg-slate-900 dark:text-white shadow-md transition-all w-full"
                  autoFocus />
              </div>
            </motion.div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800">

            {/* Zone de résultats - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-900 dark:via-purple-950/30 dark:to-blue-950/30">
              {teacherSearchTerm && teacherSuggestions.length === 0 ?
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-blue-100 dark:from-pink-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-200">Aucun professeur trouvé</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Essaie une autre recherche</p>
              </div> :
              teacherSearchTerm && teacherSuggestions.length > 0 ?
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3 max-w-7xl mx-auto">
                  {teacherSuggestions.map((teacher, index) => {
                  const school = schools.find((s) => s.id === teacher.school_id);
                  return (
                    <motion.button
                      key={teacher.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      onClick={() => handleTeacherClick(teacher)}
                      className="teacher-card-shimmer group p-2 sm:p-3 text-left bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 hover:border-pink-200 dark:hover:border-pink-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col relative">

                        {teacher.average_rating > 0 &&
                          <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-gradient-to-br from-amber-50 to-amber-100 px-1 sm:px-1.5 py-0.5 rounded-lg border border-amber-200 shadow-sm z-10">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-600 text-amber-600" />
                            <span className="text-[10px] sm:text-xs font-bold text-amber-900">
                              {teacher.average_rating.toFixed(1)}
                            </span>
                          </div>
                        }

                        <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2 flex-1">
                          {/* Photo de profil */}
                          <div className="relative shrink-0">
                            <img
                            src={teacher.photo_url}
                            alt={teacher.name}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 sm:border-3 border-white shadow-sm group-hover:border-pink-100 transition-all" />
                          </div>

                          {/* Infos prof */}
                          <div className="w-full flex-1 flex flex-col items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-0.5 sm:mb-1 truncate w-full">
                              {teacher.name}
                            </h3>
                            
                            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-50 to-blue-50 px-1.5 sm:px-2 py-0.5 rounded-full mb-1 sm:mb-1.5 border border-slate-100 max-w-full">
                              <span className="text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-[#FF4D8D] to-[#4DA6FF] bg-clip-text text-transparent line-clamp-2 text-center break-words" style={{ fontSize: teacher.subject.length > 20 ? '9px' : teacher.subject.length > 15 ? '10px' : '' }}>
                                {teacher.subject}
                              </span>
                            </div>
                            
                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2em] sm:min-h-[2.5em] leading-tight">
                              📍 {school?.name || "Établissement inconnu"}
                            </p>
                          </div>

                          {/* Bouton voir profil */}
                          <div className="w-full mt-auto pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-700">
                            <div className="text-[10px] sm:text-xs font-semibold text-center text-slate-400 dark:text-slate-500 group-hover:text-pink-500 dark:group-hover:text-pink-400 transition-colors flex items-center justify-center gap-0.5 sm:gap-1">
                              Voir profil <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </div>
                          </div>
                        </div>
                      </motion.button>);

                })}
                </div> :

              <div className="h-full flex flex-col items-center justify-center text-center pb-20">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-blue-100 dark:from-pink-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <Search className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Commence à chercher un prof</h3>
                <p className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto">Tape un nom ou une matière !</p>
              </div>
            }
            </div>
          </div>

          {/* Footer avec bouton de sortie */}
          <div className="relative border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4 z-10 shrink-0">
            <div className="flex justify-center">
              <Button
                onClick={() => setShowTeacherRoom(false)}
                variant="ghost"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl px-6">
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}