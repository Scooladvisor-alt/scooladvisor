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
import { moderateContent } from "@/functions/moderateContent";
import JoinFamilyDialog from "@/components/shared/JoinFamilyDialog";
import { useJoinFamily } from "@/components/shared/useJoinFamily";
import confetti from "canvas-confetti";

export default function AddSchoolReviewDialog({ open, onOpenChange, schoolId, existingReview, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [school, setSchool] = useState(null);
  const [flashingWidgets, setFlashingWidgets] = useState({});
  const [formData, setFormData] = useState({
    ambiance: 0,
    staff_quality: 0,
    facilities: 0,
    cafeteria: 0,
    student_life_bonus: 0,
    has_student_life: false,
    has_network: false,
    comment: "",
    is_anonymous: false,
    is_former_student: false,
    certification: false
  });
  const { showJoinDialog, actionDescription, requireAuth, closeDialog } = useJoinFamily();

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
            is_former_student: existingReview.is_former_student || false,
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
          is_former_student: false,
          certification: false
        });
        
        // Restore from local storage if exists
        const savedData = localStorage.getItem('pending_school_review_school_' + schoolId);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            // Fusionner avec les valeurs par défaut pour éviter les valeurs undefined
            setFormData(prev => ({ ...prev, ...parsed }));
            localStorage.removeItem('pending_school_review_school_' + schoolId);
          } catch (e) {
            console.error("Failed to parse saved review", e);
            localStorage.removeItem('pending_school_review_school_' + schoolId); // Nettoyage préventif
          }
        }

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
    if (user.email === 'antownin@gmail.com') return { decision: 'approved', reason: null };

    try {
      const moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es Modérator, l'agent d'intelligence artificielle officiel de ScoolAdvisor.

📝 Contenu à analyser :
"${reviewData.comment}"

Type: ${isEdit ? 'Modification d\'avis' : 'Nouvel avis'} sur un établissement

Mission : Analyser ce contenu et décider s'il respecte la charte de ScoolAdvisor — Avis sur un établissement

🧭 Contexte :
ScoolAdvisor permet aux utilisateurs (élèves, étudiants, parents, anciens) d’exprimer librement leur avis sur un établissement scolaire ou universitaire.
La plateforme autorise un langage spontané, direct, familier, engagé ou critique, tant que cela reste dans le respect des personnes et du cadre légal.
🎯 L’objectif est de permettre à chacun de dire la vérité de son expérience, sans filtre inutile, tout en protégeant contre les débordements haineux, diffamatoires ou illégaux.
📚 RÈGLES GÉNÉRALES À APPLIQUER

✅ Accepter si :
Le ton est cash, familier ou sarcastique, sans être violent ni haineux.
Le message critique l’organisation, le fonctionnement, l’ambiance ou l’approche pédagogique de l’établissement.
Le contenu exprime une opinion personnelle ou un vécu authentique, même avec émotion ou exaspération.
Le texte contient des généralisations idéologiques ou culturelles ("ambiance très à gauche", "école très élitiste") tant que ce n’est pas haineux ou incitatif.
Le message inclut des jugements d’expérience tels que :
“On est pas encadrés”
“On fout rien dans cette école”
“C’est le chaos total”
“On te laisse te débrouiller tout seul”
Des mots comme “nuls”, “relous”, “incompétents”, “perchés”, “déconnectés”, peuvent être acceptés s’ils visent l’organisation ou le ressenti général, pas une personne identifiée.
Il n’y a aucune donnée personnelle (nom de personnel administratif, élèves, adresse privée, etc.)

❌ Rejeter si :
Le message contient des insultes violentes, haineuses ou humiliantes (ex : “c’est une décharge de merde).
Il tient des propos discriminatoires (origine, religion, genre, orientation, handicap, etc.) même envers un groupe.
Il appelle à la haine ou à l’exclusion (“faut fermer cette école”, “c’est que pour les blancs”, “qu’ils crèvent tous”).
Il diffame gravement sans preuve (ex : “ils volent les subventions”, “le directeur est un escroc”).
Il contient des données personnelles identifiables (nom complet d’élève, numéro de téléphone, adresse privée, etc.)
Il sert uniquement à se moquer ou insulter sans argument réel.
Il incite à la violence, la peur ou la panique (“je vais frapper les profs”).

🧠 CONSEILS POUR INTERPRÉTATION
Sois souple : ce sont souvent des jeunes qui s’expriment.
Tolère l’exagération, la colère, les “c’est le bordel”, “on fout rien”, etc.
Cherche l’intention : est-ce une critique forte mais sincère ? ou une insulte gratuite ?
Autorise les généralisations idéologiques ou culturelles, tant qu’il n’y a pas de haine.
Refuse tout contenu qui attaque un groupe social ou personnellement identifiable.
En cas de doute mais pas de haine → approved
En cas de doute avec intention malveillante → rejected

📊 Ta mission :
Après analyse du contenu, réponds uniquement par :
approved → si le message respecte la charte
rejected → si le message enfreint les règles ci-dessus"
- reason: Si rejected, indique la raison parmi: "insulte", "discrimination", "diffamation", "harcelement", "contenu_inapproprie", "spam"`,
        response_json_schema: {
          type: "object",
          properties: {
            decision: { type: "string", enum: ["approved", "rejected"] },
            reason: { type: "string", enum: ["insulte", "discrimination", "diffamation", "harcelement", "contenu_inapproprie", "spam"] }
          },
          required: ["decision"]
        }
      });

      return {
        decision: moderationResult.decision === 'rejected' ? 'rejected' : 'approved',
        reason: moderationResult.reason || null
      };
    } catch (error) {
      console.error("Error in moderation:", error);
      return { decision: 'approved', reason: null };
    }
  };

  const getRejectionMessage = (reason) => {
    const messages = {
      insulte: "❌ Votre avis contient des propos injurieux ou vulgaires.",
      discrimination: "❌ Votre avis contient des propos discriminatoires.",
      diffamation: "❌ Votre avis porte atteinte à la réputation d'une personne.",
      harcelement: "❌ Votre avis contient des propos relevant du harcèlement.",
      contenu_inapproprie: "❌ Votre avis contient du contenu inapproprié.",
      spam: "❌ Votre avis a été détecté comme du spam."
    };
    return messages[reason] || "❌ Votre avis ne respecte pas les règles de la communauté.";
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
      let user = null;
      try {
        user = await base44.auth.me();
      } catch (e) {
        user = null;
      }

      if (!requireAuth(user, "publier cet avis")) {
        localStorage.setItem('pending_school_review_school_' + schoolId, JSON.stringify(formData));
        return;
      }

      // SECURITY: Check Ban Status
      if (user.is_banned) {
        const banDate = new Date(user.banned_until);
        if (banDate > new Date()) {
            setError(`Tu es banni de publication jusqu'au ${banDate.toLocaleDateString()} ${banDate.toLocaleTimeString()}`);
            setLoading(false);
            return;
        }
      }

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

        // Update immediately
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
          is_former_student: formData.is_former_student,
          edit_count: (existingReview.edit_count || 0) + 1,
          author_name: user.full_name,
          author_avatar: user.profile_avatar,
          status: 'published'
        });

        // Background moderation
        moderateContent({
          type: 'school_review',
          id: existingReview.id,
          text: cleanComment,
          userId: user.id,
          userEmail: user.email
        }).catch(console.error);

      } else {
        const existingReviews = await base44.entities.SchoolReview.filter({ school_id: schoolId, created_by: user.email });
        if (existingReviews.length > 0) {
          setError("Vous avez déjà publié un avis pour cet établissement.");
          setLoading(false);
          return;
        }

        // Create immediately with status published
        const newReview = await base44.entities.SchoolReview.create({
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
          is_former_student: formData.is_former_student,
          status: "published",
          report_count: 0,
          like_count: 0,
          edit_count: 0,
          author_name: user.full_name,
          author_avatar: user.profile_avatar
        });

        // Background Moderation
        moderateContent({
          type: 'school_review',
          id: newReview.id,
          text: cleanComment,
          userId: user.id,
          userEmail: user.email
        }).catch(console.error);
      }

      await updateSchoolStats(schoolId);
      
      // Animation confettis
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const colors = ['#FF4D8D', '#3B82F6'];
      
      const randomInRange = (min, max) => Math.random() * (max - min) + min;
      
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          onSuccess();
          onOpenChange(false);
          return;
        }
        
        confetti({
          particleCount: 3,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
          colors: colors,
          ticks: 200,
          gravity: 1,
          decay: 0.94,
          startVelocity: 30
        });
      }, 50);
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
  { key: "staff_quality", label: "Qualité du personnel", icon: Users, color: "text-blue-600", description: "Administration, surveillants, profs...", gradient: "bg-gradient-to-r from-blue-50 to-cyan-100", sliderClass: "slider-blue" },
  { key: "facilities", label: "Locaux", icon: Building2, color: "text-purple-600", description: "Architecture, propreté, équipements...", gradient: "bg-gradient-to-r from-purple-50 to-indigo-100", sliderClass: "slider-purple" },
  { key: "cafeteria", label: "Cantine", icon: Utensils, color: "text-orange-600", description: "Qualité des repas, choix...", gradient: "bg-gradient-to-r from-orange-50 to-amber-100", sliderClass: "slider-orange" }];


  const showStudentLifeBonus = school && (school.type === 'ecole_commerce' || school.type === 'universite' || school.type === 'ecole_ingenieur');

  const canEdit = existingReview ? (existingReview.edit_count || 0) < 3 : true;
  const submitButtonDisabled = loading || !formData.certification || !canEdit || error && error.includes("atteint la limite");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-lg sm:text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              {existingReview ? "Modifier mon avis" : "Noter l'établissement"}
            </span>
          </DialogTitle>
        </DialogHeader>



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
          .checkbox-gradient-only [data-state=checked] > span {
            display: none;
          }
        `}</style>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            {criteria.map(({ key, label, icon: Icon, color, description, gradient, sliderClass }) => {
              const isMax = formData[key] === 5;
              const isFlashing = flashingWidgets[key];

              return (
                <div
                  key={key}
                  className={`rounded-lg p-1.5 sm:p-2 border border-slate-200 transition-all duration-500 relative overflow-hidden ${
                  isMax ? gradient : 'bg-slate-50'} ${
                  isFlashing ? 'animate-widget-shine ring-2 ring-offset-2 ring-offset-white ring-yellow-400' : ''}`}>

                  <div className="flex items-center justify-between gap-2 relative z-10">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${color}`} />
                      <div className="min-w-0">
                        <Label className="font-semibold text-[11px] sm:text-xs block">{label}</Label>
                        <p className="text-[8px] sm:text-[9px] text-slate-500 truncate">{description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-sm sm:text-base font-bold text-slate-900">{formData[key].toFixed(2).replace(/[.,]00$/, "")}</span>
                      <span className="text-xs text-slate-500">/5</span>
                    </div>
                  </div>
                  <div className={sliderClass + " mt-1.5 relative z-10"}>
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

          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-2 sm:p-2.5 border border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 fill-amber-600" />
                <span className="font-semibold text-xs sm:text-sm text-amber-900">Note finale</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-xl font-bold text-amber-900">{calculateTotalRating(formData).toFixed(2).replace(/[.,]00$/, "")}</span>
                <span className="text-xs sm:text-sm text-amber-700">/{getMaxRating()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              {error === "Vous avez déjà publié un avis pour cet établissement." && (
                <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm rounded-lg border-2 border-red-300 flex items-center justify-center z-20">
                  <p className="text-xs sm:text-sm font-medium text-red-700">Avis déjà publié pour cet établissement</p>
                </div>
              )}
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => {
                  const text = e.target.value;
                  if (text.length <= MAX_COMMENT_LENGTH) {
                    setFormData({ ...formData, comment: text });
                  }
                }}
                placeholder="APPRÉCIATION GÉNÉRALE *"
                rows={2}
                className="text-sm sm:text-base pb-8"
                disabled={!canEdit} />
              
              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between gap-2 bg-white/95 rounded px-1.5 py-1 checkbox-gradient-only">
                <div className="flex items-center gap-2">
                  <label htmlFor="is_anonymous_inline" className="flex items-center gap-1 cursor-pointer">
                    <Checkbox
                      id="is_anonymous_inline"
                      checked={formData.is_anonymous}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
                      className="h-3 w-3 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#FF4D8D] data-[state=checked]:to-blue-500 data-[state=checked]:border-transparent"
                      disabled={!canEdit} />
                    <span className="text-[9px] sm:text-[10px] font-medium text-slate-600">Anonyme</span>
                  </label>

                  <label htmlFor="is_former_student_inline" className="flex items-center gap-1 cursor-pointer">
                    <Checkbox
                      id="is_former_student_inline"
                      checked={formData.is_former_student}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_former_student: checked })}
                      className="h-3 w-3 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#FF4D8D] data-[state=checked]:to-blue-500 data-[state=checked]:border-transparent"
                      disabled={!canEdit} />
                    <span className="text-[9px] sm:text-[10px] font-medium text-slate-600">Ancien</span>
                  </label>
                </div>
                
                <span className={`text-[9px] whitespace-nowrap ${formData.comment.length >= MAX_COMMENT_LENGTH ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                  {formData.comment.length}/{MAX_COMMENT_LENGTH}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 checkbox-gradient-only">
            <Checkbox
              id="certification"
              checked={formData.certification}
              onCheckedChange={(checked) => setFormData({ ...formData, certification: checked })}
              className="h-3 w-3 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#FF4D8D] data-[state=checked]:to-blue-500 data-[state=checked]:border-transparent"
              disabled={!canEdit} />
            <label
              htmlFor="certification"
              className="text-[10px] font-medium cursor-pointer text-slate-700 leading-tight">
              Je certifie être responsable de mon avis
            </label>
          </div>





          {error && error !== "Vous avez déjà publié un avis pour cet établissement." && (
          <Alert variant="destructive" className="text-destructive pt-4 pr-4 pb-4 pl-5 text-sm rounded-lg [&>svg]:top-4 relative w-full border [&>svg+div]:translate-y-[-1px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-1\\n2 [&>svg~*]:pl-7 border-destructive/50 dark:border-destructive [&>svg]:text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
          )}

          <DialogFooter>
            {error === "Vous avez déjà publié un avis pour cet établissement." ? (
              <div className="w-full bg-red-50 border-2 border-red-300 rounded-md px-4 py-3 text-center">
                <p className="text-sm font-semibold text-red-700">Avis déjà publié pour cet établissement</p>
              </div>
            ) : (
              <Button type="submit" disabled={submitButtonDisabled} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground px-4 py-2 w-full bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 disabled:bg-slate-300 text-white text-xs sm:text-base h-9 sm:h-10 shadow-md">
                {loading ? "Publication..." : existingReview ? "Modifier l'avis" : "Publier l'avis"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
      
      <JoinFamilyDialog
        open={showJoinDialog}
        onOpenChange={closeDialog}
        actionDescription={actionDescription}
      />
    </Dialog>);

}