import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Star, AlertCircle, User as UserIcon, Edit, ThumbsUp, Loader2, Trash2, Sparkles, Users, Building2, Utensils, Heart, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ReportDialog from "../shared/ReportDialog";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GradientSpinner from "@/components/shared/GradientSpinner";
import JoinFamilyDialog from "@/components/shared/JoinFamilyDialog";
import { useJoinFamily } from "@/components/shared/useJoinFamily";

const criteriaIcons = {
  ambiance: { icon: Heart, label: "Ambiance", color: "text-pink-600" },
  staff_quality: { icon: Users, label: "Staff", color: "text-blue-600" },
  facilities: { icon: Building2, label: "Locaux", color: "text-purple-600" },
  cafeteria: { icon: Utensils, label: "Cantine", color: "text-orange-600" }
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

export default function SchoolReviews({ schoolId, user, onReload, onEditReview, canModerate, onAddReview }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportingReview, setReportingReview] = React.useState(null);
  const [localLikes, setLocalLikes] = useState({});
  const [userLikes, setUserLikes] = useState(new Set());
  const [showAntoninSummary, setShowAntoninSummary] = useState(false);
  const [antoninSummary, setAntoninSummary] = useState("");
  const [loadingAntonin, setLoadingAntonin] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState(new Set());
  const [expandedComments, setExpandedComments] = useState(new Set());
  const { showJoinDialog, actionDescription, requireAuth, closeDialog } = useJoinFamily();

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      try {
        const publishedReviews = await base44.entities.SchoolReview.filter({ school_id: schoolId, status: "published" }, "-created_date");
        
        let myRejectedReviews = [];
        if (user) {
            myRejectedReviews = await base44.entities.SchoolReview.filter({ school_id: schoolId, status: "rejected", created_by: user.email }, "-created_date");
        }

        const allReviews = [...publishedReviews, ...myRejectedReviews];
        allReviews.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        
        setReviews(allReviews);
      } catch (error) {
        console.error("Error loading school reviews:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      loadReviews();
    }
  }, [schoolId]);

  useEffect(() => {
    if (user) {
      loadUserLikes();
    }
  }, [user, reviews]);

  const loadUserLikes = async () => {
    if (!user) return;
    try {
      const likes = await base44.entities.ReviewLike.filter({
        review_type: "school",
        user_email: user.email
      });
      setUserLikes(new Set(likes.map((l) => l.review_id)));
    } catch (error) {
      console.error("Error loading user likes:", error);
    }
  };

  const updateSchoolStats = async () => {
    try {
      const reviews = await base44.entities.SchoolReview.filter({ school_id: schoolId, status: "published" });
      const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
      await base44.entities.School.update(schoolId, {
        average_rating: avgRating,
        review_count: reviews.length
      });
    } catch (error) {
      console.error("Error updating school stats:", error);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.")) return;

    try {
      await base44.entities.SchoolReview.delete(reviewId);
      toast.success("Avis supprimé avec succès.");

      // Recharger les avis APRÈS suppression
      const updatedReviews = await base44.entities.SchoolReview.filter({ school_id: schoolId, status: "published" }, "-created_date");
      setReviews(updatedReviews);

      // Recalculer et mettre à jour les statistiques de l'établissement
      const avgRating = updatedReviews.length > 0 
        ? updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length 
        : 0;
      
      await base44.entities.School.update(schoolId, {
        average_rating: avgRating,
        review_count: updatedReviews.length
      });

      // Notifier le parent pour rafraîchir l'affichage
      onReload();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Erreur lors de la suppression de l'avis.");
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

    const currentDisplayedLikes = localLikes[reviewId] !== undefined ? localLikes[reviewId] : review.like_count || 0;

    setLocalLikes((prev) => ({
      ...prev,
      [reviewId]: currentDisplayedLikes + (isCurrentlyLiked ? -1 : 1)
    }));

    try {
      const existingLikes = await base44.entities.ReviewLike.filter({
        review_type: "school",
        review_id: reviewId,
        user_email: user.email
      });

      if (existingLikes.length > 0) {
        await base44.entities.ReviewLike.delete(existingLikes[0].id);
        await base44.entities.SchoolReview.update(reviewId, {
          like_count: Math.max(0, (review.like_count || 0) - 1)
        });
      } else {
        await base44.entities.ReviewLike.create({
          review_type: "school",
          review_id: reviewId,
          user_email: user.email,
          user_id: user.id
        });
        await base44.entities.SchoolReview.update(reviewId, {
          like_count: (review.like_count || 0) + 1
        });

        if (review.created_by !== user.email) {
          await base44.entities.Notification.create({
            user_email: review.created_by,
            title: "Quelqu'un a aimé votre avis",
            message: `${user.full_name || user.email} a aimé votre avis sur un établissement`,
            type: "like",
            review_id: reviewId,
            is_read: false
          });
        }
      }
    } catch (error) {
      console.error("Error liking review:", error);
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
        [reviewId]: currentDisplayedLikes
      }));
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

  const handleAskAntonin = async () => {
    setLoadingAntonin(true);
    setShowAntoninSummary(true);

    try {
      if (!reviews || reviews.length === 0) {
        setAntoninSummary("Pas encore d'avis sur cet établissement ! Sois le premier à dire ce que tu en penses 😎");
        setLoadingAntonin(false);
        return;
      }

      const reviewsSummary = reviews.map((r) => ({
        ambiance: r.ambiance,
        staff_quality: r.staff_quality,
        facilities: r.facilities,
        cafeteria: r.cafeteria,
        rating: r.rating,
        comment: r.comment
      }));

      const prompt = `Tu es Satoshi, une IA qui résume les avis des étudiants sur les profs et les établissements.

Ton rôle : faire une synthèse courte, stylée et pleine de personnalité, comme si tu racontais ça à un pote, avec de l'humour, du bon sens et des images qui parlent.

⚙️ Style et ton :
- 3 phrases max., rythmées et naturelles.
- Écris comme un étudiant malin, drôle et sincère.
- Utilise des expressions familières seulement si elles collent au contexte ("dinguerie" pour un prof ou une école très appréciés, "pas ouf" pour un ressenti moyen, "à côté de la plaque" pour un prof perdu, etc.).
- Ajoute parfois des métaphores originales liées à :
  • des animaux → "doux comme un agneau", "rapide comme un faucon", "têtu comme une mule"...
  • des personnages historiques → "un vrai Napoléon de la pédagogie", "Socrate version 2025", "Colomb de la salle de classe".
  • des situations imagées → "c'est à se demander si c'est pas une boîte de nuit tellement l'ambiance est bonne", "on dirait une ruche tellement ça bosse ici", "c'est plus calme qu'un monastère un lundi matin".
- Les métaphores doivent avoir du sens et faire sourire, sans jamais être méchantes.
- Le ton est positif, sincère et un peu taquin, jamais moqueur ni sec.

💬 Exemples :
Prof top :
"Mme Lemoine, c'est une dinguerie. Toujours le sourire, douce comme un agneau et patiente comme une sainte. Les élèves pourraient presque lui ériger une statue."

Prof exigeant but respected :
"M. Dupont, c'est le Napoléon de la rigueur. Pas toujours tendre, mais il mène sa classe comme une armée : efficace, carré, discipliné."

Prof moyen :
"Mme Bernard fait le taf, sans trop de chichis. Parfois claire, parfois à l'ouest, mais globalement ça roule. On est loin de la dinguerie, mais c'est pas la cata."

Établissement avec une super ambiance :
"Le lycée Jules Verne ? C'est à se demander si c'est pas une boîte de nuit déguisée en école. Ambiance au top, bonne humeur à tous les étages, bref : t'y vas, t'y restes."

Établissement sérieux :
"L'école Saint-Paul, c'est pas là qu'on vient faire la fiesta. Ici, c'est travail, réussite et profs impliqués. Une vraie ruche d'étudiants motivés."

🧭 Règle d'or :
Toujours drôle, jamais gratuit.
Toujours imagé, jamais faux.
Et toujours avec le ton unique de L'avis de Satoshi.

📊 Voici les avis des étudiants sur cet établissement (notes ET commentaires) :
${JSON.stringify(reviewsSummary, null, 2)}

IMPORTANT : Base-toi principalement sur les COMMENTAIRES des étudiants pour comprendre le ressenti réel. Les notes seules ne suffisent pas. Lis les commentaires pour saisir l'ambiance, les forces et les faiblesses de l'établissement.

Rédige maintenant ton résumé façon "L'avis de Satoshi" en 3 phrases max.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setAntoninSummary(result);
    } catch (error) {
      console.error("Error calling Antonin:", error);
      setAntoninSummary("Oups, Satoshi a eu un bug ! Réessaie dans quelques instants 🤖");
    } finally {
      setLoadingAntonin(false);
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => (b.like_count || 0) - (a.like_count || 0));

  return (
    <>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="reviewGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FACC15" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="chat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4D8D" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-slate-200 dark:border-slate-700 shadow-xl w-full h-auto lg:h-full flex flex-col hover:shadow-2xl transition-shadow duration-300">
        <CardHeader className="border-b border-slate-100 dark:border-slate-700 mb-2 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" style={{ stroke: "url(#chat-gradient)" }} />
              <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">Avis</span>
              <span className="text-base sm:text-xl">🍿</span>
              <span className="text-sm text-slate-400 dark:text-slate-500 font-normal">({reviews.length})</span>
            </CardTitle>
            
            {reviews.length > 0 &&
            <Button
              onClick={handleAskAntonin}
              size="sm"
              className="bg-transparent hover:bg-purple-50 dark:hover:bg-purple-950 border-0 shadow-none">
                <Sparkles className="w-4 h-4 mr-1 text-[#FF4D8D]" />
                <span className="text-xs font-bold bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">Satoshi</span>
              </Button>
            }
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden p-1 gap-1">
          <style>{`
            .reviews-scrollable {
              overflow-y: auto;
              scroll-behavior: smooth;
              flex: 1;
            }
            
            .reviews-scrollable::-webkit-scrollbar {
              width: 6px;
            }
            
            .reviews-scrollable::-webkit-scrollbar-thumb {
              background-color: rgba(148, 163, 184, 0.6);
              border-radius: 10px;
            }
            
            .reviews-scrollable::-webkit-scrollbar-track {
              background-color: rgba(0,0,0,0.05);
              border-radius: 10px;
            }
          `}</style>
          {loading ?
          <div className="flex justify-center items-center py-12">
              <GradientSpinner size="w-8 h-8" />
            </div> :
          sortedReviews.length === 0 ?
          <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <MessageSquare className="w-10 h-10 text-amber-600" />
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-medium mb-2">Aucun avis pour le moment</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                Partage ton expérience et aide les autres ! 💬
              </p>
              <Button onClick={onAddReview} className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-amber-600 text-white shadow-md">
                <Star className="w-4 h-4 mr-2" />
                Laisser le premier avis
              </Button>
            </div> :

          <div className="space-y-1 reviews-scrollable pr-1 max-h-[400px] sm:max-h-none overflow-y-auto">
              {sortedReviews.slice(0, 2).map((review) => {
              const avatarUrl = review.author_avatar && review.author_avatar !== 'letter' ? getAvatarUrl(review.author_avatar) : null;

              const isRejected = review.status === 'rejected';
              return (
                <div key={review.id} className={`p-2 rounded-lg border space-y-1.5 ${isRejected ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-600 opacity-70' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                    {isRejected && (
                        <div className="text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded border border-red-100 dark:border-red-900 mb-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Visible uniquement par vous (refusé par la modération)
                        </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-slate-100 dark:border-slate-700">
                          {avatarUrl ?
                        <AvatarImage src={avatarUrl} /> :
                        null}
                          <AvatarFallback className="bg-transparent">
                          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/f5396bc58_a-humanized-black-graduation-cap-with-a-star-shape-3.png" alt="Avatar" className="w-full h-full object-cover" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white text-xs sm:text-sm">
                                {review.is_anonymous ? "Anonyme" : review.author_name || review.created_by?.split('@')[0] || "Utilisateur"}
                                {review.is_former_student && <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs ml-1 font-normal">(ancien élève)</span>}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                {format(new Date(review.created_date), "d MMM yyyy", { locale: fr })}
                              </p>
                            </div>

                            {/* Note ultra simple - Mobile uniquement */}
                            <div className="flex sm:hidden items-center gap-0.5 bg-gradient-to-br from-amber-50 to-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">
                              <Star className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
                              <span className="text-xs font-bold text-amber-900 leading-none">{review.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                        </div>

                        {/* Note Desktop - garde l'ancien affichage */}
                        <div className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                        <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                        <span className="font-bold text-amber-900 text-sm">{review.rating.toFixed(1)}</span>
                        <span className="text-xs text-amber-700">/20</span>
                        </div>
                        </div>

                    {review.comment && (() => {
                      const isLongComment = review.comment.split('\n').length > 3 || review.comment.length > 200;
                      const isExpanded = expandedComments.has(review.id);
                      return (
                        <div className="relative bg-slate-50 dark:bg-slate-900 p-2 sm:p-3 rounded-lg mb-2 sm:mb-3">
                          <p className={`text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed pr-6 ${!isExpanded && isLongComment ? 'line-clamp-3' : ''}`}>
                            {review.comment}
                          </p>
                          {isLongComment && (
                            <button
                              onClick={() => toggleCommentExpand(review.id)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mt-1">
                              {isExpanded ? "Voir moins" : "Voir plus"}
                            </button>
                          )}
                          <button
                            onClick={() => toggleExpand(review.id)}
                            className="absolute top-2 sm:top-3 right-2 sm:right-3 text-slate-400 hover:text-slate-600 transition-colors"
                            title={expandedReviews.has(review.id) ? "Masquer les détails" : "Voir les détails"}>
                            <ChevronDown
                              className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${
                              expandedReviews.has(review.id) ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      );
                    })()}

                    {expandedReviews.has(review.id) &&
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between text-sm px-2">
                          {Object.entries(criteriaIcons).map(([key, { icon: Icon, color, label }]) =>
                      <div key={key} className="flex items-center gap-1.5" title={label}>
                              <Icon className={`w-4 h-4 ${color}`} />
                              <span className="font-bold text-slate-700 dark:text-slate-200">{review[key]}/5</span>
                            </div>
                      )}
                        </div>
                      </div>
                  }

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex gap-2">
                        {user && review.created_by === user.email &&
                      <>
                            <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditReview(review)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 h-8 w-8">

                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(review.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 h-8 w-8">

                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                      }

                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReportingReview(review)}
                        className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 h-7 px-2">

                          <AlertCircle className="w-3 h-3 mr-1" />
                          Signaler
                        </Button>
                      </div>

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
                  </div>);

            })}
            </div>
          }
        </CardContent>
      </Card>

      {reportingReview &&
      <ReportDialog
        open={!!reportingReview}
        onOpenChange={() => setReportingReview(null)}
        reviewType="school"
        reviewId={reportingReview.id}
        onSuccess={() => {
          setReportingReview(null);
          onReload();
        }} />

      }

      <Dialog open={showAntoninSummary} onOpenChange={setShowAntoninSummary}>
  <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
        <Sparkles className="w-5 h-5 text-[#FF4D8D] flex-shrink-0" />
        <div className="flex items-center gap-2">
          <span className="font-bold bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent whitespace-nowrap text-base sm:text-lg">
            L'avis de Satoshi
          </span>
          <span className="text-slate-900 dark:text-white font-medium whitespace-nowrap text-base sm:text-lg">
            sur l'établissement
          </span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 sm:py-6">
            {loadingAntonin ?
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <GradientSpinner size="w-10 h-10 sm:w-12 sm:h-12" className="mb-4" />
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">Satoshi 🤖 analyse les avis...</p>
              </div> :

            <div className="prose prose-slate max-w-none prose-sm sm:prose-base">
                <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-blue-950/30 rounded-lg p-4 sm:p-6 border-2 border-pink-100 dark:border-pink-900">
                  <p className="text-slate-800 dark:text-slate-100 leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
                    {antoninSummary}
                  </p>
                </div>
              </div>
            }
          </div>
        </DialogContent>
      </Dialog>

      <JoinFamilyDialog
        open={showJoinDialog}
        onOpenChange={closeDialog}
        actionDescription={actionDescription}
      />
    </>);

}