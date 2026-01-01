import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { security } from "../shared/security";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Plus, ChevronDown } from "lucide-react";

const predefinedSubjects = [
"Français",
"Mathématiques",
"Histoire-Géographie",
"Enseignement moral et civique",
"Anglais",
"Espagnol",
"Allemand",
"Sciences de la Vie et de la Terre (SVT)",
"Physique-Chimie",
"Technologie",
"Éducation physique et sportive (EPS)",
"Arts plastiques",
"Éducation musicale",
"Philosophie",
"Sciences économiques et sociales (SES)",
"Numérique et sciences informatiques",
"Droit",
"Management",
"Sciences de gestion et numérique"];


const teacherAvatars = [
  { id: 'avatar1', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/e9adea65a_3d-stylized-portrait-of-a-40-year-old-french-femal1.png", name: "Avatar 1" },
  { id: 'avatar2', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/ee3b6a834_3d-stylized-portrait-of-a-40-year-old-french-femal.png", name: "Avatar 2" },
  { id: 'avatar3', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/21140f986_3d-stylized-portrait-of-a-40-year-old-french-male-1.png", name: "Avatar 3" },
  { id: 'avatar4', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/9c2debfb2_3d-stylized-portrait-of-a-40-year-old-french-male-.png", name: "Avatar 4" },
  { id: 'avatar5', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/6477234f2_3d-stylized-portrait-of-a-47-year-old-french-femal.png", name: "Avatar 5" },
  { id: 'avatar6', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/4ad46a841_a-3d-stylized-character-designed-as-a-wise--clever.png", name: "Avatar 6" },
  { id: 'avatar7', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/8548ab7bc_a-3d-stylized-character-of-a-distinguished-senior-.png", name: "Avatar 7" },
  { id: 'avatar8', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/2df7514e1_a-3d-stylized-character-of-a-far-left-male-profess1.png", name: "Avatar 8" },
  { id: 'avatar9', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/cb005e0e3_a-3d-stylized-character-of-a-far-left-male-profess.png", name: "Avatar 9" },
  { id: 'avatar10', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/bfb28ca03_a-3d-stylized-character-of-a-mature-black-female-p.png", name: "Avatar 10" },
  { id: 'avatar11', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1df71def2_a-3d-stylized-character-of-a-middle-aged-bald-male.png", name: "Avatar 11" },
  { id: 'avatar12', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/3401f44f9_a-3d-stylized-character-of-a-middle-aged-male-prof1.png", name: "Avatar 12" },
  { id: 'avatar13', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/8df82aac9_a-3d-stylized-character-of-a-middle-aged-male-prof.png", name: "Avatar 13" },
  { id: 'avatar14', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d543c99da_a-3d-stylized-character-of-a-young-black-female-pr.png", name: "Avatar 14" },
  { id: 'avatar15', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/3f9e2d766_a-3d-stylized-character-of-a-young-male-professor-.png", name: "Avatar 15" },
  { id: 'avatar16', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1635b03d7_a-3d-stylized-character-of-a-young-progressive-mal.png", name: "Avatar 16" },
  { id: 'avatar17', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1db025fc3_a-3d-stylized-character-of-an-elderly-male-profess.png", name: "Avatar 17" },
  { id: 'avatar18', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/00300b279_a-3d-stylized-character-unpeu-de-cheveux-of-a-youn.png", name: "Avatar 18" },
  { id: 'avatar19', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/74fa7afa3_a-3d-stylized-male-character-representing-a-black-1.png", name: "Avatar 19" },
  { id: 'avatar20', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/095c14bd5_a-3d-stylized-male-character-representing-a-black-.png", name: "Avatar 20" },
  { id: 'avatar21', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/724bfaeea_a-3d-stylized-male-character-representing-a-young-.png", name: "Avatar 21" },
  { id: 'avatar22', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/87dfbfbe1_a-3d-stylized-portrait-of-a-40-year-old-french-wom.png", name: "Avatar 22" },
  { id: 'avatar23', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/9ca4c4bc1_a-3d-stylized-portrait-of-a-51-year-old-french-wom.png", name: "Avatar 23" },
  { id: 'avatar24', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/38510b2d8_a-3d-stylized-portrait-of-a-55-year-old-french-fem.png", name: "Avatar 24" },
  { id: 'avatar25', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/7f487a938_a-3d-stylized-portrait-of-a-75-year-old-obese-fema.png", name: "Avatar 25" },
  { id: 'avatar26', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/2f1a80b2d_a-3d-stylized-portrait-of-a-young-french-male-prof.png", name: "Avatar 26" },
  { id: 'avatar27', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/4d5fc138f_a-high-quality-3d-semi-realistic-avatar-of-a-50-wo.png", name: "Avatar 27" },
  { id: 'avatar28', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/4fdcd180b_a-high-quality-3d-semi-realistic-hrender-of-a-wise.png", name: "Avatar 28" },
  { id: 'avatar29', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/844474e63_a-high-quality-3d-stylized-character-of-a-senior-b.png", name: "Avatar 29" },
  { id: 'avatar30', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/c4f7b9868_a-professional-front-facing-portrait-of-a-35-50-ye.png", name: "Avatar 30" }
];


export default function AddTeacherDialog({ open, onOpenChange, schoolId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [showMoreAvatars, setShowMoreAvatars] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    customSubject: "",
    photo_url: teacherAvatars.length > 0 ? teacherAvatars[0].url : "",
    is_former: false
  });

  const checkTeacherLimits = async () => {
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return { ok: false, message: "Utilisateur non authentifié." };
    }

    if (user.email === 'antownin@gmail.com') {
      return { ok: true, userEmail: user.email };
    }

    const teachersInSchool = await base44.entities.Teacher.filter({
      school_id: schoolId,
      created_by: user.email
    });

    if (teachersInSchool.length >= 5) {
      return { ok: false, message: "Vous avez déjà ajouté 5 professeurs dans cet établissement. Maximum 5 par établissement." };
    }

    const allTeachers = await base44.entities.Teacher.filter({
      created_by: user.email
    });

    if (allTeachers.length >= 10) {
      return { ok: false, message: "Vous avez atteint la limite de 10 professeurs ajoutés au total." };
    }

    return { ok: true, userEmail: user.email };
  };

  const sendToModerationWebhook = async (teacherData) => {
    try {
      const response = await fetch('https://n8n.srv996204.hstgr.cloud/webhook/fea1f7e8-a1c0-40fb-a64b-c330dbe1e73d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'teacher_creation',
          teacher_id: teacherData.id,
          teacher_name: teacherData.name,
          subject: teacherData.subject,
          school_id: schoolId,
          created_by: teacherData.created_by,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();
      const action = result?.output?.action || result?.action;

      if (action === 'delete') {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending to moderation webhook:", error);
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // SECURITY: Check Permissions
    const user = await base44.auth.me();
    if (!security.canPost(user)) {
      setError("Action non autorisée.");
      setLoading(false);
      return;
    }

    const limitCheck = await checkTeacherLimits();
    if (!limitCheck.ok) {
      setError(limitCheck.message);
      setLoading(false);
      return;
    }

    // SECURITY: Sanitize inputs
    const cleanName = security.sanitize(formData.name);
    const finalSubjectRaw = showCustomSubject ? formData.customSubject : formData.subject;
    const cleanSubject = security.sanitize(finalSubjectRaw);

    if (!cleanSubject || !cleanName) {
      setError("Veuillez vérifier les champs (caractères interdits détectés).");
      setLoading(false);
      return;
    }

    // SECURITY: Anti-Duplicate Check
    const duplicateCheck = await base44.entities.Teacher.filter({
      school_id: schoolId,
      name: cleanName
    });

    if (duplicateCheck.length > 0) {
      setError("Ce professeur existe déjà dans cet établissement.");
      setLoading(false);
      return;
    }

    try {
      const tempTeacher = {
        name: cleanName,
        subject: cleanSubject,
        school_id: schoolId,
        created_by: limitCheck.userEmail,
        id: 'temp-' + Date.now()
      };

      const isApproved = await sendToModerationWebhook(tempTeacher);

      if (!isApproved) {
        setError("Cette demande d'ajout de professeur a été refusée par la modération. Merci de vérifier les informations.");
        setLoading(false);
        return;
      }

      const newTeacher = await base44.entities.Teacher.create({
        school_id: schoolId,
        name: cleanName,
        subject: cleanSubject,
        photo_url: formData.photo_url,
        status: "approved",
        average_rating: 0,
        workload_avg: 0,
        friendliness_avg: 0,
        teaching_avg: 0,
        grading_avg: 0,
        review_count: 0,
        status_report_count: 0,
        is_former: formData.is_former
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setFormData({ name: "", subject: "", customSubject: "", photo_url: teacherAvatars.length > 0 ? teacherAvatars[0].url : "", is_former: false });
        setShowCustomSubject(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error creating teacher:", err);
      setError("Erreur lors de l'ajout du professeur: " + (err.message || ""));
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl
        [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 
        [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full 
        [&::-webkit-scrollbar-thumb]:hover:bg-gray-500">






        <DialogHeader>
          <DialogTitle className="text-lg sm:text-2xl font-bold">
            <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Ajouter un professeur
            </span>
          </DialogTitle>
        </DialogHeader>

        {success &&
        <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-xs sm:text-sm">
              ✅ Professeur ajouté avec succès !
            </AlertDescription>
          </Alert>
        }

        {error &&
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        }

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Nom du professeur *</Label>
            <div className="flex items-center gap-3">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="M. Dupont"
                className="h-9 sm:h-10 text-xs sm:text-sm flex-1" />
              <div className="flex items-center gap-2 bg-gradient-to-r from-pink-50 to-blue-50 px-3 py-2 rounded-lg border border-pink-200">
                <input
                  type="checkbox"
                  id="is_former"
                  checked={formData.is_former}
                  onChange={(e) => setFormData({ ...formData, is_former: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                <label htmlFor="is_former" className="text-xs font-medium text-orange-800 whitespace-nowrap cursor-pointer">
                  Ancien prof
                </label>
              </div>
            </div>
          </div>

          {!showCustomSubject ?
          <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="subject" className="text-xs sm:text-sm">Matière enseignée *</Label>
              <Select
              value={formData.subject}
              onValueChange={(value) => {
                if (value === "__add_custom__") {
                  setShowCustomSubject(true);
                  setFormData({ ...formData, subject: "" });
                } else {
                  setFormData({ ...formData, subject: value });
                }
              }}>

                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Sélectionnez une matière" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem
                  value="__add_custom__"
                  className="bg-gradient-to-r from-pink-50 to-rose-50 border-b-2 border-pink-200 font-semibold text-pink-700 hover:bg-pink-100">

                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Ajouter une autre matière
                    </div>
                  </SelectItem>
                  {predefinedSubjects.map((subject) =>
                <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                )}
                </SelectContent>
              </Select>
            </div> :

          <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="customSubject" className="text-xs sm:text-sm">Autre matière *</Label>
              <Input
              id="customSubject"
              value={formData.customSubject}
              onChange={(e) => setFormData({ ...formData, customSubject: e.target.value })}
              required
              placeholder="Entrez le nom de la matière"
              className="h-9 sm:h-10 text-xs sm:text-sm" />

              <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCustomSubject(false);
                setFormData({ ...formData, customSubject: "" });
              }}
              className="w-full h-8 text-xs">

                Retour aux matières prédéfinies
              </Button>
            </div>
          }

          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Avatar du professeur</Label>
            <div className="w-full bg-slate-50 rounded-lg p-2 sm:p-3 border border-slate-200">
              {teacherAvatars.length > 0 ? (
                <div className="grid grid-cols-6 gap-1.5 sm:gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {teacherAvatars.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, photo_url: avatar.url })}
                      className={`p-1 rounded-lg border-2 transition-all ${
                        formData.photo_url === avatar.url ?
                        'border-blue-600 bg-blue-50 shadow-md' :
                        'border-slate-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-full h-10 sm:h-16 md:h-20 object-contain rounded-md" 
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs sm:text-sm italic">
                  Aucun avatar disponible pour le moment.
                  <br />
                  Ils seront bientôt ajoutés ! 📸
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-xs sm:text-sm h-8 sm:h-10">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground px-4 py-2 bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-xs sm:text-sm h-8 sm:h-10 text-white shadow-md">
              {loading ? "Envoi..." : "Ajouter le professeur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);

}