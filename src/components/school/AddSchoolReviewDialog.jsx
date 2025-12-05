import React, { useState, useEffect } from "react";
import { SchoolReview } from "@/entities/SchoolReview";
import { School } from "@/entities/School";
import { Notification } from "@/entities/Notification";
import { base44 } from "@/api/base44Client";
import { security } from "../shared/security";
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
        prompt: `Tu es Modérator, l'agent d'intelligence artificielle officiel de ScoolAdvisor.

📝 Contenu à analyser :
"${reviewData.comment}"

Type: ${isEdit ? 'Modification d\'avis' : 'Nouvel avis'} sur un établissement

🎯 Mission : Analyser ce contenu et décider s'il respecte la charte de ScoolAdvisor.

🚫 Contenu STRICTEMENT INTERDIT (à rejeter systématiquement) :
- Grossièretés, insultes, vulgarité
- Attaques personnelles directes
- Discrimination (sexe, origine, religion, physique, orientation, handicap, etc.)
- Harcèlement, moquerie ciblée ou humiliation
- Diffamation ou atteinte grave à la réputation
- Informations personnelles identifiantes
- Propos sexuels, violents ou politiques extrêmes
- Langage dénigrant

✅ Contenu AUTORISÉ (critiques factuelles et constructives) :
- Descriptions factuelles de l'établissement, même négatives
- Critiques constructives sur les INSTALLATIONS, SERVICES, AMBIANCE
- Opinions personnelles respectueuses

🔍 Règle d'or : 
→ Critiquer ce que fait/propose l'établissement = ✅ OK
→ Insulter ou dénigrer = ❌ INTERDIT

En cas de doute léger sur une formulation maladroite mais sans malveillance apparente, privilégie l'approbation.
En cas de doute sur une attaque déguisée, rejette.

📊 Décision requise :
Réponds UNIQUEMENT par "approved" ou "rejected".`,
        response_json_schema: {
          type: "object",
          properties: {
            decision: { type: "string", enum: ["approved", "rejected"] }
          }
        }
      });

      return moderationResult.decision === 'rejected' ? 'rejected' : 'approved';
    } catch (error) {
      console.error("Error in moderation:", error);
      return 'approved';
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

      // SECURITY: Check Permissions
      if (!security.canPost(user) && user.email !== 'antownin@gmail.com') {
        setError("Votre compte est restreint.");
        setLoading(false);
        return;
      }

      // SECURITY: Sanitize
      const cleanComment = security.sanitize(formData.comment);
      if (cleanComment.length < 10) {
        setError("Commentaire invalide après nettoyage.");
        setLoading(false);
        return;
      }

      const totalRating = calculateTotalRating(formData);

      // Vérifier la limite de 5 établissements (sauf pour les modifications)
      if (!existingReview && user.email !== 'antownin@gmail.com') {
        const schoolCount = await checkSchoolLimit(user);

        // Vérifier si cet établissement est déjà dans la liste
        const userSchoolReviews = await base44.entities.SchoolReview.filter({ created_by: user.email });
        const hasReviewedThisSchool = userSchoolReviews.some((r) => r.school_id === schoolId);

        // Avertissement au 4e avis
        if (schoolCount === 4 && !hasReviewedThisSchool) {
          setError("Il vous reste un avis possible. Vous ne pouvez publier que 5 avis au total.");
        }

        // Blocage au 6e avis (5 déjà publiés)
        if (schoolCount >= 5 && !hasReviewedThisSchool) {
          setError("Vous ne pouvez pas publier plus de 5 avis sur des établissements différents.");
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
          setError("❌ Votre message ne respecte pas les règles de la communauté.");
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
          comment: cleanComment,
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
              setError("❌ Votre message ne respecte pas les règles de la communauté. Votre compte a été banni.");
              setTimeout(() => window.location.reload(), 4000);
            } else {
              setError("❌ Votre message ne respecte pas les règles de la communauté.");
            }
          } else {
            setError("❌ Votre message ne respecte pas les règles de la communauté.");
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
          comment: cleanComment,
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
        setError("❌ Erreur technique lors de l'enregistrement de l'avis. Réessayez.");
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
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
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
        <Alert variant="destructive" className="text-destructive pt-4 pr-4 pb-4 pl-5 text-sm rounded-lg [&>svg]:top-4 relative w-full border [&>svg+div]:translate-y-[-1px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-1\\n2 [&>svg~*]:pl-7 border-destructive/50 dark:border-destructive [&>svg]:text-destructive">
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
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-5">
            {criteria.map(({ key, label, icon: Icon, color, description, gradient, sliderClass }) => {
              const isMax = formData[key] === 5;
              const isFlashing = flashingWidgets[key];

              return (
                <div
                  key={key}
                  className={`rounded-lg p-3 sm:p-4 border border-slate-200 transition-all duration-500 relative overflow-hidden ${
                  isMax ? gradient : 'bg-slate-50'} ${
                  isFlashing ? 'animate-widget-shine ring-2 ring-offset-2 ring-offset-white ring-yellow-400' : ''}`}>

                  <div className="flex items-center gap-2 mb-1 sm:mb-2 relative z-10">
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
                    <Label className="font-semibold text-xs sm:text-sm">{label}</Label>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 mb-2 sm:mb-3 relative z-10">{description}</p>
                  <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                    <div className={sliderClass + " flex-1"}>
                      <Slider
                        value={[formData[key]]}
                        onValueChange={([value]) => {
                          setFormData({ ...formData, [key]: value });
                          if (value === 5 && formData[key] !== 5) {
                            setFlashingWidgets((prev) => ({ ...prev, [key]: true }));
                            setTimeout(() => setFlashingWidgets((prev) => ({ ...prev, [key]: false })), 500);
                          }
                        }}
                        min={0}
                        max={5}
                        step={0.25}
                        disabled={!canEdit} />

                    </div>

                    <div className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border min-w-[50px] sm:min-w-[60px] justify-center transition-colors duration-300 ${isMax ? 'bg-white/80 border-transparent shadow-sm' : 'bg-white border-slate-200'}`}>
                      <span className={`text-base sm:text-xl font-bold transition-colors ${isMax ? 'text-slate-900' : 'text-slate-900'}`}>{formData[key].toFixed(2).replace(/[.,]00$/, "")}</span>
                      <span className="text-[10px] sm:text-sm text-slate-500">/5</span>
                    </div>
                  </div>
                </div>);

            })}

            {showStudentLifeBonus &&
            <div className="relative overflow-hidden bg-slate-50/50 rounded-lg p-3 sm:p-4 border border-slate-200">
                {(formData.has_student_life || formData.has_network) &&
              <>
                    {[...Array(8)].map((_, i) =>
                <div
                  key={i}
                  className="absolute animate-ping"
                  style={{
                    top: `${Math.random() * 80 + 10}%`,
                    left: `${Math.random() * 90 + 5}%`,
                    animationDuration: `${Math.random() * 1.5 + 0.5}s`,
                    animationDelay: `${Math.random() * 1}s`
                  }}>

                        <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                      </div>
                )}
                  </>
              }
                
                <div className="flex items-center gap-2 mb-2 sm:mb-3 relative z-10">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-yellow-500" />
                  <Label className="font-semibold text-xs sm:text-sm text-slate-700">Bonus Établissement (Max +2)</Label>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-8 relative z-10">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                    id="has_student_life"
                    checked={formData.has_student_life}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_student_life: checked })}
                    disabled={!canEdit} />

                    <Label htmlFor="has_student_life" className="text-xs sm:text-sm cursor-pointer font-medium text-slate-700">
                      Vie associative +1
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                    id="has_network"
                    checked={formData.has_network}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_network: checked })}
                    disabled={!canEdit} />

                    <Label htmlFor="has_network" className="text-xs sm:text-sm cursor-pointer font-medium text-slate-700">
                      Réseaux +1
                    </Label>
                  </div>
                </div>
              </div>
            }
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-3 sm:p-4 border-2 border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 fill-amber-600" />
                <span className="font-semibold text-sm sm:text-base text-amber-900">Note finale</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-amber-900">{calculateTotalRating(formData).toFixed(2).replace(/[.,]00$/, "")}</span>
                <span className="text-sm sm:text-lg text-amber-700">/ 20</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm sm:text-base">
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
              placeholder="Décris ton expérience dans cet établissement (ambiance, locaux, staff...)"
              rows={4}
              className="text-sm sm:text-base"
              disabled={!canEdit} />

            <div className="flex justify-between text-[10px] text-slate-400">
              <span>
                {formData.comment.length} / {MAX_COMMENT_LENGTH} caractères 
                <span className="ml-1">(minimum 10)</span>
              </span>
              {formData.comment.length >= MAX_COMMENT_LENGTH &&
              <span className="text-red-600 font-medium">Limite atteinte !</span>
              }
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-2 sm:p-3 rounded-lg bg-blue-50 border border-blue-200">
             <Checkbox
              id="is_anonymous"
              checked={formData.is_anonymous}
              onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
              className="mt-0.5"
              disabled={!canEdit} />

            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="is_anonymous"
                className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">

                Publier en anonyme
              </label>
              <p className="text-[10px] sm:text-xs text-slate-500">
                Votre nom d'utilisateur ne sera pas affiché publiquement.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 sm:p-4 bg-green-50 rounded-lg border-2 border-green-300">
            <Checkbox
              id="certification"
              checked={formData.certification}
              onCheckedChange={(checked) => setFormData({ ...formData, certification: checked })}
              className="mt-0.5"
              disabled={!canEdit} />

            <div className="grid gap-1.5 leading-none">
               <label
                htmlFor="certification"
                className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-green-900">

                Je certifie que cet avis est constructif et bienveillant.
              </label>
            </div>
          </div>

           <Alert className="bg-red-50 border-red-300">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900 text-[10px] sm:text-sm font-medium">
              <strong>Avertissement légal :</strong> Chaque utilisateur est seul responsable de ses propos. Tout contenu diffamatoire, injurieux ou discriminatoire est interdit.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="submit" disabled={submitButtonDisabled} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground px-4 py-2 w-full bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 disabled:bg-slate-300 text-white text-xs sm:text-base h-9 sm:h-10 shadow-md">
              {loading ? "Publication..." : existingReview ? "Modifier l'avis" : "Publier l'avis"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);

}