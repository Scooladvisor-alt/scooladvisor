import React, { useState, useEffect, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Star,
  BookOpen,
  ChevronLeft,
  Trash2,
  Loader2,
  Sparkles,
  Users } from
"lucide-react";
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
import SEO from "@/components/shared/SEO";
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

  const handleDeleteTeacher = async () => {
    const canDelete = user && user.email === 'antownin@gmail.com';
    if (!canDelete) {
      toast.error("Action non autorisée.");
      return;
    }
    if (confirm("Êtes-vous sûr de vouloir supprimer ce professeur ? Cette action est irréversible.")) {
      try {
        await base44.entities.Teacher.delete(teacherId);
        toast.success("Professeur supprimé avec succès.");
        if (school) {
          navigate(createPageUrl(`SchoolDetail?id=${school.id}`));
        } else {
          navigate(createPageUrl("Schools"));
        }
      } catch (error) {
        toast.error("Erreur lors de la suppression du professeur.");
      }
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

      const prompt = `Tu es un étudiant cool qui résume les avis sur ce professeur. 

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
      setAntoninSummary("Oups, j'ai un petit bug. Réessaye plus tard !");
    } finally {
      setLoadingAntonin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>);

  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-blue-200 p-8 text-center">

            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Professeur non trouvé
            </h2>
            
            <p className="text-slate-600 mb-6">
              Ce profil n'existe pas ou a été supprimé.
            </p>
            
            <Button
              onClick={() => navigate(-1)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">

              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </motion.div>
        </div>
      </div>);

  }

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowAddReview(true);
  };

  const canModerate = user && (user.role === 'admin' || user.role === 'moderator');
  const isAntonin = user && user.email === 'antownin@gmail.com';
  const hasRating = teacher.average_rating !== undefined && teacher.average_rating !== null && teacher.average_rating > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      {teacher && (
        <SEO 
          title={`${teacher.name} - Avis Professeur ${teacher.subject} | ScoolAdvisor`}
          description={`Lisez les avis des élèves sur ${teacher.name}, professeur de ${teacher.subject} ${school ? `à ${school.name}` : ''}. Charge de travail, pédagogie et ambiance.`}
          canonicalPath={`/TeacherDetail?id=${teacher.id}`}
        />
      )}
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
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => {
            if (school) {
              navigate(createPageUrl(`SchoolDetail?id=${school.id}`));
            } else {
              navigate(createPageUrl("Schools"));
            }
          }}
          className="mb-6">

          <ChevronLeft className="w-4 h-4 mr-2" />
          {school ? `Retour à ${school.name}` : "Retour aux établissements"}
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">

          <div className="relative p-4 sm:p-8">
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
            
            <div className="relative">
              <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start mb-6">
                <div className="flex gap-3 sm:gap-6 items-start flex-1 w-full">
                  <div className="relative">
                    <Avatar className="w-20 h-20 sm:w-32 sm:h-32 border-4 border-white shadow-lg flex-shrink-0">
                      <AvatarImage src={teacher.photo_url} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-2xl sm:text-4xl font-semibold">
                        {teacher.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {isAntonin &&
                    <Button
                      onClick={handleDeleteTeacher}
                      variant="ghost"
                      size="icon"
                      className="absolute -top-1 -right-1 h-7 w-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-full shadow-md">

                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    }
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2 break-words">{teacher.name}</h1>
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

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                <Button
                  onClick={() => {
                    if (!user) {
                      base44.auth.redirectToLogin(window.location.href);
                      return;
                    }
                    setShowAddReview(true);
                    setEditingReview(null);
                  }} className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground shadow hover:bg-primary/90 h-8 rounded-md px-3 text-xs bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white w-full sm:w-auto"

                  size="sm">

                  <Star className="w-4 h-4 mr-2" />
                  Noter ce professeur
                </Button>

                {user &&
                <ReportTeacherButton teacher={teacher} onUpdate={loadData} />
                }

                {canModerate &&
                <Button
                  onClick={handleDeleteTeacher}
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto">

                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer le profil
                    </Button>
                }

                <Button
                  onClick={handleAskAntonin}
                  variant="outline"
                  size="sm" className="">


                  <Sparkles className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Demander à Antonin 🤖 ce qu'il en pense</span>
                  <span className="sm:hidden">Avis d'Antonin 🤖</span>
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

        <div className="flex flex-col lg:hidden gap-6 sm:gap-8">
          <Suspense fallback={<div className="p-4 bg-white rounded-lg shadow-md flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
            <TeacherStats teacher={teacher} />
          </Suspense>
          
          <Suspense fallback={<div className="p-4 bg-white rounded-lg shadow-md flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
            <TeacherReviewsList
              teacherId={teacherId}
              user={user}
              onReload={loadData}
              onEditReview={handleEditReview} />

          </Suspense>
        </div>

        <div className="hidden lg:grid lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          <div className="lg:col-span-2 h-[380px]">
            <Suspense fallback={<div className="p-4 bg-white rounded-lg shadow-md flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
              <TeacherReviewsList
                teacherId={teacherId}
                user={user}
                onReload={loadData}
                onEditReview={handleEditReview} 
              />
            </Suspense>
          </div>

          <div className="h-[380px]">
             <Suspense fallback={<div className="p-4 bg-white rounded-lg shadow-md flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
              <TeacherStats teacher={teacher} />
            </Suspense>
          </div>
        </div>

        <div className="mt-8">
            <TeacherLoveNotes teacherId={teacherId} user={user} />
        </div>
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
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              L&apos;avis d&apos;Antonin 🤖 sur {teacher.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 sm:py-6">
            {loadingAntonin ?
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 animate-spin mb-4" />
                <p className="text-slate-600 text-sm sm:text-base">Antonin 🤖 analyse les avis...</p>
              </div> :

            <div className="prose prose-slate max-w-none prose-sm sm:prose-base">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 sm:p-6 border-2 border-purple-200">
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