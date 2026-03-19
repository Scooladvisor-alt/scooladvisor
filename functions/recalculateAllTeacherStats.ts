import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Seuls les admins peuvent recalculer toutes les stats
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Récupérer tous les professeurs
    const teachers = await base44.asServiceRole.entities.Teacher.list();
    const results = [];

    for (const teacher of teachers) {
      try {
        // Récupérer uniquement les avis PUBLIÉS pour ce professeur
        const reviews = await base44.asServiceRole.entities.TeacherReview.filter({ 
          teacher_id: teacher.id, 
          status: "published" 
        });

        const reviewCount = reviews.length;

        // Si aucun avis publié, mettre tout à 0
        if (reviewCount === 0) {
          await base44.asServiceRole.entities.Teacher.update(teacher.id, {
            workload_avg: 0,
            friendliness_avg: 0,
            teaching_avg: 0,
            grading_avg: 0,
            average_rating: 0,
            review_count: 0
          });

          results.push({
            teacher_id: teacher.id,
            teacher_name: teacher.name,
            status: 'reset',
            review_count: 0
          });
        } else {
          // Calculer les moyennes
          const avg = (key) => reviews.reduce((sum, r) => sum + (r[key] || 0), 0) / reviewCount;

          const workload_avg = avg('workload');
          const friendliness_avg = avg('friendliness');
          const teaching_avg = avg('teaching_method');
          const grading_avg = avg('grading_severity');
          const average_rating = workload_avg + friendliness_avg + teaching_avg + grading_avg;

          // Mettre à jour le professeur
          await base44.asServiceRole.entities.Teacher.update(teacher.id, {
            workload_avg,
            friendliness_avg,
            teaching_avg,
            grading_avg,
            average_rating,
            review_count: reviewCount
          });

          results.push({
            teacher_id: teacher.id,
            teacher_name: teacher.name,
            status: 'updated',
            review_count: reviewCount,
            average_rating: average_rating.toFixed(1)
          });
        }
      } catch (error) {
        results.push({
          teacher_id: teacher.id,
          teacher_name: teacher.name,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({ 
      success: true,
      message: `Recalculated stats for ${teachers.length} teachers`,
      results
    });

  } catch (error) {
    console.error('Error recalculating all teacher stats:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});