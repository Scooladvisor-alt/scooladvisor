import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data, old_data } = body;
    const entityName = event?.entity_name; // "TeacherReview" or "SchoolReview"

    // Determine which entity to recalculate from
    let targetId = null;
    let targetType = null;

    if (entityName === "TeacherReview") {
      targetId = data?.teacher_id || old_data?.teacher_id;
      targetType = "teacher";
    } else if (entityName === "SchoolReview") {
      targetId = data?.school_id || old_data?.school_id;
      targetType = "school";
    } else {
      return Response.json({ error: "Unknown entity" }, { status: 400 });
    }

    if (!targetId) {
      return Response.json({ error: "No target ID found" }, { status: 400 });
    }

    if (targetType === "teacher") {
      const published = await base44.asServiceRole.entities.TeacherReview.filter({
        teacher_id: targetId,
        status: "published"
      });
      const count = published.length;
      const avg = count > 0
        ? published.reduce((s, r) => s + (r.total_rating || 0), 0) / count
        : 0;

      // Also recalculate sub-averages
      const workloadAvg = count > 0 ? published.reduce((s, r) => s + (r.workload || 0), 0) / count : 0;
      const friendlinessAvg = count > 0 ? published.reduce((s, r) => s + (r.friendliness || 0), 0) / count : 0;
      const teachingAvg = count > 0 ? published.reduce((s, r) => s + (r.teaching_method || 0), 0) / count : 0;
      const gradingAvg = count > 0 ? published.reduce((s, r) => s + (r.grading_severity || 0), 0) / count : 0;

      await base44.asServiceRole.entities.Teacher.update(targetId, {
        average_rating: Math.round(avg * 100) / 100,
        review_count: count,
        workload_avg: Math.round(workloadAvg * 100) / 100,
        friendliness_avg: Math.round(friendlinessAvg * 100) / 100,
        teaching_avg: Math.round(teachingAvg * 100) / 100,
        grading_avg: Math.round(gradingAvg * 100) / 100,
      });

      return Response.json({ ok: true, type: "teacher", id: targetId, count, avg });

    } else {
      const published = await base44.asServiceRole.entities.SchoolReview.filter({
        school_id: targetId,
        status: "published"
      });
      const count = published.length;
      const avg = count > 0
        ? published.reduce((s, r) => s + (r.rating || 0), 0) / count
        : 0;

      await base44.asServiceRole.entities.School.update(targetId, {
        average_rating: Math.round(avg * 100) / 100,
        review_count: count,
      });

      return Response.json({ ok: true, type: "school", id: targetId, count, avg });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});