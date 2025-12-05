import React, { useState, useEffect } from "react";
import { TeacherReview } from "@/entities/TeacherReview";
import { Teacher } from "@/entities/Teacher";
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
import { AlertCircle, CheckCircle, Star, Heart, Brain, FileText, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function AddTeacherReviewDialog({ open, onOpenChange, teacherId, existingReview, setExistingReview, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    workload: 2.5,
    friendliness: 2.5,
    teaching_method: 2.5,
    grading_severity: 2.5,
    comment: "",
    is_anonymous: false,
    certification: false // Added certification field
  });

  const MAX_COMMENT_LENGTH = 300;

  const [flashingWidgets, setFlashingWidgets] = useState({});

  const criteria = [
    { key: "workload", label: "Charge de travail", icon: BookOpen, color: "text-blue-600", description: "Quantité de devoirs et travail demandé", gradient: "bg-gradient-to-r from-blue-50 to-cyan-100", sliderClass: "slider-blue" },
    { key: "friendliness", label: "Gentillesse", icon: Heart, color: "text-pink-600", description: "Approche et bienveillance", gradient: "bg-gradient-to-r from-pink-50 to-rose-100", sliderClass: "slider-pink" },
    { key: "teaching_method", label: "Qualité des cours", icon: Brain, color: "text-purple-600", description: "Clarté et pédagogie", gradient: "bg-gradient-to-r from-purple-50 to-indigo-100", sliderClass: "slider-purple" },
    { key: "grading_severity", label: "Notation", icon: FileText, color: "text-orange-600", description: "Façon de noter et de corriger", gradient: "bg-gradient-to-r from-orange-50 to-amber-100", sliderClass: "slider-orange" }
  ];


  const resetForm = () => {
    setFormData({
      workload: 2.5,
      friendliness: 2.5,
      teaching_method: 2.5,
      grading_severity: 2.5,
      comment: "",
      is_anonymous: false,
      certification: false // Reset certification
    });
    setError(null);
    setSuccess(false);
  };

  useEffect(() => {
    if (open) {
      if (existingReview) {
        if ((existingReview.edit_count || 0) >= 3) {
          setError("Vous avez atteint la limite de 3 modifications pour cet avis.");
          return;
        }
        setFormData({
          workload: existingReview.workload,
          friendliness: existingReview.friendliness,
          teaching_method: existingReview.teaching_method,
          grading_severity: existingReview.grading_severity,
          comment: existingReview.comment,
          is_anonymous: existingReview.is_anonymous,
          certification: false // User must re-certify on edit
        });
      } else {
        resetForm();
        checkExistingReview();
      }
    }
  }, [open, existingReview, teacherId]);

  const checkExistingReview = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;
      const reviews = await TeacherReview.filter({
        teacher_id: teacherId,
        created_by: user.email
      });

      if (reviews.length > 0 && !existingReview) {
        setError("Vous avez déjà publié un avis pour ce professeur.");
      }
    } catch (error) {
      console.error("Error checking existing review:", error);
    }
  };

  const calculateTotalRating = (data) => {
    const { workload, friendliness, teaching_method, grading_severity } = data;
    // Each criterion goes from 0-5. Total max is 20.
    return workload + friendliness + teaching_method + grading_severity;
  };

  const updateTeacherStats = async (teacherIdToUpdate) => {
    const reviews = await TeacherReview.filter({ teacher_id: teacherIdToUpdate, status: "published" });
    const reviewCount = reviews.length;

    if (reviewCount === 0) {
      await Teacher.update(teacherIdToUpdate, {
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
    const average_rating = workload_avg + friendliness_avg + teaching_avg + grading_avg;

    await Teacher.update(teacherIdToUpdate, {
      workload_avg,
      friendliness_avg,
      teaching_avg,
      grading_avg,
      average_rating,
      review_count: reviewCount
    });
  };

  const sendToModerationWebhook = async (reviewData, isEdit = false) => {
    const user = await base44.auth.me();
    if (user && user.email === 'antownin@gmail.com') return 'approved';

    try {
      const moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es Modérator, l'agent d'intelligence artificielle officiel de ScoolAdvisor.

📝 Contenu à analyser :
"${reviewData.comment}"

Type: ${isEdit ? 'Modification d\'avis' : 'Nouvel avis'} sur un professeur

🎯 Mission : Analyser ce contenu et décider s'il respecte la charte de ScoolAdvisor.

🚫 Contenu STRICTEMENT INTERDIT (à rejeter systématiquement) :
- Grossièretés, insultes, vulgarité
- Attaques personnelles directes ("il/elle est nul(le)", "c'est un(e) incompétent(e)")
- Discrimination (sexe, origine, religion, physique, orientation, handicap, etc.)
- Harcèlement, moquerie ciblée ou humiliation
- Diffamation ou atteinte grave à la réputation
- Informations personnelles identifiantes (noms complets d'élèves, adresses, téléphones, etc.)
- Propos sexuels, violents ou politiques extrêmes
- Langage dénigrant portant sur la personne elle-même
- Jugements de valeur sur l'individu (pas sur ses méthodes)

✅ Contenu AUTORISÉ (critiques factuelles et constructives) :
- Descriptions factuelles du cours et de la pédagogie, même négatives
  ✓ "On ne fait que de l'éco", "On fait peu d'exercices"
  ✓ "On fout rien avec elle", "Les cours sont peu structurés"
  ✓ "Elle est souvent absente", "Il parle trop vite"
  
- Critiques constructives sur les MÉTHODES (pas sur la PERSONNE)
  ✓ "Ses explications sont difficiles à suivre"
  ✓ "Le rythme est trop lent pour moi"
  ✓ "Ses cours manquent de dynamisme"
  
- Opinions personnelles respectueuses
  ✓ "Je trouve que ses cours ne sont pas intéressants"
  ✓ "Ce n'est pas ma méthode d'apprentissage préférée"

❌ Exemples à REJETER :
- "Elle est nulle" / "Il est incompétent" → Attaque personnelle
- "C'est la pire prof de l'école" → Jugement de valeur sur la personne
- "Il sert à rien" → Dénigrement personnel
- "Elle est moche et bête" → Discrimination/insulte

✅ Exemples à ACCEPTER :
- "On fout rien avec elle" → Critique factuelle de l'activité en cours
- "Ses cours sont ennuyants" → Opinion sur le COURS, pas la personne
- "Elle est souvent absente et on fait toujours la même chose" → Constat factuel

🔍 Règle d'or : 
La différence entre ACCEPTER et REJETER se trouve ici :
→ Critiquer ce que fait le professeur (méthodes, contenu, organisation) = ✅ OK
→ Insulter ce qu'est le professeur (sa valeur, sa personne) = ❌ INTERDIT

En cas de doute léger sur une formulation maladroite mais sans malveillance apparente, privilégie l'approbation.
En cas de doute sur une attaque personnelle déguisée, rejette.

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

  const checkSchoolLimit = async (user, currentTeacherId) => {
    // Récupérer le professeur actuel pour obtenir son school_id
    const [currentTeacher] = await base44.entities.Teacher.filter({ id: currentTeacherId });
    if (!currentTeacher || !currentTeacher.school_id) return 0;

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

    return { schoolCount: schoolIds.size, currentSchoolId: currentTeacher.school_id, reviewedSchools: schoolIds };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.comment.trim().length < 10) {
      setError("Veuillez écrire au moins 10 caractères pour le commentaire.");
      return;
    }
    if (formData.comment.length > MAX_COMMENT_LENGTH) {
      setError(`Le commentaire ne peut pas dépasser ${MAX_COMMENT_LENGTH} caractères.`);
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
         setError("Commentaire invalide.");
         setLoading(false);
         return;
      }

      const totalRating = calculateTotalRating(formData);

      // Vérifier la limite de 7 établissements (sauf pour les modifications)
      if (!existingReview && user.email !== 'antownin@gmail.com') {
        const { schoolCount, currentSchoolId, reviewedSchools } = await checkSchoolLimit(user, teacherId);

        // Si l'utilisateur a déjà 7 établissements ET que celui du prof actuel n'est pas dans la liste
        if (schoolCount >= 7 && !reviewedSchools.has(currentSchoolId)) {
          setError("Vous avez atteint la limite de 7 établissements différents. Vous ne pouvez pas publier d'avis sur un professeur d'un nouvel établissement.");
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

        const updatedReview = await base44.entities.TeacherReview.update(existingReview.id, {
          workload: formData.workload,
          friendliness: formData.friendliness,
          teaching_method: formData.teaching_method,
          grading_severity: formData.grading_severity,
          total_rating: totalRating,
          comment: cleanComment,
          is_anonymous: formData.is_anonymous,
          edit_count: (existingReview.edit_count || 0) + 1,
          author_name: user.full_name,
          author_avatar: user.profile_avatar
        });
        if (setExistingReview) {
          setExistingReview(updatedReview); // Update parent's existingReview state
        }


      } else {
        const existingReviews = await base44.entities.TeacherReview.filter({
          teacher_id: teacherId,
          created_by: user.email
        });

        if (existingReviews.length > 0) {
          setError("Vous avez déjà publié un avis pour ce professeur.");
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
              setError("Désolé, ce message ne respecte pas nos conditions d’utilisation");
            }
          } else {
            setError("Désolé, ce message ne respecte pas nos conditions d’utilisation");
          }
          setLoading(false);
          return;
        }

        await base44.entities.TeacherReview.create({
          teacher_id: teacherId,
          workload: formData.workload,
          friendliness: formData.friendliness,
          teaching_method: formData.teaching_method,
          grading_severity: formData.grading_severity,
          total_rating: totalRating,
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

      await updateTeacherStats(teacherId);
      setSuccess(true);
      toast.success("✅ Avis publié !");
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1500);

    } catch (err) {
      console.error("Error during review submission:", err);
      if (err.message && err.message.includes("authentication")) {
        setError("Vous devez être connecté pour publier un avis.");
      } else {
        toast.error("❌ Erreur technique. Réessayez.");
        setError("❌ Erreur technique. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  const canEdit = existingReview ? (existingReview.edit_count || 0) < 3 : true;
  const submitButtonDisabled = loading || !canEdit || !formData.certification || error && error.includes("atteint la limite"); // Added !formData.certification

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              {existingReview ? "Modifier mon avis" : "Noter ce professeur"}
            </span>
          </DialogTitle>
          <p className="text-xs sm:text-sm text-slate-600">
            Évaluez ce professeur selon 4 critères <span className="text-blue-600 font-medium">(Soyez bienveillant et constructif)</span>
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

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-5">
            {criteria.map(({ key, label, icon: Icon, color, description, gradient, sliderClass }) => {
              const isMax = formData[key] === 5;
              const isFlashing = flashingWidgets[key];

              return (
                <div
                  key={key}
                  className={`rounded-lg p-3 sm:p-4 border border-slate-200 transition-all duration-500 relative overflow-hidden ${
                    isMax ? gradient : 'bg-slate-50'
                  } ${isFlashing ? 'animate-widget-shine ring-2 ring-offset-2 ring-offset-white ring-yellow-400' : ''}`}
                >
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
                            setFlashingWidgets(prev => ({ ...prev, [key]: true }));
                            setTimeout(() => setFlashingWidgets(prev => ({ ...prev, [key]: false })), 500);
                          }
                        }}
                        min={0}
                        max={5}
                        step={0.5}
                        className="flex-1"
                        disabled={!canEdit}
                      />
                    </div>

                    <div className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border min-w-[50px] sm:min-w-[60px] justify-center transition-colors duration-300 ${isMax ? 'bg-white/80 border-transparent shadow-sm' : 'bg-white border-slate-200'}`}>
                      <span className={`text-base sm:text-xl font-bold transition-colors ${isMax ? 'text-slate-900' : 'text-slate-900'}`}>{formData[key].toFixed(1)}</span>
                      <span className="text-[10px] sm:text-sm text-slate-500">/5</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-3 sm:p-4 border-2 border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 fill-amber-600" />
                <span className="font-semibold text-sm sm:text-base text-amber-900">Note finale</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-amber-900">{calculateTotalRating(formData).toFixed(1)}</span>
                <span className="text-sm sm:text-lg text-amber-700">/20</span>
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
              placeholder="Décris ton expérience avec ce prof (cours, ambiance, méthodes...)"
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
                Votre nom ne sera pas affiché publiquement.
              </p>
            </div>
          </div>

          {/* New Certification Checkbox */}
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
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-900 text-[10px] sm:text-sm font-medium">
              <strong>Avertissement légal :</strong> Les propos diffamatoires, injurieux ou discriminatoires sont interdits et punissables par la loi.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="submit"
              disabled={submitButtonDisabled} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground shadow px-4 py-2 w-full bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 disabled:bg-slate-300 text-white text-xs sm:text-base h-9 sm:h-10">


              {loading ? "Publication..." : existingReview ? "Modifier l'avis" : "Publier l'avis"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);

}