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
import { moderateContent } from "@/functions/moderateContent";
import JoinFamilyDialog from "@/components/shared/JoinFamilyDialog";
import { useJoinFamily } from "@/components/shared/useJoinFamily";
import confetti from "canvas-confetti";

export default function AddTeacherReviewDialog({ open, onOpenChange, teacherId, existingReview, setExistingReview, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    workload: 0,
    friendliness: 0,
    teaching_method: 0,
    grading_severity: 0,
    comment: "",
    is_anonymous: false,
    is_former_student: false,
    certification: false
  });
  const { showJoinDialog, actionDescription, requireAuth, closeDialog } = useJoinFamily();

  const MAX_COMMENT_LENGTH = 300;

  const [flashingWidgets, setFlashingWidgets] = useState({});

  const criteria = [
    { key: "workload", label: "Charge de travail", icon: BookOpen, color: "text-blue-600", description: "Quantité de devoirs et travail demandé", gradient: "bg-gradient-to-r from-blue-50 to-cyan-100", sliderClass: "slider-blue" },
    { key: "friendliness", label: "Sympathie", icon: Heart, color: "text-pink-600", description: "Approche et bienveillance", gradient: "bg-gradient-to-r from-pink-50 to-rose-100", sliderClass: "slider-pink" },
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
      is_former_student: false,
      certification: false
    });
    setError(null);
    setSuccess(false);
  };

  useEffect(() => {
    if (open) {
      if (existingReview) {
        setFormData({
          workload: existingReview.workload,
          friendliness: existingReview.friendliness,
          teaching_method: existingReview.teaching_method,
          grading_severity: existingReview.grading_severity,
          comment: existingReview.comment,
          is_anonymous: existingReview.is_anonymous,
          is_former_student: existingReview.is_former_student || false,
          certification: false
        });
      } else {
        resetForm();
        
        const savedData = localStorage.getItem('pending_teacher_review_teacher_' + teacherId);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            setFormData(prev => ({ ...prev, ...parsed }));
            localStorage.removeItem('pending_teacher_review_teacher_' + teacherId);
          } catch (e) {
            console.error("Failed to parse saved teacher review", e);
            localStorage.removeItem('pending_teacher_review_teacher_' + teacherId);
          }
        }

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
        setError("Tu as déjà publié un avis pour ce professeur.");
      }
    } catch (error) {
      console.error("Error checking existing review:", error);
    }
  };

  const calculateTotalRating = (data) => {
    const { workload, friendliness, teaching_method, grading_severity } = data;
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

  const checkSchoolLimit = async (user, currentTeacherId) => {
    const [currentTeacher] = await base44.entities.Teacher.filter({ id: currentTeacherId });
    if (!currentTeacher || !currentTeacher.school_id) return 0;

    const [userSchoolReviews, userTeacherReviews] = await Promise.all([
    base44.entities.SchoolReview.filter({ created_by: user.email }),
    base44.entities.TeacherReview.filter({ created_by: user.email })]
    );

    const schoolIds = new Set(userSchoolReviews.map((r) => r.school_id));

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
      let user = null;
      try {
        user = await base44.auth.me();
      } catch (e) {
        user = null;
      }

      if (!requireAuth(user, "publier cet avis")) {
        localStorage.setItem('pending_teacher_review_teacher_' + teacherId, JSON.stringify(formData));
        return;
      }
      
      if (user.is_banned) {
        const banDate = new Date(user.banned_until);
        if (banDate > new Date()) {
            setError(`Tu es banni de publication jusqu'au ${banDate.toLocaleDateString()} ${banDate.toLocaleTimeString()}`);
            setLoading(false);
            return;
        }
      }

      if (!security.canPost(user) && user.email !== 'antownin@gmail.com') {
        setError("Votre compte est restreint.");
        setLoading(false);
        return;
      }

      const cleanComment = security.sanitize(formData.comment);
      if (cleanComment.length < 10) {
         setError("Commentaire invalide.");
         setLoading(false);
         return;
      }

      const totalRating = calculateTotalRating(formData);

      if (!existingReview && user.email !== 'antownin@gmail.com') {
        const { schoolCount, currentSchoolId, reviewedSchools } = await checkSchoolLimit(user, teacherId);

        if (schoolCount >= 7 && !reviewedSchools.has(currentSchoolId)) {
          setError("Vous avez atteint la limite de 7 établissements différents. Vous ne pouvez pas publier d'avis sur un professeur d'un nouvel établissement.");
          setLoading(false);
          return;
        }
      }

      if (existingReview) {
        const updatedReview = await base44.entities.TeacherReview.update(existingReview.id, {
          workload: formData.workload,
          friendliness: formData.friendliness,
          teaching_method: formData.teaching_method,
          grading_severity: formData.grading_severity,
          total_rating: totalRating,
          comment: cleanComment,
          is_anonymous: formData.is_anonymous,
          is_former_student: formData.is_former_student,
          edit_count: (existingReview.edit_count || 0) + 1,
          author_name: user.full_name,
          author_avatar: user.profile_avatar,
          status: 'published'
        });

        if (setExistingReview) {
          setExistingReview(updatedReview);
        }

        moderateContent({
          type: 'teacher_review',
          id: existingReview.id,
          text: cleanComment,
          userId: user.id,
          userEmail: user.email
        }).catch(console.error);


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

        const newReview = await base44.entities.TeacherReview.create({
          teacher_id: teacherId,
          workload: formData.workload,
          friendliness: formData.friendliness,
          teaching_method: formData.teaching_method,
          grading_severity: formData.grading_severity,
          total_rating: totalRating,
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

        moderateContent({
          type: 'teacher_review',
          id: newReview.id,
          text: cleanComment,
          userId: user.id,
          userEmail: user.email
        }).catch(console.error);
      }

      await updateTeacherStats(teacherId);
      
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
        toast.error("❌ Erreur technique. Réessayez.");
        setError("❌ Erreur technique. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitButtonDisabled = loading || !formData.certification || error && error.includes("atteint la limite");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-lg sm:text-2xl font-bold text-center">
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              {existingReview ? "Modifier mon avis" : "Noter ce professeur"}
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
          .checkbox-gradient-border [data-state=checked] {
            background: linear-gradient(to right, #FF4D8D, #3B82F6);
            border: 2px solid black !important;
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
                  className={`rounded-lg p-1.5 sm:p-3 border border-slate-200 dark:border-slate-600 transition-all duration-500 relative overflow-hidden ${
                  isMax ? gradient : 'bg-slate-50 dark:bg-slate-900'} ${
                  isFlashing ? 'animate-widget-shine ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-yellow-400' : ''}`}>

                  <div className="flex items-center justify-between gap-2 relative z-10">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${color}`} />
                      <div className="min-w-0">
                        <Label className="font-semibold text-[11px] sm:text-xs block text-slate-900 dark:text-white">{label}</Label>
                        <p className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 truncate">{description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{formData[key].toFixed(2).replace(/[.,]00$/, "")}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">/5</span>
                    </div>
                  </div>
                  <div className={sliderClass + " mt-1.5 relative z-10"}>
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
                      disabled={false} />
                  </div>
                </div>);

            })}
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-2 sm:p-2.5 border border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 fill-amber-600" />
                <span className="font-semibold text-xs sm:text-sm text-amber-900">Note finale</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-xl font-bold text-amber-900">{calculateTotalRating(formData).toFixed(2).replace(/[.,]00$/, "")}</span>
                <span className="text-xs sm:text-sm text-amber-700">/20</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
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
                className="text-sm sm:text-base pb-8 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              
              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between gap-2 bg-white/95 dark:bg-slate-800/95 rounded px-1.5 py-1 checkbox-gradient-only">
                <div className="flex items-center gap-2">
                  <label htmlFor="is_anonymous_inline" className="flex items-center gap-1 cursor-pointer">
                    <Checkbox
                      id="is_anonymous_inline"
                      checked={formData.is_anonymous}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
                      className="h-3 w-3 checkbox-gradient-border"
                      disabled={false} />
                    <span className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300">Anonyme</span>
                  </label>

                  <label htmlFor="is_former_student_inline" className="flex items-center gap-1 cursor-pointer">
                    <Checkbox
                      id="is_former_student_inline"
                      checked={formData.is_former_student}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_former_student: checked })}
                      className="h-3 w-3 checkbox-gradient-border"
                      disabled={false} />
                    <span className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300">Ancien</span>
                  </label>
                </div>
                
                <span className={`text-[9px] whitespace-nowrap ${formData.comment.length >= MAX_COMMENT_LENGTH ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                  {formData.comment.length}/{MAX_COMMENT_LENGTH}
                </span>
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-blue-950/30 rounded-xl border-2 border-pink-200/80 dark:border-purple-700/50 checkbox-gradient-only cursor-pointer select-none"
            onClick={() => setFormData({ ...formData, certification: !formData.certification })}
          >
            <Checkbox
              id="certification"
              checked={formData.certification}
              onCheckedChange={(checked) => setFormData({ ...formData, certification: checked })}
              className="h-4 w-4 flex-shrink-0 checkbox-gradient-border pointer-events-none" />
            <label className="text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 leading-snug">
              Je certifie être responsable de mon avis
            </label>
          </div>

          {error && error !== "Tu as déjà publié un avis pour ce professeur." && (
          <Alert variant="destructive" className="text-destructive pt-4 pr-4 pb-4 pl-5 text-sm rounded-lg [&>svg]:top-4 relative w-full border [&>svg+div]:translate-y-[-1px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-1\\n2 [&>svg~*]:pl-7 border-destructive/50 dark:border-destructive [&>svg]:text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
          )}

          <DialogFooter>
            {error === "Tu as déjà publié un avis pour ce professeur." ? (
              <div className="w-full bg-red-50 border-2 border-red-300 rounded-md px-4 py-3 text-center">
                <p className="text-sm font-semibold text-red-700">Avis déjà publié pour ce professeur</p>
              </div>
            ) : (
              <Button
                type="submit"
                disabled={submitButtonDisabled}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground px-4 py-2 w-full bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 disabled:bg-slate-300 text-white text-xs sm:text-base h-9 sm:h-10 shadow-md"
              >
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