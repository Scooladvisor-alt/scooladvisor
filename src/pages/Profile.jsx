import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Mail,
  Shield,
  MessageSquare,
  Star,
  ChevronLeft,
  BookOpen,
  School as SchoolIcon,
  TrendingUp,
  Users,
  Edit,
  Heart,
  Brain,
  FileText } from
"lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import GradientSpinner from "@/components/shared/GradientSpinner";

const getAvatarUrl = (avatar) => {
  const avatarUrls = {
    avatar1: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d8ad15814_a-humanized-black-graduation-cap-with-a-star-shape.png",
    avatar2: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/639510ec4_a-humanized-black-graduation-cap-with-a-star-shape-2.png",
    avatar3: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png",
    avatar4: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/cd2a7b336_a-humanized-black-graduation-cap-with-a-star-shape-4.png",
    avatar5: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5e2f6487e_a-humanized-black-graduation-cap-with-a-star-shape-5.png"
  };
  // Default to avatar3 (yellow) if avatar is 'letter' or undefined
  if (!avatar || avatar === 'letter') {
    return avatarUrls.avatar3;
  }
  return avatarUrls[avatar] || avatarUrls.avatar3;
};

function AvatarSelectionDialog({ open, onOpenChange, currentAvatar, onAvatarSelected, userInitial }) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar && currentAvatar !== 'letter' ? currentAvatar : 'avatar3');

  const avatars = [
  { id: 'avatar1', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d8ad15814_a-humanized-black-graduation-cap-with-a-star-shape.png", name: "Avatar Bleu" },
  { id: 'avatar2', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/639510ec4_a-humanized-black-graduation-cap-with-a-star-shape-2.png", name: "Avatar Violet" },
  { id: 'avatar3', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png", name: "Avatar Jaune" },
  { id: 'avatar4', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/cd2a7b336_a-humanized-black-graduation-cap-with-a-star-shape-4.png", name: "Avatar Vert" },
  { id: 'avatar5', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5e2f6487e_a-humanized-black-graduation-cap-with-a-star-shape-5.png", name: "Avatar Cyan" }];


  const handleSave = () => {
    onAvatarSelected(selectedAvatar);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b rounded-t-3xl">
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Choisir mon avatar
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 py-3 sm:py-4">
          {avatars.map((avatar) =>
          <button
            key={avatar.id}
            onClick={() => setSelectedAvatar(avatar.id)}
            className={`relative p-2 sm:p-4 rounded-xl border-2 transition-all hover:scale-105 ${
            selectedAvatar === avatar.id ?
            'border-[#FF4D8D] bg-pink-50 shadow-lg' :
            'border-slate-200 bg-white hover:border-pink-300'}`
            }>

              {avatar.url ?
            <img
              src={avatar.url}
              alt={avatar.name}
              className="w-full h-20 sm:h-32 object-contain rounded-lg" /> :


            <div className="w-full h-20 sm:h-32 flex items-center justify-center bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-[#4DA6FF] rounded-lg">
                  <span className="text-4xl sm:text-6xl font-bold text-white">{userInitial}</span>
                </div>
            }
              <p className="text-xs sm:text-sm font-medium text-center mt-1 sm:mt-2 text-slate-900">{avatar.name}</p>
              {selectedAvatar === avatar.id &&
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-[#4DA6FF] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
            }
            </button>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm">
            Annuler
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-[#4DA6FF] text-white text-xs sm:text-sm">
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teacherReviews, setTeacherReviews] = useState([]);
  const [schoolReviews, setSchoolReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [visibleTeacherReviews, setVisibleTeacherReviews] = useState(5);
  const [visibleSchoolReviews, setVisibleSchoolReviews] = useState(5);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      await loadUserReviews(currentUser.email);
    } catch (error) {
      navigate(createPageUrl("Schools"));
    }
    setLoading(false);
  };

  const loadUserReviews = async (userEmail) => {
    setReviewsLoading(true);
    try {
      // Charger TOUS les avis publiés ET tous les profs/écoles en parallèle
      const [allTeacherReviewsRaw, allSchoolReviewsRaw, allTeachers, allSchools] = await Promise.all([
        base44.entities.TeacherReview.filter({ status: "published" }, "-created_date"),
        base44.entities.SchoolReview.filter({ status: "published" }, "-created_date"),
        base44.entities.Teacher.list(),
        base44.entities.School.list()
      ]);
      
      // Filtrer côté client par email exact de l'utilisateur
      const userTeacherReviews = allTeacherReviewsRaw.filter(r => r.created_by === userEmail);
      const userSchoolReviews = allSchoolReviewsRaw.filter(r => r.created_by === userEmail);

      // Créer des maps pour accès rapide
      const teachersMap = new Map(allTeachers.map((t) => [t.id, t]));
      const schoolsMap = new Map(allSchools.map((s) => [s.id, s]));

      // Enrichir les avis professeurs avec les infos prof et école
      const enrichedTeacherReviews = userTeacherReviews
        .map((review) => {
          const teacher = teachersMap.get(review.teacher_id);
          const school = teacher ? schoolsMap.get(teacher.school_id) : null;
          return { ...review, teacher, school };
        })
        .filter((r) => r.teacher);

      // Enrichir les avis établissements avec les infos école
      // Récupérer les écoles manquantes individuellement si nécessaire
      const enrichedSchoolReviews = await Promise.all(
        userSchoolReviews.map(async (review) => {
          let school = schoolsMap.get(review.school_id);
          
          // Si l'école n'est pas dans la map, essayer de la récupérer directement
          if (!school && review.school_id) {
            try {
              const [fetchedSchool] = await base44.entities.School.filter({ id: review.school_id });
              if (fetchedSchool) {
                school = fetchedSchool;
              }
            } catch (e) {
              console.error("Erreur récupération école:", e);
            }
          }
          
          return { 
            ...review, 
            school: school || { id: review.school_id, name: "École non trouvée" } 
          };
        })
      );

      setTeacherReviews(enrichedTeacherReviews);
      setSchoolReviews(enrichedSchoolReviews);
    } catch (error) {
      console.error("Error loading user reviews:", error);
      setTeacherReviews([]);
      setSchoolReviews([]);
    }
    setReviewsLoading(false);
  };

  const handleAvatarSelected = async (avatarId) => {
    try {
      await base44.auth.updateMe({
        profile_avatar: avatarId
      });

      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      toast.success("Avatar mis à jour !");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de l'avatar.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <GradientSpinner size="w-16 h-16" className="mx-auto mb-4" />
          <p className="text-slate-600">Chargement du profil...</p>
        </div>
      </div>);

  }

  if (!user) {
    return null;
  }

  const totalReviews = teacherReviews.length + schoolReviews.length;
  const avatarUrl = user.profile_avatar && user.profile_avatar !== 'letter' ? getAvatarUrl(user.profile_avatar) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <style>{`
        @keyframes rotating-shine {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(251, 191, 36, 0.3); }
          50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.6); }
        }
        
        .rotating-shine-widget {
          position: relative;
          overflow: hidden;
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
            rgba(255, 255, 255, 0.8) 30deg,
            transparent 60deg
          );
          animation: rotating-shine 3s linear infinite;
          pointer-events: none;
        }
        
        .rotating-shine-widget::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          animation: pulse-glow 2s ease-in-out infinite;
          pointer-events: none;
        }
        
        .reviews-scroll::-webkit-scrollbar {
          width: 6px;
        }
        
        .reviews-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        .reviews-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        
        .reviews-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Schools"))}
          className="mb-6">

          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-slate-200 mb-8 relative z-10">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="tracking-tight text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-[#4DA6FF] bg-clip-text text-transparent">Mon Profil

              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start">
                <div className="flex flex-col items-center gap-4 relative">
                  <div className="relative group cursor-pointer" onClick={() => setShowAvatarDialog(true)}>
                    <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-blue-100 shadow-lg">
                      {avatarUrl ?
                      <AvatarImage src={avatarUrl} /> :
                      null}
                      <AvatarFallback className="bg-transparent">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png" alt="Avatar" className="w-full h-full object-cover" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="absolute bottom-2 right-2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center group-hover:bg-black/80 transition-colors shadow-lg">
                      <Edit className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 w-full text-center sm:text-left">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                      {user.full_name}
                    </h2>
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600 mb-3">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-sm">
                        {user.role === 'admin' ? 'Administrateur' : user.role === 'moderator' ? 'Modérateur' : 'Étudiant'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-slate-200 relative z-10">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <TrendingUp className="w-6 h-6 text-[#FF4D8D]" />
                Mes avis ({totalReviews})
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              {reviewsLoading ?
              <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#FF4D8D] border-t-transparent rounded-full animate-spin" />
                </div> :
              totalReviews === 0 ?
              <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Tu n'as pas encore laissé d'avis !</h3>
                  <p className="text-slate-600 mb-6">Va partager ton expérience sur un prof ou ton établissement.</p>
                  <Button onClick={() => navigate(createPageUrl("Schools"))} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-to-r from-pink-500 to-blue-500 text-white hover:opacity-90 h-10 px-4 py-2">
                    Découvrir les établissements
                  </Button>
                </div> :

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Colonne gauche : Avis professeurs */}
                  <div className="flex flex-col">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center justify-between gap-2 bg-white/90 backdrop-blur-sm py-2 sticky top-0 z-10 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF4D8D]" />
                        <span className="text-sm sm:text-base">Mes professeurs ({teacherReviews.length})</span>
                      </div>
                    </h3>
                    <div className={`space-y-3 overflow-y-auto pr-2 reviews-scroll ${teacherReviews.length > 0 ? 'h-[400px] sm:h-[500px]' : 'h-auto'}`}>
                      {teacherReviews.length > 0 ?
                    <>
                      {teacherReviews.slice(0, visibleTeacherReviews).map((review) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-2 border-slate-200 rounded-xl p-3 sm:p-4 hover:border-pink-300 hover:shadow-lg transition-all bg-white relative group"
                        >
                          <div className="flex flex-col gap-2 sm:gap-3">
                            {/* Header Info */}
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                              <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 min-w-0 w-full">
                                {/* School Link */}
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(createPageUrl(`SchoolDetail?id=${review.school?.id}`));
                                  }}
                                  className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer w-fit"
                                >
                                  <SchoolIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide truncate">
                                    {review.school?.name}
                                  </span>
                                </div>

                                {/* Teacher Link */}
                                <h4 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(createPageUrl(`TeacherDetail?id=${review.teacher?.id}`));
                                  }}
                                  className="text-base sm:text-lg font-bold text-slate-900 hover:text-[#FF4D8D] transition-colors cursor-pointer truncate w-fit"
                                >
                                  {review.teacher?.name}
                                </h4>

                                {/* Subject Badge */}
                                <Badge 
                                  variant="secondary" 
                                  className="w-fit text-[10px] sm:text-xs font-medium bg-purple-50 text-purple-700 border-purple-100"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {review.teacher?.subject || "Matière non renseignée"}
                                </Badge>
                              </div>

                              {/* Rating Widget */}
                              <div className="flex-shrink-0 bg-gradient-to-br from-amber-50 to-amber-100 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-amber-200 flex items-center gap-0.5 sm:gap-1 shadow-sm self-start sm:self-auto">
                                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 fill-amber-600" />
                                <span className="text-sm sm:text-base font-bold text-amber-900">
                                  {review.total_rating?.toFixed(1)}
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-amber-700 font-medium">/20</span>
                              </div>
                            </div>

                            {/* Criteria Grid */}
                            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-xs bg-slate-50 p-1.5 sm:p-2 rounded-lg">
                              <div className="flex flex-col items-center text-center gap-0.5">
                                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase">Charge</span>
                                <span className="text-xs sm:text-sm font-bold text-blue-600">{review.workload}/5</span>
                              </div>
                              <div className="flex flex-col items-center text-center gap-0.5">
                                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase">Amabilité</span>
                                <span className="text-xs sm:text-sm font-bold text-pink-600">{review.friendliness}/5</span>
                              </div>
                              <div className="flex flex-col items-center text-center gap-0.5">
                                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase">Pédago</span>
                                <span className="text-xs sm:text-sm font-bold text-purple-600">{review.teaching_method}/5</span>
                              </div>
                              <div className="flex flex-col items-center text-center gap-0.5">
                                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase">Notation</span>
                                <span className="text-xs sm:text-sm font-bold text-orange-600">{review.grading_severity}/5</span>
                              </div>
                            </div>

                            {/* Review Content */}
                            <div className="bg-white rounded-lg">
                              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic relative pl-2 sm:pl-3 border-l-2 border-pink-200">
                                "{review.comment}"
                              </p>
                            </div>

                            {/* Footer Date */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] sm:text-xs text-slate-400 pt-1.5 sm:pt-2 border-t border-slate-100 mt-1 gap-1 sm:gap-0">
                              <span>Publié le {format(new Date(review.created_date), "d MMM yyyy", { locale: fr })}</span>
                              {review.edit_count > 0 && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px]">
                                  Modifié {review.edit_count} fois
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {visibleTeacherReviews < teacherReviews.length && (
                        <button
                          onClick={() => setVisibleTeacherReviews(prev => prev + 5)}
                          className="w-full py-3 text-sm font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors border border-dashed border-purple-200 mt-2"
                        >
                          Voir plus de professeurs...
                        </button>
                      )}
                    </> :

                    <div className="text-center py-6 sm:py-8 px-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border-2 border-dashed border-pink-200">
                          <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-pink-300" />
                          <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-1">Tu n'as pas encore noté de prof !</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-4">Va sur un établissement pour noter ton premier professeur 🎓</p>
                          <Button
                            size="sm"
                            onClick={() => navigate(createPageUrl("Schools"))}
                            className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white text-xs h-8"
                          >
                            <Star className="w-3 h-3 mr-1.5" />
                            Noter mon premier prof
                          </Button>
                        </div>
                    }
                    </div>
                  </div>

                  {/* Colonne droite : Avis établissements */}
                  <div className="flex flex-col">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm py-2 sticky top-0 z-10 border-b border-slate-100">
                      <SchoolIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      <span className="text-sm sm:text-base">Mes établissements ({schoolReviews.length})</span>
                    </h3>
                    <div className={`space-y-3 overflow-y-auto pr-2 reviews-scroll ${schoolReviews.length > 0 ? 'h-[400px] sm:h-[500px]' : 'h-auto'}`}>
                      {schoolReviews.length > 0 ?
                    <>
                      {schoolReviews.slice(0, visibleSchoolReviews).map((review) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-2 border-slate-200 rounded-xl p-3 sm:p-4 hover:border-blue-300 hover:shadow-lg transition-all bg-white group"
                        >
                          <div className="flex flex-col gap-2 sm:gap-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
                              <div className="flex-1 min-w-0 w-full">
                                {/* School Link */}
                                <h4 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(createPageUrl(`SchoolDetail?id=${review.school?.id}`));
                                  }}
                                  className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate w-fit mb-1"
                                >
                                  {review.school?.name}
                                </h4>
                                
                                {/* School Type Badge if available */}
                                {review.school?.type && (
                                  <Badge variant="outline" className="text-[9px] sm:text-[10px] bg-blue-50 text-blue-700 border-blue-100 capitalize">
                                    {review.school.type.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Rating Widget */}
                              <div className="flex-shrink-0 bg-gradient-to-br from-amber-50 to-amber-100 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-amber-200 flex items-center gap-0.5 sm:gap-1 shadow-sm self-start sm:self-auto">
                                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 fill-amber-600" />
                                <span className="text-sm sm:text-base font-bold text-amber-900">
                                  {review.rating?.toFixed(1)}
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-amber-700 font-medium">/20</span>
                              </div>
                            </div>

                            {/* Review Content */}
                            <div className="bg-white rounded-lg">
                              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic relative pl-2 sm:pl-3 border-l-2 border-blue-200">
                                "{review.comment}"
                              </p>
                            </div>

                            {/* Footer Date */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] sm:text-xs text-slate-400 pt-1.5 sm:pt-2 border-t border-slate-100 mt-1 gap-1 sm:gap-0">
                              <span>Publié le {format(new Date(review.created_date), "d MMM yyyy", { locale: fr })}</span>
                              {review.edit_count > 0 && (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px]">
                                  Modifié {review.edit_count} fois
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {visibleSchoolReviews < schoolReviews.length && (
                        <button
                          onClick={() => setVisibleSchoolReviews(prev => prev + 5)}
                          className="w-full py-3 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors border border-dashed border-blue-200 mt-2"
                        >
                          Voir plus d'établissements...
                        </button>
                      )}
                    </> :

                    <div className="text-center py-6 sm:py-8 px-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-200">
                          <SchoolIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-blue-300" />
                          <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-1">Tu n'as pas encore noté d'établissement !</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-4">Partage ton expérience sur ton école 🏫</p>
                          <Button
                            size="sm"
                            onClick={() => navigate(createPageUrl("Schools"))}
                            className="bg-gradient-to-r from-blue-500 via-purple-500 to-[#FF4D8D] hover:from-blue-500/90 hover:via-purple-500/90 hover:to-[#FF4D8D]/90 text-white text-xs h-8"
                          >
                            <Star className="w-3 h-3 mr-1.5" />
                            Noter mon premier établissement
                          </Button>
                        </div>
                    }
                    </div>
                  </div>
                </div>
              }
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AvatarSelectionDialog
        open={showAvatarDialog}
        onOpenChange={setShowAvatarDialog}
        currentAvatar={user.profile_avatar}
        onAvatarSelected={handleAvatarSelected}
        userInitial={user.full_name?.charAt(0) || 'U'} />

    </div>);

}