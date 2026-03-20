import React, { useState, useEffect } from "react";
import { TeacherReview } from "@/entities/TeacherReview";
import { SchoolReview } from "@/entities/SchoolReview";
import { Teacher } from "@/entities/Teacher";
import { School } from "@/entities/School";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Star, Search, Eye, EyeOff, Flag } from "lucide-react"; // Added Flag icon
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AllReviews({ onUpdate }) {
  const [teacherReviews, setTeacherReviews] = useState([]);
  const [schoolReviews, setSchoolReviews] = useState([]);
  const [teachers, setTeachers] = useState({});
  const [schools, setSchools] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    
    const [teacherReviewsData, schoolReviewsData, teachersData, schoolsData] = await Promise.all([
      TeacherReview.list(),
      SchoolReview.list(),
      Teacher.list(),
      School.list()
    ]);

    const teachersMap = {};
    const schoolsMap = {};

    teachersData.forEach(teacher => {
      teachersMap[teacher.id] = teacher;
    });
    schoolsData.forEach(school => {
      schoolsMap[school.id] = school;
    });

    setTeacherReviews(teacherReviewsData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setSchoolReviews(schoolReviewsData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setTeachers(teachersMap);
    setSchools(schoolsMap);
    setLoading(false);
  };

  const handleDeleteTeacherReview = async (reviewId) => {
    if (!confirm("Êtes-vous sûr de vouloir masquer cet avis ?")) return;
    
    try {
      await TeacherReview.update(reviewId, { status: "hidden" });
      toast.success("Avis masqué avec succès.");
      loadReviews();
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors du masquage de l'avis.");
    }
  };

  const handleDeleteSchoolReview = async (reviewId) => {
    if (!confirm("Êtes-vous sûr de vouloir masquer cet avis ?")) return;
    
    try {
      await SchoolReview.update(reviewId, { status: "hidden" });
      toast.success("Avis masqué avec succès.");
      loadReviews();
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors du masquage de l'avis.");
    }
  };

  const handleRestoreTeacherReview = async (reviewId) => {
    try {
      await TeacherReview.update(reviewId, { status: "published" });
      toast.success("Avis restauré (publié) avec succès.");
      loadReviews();
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la restauration de l'avis.");
    }
  };

  const handleRestoreSchoolReview = async (reviewId) => {
    try {
      await SchoolReview.update(reviewId, { status: "published" });
      toast.success("Avis restauré (publié) avec succès.");
      loadReviews();
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la restauration de l'avis.");
    }
  };

  const handleReportTeacherReview = async (reviewId) => {
    if (!confirm("Êtes-vous sûr de vouloir signaler cet avis ? Il sera déplacé vers la section 'Avis Signalés' pour modération.")) return;
    try {
      await TeacherReview.update(reviewId, { status: "reported" });
      toast.success("Avis signalé avec succès.");
      loadReviews();
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors du signalement de l'avis.");
    }
  };

  const handleReportSchoolReview = async (reviewId) => {
    if (!confirm("Êtes-vous sûr de vouloir signaler cet avis ? Il sera déplacé vers la section 'Avis Signalés' pour modération.")) return;
    try {
      await SchoolReview.update(reviewId, { status: "reported" });
      toast.success("Avis signalé avec succès.");
      loadReviews();
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors du signalement de l'avis.");
    }
  };

  const filterReviews = (reviews, entityMap, entityKey) => {
    if (!searchTerm) return reviews;
    return reviews.filter(review => {
      const entity = entityMap[review[entityKey]];
      return (
        entity?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const teacherReviewsForTeachersTab = teacherReviews.filter(r => r.status !== 'reported');
  const schoolReviewsForSchoolsTab = schoolReviews.filter(r => r.status !== 'reported');
  const reportedTeacherReviews = teacherReviews.filter(r => r.status === 'reported');
  const reportedSchoolReviews = schoolReviews.filter(r => r.status === 'reported');

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <p className="text-slate-600">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Rechercher par nom, commentaire ou auteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="teachers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-slate-200">
          <TabsTrigger value="teachers">
            Avis Professeurs ({teacherReviewsForTeachersTab.length})
          </TabsTrigger>
          <TabsTrigger value="schools">
            Avis Établissements ({schoolReviewsForSchoolsTab.length})
          </TabsTrigger>
          <TabsTrigger value="reported">
            Avis Signalés ({reportedTeacherReviews.length + reportedSchoolReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teachers" className="space-y-4">
          {filterReviews(teacherReviewsForTeachersTab, teachers, "teacher_id").map((review, index) => {
            const teacher = teachers[review.teacher_id];
            if (!teacher) return null;

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{teacher.name}</CardTitle>
                          <Badge variant="outline">{teacher.subject}</Badge>
                          {review.status === "hidden" && (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Masqué
                            </Badge>
                          )}
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                            <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                            <span className="font-bold text-amber-900 text-sm">{review.total_rating.toFixed(1)}/20</span>
                          </div>
                        </div>

                        <p className="text-slate-700 mb-3">{review.comment}</p>

                        <div className="text-xs text-slate-500 space-y-1">
                          <p>Par: {review.is_anonymous ? "Anonyme" : review.created_by}</p>
                          <p>Le {format(new Date(review.created_date), "d MMMM yyyy à HH:mm", { locale: fr })}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {review.status === "published" && (
                            <>
                                <Button
                                    onClick={() => handleReportTeacherReview(review.id)}
                                    variant="outline"
                                    size="sm"
                                    className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                                >
                                    <Flag className="w-4 h-4 mr-2" />
                                    Signaler
                                </Button>
                                <Button
                                    onClick={() => handleDeleteTeacherReview(review.id)}
                                    variant="destructive"
                                    size="sm"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Masquer
                                </Button>
                            </>
                        )}
                        {review.status === "hidden" && (
                            <Button
                                onClick={() => handleRestoreTeacherReview(review.id)}
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Restaurer
                            </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}

          {filterReviews(teacherReviewsForTeachersTab, teachers, "teacher_id").length === 0 && (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <p className="text-slate-600">Aucun avis de professeur trouvé</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schools" className="space-y-4">
          {filterReviews(schoolReviewsForSchoolsTab, schools, "school_id").map((review, index) => {
            const school = schools[review.school_id];
            if (!school) return null;

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{school.name}</CardTitle>
                          {review.status === "hidden" && (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Masqué
                            </Badge>
                          )}
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                            <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                            <span className="font-bold text-amber-900 text-sm">{review.rating.toFixed(1)}/20</span>
                          </div>
                        </div>

                        <p className="text-slate-700 mb-3">{review.comment}</p>

                        <div className="text-xs text-slate-500 space-y-1">
                          <p>Par: {review.is_anonymous ? "Anonyme" : review.created_by}</p>
                          <p>Le {format(new Date(review.created_date), "d MMMM yyyy à HH:mm", { locale: fr })}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {review.status === "published" && (
                            <>
                                <Button
                                    onClick={() => handleReportSchoolReview(review.id)}
                                    variant="outline"
                                    size="sm"
                                    className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                                >
                                    <Flag className="w-4 h-4 mr-2" />
                                    Signaler
                                </Button>
                                <Button
                                    onClick={() => handleDeleteSchoolReview(review.id)}
                                    variant="destructive"
                                    size="sm"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Masquer
                                </Button>
                            </>
                        )}
                        {review.status === "hidden" && (
                            <Button
                                onClick={() => handleRestoreSchoolReview(review.id)}
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Restaurer
                            </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}

          {filterReviews(schoolReviewsForSchoolsTab, schools, "school_id").length === 0 && (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <p className="text-slate-600">Aucun avis d'établissement trouvé</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reported" className="space-y-4">
          {filterReviews(reportedTeacherReviews, teachers, "teacher_id").length > 0 && (
            <h3 className="text-lg font-semibold text-slate-800">Avis Professeurs Signalés</h3>
          )}
          {filterReviews(reportedTeacherReviews, teachers, "teacher_id").map((review, index) => {
            const teacher = teachers[review.teacher_id];
            if (!teacher) return null;

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{teacher.name}</CardTitle>
                          <Badge variant="outline">{teacher.subject}</Badge>
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            <Flag className="w-3 h-3 mr-1" />
                            Signalé
                          </Badge>
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                            <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                            <span className="font-bold text-amber-900 text-sm">{review.total_rating.toFixed(1)}/20</span>
                          </div>
                        </div>

                        <p className="text-slate-700 mb-3">{review.comment}</p>

                        <div className="text-xs text-slate-500 space-y-1">
                          <p>Par: {review.is_anonymous ? "Anonyme" : review.created_by}</p>
                          <p>Le {format(new Date(review.created_date), "d MMMM yyyy à HH:mm", { locale: fr })}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleRestoreTeacherReview(review.id)} // Approve: set to published
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Approuver
                        </Button>
                        <Button
                          onClick={() => handleDeleteTeacherReview(review.id)} // Hide: set to hidden
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Masquer
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}

          {filterReviews(reportedSchoolReviews, schools, "school_id").length > 0 && (
            <h3 className="text-lg font-semibold text-slate-800 mt-8">Avis Établissements Signalés</h3>
          )}
          {filterReviews(reportedSchoolReviews, schools, "school_id").map((review, index) => {
            const school = schools[review.school_id];
            if (!school) return null;

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{school.name}</CardTitle>
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            <Flag className="w-3 h-3 mr-1" />
                            Signalé
                          </Badge>
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                            <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                            <span className="font-bold text-amber-900 text-sm">{review.rating.toFixed(1)}/20</span>
                          </div>
                        </div>

                        <p className="text-slate-700 mb-3">{review.comment}</p>

                        <div className="text-xs text-slate-500 space-y-1">
                          <p>Par: {review.is_anonymous ? "Anonyme" : review.created_by}</p>
                          <p>Le {format(new Date(review.created_date), "d MMMM yyyy à HH:mm", { locale: fr })}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleRestoreSchoolReview(review.id)} // Approve: set to published
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Approuver
                        </Button>
                        <Button
                          onClick={() => handleDeleteSchoolReview(review.id)} // Hide: set to hidden
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Masquer
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}

          {filterReviews(reportedTeacherReviews, teachers, "teacher_id").length === 0 &&
           filterReviews(reportedSchoolReviews, schools, "school_id").length === 0 && (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <p className="text-slate-600">Aucun avis signalé trouvé</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}