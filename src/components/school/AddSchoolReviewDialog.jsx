import React, { useState, useEffect } from "react";
import { SchoolReview } from "@/entities/SchoolReview";
import { School } from "@/entities/School";
import { Notification } from "@/entities/Notification";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Star, Heart, Users, Building2, Utensils } from "lucide-react";

export default function AddSchoolReviewDialog({ open, onOpenChange, schoolId, existingReview, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [school, setSchool] = useState(null);
  const [flashingWidgets, setFlashingWidgets] = useState({});
  const [formData, setFormData] = useState({
    ambiance: 2.5,
    staff_quality: 2.5,
    facilities: 2.5,
    cafeteria: 2.5,
    student_life_bonus: 0,
    has_student_life: false,
    has_network: false,
    comment: "",
    is_anonymous: false,
    certification: false
  });

  const MAX_COMMENT_LENGTH = 300;

  useEffect(() => {
    if (open && schoolId) {
      loadSchool();
    }
  }, [open, schoolId]);

  const loadSchool = async () => {
    try {
      const schools = await base44.entities.School.filter({ id: schoolId });
      setSchool(schools[0] || null);
    } catch (error) {
      console.error("Error loading school:", error);
    }
  };

  useEffect(() => {
    if (open) {
      if (existingReview) {
        // Check edit limit
        if ((existingReview.edit_count || 0) >= 3) {
          setError("Vous avez atteint la limite de 3 modifications pour cet avis.");
          setLoading(false);
        } else {
          setFormData({
            ambiance: existingReview.ambiance,
            staff_quality: existingReview.staff_quality,
            facilities: existingReview.facilities,
            cafeteria: existingReview.cafeteria,
            student_life_bonus: existingReview.student_life_bonus || 0,
            has_student_life: existingReview.has_student_life || false,
            has_network: existingReview.has_network || false,
            comment: existingReview.comment,
            is_anonymous: existingReview.is_anonymous,
            certification: true
          });
        }
      } else {
        setFormData({
          ambiance: 2.5,
          staff_quality: 2.5,
          facilities: 2.5,
          cafeteria: 2.5,
          student_life_bonus: 0,
          has_student_life: false,
          has_network: false,
          comment: "",
          is_anonymous: false,
          certification: false
        });
        checkExistingReview();
      }
      setError(null);
      if (existingReview && (existingReview.edit_count || 0) >= 3) {
        setError("Vous avez atteint la limite de 3 modifications pour cet avis.");
      }
      setSuccess(false);
      setFlashingWidgets({});
    }
  }, [open, existingReview]);

  const checkExistingReview = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;
      const reviews = await base44.entities.SchoolReview.filter({
        school_id: schoolId,
        created_by: user.email
      });

      if (reviews.length > 0 && !existingReview) {
        setError("Vous avez déjà publié un avis pour cet établissement.");
      }
    } catch (error) {
      console.error("Error checking existing review:", error);
    }
  };

  const calculateTotalRating = (data) => {
    const { ambiance, staff_quality, facilities, cafeteria, has_student_life, has_network } = data;

    if (school && (school.type === 'ecole_commerce' || school.type === 'universite' || school.type === 'ecole_ingenieur')) {
      const bonus = (has_student_life ? 1 : 0) + (has_network ? 1 : 0);
      return ambiance + staff_quality + facilities + cafeteria + bonus;
    }

    return ambiance + staff_quality + facilities + cafeteria;
  };

  const getMaxRating = () => {
    if (school && (school.type === 'ecole_commerce' || school.type === 'universite' || school.type === 'ecole_ingenieur')) {
      return 22;
    }
    return 20;
  };

  const sendToModerationWebhook = async (reviewData, isEdit = false) => {
    const user = await base44.auth.me();
    if (user.email === 'antownin@gmail.com') return 'approved';

    try {
      const moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `🧠 Tu es Modérateur, l'agent d'intelligence artificielle officiel de ScoolAdvisor.

📝 Contenu à analyser :
"${reviewData.comment}"

Type: ${isEdit ? 'Modification d\'avis' : 'Nouvel avis'} sur un établissement

🎯 Mission : Analyser ce contenu et décider s'il respecte la charte de ScoolAdvisor.

🚫 Contenu INTERDIT (à rejeter) :
- Grossièretés, insultes, vulgarité
- Discrimination (sexe, origine, religion, physique, etc.)
- Harcèlement ou moquerie
- Diffamation ou atteinte grave à la réputation
- Informations personnelles
- Propos sexuels, violents ou politiques extrêmes
- Langage dénigrant ou humiliant

✅ Contenu AUTORISÉ :
- Critiques constructives et respectueuses (même négatives)
- Avis factuels et polis
- Opinions personnelles exprimées avec respect

📊 Décision requise :
Réponds UNIQUEMENT par "approved" ou "rejected".
En cas de doute entre "critiquer" et "insulter", privilégie la sécurité et rejette.`,
        response_json_schema: {
          type: "object",
          properties: {
            decision: { type: "string", enum: ["approved", "rejected"] }
          }
        }
      });

      return moderationResult.decision || 'rejected'; // Default to rejected if AI fails for stricter moderation
    } catch (error) {
      console.error("Error in moderation:", error);
      return 'rejected'; // Default to rejected on error for safety/stricter moderation
    }
  };

  const checkSchoolLimit = async (user) => {
    // Récupérer tous les avis de l'utilisateur
    const [userSchoolReviews, userTeacherReviews] = await Promise.all([
    base44.entities.SchoolReview.filter({ created_by: user.email }),
    base44.entities.TeacherReview.filter({ created_by: user.email })]
    );

    // Obtenir les school_id uniques des avis école
    const schoolIds = new Set(userSchoolReviews.map((r) => r.school_id));

    // Pour les avis professeurs, récupérer les profs pour obtenir leurs school_id
    if (userTeacherReviews.length > 0) {
      const teacherIds = [...new Set(userTeacherReviews.map((r) => r.teacher_id))];
      const teachers = await base44.entities.Teacher.filter({ id__in: teacherIds });
      teachers.forEach((t) => {
        if (t.school_id) schoolIds.add(t.school_id);
      });
    }

    return schoolIds.size;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.comment.trim().length < 10) {
      setError("Veuillez écrire au moins 10 caractères pour l'appréciation générale.");
      return;
    }
    if (formData.comment.length > MAX_COMMENT_LENGTH) {
      setError(`L'appréciation ne peut pas dépasser ${MAX_COMMENT_LENGTH} caractères.`);
      return;
    }
    if (!formData.certification) {
      setError("Vous devez certifier que votre avis est bienveillant et constructif.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const user = await base44.auth.me();
      const totalRating = calculateTotalRating(formData);

      if (user.is_banned && user.email !== 'antownin@gmail.com') {
        setError("Votre compte est banni et ne peut pas publier d'avis.");
        setLoading(false);
        return;
      }

      // Vérifier la limite de 7 établissements (sauf pour les modifications)
      if (!existingReview && user.email !== 'antownin@gmail.com') {
        const schoolCount = await checkSchoolLimit(user);

        // Vérifier si cet établissement est déjà dans la liste
        const userSchoolReviews = await base44.entities.SchoolReview.filter({ created_by: user.email });
        const hasReviewedThisSchool = userSchoolReviews.some((r) => r.school_id === schoolId);

        // Si l'utilisateur a déjà 7 établissements ET n'a pas encore noté celui-ci
        if (schoolCount >= 7 && !hasReviewedThisSchool) {
          setError("Vous avez atteint la limite de 7 établissements différents. Vous ne pouvez pas publier d'avis sur un nouvel établissement.");
          setLoading(false);
          return;
        }
      }

      if (existingReview) {
        if ((existingReview.edit_count || 0) >= 3) {
          setError("Vous avez atteint la limite de 3 modifications pour cet avis.");
          setLoading(false);
          return;
        }

        const tempReviewForModeration = { comment: formData.comment };
        const moderationResult = await sendToModerationWebhook(tempReviewForModeration, true);

        if (moderationResult === 'rejected') {
          setError("Votre modification contient du contenu inapproprié et a été refusée par la modération. Votre avis original n'a pas été modifié.");
          setLoading(false);

          if (user.email !== 'antownin@gmail.com') {
            const violationCount = (user.violation_count || 0) + 1;
            await base44.auth.updateMe({ violation_count: violationCount });

            await base44.entities.Notification.create({
              user_email: user.email,
              title: "Modification d'avis refusée",
              message: `Votre tentative de modification a été refusée par notre modération. ${violationCount >= 3 ? 'Votre compte a été banni.' : `Attention : ${3 - violationCount} avertissement(s) restant(s) avant bannissement.`}`,
              type: "report",
              is_read: false
            });

            if (violationCount >= 3) {
              await base44.auth.updateMe({ is_banned: true });
              setTimeout(() => window.location.reload(), 4000);
            }
          }
          return;
        }

        await base44.entities.SchoolReview.update(existingReview.id, {
          ambiance: formData.ambiance,
          staff_quality: formData.staff_quality,
          facilities: formData.facilities,
          cafeteria: formData.cafeteria,
          student_life_bonus: (formData.has_student_life ? 1 : 0) + (formData.has_network ? 1 : 0),
          has_student_life: formData.has_student_life,
          has_network: formData.has_network,
          rating: totalRating,
          comment: formData.comment,
          is_anonymous: formData.is_anonymous,
          edit_count: (existingReview.edit_count || 0) + 1,
          author_name: user.full_name,
          author_avatar: user.profile_avatar
        });

      } else {
        const existingReviews = await base44.entities.SchoolReview.filter({ school_id: schoolId, created_by: user.email });
        if (existingReviews.length > 0) {
          setError("Vous avez déjà publié un avis pour cet établissement.");
          setLoading(false);
          return;
        }

        const tempReviewForModeration = { comment: formData.comment };
        const moderationResult = await sendToModerationWebhook(tempReviewForModeration, false);

        if (moderationResult === 'rejected') {
          if (user.email !== 'antownin@gmail.com') {
            const violationCount = (user.violation_count || 0) + 1;
            await base44.auth.updateMe({ violation_count: violationCount });

            await base44.entities.Notification.create({
              user_email: user.email,
              title: "Avis refusé et supprimé",
              message: `Votre avis a été refusé par notre modération car il ne respectait pas nos règles. ${violationCount >= 3 ? 'Votre compte a été banni.' : `Attention : ${3 - violationCount} avertissement(s) restant(s) avant bannissement.`}`,
              type: "report",
              is_read: false
            });

            if (violationCount >= 3) {
              await base44.auth.updateMe({ is_banned: true });
              setError("Votre avis a été refusé et votre compte a été banni suite à des violations répétées.");
              setTimeout(() => window.location.reload(), 4000);
            } else {
              setError("Votre avis a été refusé par notre système de modération car il ne respecte pas nos règles de bienveillance.");
            }
          } else {
            setError("Votre avis a été refusé par notre système de modération car il ne respecte pas nos règles de bienveillance.");
          }
          setLoading(false);
          return;
        }

        await base44.entities.SchoolReview.create({
          school_id: schoolId,
          ambiance: formData.ambiance,
          staff_quality: formData.staff_quality,
          facilities: formData.facilities,
          cafeteria: formData.cafeteria,
          student_life_bonus: (formData.has_student_life ? 1 : 0) + (formData.has_network ? 1 : 0),
          has_student_life: formData.has_student_life,
          has_network: formData.has_network,
          rating: totalRating,
          comment: formData.comment,
          is_anonymous: formData.is_anonymous,
          status: "published",
          report_count: 0,
          like_count: 0,
          edit_count: 0,
          author_name: user.full_name,
          author_avatar: user.profile_avatar
        });
      }

      await updateSchoolStats(schoolId);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      console.error("Error during review submission:", err);
      if (err.message && err.message.includes("authentication")) {
        setError("Vous devez être connecté pour publier un avis.");
      } else {
        setError("Erreur lors de l'enregistrement de l'avis.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSchoolStats = async (schoolId) => {
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

  const criteria = [
  { key: "ambiance", label: "Ambiance générale", icon: Heart, color: "text-pink-600", description: "C'est la famille ?", gradient: "bg-gradient-to-r from-pink-50 to-rose-100", sliderClass: "slider-pink" },
  { key: "staff_quality", label: "Qualité du personnel", icon: Users, color: "text-blue-600", description: "Administration, surveillants, professeurs, encadrement...", gradient: "bg-gradient-to-r from-blue-50 to-cyan-100", sliderClass: "slider-blue" },
  { key: "facilities", label: "Locaux", icon: Building2, color: "text-purple-600", description: "Architecture, propreté, confort des espaces intérieurs et extérieurs, équipements sportifs et numériques.", gradient: "bg-gradient-to-r from-purple-50 to-indigo-100", sliderClass: "slider-purple" },
  { key: "cafeteria", label: "Cantine / Restauration", icon: Utensils, color: "text-orange-600", description: "Qualité des repas, choix des menus, tarifs, confort de l'espace.", gradient: "bg-gradient-to-r from-orange-50 to-amber-100", sliderClass: "slider-orange" }];


  const showStudentLifeBonus = school && (school.type === 'ecole_commerce' || school.type === 'universite' || school.type === 'ecole_ingenieur');

  const canEdit = existingReview ? (existingReview.edit_count || 0) < 3 : true;
  const submitButtonDisabled = loading || !formData.certification || !canEdit || error && error.includes("atteint la limite");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              {existingReview ? "Modifier mon avis" : "Noter l'établissement"}
            </span>
          </DialogTitle>
          <p className="text-xs sm:text-sm text-slate-600">
            Évaluez votre expérience selon {showStudentLifeBonus ? '5' : '4'} critères <span className="text-blue-600 font-medium">(Soyez bienveillant et constructif)</span>
          </p>
        </DialogHeader>

        {success &&
        <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-xs sm:text-sm">
              Avis publié avec succès !
            </AlertDescription>
          </Alert>
        }

        {error &&
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        }

        <style>{`
          .slider-pink .bg-primary { background-color: #ec4899; }
          .slider-blue .bg-primary { background-color: #2563eb; }
          .slider-purple .bg-primary { background-color: #9333ea; }
          .slider-orange .bg-primary { background-color: #ea580c; }
          @keyframes widget-shine {
            0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
          }
          .animate-widget-shine {
            animation: widget-shine 0.5s ease-out;
          }
        `}</style>
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {criteria.map(({ key, label, icon: Icon, color, description, gradient, sliderClass }) => {
                const isMax = formData[key] === 5;
                const isFlashing = flashingWidgets[key];
                
                return (
                  <div 
                    key={key} 
                    className={`rounded-lg p-3 border border-slate-200 transition-all duration-500 relative overflow-hidden ${
                      isMax ? gradient : 'bg-slate-50'
                    } ${isFlashing ? 'animate-widget-shine ring-2 ring-offset-2 ring-offset-white ring-yellow-400' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <Label className="font-semibold text-xs">{label}</Label>
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                      <div className={sliderClass + " flex-1"}>
                        <Slider
                          value={[formData[key]]}
                          onValueChange={([value]) => {
                            setFormData({ ...formData, [key]: value });
                            if (value === 5 && formData[key] !== 5) {
                              setFlashingWidgets(prev => ({ ...prev, [key]: true }));
                              setTimeout(() => setFlashingWidgets(prev => ({ ...prev, [key]: false })), 500);
                            }
                          }}
                          min={0}
                          max={5}
                          step={0.25}
                          disabled={!canEdit} 
                        />
                      </div>

                      <div className={`flex items-center justify-center px-2 py-0.5 rounded border min-w-[40px] transition-colors duration-300 ${isMax ? 'bg-white/80 border-transparent shadow-sm' : 'bg-white border-slate-200'}`}>
                        <span className="text-sm font-bold text-slate-900">{formData[key].toFixed(1).replace(/[.,]0$/, "")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {showStudentLifeBonus &&
            <div className="relative overflow-hidden bg-slate-50/50 rounded-lg p-3 border border-slate-200">
                {(formData.has_student_life || formData.has_network) && (
                  <>
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute animate-ping"
                        style={{
                          top: `${Math.random() * 80 + 10}%`,
                          left: `${Math.random() * 90 + 5}%`,
                          animationDuration: `${Math.random() * 1.5 + 0.5}s`,
                          animationDelay: `${Math.random() * 1}s`
                        }}
                      >
                        <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                      </div>
                    ))}
                  </>
                )}
                
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <Label className="font-semibold text-xs text-slate-700">Bonus (Max +2)</Label>
                </div>

                <div className="flex gap-4 relative z-10">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_student_life"
                      checked={formData.has_student_life}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_student_life: checked })}
                      disabled={!canEdit}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="has_student_life" className="text-xs cursor-pointer font-medium text-slate-700">
                      Vie asso. +1
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_network"
                      checked={formData.has_network}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_network: checked })}
                      disabled={!canEdit}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="has_network" className="text-xs cursor-pointer font-medium text-slate-700">
                      Réseaux +1
                    </Label>
                  </div>
                </div>
              </div>
            }

            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                  <span className="font-semibold text-sm text-amber-900">Note finale</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-amber-900">{calculateTotalRating(formData).toFixed(2).replace(/[.,]00$/, "")}</span>
                  <span className="text-sm text-amber-700">/ 20</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-sm font-semibold">
                Appréciation générale *
              </Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => {
                  const text = e.target.value;
                  if (text.length <= MAX_COMMENT_LENGTH) {
                    setFormData({ ...formData, comment: text });
                  }
                }}
                placeholder="Décris ton expérience..."
                rows={5}
                className="text-sm resize-none"
                disabled={!canEdit} />

              <div className="flex justify-between text-[10px] text-slate-400">
                <span>
                  {formData.comment.length} / {MAX_COMMENT_LENGTH}
                </span>
                {formData.comment.length >= MAX_COMMENT_LENGTH &&
                <span className="text-red-600 font-medium">Max atteint</span>
                }
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2 p-2 rounded bg-blue-50 border border-blue-100">
                 <Checkbox
                  id="is_anonymous"
                  checked={formData.is_anonymous}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
                  className="w-4 h-4"
                  disabled={!canEdit} />
                <label htmlFor="is_anonymous" className="text-xs font-medium cursor-pointer">
                  Mode anonyme
                </label>
              </div>
              
              <div className="flex items-center space-x-2 p-2 bg-green-50 rounded border border-green-200">
                <Checkbox
                  id="certification"
                  checked={formData.certification}
                  onCheckedChange={(checked) => setFormData({ ...formData, certification: checked })}
                  className="w-4 h-4"
                  disabled={!canEdit} />
                 <label htmlFor="certification" className="text-xs font-medium text-green-900 cursor-pointer">
                  Je certifie être constructif
                </label>
              </div>
            </div>

            <Alert className="bg-red-50 border-red-100 py-2">
              <AlertCircle className="h-3 w-3 text-red-600 top-3" />
              <AlertDescription className="text-red-900 text-[10px] leading-tight ml-2">
                Responsabilité : pas d'injures, diffamation ou discrimination.
              </AlertDescription>
            </Alert>

            <Button type="submit" disabled={submitButtonDisabled} className="w-full bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white shadow-md">
              {loading ? "Envoi..." : existingReview ? "Modifier" : "Publier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);

}