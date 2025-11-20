import React, { useState, useEffect } from "react";
import { TeacherReview } from "@/entities/TeacherReview";
import { ReviewLike } from "@/entities/ReviewLike";
import { Notification } from "@/entities/Notification";
import { Teacher } from "@/entities/Teacher";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, User as UserIcon, AlertCircle, Edit, ThumbsUp, Loader2, Trash2, ChevronDown, BookOpen, Heart, Brain, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import ReportDialog from "../shared/ReportDialog";
import { toast } from "sonner";

// Helper function pour formater les dates correctement
const formatDateWithTimezone = (dateString, formatStr) => {
  const date = new Date(dateString);
  return format(date, formatStr, { locale: fr });
};

const criteriaIcons = {
  workload: { icon: BookOpen, label: "Charge", color: "text-blue-600" },
  friendliness: { icon: Heart, label: "Amabilité", color: "text-pink-600" },
  teaching_method: { icon: Brain, label: "Enseignement", color: "text-purple-600" },
  grading_severity: { icon: FileText, label: "Notation", color: "text-orange-600" }
};

const getAvatarUrl = (avatar) => {
  const avatarUrls = {
    avatar1: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d8ad15814_a-humanized-black-graduation-cap-with-a-star-shape.png",
    avatar2: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/639510ec4_a-humanized-black-graduation-cap-with-a-star-shape-2.png",
    avatar3: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png",
    avatar4: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/cd2a7b336_a-humanized-black-graduation-cap-with-a-star-shape-4.png",
    avatar5: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5e2f6487e_a-humanized-black-graduation-cap-with-a-star-shape-5.png"
  };
  return avatarUrls[avatar] || "";
};

