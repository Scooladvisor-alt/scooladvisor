import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Eye,
  Star,
  Loader2,
  User,
  ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function ReviewModeration() {
  const [loading, setLoading] = useState(true);
  const [allReviews, setAllReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [userViolations, setUserViolations] = useState({});

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const [teacherReviews, schoolReviews, allUsers] = await Promise.all([
        base44.entities.TeacherReview.list("-created_date", 50),
        base44.entities.SchoolReview.list("-created_date", 50),
        base44.entities.User.list()
      ]);

      const violations = {};
      allUsers.forEach(user => {
        violations[user.email] = {
          count: user.violation_count || 0,
          is_banned: user.is_banned || false,
          ban_reason: user.ban_reason
        };
      });
      setUserViolations(violations);

      const [teachers, schools] = await Promise.all([
        base44.entities.Teacher.list(),
        base44.entities.School.list()
      ]);

      const teachersMap = {};
      const schoolsMap = {};

      teachers.forEach(t => teachersMap[t.id] = t);
      schools.forEach(s => schoolsMap[s.id] = s);

      const enrichedTeacherReviews = teacherReviews.map(r => ({
        ...r,
        type: 'teacher',
        teacher: teachersMap[r.teacher_id],
        school: teachersMap[r.teacher_id] ? schoolsMap[teachersMap[r.teacher_id].school_id] : null
      }));

      const enrichedSchoolReviews = schoolReviews.map(r => ({
        ...r,
        type: 'school',
        school: schoolsMap[r.school_id]
      }));

      const combined = [...enrichedTeacherReviews, ...enrichedSchoolReviews]
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      setAllReviews(combined);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("Erreur lors du chargement des avis");
    }
    setLoading(false);
  };

  const handleViewDetail = (review) => {
    setSelectedReview(review);
    setShowDetailDialog(true);
  };

  const handleApproveReview = async (review) => {
    setActionLoading(true);
    try {
      if (review.type === 'teacher') {
        await base44.entities.TeacherReview.update(review.id, { status: 'published' });
      } else {
        await base44.entities.SchoolReview.update(review.id, { status: 'published' });
      }

      toast.success("Avis approuvé");
      await loadReviews();
      setShowDetailDialog(false);
    } catch (error) {
      console.error("Error approving review:", error);
      toast.error("Erreur lors de l'approbation");
    }
    setActionLoading(false);
  };

  const handleRejectReview = async (review) => {
    if (!confirm("Êtes-vous sûr de vouloir rejeter cet avis ?")) return;

    setActionLoading(true);
    try {
      if (review.type === 'teacher') {
        await base44.entities.TeacherReview.delete(review.id);
      } else {
        await base44.entities.SchoolReview.delete(review.id);
      }

      const currentViolations = userViolations[review.created_by]?.count || 0;
      const users = await base44.entities.User.filter({ email: review.created_by });
      if (users.length > 0) {
        const user = users[0];
        await base44.entities.User.update(user.id, {
          violation_count: currentViolations + 1
        });
      }

      await base44.entities.Notification.create({
        user_email: review.created_by,
        title: "Avis rejeté",
        message: `Votre avis a été rejeté par la modération. ${currentViolations + 1 >= 3 ? 'Votre compte a été banni.' : `Attention : ${3 - (currentViolations + 1)} avertissement(s) restant(s).`}`,
        type: "report",
        is_read: false
      });

      toast.success("Avis rejeté et utilisateur notifié");
      await loadReviews();
      setShowDetailDialog(false);
    } catch (error) {
      console.error("Error rejecting review:", error);
      toast.error("Erreur lors du rejet");
    }
    setActionLoading(false);
  };

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      toast.error("Veuillez spécifier une raison");
      return;
    }

    setActionLoading(true);
    try {
      const review = selectedReview;
      const users = await base44.entities.User.filter({ email: review.created_by });
      if (users.length > 0) {
        const user = users[0];
        await base44.entities.User.update(user.id, {
          is_banned: true,
          ban_reason: banReason
        });
      }

      if (review.type === 'teacher') {
        await base44.entities.TeacherReview.delete(review.id);
      } else {
        await base44.entities.SchoolReview.delete(review.id);
      }

      await base44.entities.Notification.create({
        user_email: review.created_by,
        title: "Compte banni",
        message: `Votre compte a été banni. Raison : ${banReason}`,
        type: "report",
        is_read: false
      });

      toast.success("Utilisateur banni");
      await loadReviews();
      setShowDetailDialog(false);
      setShowBanDialog(false);
      setBanReason("");
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Erreur lors du bannissement");
    }
    setActionLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            Tous les avis récents (50 derniers)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {allReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={review.status === 'published' ? 'default' : 'secondary'}>
                            {review.status}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {format(new Date(review.created_date), "d MMM yyyy HH:mm", { locale: fr })}
                          </span>
                        </div>

                        <div className="text-sm font-medium text-slate-900">
                          {review.type === 'teacher' 
                            ? `${review.teacher?.name} (${review.teacher?.subject})`
                            : review.school?.name}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <User className="w-3 h-3" />
                          {review.created_by}
                          {userViolations[review.created_by] && userViolations[review.created_by].count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {userViolations[review.created_by].count} violation(s)
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 line-clamp-1">{review.comment}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(review)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'avis</DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Badge>{selectedReview.type === 'teacher' ? 'Professeur' : 'Établissement'}</Badge>
              </div>

              <div className="space-y-2">
                <Label>Cible</Label>
                <p className="text-sm font-medium">
                  {selectedReview.type === 'teacher' 
                    ? `${selectedReview.teacher?.name} - ${selectedReview.teacher?.subject}`
                    : selectedReview.school?.name}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Auteur</Label>
                <div className="flex items-center gap-2">
                  <p className="text-sm">{selectedReview.created_by}</p>
                  {userViolations[selectedReview.created_by] && (
                    <div className="flex items-center gap-2">
                      <Badge variant={userViolations[selectedReview.created_by].count > 0 ? 'destructive' : 'default'}>
                        {userViolations[selectedReview.created_by].count} violation(s)
                      </Badge>
                      {userViolations[selectedReview.created_by].is_banned && (
                        <Badge variant="destructive">BANNI</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Note</Label>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-semibold">
                    {selectedReview.type === 'teacher' ? selectedReview.total_rating : selectedReview.rating}/20
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Commentaire</Label>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm">{selectedReview.comment}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date de création</Label>
                <p className="text-sm">{format(new Date(selectedReview.created_date), "PPpp", { locale: fr })}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleApproveReview(selectedReview)}
              disabled={actionLoading}
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approuver
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRejectReview(selectedReview)}
              disabled={actionLoading}
              className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeter
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowBanDialog(true)}
              disabled={actionLoading}
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Bannir utilisateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bannir l'utilisateur</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ban_reason">Raison du bannissement *</Label>
              <Textarea
                id="ban_reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Expliquez la raison du bannissement..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={actionLoading || !banReason.trim()}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirmer le bannissement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}