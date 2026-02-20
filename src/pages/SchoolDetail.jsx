import React, { useState, useEffect, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Users, Star, Plus, ChevronLeft, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileHeader from "../components/mobile/MobileHeader";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

const TeachersList = lazy(() => import("../components/school/TeachersList"));
const SchoolReviews = lazy(() => import("../components/school/SchoolReviews"));
const AddTeacherDialog = lazy(() => import("../components/school/AddTeacherDialog"));
const AddSchoolReviewDialog = lazy(() => import("../components/school/AddSchoolReviewDialog"));
const ReportSchoolDialog = lazy(() => import("../components/school/ReportSchoolDialog"));
const SchoolChat = lazy(() => import("../components/school/SchoolChat"));
import SchoolAdminMenu from "../components/admin/SchoolAdminMenu";
import { toast } from "sonner";
import SEO from "@/components/shared/SEO";
import GradientSpinner from "@/components/shared/GradientSpinner";

export default function SchoolDetailPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const schoolId = urlParams.get('id');

  const [school, setSchool] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const [showReportDialog, setShowReportDialog] = useState(false);

  useEffect(() => {
    if (schoolId) {
      loadData();
      
      const savedTeacher = localStorage.getItem('pending_teacher_submission_school_' + schoolId);
      if (savedTeacher) {
        setShowAddTeacher(true);
      }

      const savedReview = localStorage.getItem('pending_school_review_school_' + schoolId);
      if (savedReview) {
        setShowAddReview(true);
      }
    }
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);

    try {
      const schoolsData = await base44.entities.School.filter({ id: schoolId });
      const foundSchool = schoolsData[0];
      setSchool(foundSchool);


      let currentUser = null;
      try {
        currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    } catch (error) {
      console.error("Error loading school data:", error);
      setSchool(null);
    }
    setLoading(false);
  };

  const refreshSchoolStats = async () => {
    try {
      const [updatedSchool] = await base44.entities.School.filter({ id: schoolId });
      if (updatedSchool) {
        setSchool(updatedSchool);
      }
    } catch (error) {
      console.error("Error refreshing school stats:", error);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowAddReview(true);
  };



  useEffect(() => {
    if (!loading && !school) {
      window.location.href = "/";
    }
  }, [loading, school]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8 flex items-center justify-center">
        <GradientSpinner size="w-12 h-12" />
      </div>);

  }

  if (!school) return null;

  const typeLabels = {
    college: "Collège",
    lycee: "Lycée",
    universite: "Université",
    ecole_privee: "École privée",
    ecole_commerce: "École de commerce",
    ecole_ingenieur: "École d'ingénieurs"
  };

  const typeColors = {
    college: "bg-[#3498DB] text-white border-[#3498DB]",
    lycee: "bg-[#1ABC9C] text-white border-[#1ABC9C]",
    universite: "bg-[#27AE60] text-white border-[#27AE60]",
    ecole_privee: "bg-[#F39C12] text-white border-[#F39C12]",
    ecole_commerce: "bg-[#E74C3C] text-white border-[#E74C3C]",
    ecole_ingenieur: "bg-[#FF6B35] text-white border-[#FF6B35]"
  };

  const hasRating = school.average_rating && school.average_rating > 0;
  const canModerate = user && (user.role === 'admin' || user.role === 'moderator');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <MobileHeader 
        title={school?.name || 'Établissement'} 
        subtitle={school?.city}
        onBack={() => navigate(createPageUrl("Schools"))}
      />
      {school &&
      <SEO
        title={`${school.name} (${school.city}) - Avis et Classement | ScoolAdvisor`}
        description={`Découvrez les avis authentiques des étudiants sur ${school.name} à ${school.city}. Note globale : ${school.average_rating ? school.average_rating.toFixed(1) : 'N/A'}/20.`}
        canonicalPath={`/schools/${school.id}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": school.name,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": school.address,
            "addressLocality": school.city,
            "addressCountry": school.region === "International" ? "" : "FR"
          },
          "aggregateRating": school.average_rating && school.review_count > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": school.average_rating,
            "bestRating": "20",
            "reviewCount": school.review_count
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
        
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.95; }
        }
        
        @keyframes badge-shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(400%) rotate(45deg); }
        }
        
        .animate-shine {
          animation: shine 4s ease-in-out infinite;
        }
        
        .type-badge {
          animation: pulse-soft 3s ease-in-out infinite;
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

        /* Custom scrollbar styles */
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
        
        /* Accessibility: respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-shine, .type-badge, .note-widget::before {
            animation: none;
            background-position: 0 0;
          }
        }
      `}</style>
      
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Schools"))}
          className="mb-2">

          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour aux établissements
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-4">

          <div className="relative p-4 sm:p-6 md:p-8">
            
            <div className="relative">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6 mb-4 md:mb-6">
                <div className="flex-1 w-full">
                  {school.status === 'banned' &&
                      <Badge className="mb-2 bg-red-100 text-red-800 border-red-200 text-xs">
                          Établissement Banni
                        </Badge>
                      }
                  <div className="flex items-center justify-between gap-2 mb-1 md:mb-2">
                    {user && user.role === 'admin' && (
                      <SchoolAdminMenu school={school} user={user} onUpdate={loadData} />
                    )}
                    {user &&
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowReportDialog(true);
                      }}
                      className="md:hidden text-red-500 hover:text-red-700 transition-colors"
                      title="Signaler cet établissement">

                        <Flag className="w-4 h-4" />
                      </button>
                    }
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-600 text-sm sm:text-base">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="font-medium">{school.city}</span>
                    </div>
                    <Badge className={`border-2 text-xs font-semibold shadow-md type-badge ${typeColors[school.type]}`}>
                      {typeLabels[school.type]}
                    </Badge>
                  </div>
                  {user &&
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReportDialog(true);
                    }}
                    className="hidden md:flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors mt-2 text-xs"
                    title="Signaler cet établissement">
                      <Flag className="w-3 h-3" />
                      <span>Signaler</span>
                    </button>
                  }
                </div>

                {hasRating ?
                <motion.div
                  key={school.average_rating}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 text-center w-full sm:w-auto note-widget px-3 py-2 sm:px-4 sm:py-4 sm:min-w-[120px]">

                    
                    <div className="relative z-10 flex sm:hidden items-center justify-center gap-1 whitespace-nowrap">
                      <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                      <span className="text-lg font-bold text-amber-900">{school.average_rating.toFixed(1)}</span>
                      <span className="text-sm text-amber-700">/ 20</span>
                      <span className="text-xs text-amber-600 ml-1">basé sur :</span>
                      <span className="text-sm font-semibold text-amber-800">{school.review_count} avis</span>
                    </div>
                    
                    <div className="relative z-10 hidden sm:block">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                        <span className="text-3xl font-bold text-amber-900" style={{ textShadow: '0 0 8px rgba(168,85,247,0.3)' }}>
                          {school.average_rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-amber-700">sur 20</p>
                      <p className="text-xs text-amber-600 mt-0.5">{school.review_count} avis</p>
                    </div>
                  </motion.div> :

                <div className="bg-slate-50 rounded-lg border border-slate-200 text-center w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-4 sm:min-w-[120px]">
                    <div className="flex sm:hidden items-center justify-center gap-2 whitespace-nowrap">
                      <Star className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">Pas encore noté</span>
                    </div>
                    
                    <div className="hidden sm:block">
                      <Star className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs text-slate-600">Pas encore noté</p>
                    </div>
                  </div>
                }
              </div>



              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setShowAddTeacher(true)}
                  className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-lg w-full sm:flex-1 h-11">
                  <Plus className="w-4 h-4 mr-2 text-white" />
                  Ajouter un professeur
                </Button>

                <Button
                  onClick={() => setShowAddReview(true)}
                  className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-amber-600 text-white shadow-lg w-full sm:flex-1 h-11">
                  <Star className="w-4 h-4 mr-2" />
                  Noter l'établissement
                </Button>
              </div>
              
              {!user &&
              <p className="text-sm text-slate-600 mt-3 text-center">
                  📌 Connecte-toi pour noter et ajouter tes profs.
                </p>
              }
              
              <p className="text-xs text-slate-400 mt-4 text-center">
                📍 {school.address}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-stretch justify-items-center">
          <div className="w-full max-h-[600px] lg:h-[500px] flex flex-col">
            <Suspense fallback={<div className="p-4 bg-white rounded-lg shadow-md flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
              <TeachersList
                schoolId={schoolId}
                onAddTeacher={() => setShowAddTeacher(true)} />

            </Suspense>
          </div>

          <div className="w-full max-h-[600px] lg:h-[500px] flex flex-col">
             <Suspense fallback={<div className="p-4 bg-white rounded-lg shadow-md flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
              <SchoolReviews
                schoolId={schoolId}
                user={user}
                onReload={() => {
                  refreshSchoolStats();
                  loadData();
                }}
                onEditReview={handleEditReview}
                canModerate={canModerate}
                onAddReview={() => setShowAddReview(true)} />


            </Suspense>
          </div>
        </div>

        <Suspense fallback={null}>
          <div className="mt-6">
            <SchoolChat schoolId={schoolId} isHomePage={false} />
          </div>
        </Suspense>
      </div>

      <Suspense>
        <AddTeacherDialog
          open={showAddTeacher}
          onOpenChange={setShowAddTeacher}
          schoolId={schoolId}
          onSuccess={loadData} />


        <AddSchoolReviewDialog
          open={showAddReview}
          onOpenChange={(open) => {
            setShowAddReview(open);
            if (!open) setEditingReview(null);
          }}
          schoolId={schoolId}
          existingReview={editingReview}
          onSuccess={() => {
            refreshSchoolStats();
            loadData();
          }} />


        <ReportSchoolDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          schoolId={schoolId} />

      </Suspense>
    </div>);

}