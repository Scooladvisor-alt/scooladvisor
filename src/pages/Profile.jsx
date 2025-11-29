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
  Edit } from
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
      // Charger TOUS les avis de l'utilisateur publiés
      const [allTeacherReviews, allSchoolReviews] = await Promise.all([
      base44.entities.TeacherReview.filter({
        created_by: userEmail,
        status: "published"
      }, "-created_date"),
      base44.entities.SchoolReview.filter({
        created_by: userEmail,
        status: "published"
      }, "-created_date")]
      );

      // Récupérer tous les IDs nécessaires
      const teacherIds = [...new Set(allTeacherReviews.map((r) => r.teacher_id).filter(Boolean))];
      const schoolIds = [...new Set(allSchoolReviews.map((r) => r.school_id).filter(Boolean))];

      // Charger tous les profs et écoles en parallèle
      const [teachers, directSchools] = await Promise.all([
      teacherIds.length > 0 ? base44.entities.Teacher.list() : [],
      schoolIds.length > 0 ? base44.entities.School.list() : []]
      );

      // Filtrer pour ne garder que les profs/écoles qui existent dans les IDs
      const relevantTeachers = teachers.filter((t) => teacherIds.includes(t.id));
      const teacherSchoolIds = relevantTeachers.map((t) => t.school_id).filter(Boolean);

      // Charger toutes les écoles nécessaires
      const allSchoolIds = [...new Set([...schoolIds, ...teacherSchoolIds])];
      const allSchools = directSchools.filter((s) => allSchoolIds.includes(s.id));

      // Créer des maps pour accès rapide
      const teachersMap = new Map(relevantTeachers.map((t) => [t.id, t]));
      const schoolsMap = new Map(allSchools.map((s) => [s.id, s]));

      // Enrichir et filtrer les avis professeurs
      const validTeacherReviews = allTeacherReviews.
      map((review) => {
        const teacher = teachersMap.get(review.teacher_id);
        const school = teacher ? schoolsMap.get(teacher.school_id) : null;
        return {
          ...review,
          teacher,
          school
        };
      }).
      filter((review) => review.teacher && review.school);

      // Enrichir et filtrer les avis établissements
      const validSchoolReviews = allSchoolReviews.
      map((review) => ({
        ...review,
        school: schoolsMap.get(review.school_id)
      })).
      filter((review) => review.school);

      setTeacherReviews(validTeacherReviews);
      setSchoolReviews(validSchoolReviews);
    } catch (error) {
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

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-slate-200 mb-8">
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
                      <AvatarFallback className="bg-gradient-to-br from-[#FF4D8D] via-purple-500 to-[#4DA6FF] text-white text-5xl sm:text-6xl font-bold">
                        {user.full_name?.charAt(0) || 'U'}
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

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-slate-200">
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
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Tu n'as pas encore laissé d'avis ! 🎤</h3>
                  <p className="text-slate-600 mb-6">Va partager ton expérience sur un prof ou ton établissement.</p>
                  <Button onClick={() => navigate(createPageUrl("Schools"))} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-to-r from-pink-500 to-blue-500 text-white hover:opacity-90 h-10 px-4 py-2">
                    Découvrir les établissements
                  </Button>
                </div> :

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Colonne gauche : Avis professeurs */}
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm py-2 sticky top-0 z-10 border-b border-slate-100">
                      <Users className="w-5 h-5 text-[#FF4D8D]" />
                      Avis professeurs ({teacherReviews.length})
                    </h3>
                    <div className="space-y-3 overflow-y-auto pr-2 reviews-scroll" style={{ maxHeight: '600px' }}>
                      {teacherReviews.length > 0 ?
                    teacherReviews.map((review) =>
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-2 border-slate-200 rounded-xl p-4 hover:border-pink-300 hover:shadow-lg transition-all cursor-pointer bg-white"
                      onClick={() => navigate(createPageUrl(`TeacherDetail?id=${review.teacher_id}`))}>

                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-base mb-2">
                                  {review.teacher.name}
                                </h4>
                                <div className="flex flex-col gap-1.5">
                                  <Badge variant="outline" className="text-xs w-fit">
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    {review.teacher.subject}
                                  </Badge>
                                  <span className="text-xs text-slate-600 flex items-center gap-1">
                                    <SchoolIcon className="w-3 h-3" />
                                    {review.school.name}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="rotating-shine-widget bg-gradient-to-br from-amber-50 to-amber-100 px-3 py-2 rounded-lg border-2 border-amber-200 flex-shrink-0">
                                <div className="relative z-10 flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                                  <span className="text-base font-bold text-amber-900">
                                    {review.total_rating?.toFixed(1)}
                                  </span>
                                  <span className="text-xs text-amber-700">/20</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-sm text-slate-700 leading-relaxed mb-3">
                              {review.comment}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>📅 {format(new Date(review.created_date), "d MMMM yyyy", { locale: fr })}</span>
                              {review.edit_count > 0 &&
                        <Badge variant="outline" className="text-[10px]">
                                  Modifié {review.edit_count}×
                                </Badge>
                        }
                            </div>
                          </motion.div>
                    ) :

                    <div className="text-center py-12 text-slate-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="text-sm">Aucun avis professeur</p>
                        </div>
                    }
                    </div>
                  </div>

                  {/* Colonne droite : Avis établissements */}
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm py-2 sticky top-0 z-10 border-b border-slate-100">
                      <SchoolIcon className="w-5 h-5 text-blue-600" />
                      Avis établissements ({schoolReviews.length})
                    </h3>
                    <div className="space-y-3 overflow-y-auto pr-2 reviews-scroll" style={{ maxHeight: '600px' }}>
                      {schoolReviews.length > 0 ?
                    schoolReviews.map((review) =>
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-2 border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer bg-white"
                      onClick={() => navigate(createPageUrl(`SchoolDetail?id=${review.school_id}`))}>

                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-base mb-2">
                                  {review.school.name}
                                </h4>
                              </div>
                              
                              <div className="rotating-shine-widget bg-gradient-to-br from-amber-50 to-amber-100 px-3 py-2 rounded-lg border-2 border-amber-200 flex-shrink-0">
                                <div className="relative z-10 flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                                  <span className="text-base font-bold text-amber-900">
                                    {review.rating?.toFixed(1)}
                                  </span>
                                  <span className="text-xs text-amber-700">/20</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-sm text-slate-700 leading-relaxed mb-3">
                              {review.comment}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>📅 {format(new Date(review.created_date), "d MMMM yyyy", { locale: fr })}</span>
                              {review.edit_count > 0 &&
                        <Badge variant="outline" className="text-[10px]">
                                  Modifié {review.edit_count}×
                                </Badge>
                        }
                            </div>
                          </motion.div>
                    ) :

                    <div className="text-center py-12 text-slate-500">
                          <SchoolIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="text-sm">Aucun avis établissement</p>
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