
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Star, AlertCircle, User as UserIcon, Edit, ThumbsUp, Loader2, Trash2, Sparkles, Users, Building2, Utensils, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ReportDialog from "../shared/ReportDialog";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    avatar5: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5e2f6487e_a-humanized-black-graduation-cap-with-a-star-shape-5.png"
  };
  return avatarUrls[avatar] || "";
};

export default function SchoolReviews({ schoolId, user, onReload, onEditReview, canModerate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportingReview, setReportingReview] = React.useState(null);
  const [localLikes, setLocalLikes] = useState({});
  const [userLikes, setUserLikes] = useState(new Set());
  const [showAntoninSummary, setShowAntoninSummary] = useState(false);
  const [antoninSummary, setAntoninSummary] = useState("");
  const [loadingAntonin, setLoadingAntonin] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      try {
        const reviewsData = await base44.entities.SchoolReview.filter({ school_id: schoolId, status: "published" }, "-created_date");
        setReviews(reviewsData);
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

      // Recharger les avis et mettre à jour les stats
      const updatedReviews = await base44.entities.SchoolReview.filter({ school_id: schoolId, status: "published" }, "-created_date");
      setReviews(updatedReviews);

      // Recalculer et mettre à jour les statistiques
      await updateSchoolStats();

      // Notifier le parent pour rafraîchir l'affichage
      onReload();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Erreur lors de la suppression de l'avis.");
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
          user_email: user.email
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

      const prompt = `Tu es Antonin, une IA qui résume les avis des étudiants sur les profs et les établissements.

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
Et toujours avec le ton unique de L'avis d'Antonin.

📊 Voici les avis des étudiants sur cet établissement (notes ET commentaires) :
${JSON.stringify(reviewsSummary, null, 2)}

IMPORTANT : Base-toi principalement sur les COMMENTAIRES des étudiants pour comprendre le ressenti réel. Les notes seules ne suffisent pas. Lis les commentaires pour saisir l'ambiance, les forces et les faiblesses de l'établissement.

Rédige maintenant ton résumé façon "L'avis d'Antonin" en 3 phrases max.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setAntoninSummary(result);
    } catch (error) {
      console.error("Error calling Antonin:", error);
      setAntoninSummary("Oups, Antonin a eu un bug ! Réessaie dans quelques instants 🤖");
    } finally {
      setLoadingAntonin(false);
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => (b.like_count || 0) - (a.like_count || 0));

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              Avis 🍿 ({reviews.length})
            </CardTitle>
            
            {reviews.length > 0 &&
            <Button
              onClick={handleAskAntonin}
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">

                <Sparkles className="w-4 h-4 mr-1" />
                <span className="text-xs">Ant's 🤖</span>
              </Button>
            }
          </div>
        </CardHeader>
        <CardContent className="section-scrollable">
          {loading ?
          <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div> :
          sortedReviews.length === 0 ?
          <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 text-sm">Aucun avis pour le moment</p>
            </div> :

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {sortedReviews.map((review) => {
              const avatarUrl = review.author_avatar && review.author_avatar !== 'letter' ? getAvatarUrl(review.author_avatar) : null;

              return (
                <div key={review.id} className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-10 h-10 border-2 border-slate-100">
                          {!review.is_anonymous && avatarUrl ?
                        <AvatarImage src={avatarUrl} /> :
                        null}
                          <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white text-sm">
                            {review.is_anonymous ? <UserIcon className="w-5 h-5" /> : review.author_name?.charAt(0).toUpperCase() || review.created_by?.charAt(0).toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 text-sm">
                                {review.is_anonymous ? "Anonyme" : review.author_name || review.created_by?.split('@')[0] || "Utilisateur"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {format(new Date(review.created_date), "d MMM yyyy", { locale: fr })}
                              </p>
                            </div>

                            {/* Note ultra simple - Mobile uniquement */}
                            <div className="flex sm:hidden items-center gap-1 bg-gradient-to-br from-amber-50 to-amber-100 px-2 py-1 rounded-full border border-amber-200 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"
                            style={{ backgroundSize: '200% 100%' }}></div>
                              <div className="relative z-10 flex items-center gap-1">
                                <Star className="w-3 h-3 text-amber-600 fill-amber-600" />
                                <span className="text-sm font-bold text-amber-900 leading-none">{review.rating.toFixed(1)}</span>
                              </div>
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

                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {Object.entries(criteriaIcons).map(([key, { icon: Icon, color }]) =>
                    <div key={key} className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                            <div className="flex flex-row items-center justify-center gap-1">
                              <Icon className={`w-4 h-4 ${color}`} />
                              <span className="text-sm font-bold text-slate-900">{review[key]}</span>
                              <span className="hidden sm:inline text-[9px] text-slate-500">/5</span>
                            </div>
                        </div>
                    )}
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed">{review.comment}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex gap-2">
                        {user && review.created_by === user.email &&
                      <>
                            <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditReview(review)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8">

                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(review.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8">

                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                      }

                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReportingReview(review)}
                        className="text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 h-7 px-2">

                          <AlertCircle className="w-3 h-3 mr-1" />
                          Signaler
                        </Button>
                      </div>

                      <Button
                      variant={userLikes.has(review.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleLike(review)} className="justify-center whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-9 rounded-md px-3 flex items-center gap-2 transition-all bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90">






                        <ThumbsUp className={`w-3 h-3 ${userLikes.has(review.id) ? 'fill-current' : ''}`} />
                        <span className="text-xs">{getLikeCount(review)}</span>
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
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-2xl">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              L'avis d'Antonin 🤖 sur l'établissement
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
    </>);

}