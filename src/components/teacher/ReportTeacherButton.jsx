import React, { useState } from "react";
import { TeacherStatusReport } from "@/entities/TeacherStatusReport";
import { TeacherFraudReport } from "@/entities/TeacherFraudReport";
import { Teacher } from "@/entities/Teacher";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, UserX, XCircle, Flag, Trash2, Heart, Star, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function ReportTeacherButton({ teacher, onUpdate, variant = "default" }) {
  const [showDialog, setShowDialog] = useState(false);
  const [reportType, setReportType] = useState("former");
  const [loading, setLoading] = useState(false);

  // Formulaire demande de suppression (je suis ce prof)
  const [showRemovalForm, setShowRemovalForm] = useState(false);
  const [removalSent, setRemovalSent] = useState(false);
  const [removalReason, setRemovalReason] = useState("");
  const [platformRating, setPlatformRating] = useState(0);
  const [removalMessage, setRemovalMessage] = useState("");
  const [removalFirstName, setRemovalFirstName] = useState("");
  const [removalLastName, setRemovalLastName] = useState("");
  const [removalEmail, setRemovalEmail] = useState("");
  const [removalAttest, setRemovalAttest] = useState(false);
  const [isConfirmedPerson, setIsConfirmedPerson] = useState(false);

  const handleReport = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      
      if (reportType === "former") {
        // Signaler comme ancien prof
        const existingReports = await TeacherStatusReport.filter({
          teacher_id: teacher.id,
          reporter_email: user.email
        });

        if (existingReports.length > 0) {
          toast.error("Vous avez déjà signalé ce professeur");
          setLoading(false);
          setShowDialog(false);
          return;
        }

        await TeacherStatusReport.create({
          teacher_id: teacher.id,
          reporter_email: user.email,
          reporter_id: user.id,
          reason: "Ne fait plus partie de l'établissement",
          status: "pending",
          teacher_name: teacher.name
        });

        const newCount = (teacher.status_report_count || 0) + 1;
        
        if (newCount >= 3) {
          await Teacher.update(teacher.id, {
            status_report_count: newCount,
            is_former: true
          });
          toast.success("Ce professeur a été marqué comme ancien professeur");
        } else {
          await Teacher.update(teacher.id, {
            status_report_count: newCount
          });
          toast.success("Signalement enregistré");
        }
      } else {
        // Signaler comme faux prof
        const existingFraudReports = await TeacherFraudReport.filter({
          teacher_id: teacher.id,
          reporter_email: user.email
        });

        if (existingFraudReports.length > 0) {
          toast.error("Vous avez déjà signalé ce professeur comme faux");
          setLoading(false);
          setShowDialog(false);
          return;
        }

        await TeacherFraudReport.create({
          teacher_id: teacher.id,
          reporter_email: user.email,
          reporter_id: user.id,
          reason: "Faux professeur",
          status: "pending",
          teacher_name: teacher.name
        });

        // Compter le nombre total de signalements fraude
        const allFraudReports = await TeacherFraudReport.filter({
          teacher_id: teacher.id
        });

        if (allFraudReports.length >= 3) {
          // Supprimer le professeur
          await Teacher.delete(teacher.id);
          toast.success("Ce professeur a été supprimé après vérification");
        } else {
          toast.success("Signalement enregistré");
        }
      }

      setShowDialog(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Erreur lors du signalement");
    }
    setLoading(false);
  };

  const handleRemovalRequest = async () => {
    if (!isConfirmedPerson) { toast.error("Confirmez d'abord que vous êtes la personne représentée."); return; }
    if (!removalFirstName.trim()) { toast.error("Veuillez indiquer votre prénom."); return; }
    if (!removalLastName.trim()) { toast.error("Veuillez indiquer votre nom."); return; }
    if (!removalEmail.trim() || !removalEmail.includes("@")) { toast.error("Veuillez indiquer une adresse email valide."); return; }
    if (!removalReason) { toast.error("Veuillez choisir une raison."); return; }
    if (!removalMessage.trim() || removalMessage.trim().length < 20) { toast.error("Veuillez détailler votre demande (20 caractères min)."); return; }
    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.TeacherRemovalRequest.create({
        teacher_id: teacher.id,
        teacher_name: teacher.name,
        requester_email: removalEmail,
        requester_id: user.id,
        removal_reason: removalReason,
        platform_rating: platformRating || null,
        message: `[${removalFirstName} ${removalLastName} — ${removalEmail}]\n${removalMessage}`,
        status: "pending"
      });
      setRemovalSent(true);
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la demande.");
    }
    setLoading(false);
  };

  return (
    <>
      {variant === "flag" ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDialog(true);
          }}
          className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
          title="Signaler ce professeur"
        >
          <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
          className="border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Signaler
        </Button>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) { setShowRemovalForm(false); setRemovalSent(false); setRemovalReason(""); setPlatformRating(0); setRemovalMessage(""); setRemovalFirstName(""); setRemovalLastName(""); setRemovalEmail(""); setRemovalAttest(false); setIsConfirmedPerson(false); } }}>
        <DialogContent className="max-w-[98vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#FF4D8D]" />
              <span className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 bg-clip-text text-transparent">
                {showRemovalForm ? "Demande de suppression de profil" : "Signaler ce professeur"}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Formulaire de suppression (je suis ce prof) */}
          {showRemovalForm ? (
            removalSent ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 text-green-600 fill-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Demande reçue avec ❤️</h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">
                  Notre équipe va examiner votre demande dans les meilleurs délais. Nous vous contacterons à l'adresse indiquée si besoin.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Scooladvisor est une communauté qui valorise la bienveillance et le respect. On te souhaite le meilleur.
                </p>
                <Button onClick={() => setShowDialog(false)} className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white">
                  Fermer
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Confirmation d'identité — case cocher avant tout */}
                <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isConfirmedPerson ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-white hover:border-green-300 hover:bg-green-50/30'}`}
                  onClick={() => setIsConfirmedPerson(!isConfirmedPerson)}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isConfirmedPerson}
                      onCheckedChange={setIsConfirmedPerson}
                      className="mt-1 flex-shrink-0 w-5 h-5"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 text-sm">Je pense être la personne représentée par ce profil</p>
                      <p className="text-xs text-slate-500 mt-1">Cette case est obligatoire pour continuer. Confirme que tu es la personne concernée avant de détailler ta demande.</p>
                    </div>
                  </div>
                </div>

                {/* Reste du formulaire — désactivé tant qu'on n'a pas coché */}
                <div className={`space-y-4 ${!isConfirmedPerson ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Identité */}
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-3">Vos informations <span className="text-red-500">*</span></p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label className="text-xs text-slate-500 mb-1 block">Prénom</Label>
                        <Input value={removalFirstName} onChange={(e) => setRemovalFirstName(e.target.value)} placeholder="Prénom" disabled={!isConfirmedPerson} />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 mb-1 block">Nom</Label>
                        <Input value={removalLastName} onChange={(e) => setRemovalLastName(e.target.value)} placeholder="Nom" disabled={!isConfirmedPerson} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1 block">Adresse e-mail</Label>
                      <Input type="email" value={removalEmail} onChange={(e) => setRemovalEmail(e.target.value)} placeholder="votre@email.com" disabled={!isConfirmedPerson} />
                    </div>
                  </div>

                  {/* Raison */}
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-3">Motif de la demande <span className="text-red-500">*</span></p>
                    <RadioGroup value={removalReason} onValueChange={setRemovalReason} className="space-y-2">
                      {[
                        { value: "informations_incorrectes", label: "Les informations affichées ne semblent pas exactes" },
                        { value: "autre", label: "Simplement gêné(e) que mon nom apparaisse sur la plateforme" },
                        { value: "avis_diffamatoires", label: "Certains avis me semblent injustes ou inappropriés" },
                      ].map((opt) => (
                        <div key={opt.value} className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${removalReason === opt.value ? 'border-pink-400 bg-pink-50' : 'border-slate-200 hover:border-pink-200 hover:bg-pink-50/30'}`}>
                          <RadioGroupItem value={opt.value} id={opt.value} className="mt-0.5" />
                          <Label htmlFor={opt.value} className="cursor-pointer text-sm text-slate-800">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Message libre */}
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Informations complémentaires <span className="text-red-500">*</span></p>
                    <Textarea
                      value={removalMessage}
                      onChange={(e) => setRemovalMessage(e.target.value)}
                      placeholder="Explique ta situation en quelques mots..."
                      rows={3}
                      className="resize-none"
                      disabled={!isConfirmedPerson}
                    />
                    <p className="text-xs text-slate-400 mt-1">{removalMessage.length} caractères (20 min)</p>
                  </div>

                  {/* Message bienveillance */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      💙 <span className="font-semibold">Scooladvisor</span> est une plateforme bienveillante fondée sur la confiance et l'authenticité. Nous examinons chaque demande avec sérieux et respect, en veillant à soutenir une communauté positive et constructive pour tous.
                    </p>
                  </div>

                  {/* Note plateforme */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Quelle note donnez-vous à Scooladvisor ? <span className="text-slate-400">(optionnel)</span></p>
                    <div className="flex gap-1.5 flex-wrap">
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <button
                          key={n}
                          onClick={() => setPlatformRating(n)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold border-2 transition-all ${platformRating === n ? 'bg-gradient-to-br from-[#FF4D8D] to-purple-500 text-white border-pink-400' : 'border-slate-200 text-slate-600 hover:border-pink-300'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setShowRemovalForm(false)}>Retour</Button>
                  <Button
                    onClick={handleRemovalRequest}
                    disabled={loading || !isConfirmedPerson}
                    className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 text-white font-semibold disabled:opacity-50"
                  >
                    {loading ? "Envoi..." : "Envoyer ma demande"}
                  </Button>
                </DialogFooter>
              </div>
            )
          ) : (
            <>
              <RadioGroup value={reportType} onValueChange={setReportType} className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer">
                  <RadioGroupItem value="former" id="former" className="mt-1 border-amber-400 text-amber-600" />
                  <div className="flex-1">
                    <Label htmlFor="former" className="font-medium text-slate-900 cursor-pointer flex items-center gap-2 text-sm sm:text-base">
                      <UserX className="w-4 h-4 text-amber-600" />
                      Ne fait plus partie de l'établissement
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-red-200 bg-red-50/40 hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer">
                  <RadioGroupItem value="fraud" id="fraud" className="mt-1 border-red-400 text-red-600" />
                  <div className="flex-1">
                    <Label htmlFor="fraud" className="font-medium text-slate-900 cursor-pointer flex items-center gap-2 text-sm sm:text-base">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Ce n'est pas un vrai professeur
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {/* 3ème option — je suis ce prof */}
              <div
                onClick={() => setShowRemovalForm(true)}
                className="flex items-start space-x-3 p-3 rounded-lg border-2 border-pink-200 bg-pink-50/40 hover:bg-pink-50 hover:border-pink-300 transition-all cursor-pointer"
              >
                <div className="mt-1 w-4 h-4 rounded-full border-2 border-pink-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                    <Trash2 className="w-4 h-4 text-pink-600" />
                    Je suis ce professeur et je souhaite supprimer mon profil
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Uniquement si vous êtes directement concerné(e)</p>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  Les faux signalements peuvent entraîner la suspension de votre compte.
                </AlertDescription>
              </Alert>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="text-xs sm:text-sm">
                  Annuler
                </Button>
                <Button
                  onClick={handleReport}
                  disabled={loading}
                  className="bg-gradient-to-r from-[#FF4D8D] via-purple-500 to-blue-500 hover:from-[#FF4D8D]/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-md text-xs sm:text-sm font-semibold"
                >
                  {loading ? "Signalement..." : "Confirmer le signalement"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}