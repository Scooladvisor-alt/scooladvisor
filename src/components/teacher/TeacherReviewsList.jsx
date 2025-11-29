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
import { motion, AnimatePresence } from "framer-motion";
import ReportDialog from "../shared/ReportDialog";
import { toast } from "sonner";

// Helper function pour formater les dates correctement
const formatDateWithTimezone = (dateString, formatStr) => {
  const date = new Date(dateString);
  return format(date, formatStr, { locale: fr });
};

const criteriaIcons = {
  workload: { icon: BookOpen, label: "Charge", color: "text-[#4CA9FF]" },
  friendliness: { icon: Heart, label: "Amabilité", color: "text-[#FF64B8]" },
  teaching_method: { icon: Brain, label: "Enseignement", color: "text-purple-500" },
  grading_severity: { icon: FileText, label: "Notation", color: "text-orange-500" }
};

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

export default function TeacherReviewsList({ teacherId, user, onReload, onEditReview, embedded = false }) {
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

  const Content = () => (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b border-slate-100 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 p-4 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <MessageSquare className="w-5 h-5 text-[#FF4D8D]" />
            </div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Avis des étudiants
              </span>
              <span>🍿</span>
              <span className="text-slate-400 font-medium text-sm">({reviews.length})</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 pt-2 overflow-hidden">
          {loading ?
          <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div> :
          sortedReviews.length === 0 ?
          <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <MessageSquare className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-600 font-medium">Aucun avis pour le moment</p>
              <p className="text-sm text-slate-500 mt-1">Soyez le premier à noter !</p>
            </div> :

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
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
                <div
                  key={review.id}
                  className="group relative p-5 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 hover:border-purple-100"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      <Avatar className="w-10 h-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                         {!review.is_anonymous && avatarUrl ?
                            <AvatarImage src={avatarUrl} /> : null}
                          <AvatarFallback className={`text-white text-sm font-bold ${review.is_anonymous ? 'bg-slate-400' : 'bg-gradient-to-br from-purple-500 to-blue-500'}`}>
                            {review.is_anonymous ? <UserIcon className="w-5 h-5" /> : (review.author_name?.[0] || 'A')}
                          </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                           <h4 className="font-bold text-slate-900 text-sm">
                              {review.is_anonymous ? "Anonyme" : review.author_name || "Étudiant"}
                           </h4>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {formatDateWithTimezone(review.created_date, "d MMM yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 shadow-sm">
                        <Star className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                        <span className="font-bold text-sm text-amber-950">{review.total_rating.toFixed(1)}</span>
                        <span className="text-[10px] text-amber-700 font-medium">/20</span>
                      </div>
                    </div>
                  </div>

                  {/* Comment & Expand Toggle */}
                  <div className="mt-4 mb-2 flex items-start gap-2">
                    <p className="text-sm text-slate-700 leading-relaxed flex-1">
                      {review.comment}
                    </p>
                    <button
                      onClick={() => toggleExpand(review.id)}
                      className="flex-shrink-0 p-1 text-slate-400 hover:text-purple-600 transition-colors rounded-full hover:bg-slate-50"
                      title={expandedReviews.has(review.id) ? "Masquer les détails" : "Voir les détails"}
                    >
                      <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedReviews.has(review.id) ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Criteria Details */}
                  <AnimatePresence>
                    {expandedReviews.has(review.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap items-center gap-4 pb-3 pl-1">
                           {Object.entries(criteriaIcons).map(([key, { icon: Icon, label, color }]) => (
                             <div key={key} className="flex items-center gap-2 text-slate-600">
                                <Icon className={`w-4 h-4 ${color}`} />
                                <span className="text-xs font-medium">{label}:</span>
                                <span className="text-sm font-bold text-slate-900">{review[key]}/5</span>
                             </div>
                           ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                       <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(review)}
                          className={`h-8 px-3 rounded-full text-xs font-medium transition-all min-w-[60px] justify-center ${
                            userLikes.has(review.id)
                              ? "bg-gradient-to-r from-[#FF64B8] to-[#4CA9FF] text-white shadow-sm hover:opacity-90"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                       >
                          <motion.div
                            key={userLikes.has(review.id) ? "liked" : "unliked"}
                            whileTap={{ scale: 0.8 }}
                            animate={userLikes.has(review.id) ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 mr-1.5 ${userLikes.has(review.id) ? "fill-current text-white" : ""}`} />
                          </motion.div>
                          <span>{getLikeCount(review)}</span>
                       </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      {user && review.created_by === user.email ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => onEditReview(review)} className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(review.id)} className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setReportingReview(review)} className="h-7 w-7 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-full" title="Signaler">
                           <AlertCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );

            })}
            </div>
          }
      </div>
    </div>
  );

  return (
    <>
      {embedded ? (
        <Content />
      ) : (
        <Card className="bg-white/90 backdrop-blur-md border-slate-200 shadow-xl w-full h-full flex flex-col hover:shadow-2xl transition-shadow duration-300">
          <Content />
        </Card>
      )}

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