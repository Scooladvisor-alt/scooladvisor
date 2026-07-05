import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Linkedin,
  Briefcase,
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const emptyEntry = { type: "education", title: "", organization: "", period: "", description: "" };

export default function CareerSection({ user, onUpdate }) {
  const [showLinkedinDialog, setShowLinkedinDialog] = useState(false);
  const [linkedinInput, setLinkedinInput] = useState(user.linkedin_url || "");
  const [savingLinkedin, setSavingLinkedin] = useState(false);

  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [entryDraft, setEntryDraft] = useState(emptyEntry);
  const [editingIndex, setEditingIndex] = useState(null);
  const [savingEntry, setSavingEntry] = useState(false);

  const entries = user.career_entries || [];

  const saveLinkedin = async () => {
    setSavingLinkedin(true);
    try {
      const cleaned = linkedinInput.trim();
      await base44.auth.updateMe({ linkedin_url: cleaned });
      await onUpdate();
      setShowLinkedinDialog(false);
      toast.success("Lien LinkedIn enregistré !");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement du lien.");
    }
    setSavingLinkedin(false);
  };

  const openAddEntry = () => {
    setEntryDraft(emptyEntry);
    setEditingIndex(null);
    setShowEntryDialog(true);
  };

  const openEditEntry = (index) => {
    setEntryDraft({ ...emptyEntry, ...entries[index] });
    setEditingIndex(index);
    setShowEntryDialog(true);
  };

  const saveEntry = async () => {
    if (!entryDraft.title.trim() || !entryDraft.organization.trim()) {
      toast.error("Renseigne au moins l'intitulé et l'établissement/entreprise.");
      return;
    }
    setSavingEntry(true);
    try {
      const next = [...entries];
      if (editingIndex !== null) {
        next[editingIndex] = entryDraft;
      } else {
        next.push(entryDraft);
      }
      await base44.auth.updateMe({ career_entries: next });
      await onUpdate();
      setShowEntryDialog(false);
      toast.success("Parcours mis à jour !");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement.");
    }
    setSavingEntry(false);
  };

  const deleteEntry = async (index) => {
    try {
      const next = entries.filter((_, i) => i !== index);
      await base44.auth.updateMe({ career_entries: next });
      await onUpdate();
      toast.success("Entrée supprimée.");
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-4">
      {/* LinkedIn */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {user.linkedin_url ? (
          <a
            href={user.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] font-medium hover:bg-[#0A66C2]/20 transition-colors text-sm"
          >
            <Linkedin className="w-4 h-4" />
            Voir mon LinkedIn
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="text-sm text-slate-500 dark:text-slate-400">Aucun LinkedIn connecté</span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setLinkedinInput(user.linkedin_url || ""); setShowLinkedinDialog(true); }}
          className="text-xs dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
        >
          <Linkedin className="w-3.5 h-3.5 mr-1.5" />
          {user.linkedin_url ? "Modifier" : "Connecter LinkedIn"}
        </Button>
      </div>

      {/* Parcours */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mon parcours</h4>
        <Button
          size="sm"
          onClick={openAddEntry}
          className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white text-xs h-8"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Ajouter
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Ajoute tes formations et expériences pour montrer ton parcours.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <Card key={index} className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
              <CardContent className="p-3 flex items-start gap-3">
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${entry.type === "education" ? "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300" : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300"}`}>
                  {entry.type === "education" ? <GraduationCap className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">{entry.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {entry.type === "education" ? "Formation" : "Expérience"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{entry.organization}</p>
                  {entry.period && <p className="text-[11px] text-slate-400 dark:text-slate-500">{entry.period}</p>}
                  {entry.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{entry.description}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => openEditEntry(index)} className="text-slate-400 hover:text-purple-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteEntry(index)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog LinkedIn */}
      <Dialog open={showLinkedinDialog} onOpenChange={setShowLinkedinDialog}>
        <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0A66C2]">
              <Linkedin className="w-5 h-5" />
              Connecter LinkedIn
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">URL de ton profil LinkedIn</label>
            <Input
              value={linkedinInput}
              onChange={(e) => setLinkedinInput(e.target.value)}
              placeholder="https://www.linkedin.com/in/ton-profil"
              className="dark:bg-slate-900 dark:text-white dark:border-slate-600"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowLinkedinDialog(false)} className="dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
              Annuler
            </Button>
            <Button onClick={saveLinkedin} disabled={savingLinkedin} className="bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white">
              {savingLinkedin ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Entrée parcours */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingIndex !== null ? "Modifier l'entrée" : "Ajouter au parcours"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={entryDraft.type === "education" ? "default" : "outline"}
                onClick={() => setEntryDraft({ ...entryDraft, type: "education" })}
                className={`flex-1 text-xs ${entryDraft.type === "education" ? "bg-purple-600 text-white" : "dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"}`}
              >
                <GraduationCap className="w-4 h-4 mr-1" /> Formation
              </Button>
              <Button
                type="button"
                variant={entryDraft.type === "experience" ? "default" : "outline"}
                onClick={() => setEntryDraft({ ...entryDraft, type: "experience" })}
                className={`flex-1 text-xs ${entryDraft.type === "experience" ? "bg-blue-600 text-white" : "dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"}`}
              >
                <Briefcase className="w-4 h-4 mr-1" /> Expérience
              </Button>
            </div>
            <Input
              value={entryDraft.title}
              onChange={(e) => setEntryDraft({ ...entryDraft, title: e.target.value })}
              placeholder={entryDraft.type === "education" ? "Diplôme (ex: Master Marketing)" : "Poste (ex: Chef de projet)"}
              className="dark:bg-slate-900 dark:text-white dark:border-slate-600"
            />
            <Input
              value={entryDraft.organization}
              onChange={(e) => setEntryDraft({ ...entryDraft, organization: e.target.value })}
              placeholder={entryDraft.type === "education" ? "Établissement" : "Entreprise"}
              className="dark:bg-slate-900 dark:text-white dark:border-slate-600"
            />
            <Input
              value={entryDraft.period}
              onChange={(e) => setEntryDraft({ ...entryDraft, period: e.target.value })}
              placeholder="Période (ex: 2020 - 2023)"
              className="dark:bg-slate-900 dark:text-white dark:border-slate-600"
            />
            <Textarea
              value={entryDraft.description}
              onChange={(e) => setEntryDraft({ ...entryDraft, description: e.target.value })}
              placeholder="Description (optionnel)"
              rows={2}
              className="dark:bg-slate-900 dark:text-white dark:border-slate-600"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEntryDialog(false)} className="dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
              Annuler
            </Button>
            <Button onClick={saveEntry} disabled={savingEntry} className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white">
              {savingEntry ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}