import React, { useState, useEffect, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Star,
  BookOpen,
  ChevronLeft,
  Loader2,
  Sparkles,
  Users } from
"lucide-react";
import MobileHeader from "../components/mobile/MobileHeader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";

import ReportTeacherButton from "../components/teacher/ReportTeacherButton";
import TeacherAdminMenu from "../components/admin/TeacherAdminMenu";
import SEO from "@/components/shared/SEO";
import GradientSpinner from "@/components/shared/GradientSpinner";
const AddTeacherReviewDialog = lazy(() => import("../components/teacher/AddTeacherReviewDialog"));
const TeacherStats = lazy(() => import("../components/teacher/TeacherStats"));
const TeacherReviewsList = lazy(() => import("../components/teacher/TeacherReviewsList"));
import TeacherLoveNotes from "../components/teacher/TeacherLoveNotes";

export default function TeacherDetailPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const teacherId = urlParams.get('id');

  const [teacher, setTeacher] = useState(null);
  const [school, setSchool] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [showAntoninSummary, setShowAntoninSummary] = useState(false);
  const [antoninSummary, setAntoninSummary] = useState("");
  const [loadingAntonin, setLoadingAntonin] = useState(false);

  useEffect(() => {
    if (teacherId) {
      loadData();
      
      const savedReview = localStorage.getItem('pending_teacher_review_teacher_' + teacherId);
      if (savedReview) {
        setShowAddReview(true);
      }
    }
  }, [teacherId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const teachersData = await base44.entities.Teacher.filter({ id: teacherId });
      const foundTeacher = teachersData[0];
      setTeacher(foundTeacher || null);

      if (foundTeacher && foundTeacher.school_id) {
        const schoolsData = await base44.entities.School.filter({ id: foundTeacher.school_id });
        setSchool(schoolsData[0] || null);
      }

      let currentUser = null;
      try {
        currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.warn("User not authenticated or error during base44.auth.me():", error);
        setUser(null);
      }
    } catch (error) {
      console.error("Error loading teacher data:", error);
      setTeacher(null);
      setSchool(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!teacherId) return;

    // S'abonner aux changements du professeur en temps réel
    const unsubscribe = base44.entities.Teacher.subscribe((event) => {
      if (event.id === teacherId && event.type === 'update') {
        setTeacher(event.data);
      }
    });

    return () => unsubscribe();
  }, [teacherId]);

  const updateTeacherStats = async (tId) => {
    try {
      const reviews = await base44.entities.TeacherReview.filter({ teacher_id: tId, status: "published" });
      const reviewCount = reviews.length;

      if (reviewCount === 0) {
        await base44.entities.Teacher.update(tId, {
          workload_avg: 0,
          friendliness_avg: 0,
          teaching_avg: 0,
          grading_avg: 0,
          average_rating: 0,
          review_count: 0
        });
        return;
      }

      const avg = (key) => reviews.reduce((sum, r) => sum + r[key], 0) / reviewCount;

      const workload_avg = avg('workload');
      const friendliness_avg = avg('friendliness');
      const teaching_avg = avg('teaching_method');
      const grading_avg = avg('grading_severity');
      const average_rating = workload_avg + friendliness_avg + teaching_avg + grading_avg;

      await base44.entities.Teacher.update(tId, {
        workload_avg,
        friendliness_avg,
        teaching_avg,
        grading_avg,
        average_rating,
        review_count: reviewCount
      });
    } catch (error) {
      console.error("Error updating teacher stats:", error);
    }
  };



  const handleAskAntonin = async () => {
    setLoadingAntonin(true);
    setShowAntoninSummary(true);

    try {
      const reviews = await base44.entities.TeacherReview.filter({ teacher_id: teacherId, status: "published" });

      if (!reviews || reviews.length === 0) {
        setAntoninSummary("Pas encore d'avis sur ce prof ! Sois le premier à dire ce que tu en penses 😎");
        setLoadingAntonin(false);
        return;
      }

      const reviewsSummary = reviews.map((r) => ({
        workload: r.workload,
        friendliness: r.friendliness,
        teaching_method: r.teaching_method,
        grading_severity: r.grading_severity,
        total_rating: r.total_rating,
        comment: r.comment
      }));

      const prompt = `Tu es Satoshi, un étudiant cool qui résume les avis sur ce professeur. 

Voici les avis : ${JSON.stringify(reviewsSummary)}

Fais un résumé direct et naturel en 3-5 phrases max. Ton détendu, fun, mais constructif. 
IMPORTANT : Commence DIRECTEMENT par le contenu (ex: "Alors voilà le topo..."), PAS par "Salut".`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setAntoninSummary(result);
    } catch (error) {
      console.error("Error generating summary:", error);
      setAntoninSummary("Oups, Satoshi a un petit bug. Réessaye plus tard !");
    } finally {
      setLoadingAntonin(false);
    }
  };

  useEffect(() => {
    if (!loading && !teacher) {
      window.location.href = "/";
    }
  }, [loading, teacher]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-blue-50 flex items-center justify-center">
        <GradientSpinner size="w-12 h-12" />
      </div>);

  }

  if (!teacher) return null;

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowAddReview(true);
  };

  const canModerate = user && (user.role === 'admin' || user.role === 'moderator');

  const hasRating = teacher.review_count > 0 && teacher.average_rating !== undefined && teacher.average_rating !== null && teacher.average_rating > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-blue-50">
      <MobileHeader 
        title={teacher?.name || 'Professeur'} 
        subtitle={teacher?.subject}
        onBack={() => {
          if (school) {
            navigate(createPageUrl(`SchoolDetail?id=${school.id}`));
          } else {
            navigate(createPageUrl("Schools"));
          }
        }}
      />
      {teacher &&
      <SEO
        title={`${teacher.name} - Avis Professeur ${teacher.subject} | ScoolAdvisor`}
        description={`Lisez les avis des élèves sur ${teacher.name}, professeur de ${teacher.subject} ${school ? `à ${school.name}` : ''}. Charge de travail, pédagogie et ambiance.`}
        canonicalPath={`/teachers/${teacher.id}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Person",
          "name": teacher.name,
          "jobTitle": `Professeur de ${teacher.subject}`,
          "worksFor": school ? {
            "@type": "EducationalOrganization",
            "name": school.name
          } : undefined,
          "aggregateRating": teacher.average_rating && teacher.review_count > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": teacher.average_rating,
            "bestRating": "20",
            "reviewCount": teacher.review_count
          } : undefined
        }}
      />

      }
      <style>{`
        @keyframes shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes badge-shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(400%) rotate(45deg); }
        }
        
        .animate-shine {
          animation: shine 4s ease-in-out infinite;
        }
        
        .note-widget {
          position: relative;
          overflow: hidden;
        }
        
        .note-widget::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 50%;
          height: 200%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.5),
            transparent
          );
          animation: badge-shimmer 3s infinite;
          pointer-events: none;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-shine, .note-widget::before {
            animation: none;
            background-position: 0 0;
          }
        }
      `}</style>
      
      <div className="max-w-6xl mx-auto px-0 lg:px-4 py-4 pb-0 lg:pb-4">
        <Button
          variant="ghost"
          onClick={() => {
            if (school) {
              navigate(createPageUrl(`SchoolDetail?id=${school.id}`));
            } else {
              navigate(createPageUrl("Schools"));
            }
          }}
          className="mb-2 mx-4 lg:mx-0">

          <ChevronLeft className="w-4 h-4 mr-2" />
          {school ? `Retour à ${school.name}` : "Retour aux établissements"}
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8 mx-4 lg:mx-0">

          <div className="relative p-4 sm:p-8">
            <div className="hidden sm:block absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-[#FF4D8D]/10 via-purple-500/10 to-blue-500/5 rounded-bl-full" />
            
            <div className="relative">
              <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start mb-6">
                <div className="flex gap-3 sm:gap-6 items-start flex-1 w-full">
                  <div className="relative">
                    <Avatar className="w-20 h-20 sm:w-32 sm:h-32 border-4 border-white shadow-lg flex-shrink-0">
                      <AvatarImage src={teacher.photo_url} loading="lazy" />
                      <AvatarFallback className="bg-gradient-to-br from-[#FF4D8D] to-blue-500 text-white text-2xl sm:text-4xl font-semibold">
                        {teacher.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {teacher.is_former && (
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md border-2 border-white z-10">
                        Ancien
                      </div>
                    )}

                  </div>
                  
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 break-words">{teacher.name}</h1>
                        {user && (
                          <ReportTeacherButton teacher={teacher} onUpdate={loadData} variant="flag" />
                        )}
                        {user && user.role === 'admin' && (
                          <TeacherAdminMenu teacher={teacher} user={user} onUpdate={loadData} />
                        )}
                      </div>
                    <div className="flex items-center gap-2 text-sm sm:text-base text-slate-600">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="break-words">{teacher.subject}</span>
                    </div>
                  </div>
                </div>

                {hasRating ?
                <motion.div
                  key={teacher.average_rating}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200 w-full sm:w-auto note-widget"
                  style={{ boxShadow: '0 0 12px rgba(168,85,247,0.15)' }}>

                    <div className="relative z-10 flex sm:hidden items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap">
                      <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                      <span className="text-lg font-bold text-amber-900">{teacher.average_rating.toFixed(1)}</span>
                      <span className="text-xs text-amber-700">/ 20</span>
                      <span className="text-xs text-amber-600 ml-1">•</span>
                      <span className="text-sm font-semibold text-amber-800">{teacher.review_count} avis</span>
                    </div>
                    
                    <div className="relative z-10 hidden sm:block text-center p-4 min-w-[120px]">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                        <span className="text-3xl font-bold text-amber-900" style={{ textShadow: '0 0 8px rgba(168,85,247,0.3)' }}>
                          {teacher.average_rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-amber-700">sur 20</p>
                      <p className="text-xs text-amber-600 mt-0.5">{teacher.review_count} avis</p>
                    </div>
                  </motion.div> :

                <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border-2 border-slate-200 text-center min-w-[100px] sm:min-w-[120px] w-full sm:w-auto">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-600">Pas encore noté</p>
                  </div>
                }
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-4">
                <Button
                  onClick={() => {
                    setShowAddReview(true);
                    setEditingReview(null);
                  }} 
                  className="flex-1 sm:flex-none bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md h-11 px-6 rounded-xl font-medium"
                  size="default">
                  <Star className="w-5 h-5 mr-2" />
                  Noter ce professeur
                </Button>

                <Button
                  onClick={handleAskAntonin}
                  variant="outline"
                  className="flex-1 sm:flex-none border-2 border-pink-100 hover:bg-pink-50 hover:border-pink-200 text-slate-700 h-11 px-4 rounded-xl font-medium bg-white/50">
                  <Sparkles className="w-4 h-4 mr-2 text-[#FF4D8D]" />
                  <span className="hidden sm:inline bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent font-bold">
                    Demander à Satoshi ce qu'il en pense
                  </span>
                  <span className="sm:hidden bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent font-bold">
                    Avis de Satoshi
                  </span>
                </Button>


              </div>
              
              {!user &&
              <p className="text-xs sm:text-sm text-slate-600 mt-3">
                  📌 Connectez-vous pour noter ce professeur et accéder à toutes les fonctionnalités.
                </p>
              }
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:hidden gap-6 sm:gap-8 mx-4 lg:mx-0">
          <Suspense fallback={<div className="p-4 bg-white rounded-lg shadow-md flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
            <TeacherStats teacher={teacher} />
          </Suspense>
          
          <div className="h-[360px]">
            <Suspense fallback={<div className="p-4 bg-white rounded-lg shadow-md flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
              <TeacherReviewsList
                teacherId={teacherId}
                user={user}
                onReload={loadData}
                onEditReview={handleEditReview} />
            </Suspense>
          </div>
        </div>

        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

            <div className="grid grid-cols-3 divide-x divide-slate-100 h-[360px]">
              <div className="col-span-2 h-full overflow-hidden">
                <Suspense fallback={<div className="flex justify-center items-center h-full min-h-[300px]"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
                  <TeacherReviewsList
                    teacherId={teacherId}
                    user={user}
                    onReload={loadData}
                    onEditReview={handleEditReview}
                    embedded={true} />

                </Suspense>
              </div>

              <div className="bg-slate-50/50 h-full overflow-hidden">
                <Suspense fallback={<div className="flex justify-center items-center h-full min-h-[300px]"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
                  <TeacherStats teacher={teacher} embedded={true} />
                </Suspense>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
      
      <div className="w-full mt-8 lg:mt-8 lg:max-w-6xl lg:mx-auto lg:px-4">
        <TeacherLoveNotes teacherId={teacherId} user={user} />
      </div>

      <Suspense>
        <AddTeacherReviewDialog
          open={showAddReview}
          onOpenChange={(open) => {
            setShowAddReview(open);
            if (!open) setEditingReview(null);
          }}
          teacherId={teacherId}
          existingReview={editingReview}
          setExistingReview={setEditingReview}
          onSuccess={loadData} />

      </Suspense>

      <Dialog open={showAntoninSummary} onOpenChange={setShowAntoninSummary}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-2xl">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF4D8D]" />
              <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
                L'avis de Satoshi
              </span>
              <span className="text-slate-900">sur {teacher.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 sm:py-6">
            {loadingAntonin ?
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <GradientSpinner size="w-10 h-10 sm:w-12 sm:h-12" className="mb-4" />
                <p className="text-slate-600 text-sm sm:text-base">Satoshi 🤖 analyse les avis...</p>
              </div> :

            <div className="prose prose-slate max-w-none prose-sm sm:prose-base">
                <div className="bg-gradient-to-r from-pink-50 via-purple-50/50 to-blue-50 rounded-lg p-4 sm:p-6 border-2 border-pink-100">
                  <p className="text-slate-800 leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
                    {antoninSummary}
                  </p>
                </div>
              </div>
            }
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}