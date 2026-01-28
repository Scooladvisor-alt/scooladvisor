import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teacher_id } = await req.json();

    if (!teacher_id) {
      return Response.json({ error: 'teacher_id is required' }, { status: 400 });
    }

    // Récupérer tous les avis publiés pour ce professeur
    const reviews = await base44.entities.TeacherReview.filter({ 
      teacher_id: teacher_id, 
      status: "published" 
    });

    const reviewCount = reviews.length;

    // Si aucun avis, mettre tout à 0
    if (reviewCount === 0) {
      await base44.asServiceRole.entities.Teacher.update(teacher_id, {
        workload_avg: 0,
        friendliness_avg: 0,
        teaching_avg: 0,
        grading_avg: 0,
        average_rating: 0,
        review_count: 0
      });

      return Response.json({ 
        success: true, 
        message: 'Teacher stats reset to 0 (no reviews)',
        stats: {
          workload_avg: 0,
          friendliness_avg: 0,
          teaching_avg: 0,
          grading_avg: 0,
          average_rating: 0,
          review_count: 0
        }
      });
    }

    // Calculer les moyennes
    const avg = (key) => reviews.reduce((sum, r) => sum + (r[key] || 0), 0) / reviewCount;

    const workload_avg = avg('workload');
    const friendliness_avg = avg('friendliness');
    const teaching_avg = avg('teaching_method');
    const grading_avg = avg('grading_severity');
    const average_rating = workload_avg + friendliness_avg + teaching_avg + grading_avg;

    // Mettre à jour le professeur
    await base44.asServiceRole.entities.Teacher.update(teacher_id, {
      workload_avg,
      friendliness_avg,
      teaching_avg,
      grading_avg,
      average_rating,
      review_count: reviewCount
    });

    return Response.json({ 
      success: true, 
      message: 'Teacher stats updated successfully',
      stats: {
        workload_avg,
        friendliness_avg,
        teaching_avg,
        grading_avg,
        average_rating,
        review_count: reviewCount
      }
    });

  } catch (error) {
    console.error('Error updating teacher stats:', error);
    return Response.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
});