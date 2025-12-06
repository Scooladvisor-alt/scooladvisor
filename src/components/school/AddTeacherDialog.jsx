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
{ id: 'teacher1', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/6242bec45_a-3d-stylized-character-designed-as-a-modern--clev.png", name: "Prof 1" },
{ id: 'teacher2', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/c672e9a49_a-confident-and-clever-female-professor-with-brigh.png", name: "Prof 2" },
{ id: 'teacher3', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/b17bde77c_a-3d-stylized-character-designed-as-a-wise--clever.png", name: "Prof 3" },
{ id: 'teacher4', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/d4a68d2a3_a-3d-stylized-character-designed-as-an-experienced.png", name: "Prof 4" },
{ id: 'teacher5', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/2b9f3fb6d_a-young--expressive-female-professor-with-short-or-2.png", name: "Prof 5" },
{ id: 'teacher6', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/5bcfdc746_a-young--expressive-female-professor-with-short-or-3.png", name: "Prof 6" },
{ id: 'teacher7', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/a07c73e8b_a-3d-stylized-male-character-representing-a-prof-.png", name: "Prof 7" },
{ id: 'teacher8', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/962da596e_a-3d-stylized-character-of-a-middle-aged-bald-male.png", name: "Prof 8" },
{ id: 'teacher9', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/758c3f628_a-3d-stylized-character-of-a-middle-aged-blonde-fe.png", name: "Prof 9" },
{ id: 'teacher10', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/1ff02d2e8_a-3d-stylized-character-of-a-mature-female-profess.png", name: "Prof 10" },
{ id: 'teacher11', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/7d26ed436_a-3d-stylized-character-designed-as-an-experienced.png", name: "Prof 11" },
{ id: 'teacher12', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/0963162b7_3d-stylized-character-designed-as-an-experienced--.png", name: "Prof 12" },
{ id: 'teacher13', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/ea41f3042_3d-stylized-portrait-of-a-40-year-old-french-femal.png", name: "Prof 13" },
{ id: 'teacher14', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/00ea97ada_3d-stylized-portrait-of-a-40-year-old-french-male-.png", name: "Prof 14" },
{ id: 'teacher15', url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e56a6378dcdf368ceea549/830c78bd6_3d-stylized-portrait-of-a-40-year-old-french-femal-2.png", name: "Prof 15" }];


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
    photo_url: teacherAvatars[0].url,
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
        setFormData({ name: "", subject: "", customSubject: "", photo_url: teacherAvatars[0].url, is_former: false });
        setShowCustomSubject(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error creating teacher:", err);
      setError("Erreur lors de l'ajout du professeur: " + (err.message || ""));
    }
    setLoading(false);
  };

  const displayedAvatars = showMoreAvatars ? teacherAvatars : teacherAvatars.slice(0, 10);

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
              <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
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
              <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                {displayedAvatars.map((avatar) =>
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, photo_url: avatar.url })}
                  className={`p-1 rounded-lg border-2 transition-all ${
                  formData.photo_url === avatar.url ?
                  'border-blue-600 bg-blue-50 shadow-md' :
                  'border-slate-200 hover:border-blue-300 bg-white'}`
                  }>

                    <img
                    src={avatar.url}
                    alt={avatar.name}
                    className="w-full h-10 sm:h-16 md:h-20 object-contain rounded-md" />

                  </button>
                )}
              </div>
              
              {!showMoreAvatars &&
              <button
                type="button"
                onClick={() => setShowMoreAvatars(true)}
                className="w-full mt-2 flex items-center justify-center gap-1 text-blue-600 hover:text-blue-700 text-xs py-1">

                  <span>voir les autres</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              }
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