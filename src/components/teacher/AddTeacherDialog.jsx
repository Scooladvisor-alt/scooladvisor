import React, { useState, useEffect } from "react";
import { Teacher } from "@/entities/Teacher";
import { CustomSubject } from "@/entities/CustomSubject";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, PlusCircle } from "lucide-react";

export default function AddTeacherDialog({ open, onOpenChange, schoolId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: ""
  });
  const [subjects, setSubjects] = useState([]);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => {
    if (open) {
      loadSubjects();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({ name: "", subject: "" });
    setError(null);
    setShowNewSubject(false);
    setNewSubject("");
  };

  const loadSubjects = async () => {
    const defaultSubjects = ["Mathématiques", "Physique", "Français", "Anglais", "Histoire", "Géographie", "SVT"];
    try {
      const customSubjects = await CustomSubject.list();
      setSubjects([...defaultSubjects, ...customSubjects.map(s => s.name)]);
    } catch (e) {
      setSubjects(defaultSubjects);
    }
  };

  const handleAddNewSubject = async () => {
    if (newSubject.trim().length > 2) {
      await CustomSubject.create({ name: newSubject.trim() });
      await loadSubjects();
      setFormData({ ...formData, subject: newSubject.trim() });
      setShowNewSubject(false);
      setNewSubject("");
    }
  };

  const checkTeacherLimits = async () => {
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return { ok: false, message: "Utilisateur non authentifié." };
    }
    
    if (user.email === 'antownin@gmail.com') {
      return { ok: true, userEmail: user.email };
    }
    
    const teachersInSchool = await Teacher.filter({
      school_id: schoolId,
      created_by: user.email
    });
    
    if (teachersInSchool.length >= 1) {
      return { ok: false, message: "Vous avez déjà ajouté 1 professeur dans cet établissement. Maximum 1 par établissement." };
    }
    
    const allTeachers = await Teacher.filter({
      created_by: user.email
    });
    
    if (allTeachers.length >= 5) {
      return { ok: false, message: "Vous avez atteint la limite de 5 professeurs ajoutés au total." };
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
        await Teacher.delete(teacherData.id);
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
    
    const limitCheck = await checkTeacherLimits();
    if (!limitCheck.ok) {
      setError(limitCheck.message);
      setLoading(false);
      return;
    }

    try {
      const newTeacher = await Teacher.create({
        school_id: schoolId,
        name: formData.name,
        subject: formData.subject,
        status: "approved",
        average_rating: 0,
        review_count: 0
      });

      const isApproved = await sendToModerationWebhook(newTeacher);

      if (!isApproved) {
        setError("Cette demande d'ajout a été refusée par notre système de modération.");
        setLoading(false);
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError("Erreur lors de l'ajout du professeur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau professeur</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du professeur</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Matière enseignée</Label>
            <Select
              value={formData.subject}
              onValueChange={(value) => setFormData({ ...formData, subject: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une matière" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowNewSubject(!showNewSubject)}
            className="text-blue-600 hover:text-blue-700"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Ajouter une nouvelle matière
          </Button>

          {showNewSubject && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nom de la nouvelle matière"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              <Button type="button" onClick={handleAddNewSubject}>Ajouter</Button>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.subject}>
              {loading ? "Ajout..." : "Ajouter le professeur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}