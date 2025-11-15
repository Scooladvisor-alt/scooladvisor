import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserX, UserCheck, Loader2, Mail, AlertCircle, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const formatDateWithTimezone = (dateString, formatStr) => {
  const date = new Date(dateString);
  return format(date, formatStr, { locale: fr });
};

export default function BannedUsers({ onUpdate }) {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    loadBannedUsers();
  }, []);

  const loadBannedUsers = async () => {
    setLoading(true);
    try {
      const users = await base44.entities.User.filter({ is_banned: true }, "-updated_date");
      setBannedUsers(users);
    } catch (error) {
      console.error("Error loading banned users:", error);
      toast.error("Erreur lors du chargement des utilisateurs bannis");
    }
    setLoading(false);
  };

  const loadUserReviews = async (userEmail) => {
    setLoadingReviews(true);
    try {
      const [teacherReviews, schoolReviews, chatMessages, nationalMessages] = await Promise.all([
        base44.entities.TeacherReview.filter({ created_by: userEmail }).catch(() => []),
        base44.entities.SchoolReview.filter({ created_by: userEmail }).catch(() => []),
        base44.entities.ChatMessage.filter({ author_email: userEmail }).catch(() => []),
        base44.entities.NationalMessage.filter({ author_email: userEmail }).catch(() => [])
      ]);
      
      const allReviews = [
        ...teacherReviews.map(r => ({ ...r, type: 'teacher' })),
        ...schoolReviews.map(r => ({ ...r, type: 'school' })),
        ...chatMessages.map(m => ({ ...m, type: 'chat_message' })),
        ...nationalMessages.map(m => ({ ...m, type: 'national_message' }))
      ];
      
      allReviews.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      setUserReviews(allReviews);
    } catch (error) {
      console.error("Error loading user reviews:", error);
      toast.error("Erreur lors du chargement des avis");
    }
    setLoadingReviews(false);
  };

  const handleShowDetails = async (user) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
    await loadUserReviews(user.email);
  };

  const handleUnban = async (user) => {
    if (!confirm(`Êtes-vous sûr de vouloir débannir ${user.full_name || user.email} ?`)) return;

    try {
      await base44.entities.User.update(user.id, {
        is_banned: false,
        ban_reason: null,
        violation_count: 0
      });

      await base44.entities.Notification.create({
        user_email: user.email,
        title: "Compte réactivé",
        message: "Votre compte a été réactivé. Vous pouvez de nouveau accéder à la plateforme.",
        type: "report",
        is_read: false
      });

      toast.success("Utilisateur débanni avec succès");
      setShowDetailsDialog(false);
      loadBannedUsers();
      onUpdate();
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("Erreur lors du débannissement");
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center flex justify-center items-center">
          <Loader2 className="w-8 h-8 mr-2 text-slate-400 animate-spin" />
          <p className="text-slate-600">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (bannedUsers.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <UserCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900">Aucun utilisateur banni</h3>
          <p className="text-slate-600">Tous les utilisateurs ont accès à la plateforme</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              Utilisateurs bannis ({bannedUsers.length})
            </CardTitle>
          </CardHeader>
        </Card>

        {bannedUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-red-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">BANNI</Badge>
                      {user.violation_count > 0 && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {user.violation_count} violation(s)
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg text-slate-900">{user.full_name}</h3>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>

                    {user.ban_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-red-900 mb-1">Raison du bannissement :</p>
                            <p className="text-sm text-red-800">{user.ban_reason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>Inscrit le : {formatDateWithTimezone(user.created_date, "d MMM yyyy")}</span>
                      {user.updated_date && (
                        <>
                          <span>•</span>
                          <span>Dernière MAJ : {formatDateWithTimezone(user.updated_date, "d MMM yyyy 'à' HH:mm")}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleShowDetails(user)}
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir pourquoi
                    </Button>
                    <Button
                      onClick={() => handleUnban(user)}
                      className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                      size="sm"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Débannir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              Détails du bannissement - {selectedUser?.full_name}
            </DialogTitle>
            <DialogDescription>
              Voici tous les avis publiés par cet utilisateur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User Info */}
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-3">
                  <Badge variant="destructive" className="text-sm">BANNI</Badge>
                  {selectedUser?.violation_count > 0 && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {selectedUser.violation_count} violation(s)
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">{selectedUser?.full_name}</h3>
                <p className="text-sm text-slate-600 mb-2">Email: {selectedUser?.email}</p>
                {selectedUser?.ban_reason && (
                  <div className="bg-white border border-red-300 rounded-lg p-3 mt-3">
                    <p className="text-xs font-semibold text-red-900 mb-1">Raison du bannissement :</p>
                    <p className="text-sm text-red-800">{selectedUser.ban_reason}</p>
                  </div>
                )}
                {selectedUser?.violation_reason && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mt-2">
                    <p className="text-xs font-semibold text-amber-900 mb-1">Détail de la dernière violation :</p>
                    <p className="text-sm text-amber-800">{selectedUser.violation_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dernier contenu ayant causé le ban (si récent) */}
            {userReviews.length > 0 && userReviews[0] && (
              <Card className="bg-red-50 border-red-300">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Dernier contenu publié (possiblement la cause du ban)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const lastItem = userReviews[0];
                    if (lastItem.type === 'teacher' || lastItem.type === 'school') {
                      return (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={lastItem.type === 'teacher' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
                              {lastItem.type === 'teacher' ? '👨‍🏫 Avis Professeur' : '🏫 Avis École'}
                            </Badge>
                            <Badge variant={lastItem.status === 'published' ? 'default' : 'destructive'}>
                              {lastItem.status === 'published' ? 'Publié' : 'Rejeté'}
                            </Badge>
                          </div>
                          {lastItem.comment && (
                            <div className="bg-white p-3 rounded-lg border border-red-200">
                              <p className="text-sm font-semibold text-slate-700 mb-1">Commentaire :</p>
                              <p className="text-sm text-slate-900">{lastItem.comment}</p>
                            </div>
                          )}
                          <p className="text-xs text-slate-500 mt-2">
                            Publié le: {formatDateWithTimezone(lastItem.created_date, "d MMM yyyy 'à' HH:mm")}
                          </p>
                        </>
                      );
                    } else if (lastItem.type === 'chat_message') {
                      return (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              💬 Message Chat École
                            </Badge>
                            <Badge variant={lastItem.is_deleted ? 'destructive' : 'default'}>
                              {lastItem.is_deleted ? 'Supprimé' : 'Publié'}
                            </Badge>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-red-200">
                            <p className="text-sm text-slate-900">{lastItem.message}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            Publié le: {formatDateWithTimezone(lastItem.created_date, "d MMM yyyy 'à' HH:mm")}
                          </p>
                        </>
                      );
                    } else if (lastItem.type === 'national_message') {
                      return (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-pink-50 text-pink-700">
                              🎤 Micro National
                            </Badge>
                            <Badge variant={lastItem.is_deleted ? 'destructive' : 'default'}>
                              {lastItem.is_deleted ? 'Supprimé' : 'Publié'}
                            </Badge>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-red-200">
                            <p className="text-sm text-slate-900">{lastItem.message}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            Publié le: {formatDateWithTimezone(lastItem.created_date, "d MMM yyyy 'à' HH:mm")}
                          </p>
                        </>
                      );
                    }
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                📝 Tous les contenus publiés ({userReviews.length})
              </h4>
              
              {loadingReviews ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : userReviews.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Aucun contenu publié</p>
              ) : (
                <div className="space-y-3">
                  {userReviews.map((review) => (
                    <Card key={review.id} className="border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <Badge variant="outline" className={
                            review.type === 'teacher' ? 'bg-blue-50 text-blue-700' : 
                            review.type === 'school' ? 'bg-green-50 text-green-700' :
                            review.type === 'chat_message' ? 'bg-purple-50 text-purple-700' :
                            'bg-pink-50 text-pink-700'
                          }>
                            {review.type === 'teacher' ? '👨‍🏫 Professeur' : 
                             review.type === 'school' ? '🏫 École' :
                             review.type === 'chat_message' ? '💬 Chat' :
                             '🎤 Micro National'}
                          </Badge>
                          <Badge variant={
                            review.status === 'published' ? 'default' : 
                            review.status === 'rejected' ? 'destructive' : 
                            review.is_deleted ? 'destructive' :
                            'secondary'
                          }>
                            {review.status || (review.is_deleted ? 'Supprimé' : 'Publié')}
                          </Badge>
                        </div>
                        
                        {review.type === 'teacher' && (
                          <div className="mb-2">
                            <p className="text-sm font-semibold">Note: {review.total_rating}/20</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-1">
                              <span>Charge: {review.workload}/5</span>
                              <span>Amabilité: {review.friendliness}/5</span>
                              <span>Enseignement: {review.teaching_method}/5</span>
                              <span>Notation: {review.grading_severity}/5</span>
                            </div>
                          </div>
                        )}
                        
                        {review.type === 'school' && (
                          <div className="mb-2">
                            <p className="text-sm font-semibold">Note: {review.rating}/20</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-1">
                              <span>Ambiance: {review.ambiance}/5</span>
                              <span>Personnel: {review.staff_quality}/5</span>
                              <span>Locaux: {review.facilities}/5</span>
                              <span>Cantine: {review.cafeteria}/5</span>
                            </div>
                          </div>
                        )}
                        
                        {(review.comment || review.message) && (
                          <div className="bg-slate-50 p-3 rounded-lg mt-2">
                            <p className="text-sm text-slate-700">{review.comment || review.message}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 pt-2 border-t">
                          <span>Publié le: {formatDateWithTimezone(review.created_date, "d MMM yyyy 'à' HH:mm")}</span>
                          {review.report_count > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-red-600 font-medium">{review.report_count} signalement(s)</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                <X className="w-4 h-4 mr-2" />
                Fermer
              </Button>
              <Button onClick={() => handleUnban(selectedUser)} className="bg-green-600 hover:bg-green-700">
                <UserCheck className="w-4 h-4 mr-2" />
                Débannir cet utilisateur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}