export default function TeacherReviewsList({ teacherId, user, onReload, onEditReview }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportingReview, setReportingReview] = useState(null);
  const [likingReview, setLikingReview] = useState(null);
  const [localLikes, setLocalLikes] = useState({});
  const [userLikes, setUserLikes] = useState(new Set());
  const [reviewUsers, setReviewUsers] = useState({});
  const [expandedReviews, setExpandedReviews] = useState(new Set());

  useEffect(() => {
    loadReviews();
  }, [teacherId, user]); // Added user to dependencies for correct behavior when user changes

  const loadReviews = async () => {
    setLoading(true);
    const reviewsData = await TeacherReview.filter({ teacher_id: teacherId, status: "published" }, "-created_date");
    setReviews(reviewsData);

    // Charger les infos utilisateurs pour les avis non-anonymes
    const userEmails = [...new Set(reviewsData.filter((r) => !r.is_anonymous).map((r) => r.created_by))];
    const usersData = {};

    for (const email of userEmails) {
      try {
        // Ne charger que pour le user connecté ou skip silencieusement
        if (user && email === user.email) {
          usersData[email] = user;
        }
      } catch (error) {

        // Ignorer silencieusement les erreurs de chargement, as per instructions.
      }}

    setReviewUsers(usersData);
    setLoading(false);
  };

  const updateTeacherStats = async () => {
    const reviews = await TeacherReview.filter({ teacher_id: teacherId, status: "published" });
    const reviewCount = reviews.length;

    if (reviewCount === 0) {
      await Teacher.update(teacherId, {
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
    // The average_rating is the sum of the four criteria averages, consistent with /20 display.
    const average_rating = workload_avg + friendliness_avg + teaching_avg + grading_avg;

    await Teacher.update(teacherId, {
      workload_avg,
      friendliness_avg,
      teaching_avg,
      grading_avg,
      average_rating,
      review_count: reviewCount
    });
  };

  const handleDelete = async (reviewId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.")) return;

    try {
      await TeacherReview.delete(reviewId);
      toast.success("Avis supprimé avec succès.");
      await updateTeacherStats();
      await loadReviews();
      onReload();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Erreur lors de la suppression de l'avis.");
    }
  };

  useEffect(() => {
    if (user) {
      loadUserLikes();
    }
  }, [user, reviews]);

  const loadUserLikes = async () => {
    if (!user) return;
    try {
      const likes = await ReviewLike.filter({
        review_type: "teacher",
        user_email: user.email
      });
      setUserLikes(new Set(likes.map((l) => l.review_id)));
    } catch (error) {
      console.error("Error loading user likes:", error);
    }
  };

  const handleLike = async (review) => {
    if (!user) {
      await base44.auth.redirectToLogin(window.location.href);
      return;
    }

    const reviewId = review.id;
    const isCurrentlyLiked = userLikes.has(reviewId);

    setUserLikes((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });

    setLocalLikes((prev) => ({
      ...prev,
      [reviewId]: (localLikes[reviewId] ?? review.like_count ?? 0) + (isCurrentlyLiked ? -1 : 1)
    }));

    try {
      const existingLikes = await ReviewLike.filter({
        review_type: "teacher",
        review_id: reviewId,
        user_email: user.email
      });

      if (existingLikes.length > 0) {
        await ReviewLike.delete(existingLikes[0].id);
        await TeacherReview.update(reviewId, {
          like_count: Math.max(0, (review.like_count || 0) - 1)
        });
      } else {
        await ReviewLike.create({
          review_type: "teacher",
          review_id: reviewId,
          user_email: user.email
        });
        await TeacherReview.update(reviewId, {
          like_count: (review.like_count || 0) + 1
        });

        if (review.created_by !== user.email) {
          await Notification.create({
            user_email: review.created_by,
            title: "Quelqu'un a aimé votre avis",
            message: `${user.full_name || user.email} a aimé votre avis sur un professeur`,
            type: "like",
            review_id: reviewId,
            is_read: false
          });
        }
      }
    } catch (error) {
      console.error("Error liking review:", error);
      // Revert local state on error
      setUserLikes((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(reviewId);
        } else {
          newSet.delete(reviewId);
        }
        return newSet;
      });
      setLocalLikes((prev) => ({
        ...prev,
        [reviewId]: (localLikes[reviewId] ?? review.like_count ?? 0) - (isCurrentlyLiked ? -1 : 1)
      }));
      toast.error("Erreur lors de l'action J'aime.");
    }
  };

  const getLikeCount = (review) => {
    return localLikes[review.id] !== undefined ? localLikes[review.id] : review.like_count || 0;
  };

  const toggleExpand = (reviewId) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const sortedReviews = [...reviews].sort((a, b) => (getLikeCount(b) || 0) - (getLikeCount(a) || 0));

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg w-full h-full flex flex-col">
        <CardHeader>
          <CardTitle className="font-semibold tracking-tight flex items-center gap-2 text-xl">
            <MessageSquare className="w-6 h-6 text-purple-600" />
            Avis des étudiants 🍿 ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {loading ?
          <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div> :
          sortedReviews.length === 0 ?
          <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600">Aucun avis pour le moment</p>
              <p className="text-sm text-slate-500 mt-2">Soyez le premier à noter ce professeur !</p>
            </div> :

          <div className="space-y-3 sm:space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <style>{`
              .custom-scrollbar::-webkit-scrollbar { width: 6px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
              {sortedReviews.slice(0, 2).map((review, index) => {
              const reviewUser = reviewUsers[review.created_by];
              const userAvatar = reviewUser?.profile_avatar;
              const avatarUrl = userAvatar && userAvatar !== 'letter' ? getAvatarUrl(userAvatar) : null;

              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 sm:p-6 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">

                    <div className="flex flex-col sm:flex-row items-start justify-between mb-2 sm:mb-4 gap-2 sm:gap-3">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 w-full">
                        <Avatar className="w-8 h-8 sm:w-12 sm:h-12 border-2 border-slate-100 flex-shrink-0">
                          {!review.is_anonymous && avatarUrl ?
                        <AvatarImage src={avatarUrl} alt={`Avatar of ${reviewUser?.full_name || 'user'}`} /> :
                        null}
                          <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white">
                            {review.is_anonymous ? <UserIcon className="w-6 h-6" /> : reviewUser?.full_name?.charAt(0).toUpperCase() || review.created_by?.charAt(0).toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 relative">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 text-xs sm:text-base truncate">
                                {review.is_anonymous ? "Étudiant anonyme" : reviewUser?.full_name || review.created_by?.split('@')[0] || "Étudiant"}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-500">
                                {formatDateWithTimezone(review.created_date, "d MMM yyyy")}
                              </p>
                            </div>
                            
                            {/* Note ultra simple - Mobile uniquement */}
                            <div className="flex sm:hidden items-center gap-0.5 bg-gradient-to-br from-amber-50 to-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">
                              <Star className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
                              <span className="text-xs font-bold text-amber-900 leading-none">{(review.total_rating || 0).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Note à droite - Desktop */}
                      <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100 px-4 py-2 rounded-full border border-amber-200">
                        <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                        <span className="font-bold text-amber-900 text-lg">{(review.total_rating || 0).toFixed(1)}</span>
                        <span className="text-sm text-amber-700">/20</span>
                      </div>
                    </div>

                    {review.comment && (
                      <div className="relative bg-slate-50 p-2 sm:p-3 rounded-lg mb-2 sm:mb-3">
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pr-6">
                          {review.comment}
                        </p>
                        <button
                          onClick={() => toggleExpand(review.id)}
                          className="absolute top-2 sm:top-3 right-2 sm:right-3 text-slate-400 hover:text-slate-600 transition-colors"
                          title={expandedReviews.has(review.id) ? "Masquer les détails" : "Voir les détails"}
                        >
                          <ChevronDown 
                            className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${
                              expandedReviews.has(review.id) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    )}

                    {expandedReviews.has(review.id) && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100">
                        <div className="flex gap-2 sm:gap-3 overflow-x-auto mb-2 sm:mb-4">
                          {Object.entries(criteriaIcons).map(([key, { icon: Icon, color }]) => (
                            <div key={key} className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                              <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${color} flex-shrink-0`} />
                              <span className="text-[10px] sm:text-[11px] font-bold text-slate-900">{review[key]}</span>
                              <span className="text-[9px] sm:text-[10px] text-slate-500">/5</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-1 sm:gap-2 pt-2 sm:pt-4 border-t border-slate-100">
                      <div className="flex gap-1 flex-wrap">
                        {user && review.created_by === user.email &&
                      <>
                            <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditReview(review)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 w-6 sm:h-8 sm:w-8">

                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            
                            <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(review.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 sm:h-8 sm:w-8">

                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </>
                      }

                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReportingReview(review)}
                        className="text-[10px] sm:text-xs text-slate-500 hover:text-red-600 h-6 sm:h-auto px-1.5 sm:px-2">

                          <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1" />
                          <span className="hidden sm:inline">Signaler</span>
                        </Button>

                        <Button
                        variant={userLikes.has(review.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleLike(review)}
                        disabled={likingReview === review.id}
                        className={`flex items-center gap-1 sm:gap-2 transition-all h-6 sm:h-auto px-2 sm:px-3 ${
                        userLikes.has(review.id) ?
                        'bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90' :
                        'hover:bg-blue-50'}`
                        }>



                          <ThumbsUp className={`w-2.5 h-2.5 sm:w-4 sm:h-4 ${userLikes.has(review.id) ? 'fill-current' : ''}`} />
                          <span className="text-xs sm:text-sm">{getLikeCount(review)}</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>);

            })}
            </div>
          }
        </CardContent>
      </Card>

      {reportingReview &&
      <ReportDialog
        open={!!reportingReview}
        onOpenChange={() => setReportingReview(null)}
        reviewType="teacher"
        reviewId={reportingReview.id}
        onSuccess={() => {
          setReportingReview(null);
          onReload();
        }} />

      }
    </>);

}