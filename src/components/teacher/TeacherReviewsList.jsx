import React, { useState, useEffect } from "react";
import { TeacherReview } from "@/entities/TeacherReview";
import { ReviewLike } from "@/entities/ReviewLike";
import { Notification } from "@/entities/Notification";
import { Teacher } from "@/entities/Teacher";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, User as UserIcon, AlertCircle, Edit, ThumbsUp, Loader2, Trash2, ChevronDown, BookOpen, Heart, Brain, FileText, Flag } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import ReportDialog from "../shared/ReportDialog";
import { toast } from "sonner";
import GradientSpinner from "@/components/shared/GradientSpinner";
import JoinFamilyDialog from "@/components/shared/JoinFamilyDialog";
import { useJoinFamily } from "@/components/shared/useJoinFamily";

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
    avatar5: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5e2f6487e_a-humanized-black-graduation-cap-with-a-star-shape-5.png",
    avatar6: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1b286b7dd_a-human-schoolboy-inspired-by-a-famous-comic-stude.png",
    avatar7: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/fd729e269_an-anonymous-student-with-a-james-bond-inspired-au.png",
    avatar8: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/538606372_image.png",
    avatar9: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/c3f498768_a-premium-abstract-student-goat-avatar-symbolizing.png",
    avatar10: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/a9d36d153_image-2.png"
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [reportingReview, setReportingReview] = useState(null);
  const [likingReview, setLikingReview] = useState(null);
  const [localLikes, setLocalLikes] = useState({});
  const [userLikes, setUserLikes] = useState(new Set());
  const [reviewUsers, setReviewUsers] = useState({});
  const [expandedReviews, setExpandedReviews] = useState(new Set());
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const { showJoinDialog, actionDescription, requireAuth, closeDialog } = useJoinFamily();

  useEffect(() => {
    loadReviews(true);
  }, [teacherId, user]);

  const loadReviews = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setReviews([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const limit = 5;
      const skip = reset ? 0 : reviews.length;
      
      // Utilisation de skip pour la pagination
      // Fetch published reviews OR rejected reviews by current user
      // Note: Filtering complex OR conditions in one go is limited, so we fetch published
      // and we could try to fetch user's rejected ones separately if needed, 
      // but simpler to fetch broader list if list is small, OR make 2 queries.
      // Strategy: Fetch published normally. 
      // Also fetch "rejected" reviews made by "me".
      
      const publishedReviews = await TeacherReview.filter(
        { teacher_id: teacherId, status: "published" }, 
        "-created_date", 
        limit, 
        skip
      );

      let myRejectedReviews = [];
      if (user && reset) { // Only load rejected on first load to avoid pagination mess
         myRejectedReviews = await TeacherReview.filter(
            { teacher_id: teacherId, status: "rejected", created_by: user.email },
            "-created_date"
         );
      }

      // Merge and sort
      let newReviews = [...publishedReviews, ...myRejectedReviews];
      // Sort by date desc
      newReviews.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      // Deduplicate by ID just in case
      newReviews = newReviews.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

      if (newReviews.length < limit) {
        setHasMoreReviews(false);
      }

      const updatedReviews = reset ? newReviews : [...reviews, ...newReviews];
      setReviews(updatedReviews);

      // Charger les infos utilisateurs pour les avis non-anonymes
      const userEmails = [...new Set(newReviews.filter((r) => !r.is_anonymous).map((r) => r.created_by))];
      // Note: On pourrait optimiser en ne chargeant que les nouveaux, mais on garde la logique simple
      // On fusionne avec les existants
      
      const newUsersData = { ...reviewUsers };
      for (const email of userEmails) {
        if (!newUsersData[email] && user && email === user.email) {
           newUsersData[email] = user;
        }
      }
      setReviewUsers(newUsersData);

    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Si on est proche du bas (à 50px près) et qu'on ne charge pas déjà et qu'il y en a plus
    if (scrollHeight - scrollTop <= clientHeight + 50 && !loadingMore && !loading && hasMoreReviews) {
      loadReviews(false);
    }
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
      // Les stats seront automatiquement recalculées par l'automation
      await loadReviews(true);
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
    if (!requireAuth(user, "liker cet avis")) {
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
      [reviewId]: Math.max(0, (localLikes[reviewId] ?? review.like_count ?? 0) + (isCurrentlyLiked ? -1 : 1))
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
          user_email: user.email,
          user_id: user.id
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
        [reviewId]: Math.max(0, (localLikes[reviewId] ?? review.like_count ?? 0) - (isCurrentlyLiked ? -1 : 1))
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

  const toggleCommentExpand = (reviewId) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedComments(newExpanded);
  };

  const isCommentLong = (comment) => {
    if (!comment) return false;
    const lines = comment.split('\n').length;
    const estimatedLines = comment.length / 50; // Approximation
    return lines > 3 || estimatedLines > 3;
  };

  // On garde l'ordre de chargement (par date) pour le scroll infini
  const displayedReviews = reviews;

  const Content = () => (
    <div className="flex-1 flex flex-col h-full">
      {/* SVG Gradient Definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="chat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4D8D" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 dark:from-pink-500/20 dark:via-purple-500/20 dark:to-blue-500/20 p-4 mb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
              <MessageSquare className="w-5 h-5 text-[#FF4D8D]" />
            </div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Avis des étudiants
              </span>
              <span>🍿</span>
              <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">({reviews.length})</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-2 pt-2 overflow-hidden">
          {loading && reviews.length === 0 ?
          <div className="flex justify-center items-center h-full">
              <GradientSpinner size="w-8 h-8" />
            </div> :
          reviews.length === 0 ?
          <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-500" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium">Aucun avis pour le moment</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Soyez le premier à noter !</p>
            </div> :

          <div 
            className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar"
            onScroll={handleScroll}
          >
            <style>{`
              .custom-scrollbar::-webkit-scrollbar { width: 6px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
              {displayedReviews.map((review, index) => {
              const reviewUser = reviewUsers[review.created_by];
              // Use stored avatar if available, otherwise fallback to user profile
              const rawAvatar = review.author_avatar || reviewUser?.profile_avatar;
              const avatarUrl = rawAvatar && rawAvatar !== 'letter' ? getAvatarUrl(rawAvatar) : null;

              const isRejected = review.status === 'rejected';
              
              return (
                <div
                  key={review.id}
                  className={`group relative p-3.5 sm:p-5 rounded-2xl border transition-all duration-300
                    ${isRejected ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-75 grayscale-[0.5]' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-purple-100 dark:hover:border-purple-700 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.08)]'}
                  `}
                >
                  {isRejected && (
                    <div className="mb-3 p-2 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-medium text-red-700 dark:text-red-400">
                            Visible uniquement par vous (contenu refusé par la modération)
                        </span>
                    </div>
                  )}
                  {/* Header */}
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex gap-2.5 items-center min-w-0">
                      <Avatar className="w-9 h-9 flex-shrink-0 border-2 border-white dark:border-slate-700 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
                         {avatarUrl ?
                            <AvatarImage src={avatarUrl} loading="lazy" /> : null}
                          <AvatarFallback className="bg-transparent">
                               <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png" alt="Avatar" className="w-full h-full object-cover" />
                          </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                            {review.is_anonymous ? "Anonyme" : review.author_name || "Étudiant"}
                          </h4>
                          {review.is_former_student && (
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-medium">Ancien élève</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatDateWithTimezone(review.created_date, "d MMM yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-2 py-1 rounded-lg border border-amber-200 shadow-sm flex-shrink-0">
                      <Star className="w-3 h-3 fill-amber-600 text-amber-600" />
                      <span className="font-bold text-sm text-amber-950">{review.total_rating.toFixed(1)}</span>
                      <span className="text-[10px] text-amber-700 font-medium">/20</span>
                    </div>
                  </div>

                  {/* Comment & Expand Toggle */}
                  <div className="mt-2.5 mb-1.5">
                    <div className="flex items-start gap-2">
                      <p className={`text-sm text-slate-700 dark:text-slate-200 leading-relaxed flex-1 ${!expandedComments.has(review.id) && isCommentLong(review.comment) ? 'line-clamp-3' : ''}`}>
                        {review.comment}
                      </p>
                      <button
                        onClick={() => toggleExpand(review.id)}
                        className="flex-shrink-0 p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-700"
                        title={expandedReviews.has(review.id) ? "Masquer les détails" : "Voir les détails"}
                      >
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedReviews.has(review.id) ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {isCommentLong(review.comment) && !expandedComments.has(review.id) && (
                      <button
                        onClick={() => toggleCommentExpand(review.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                      >
                        Voir plus
                      </button>
                    )}
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
                        <div className="flex items-center justify-between text-sm pb-3 px-1 pt-1">
                          {Object.entries(criteriaIcons).map(([key, { icon: Icon, label, color }]) => (
                            <div key={key} className="flex items-center gap-1.5" title={label}>
                               <Icon className={`w-4 h-4 ${color}`} />
                               <span className="font-bold text-slate-700 dark:text-slate-200">{review[key]}/5</span>
                             </div>
                           ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-50 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                       <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(review)}
                          className={`h-8 px-3 rounded-full border transition-all ${
                            userLikes.has(review.id)
                              ? "bg-white dark:bg-slate-700 border-transparent shadow-sm ring-1 ring-pink-100 dark:ring-pink-900"
                              : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                          }`}
                       >
                          <ThumbsUp
                            className="w-4 h-4 mr-1.5 transition-all duration-300"
                            style={userLikes.has(review.id) ? { stroke: "url(#chat-gradient)", fill: "none" } : { stroke: "#94a3b8", fill: "none" }}
                          />
                          <span className={`text-xs font-bold ${userLikes.has(review.id) ? "text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500" : "text-slate-500"}`}>
                            {getLikeCount(review)}
                          </span>
                       </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      {user && review.created_by === user.email ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => onEditReview(review)} className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-full">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(review.id)} className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-full">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <button onClick={() => setReportingReview(review)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Signaler">
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );

            })}
            
            {loadingMore && (
              <div className="text-center py-4">
                <span className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement...
                </span>
              </div>
            )}
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
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-slate-200 dark:border-slate-700 border-x-0 sm:border-x shadow-xl w-full h-full flex flex-col hover:shadow-2xl transition-shadow duration-300 rounded-none sm:rounded-xl">
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
      
      <JoinFamilyDialog
        open={showJoinDialog}
        onOpenChange={closeDialog}
        actionDescription={actionDescription}
      />
    </>);

}