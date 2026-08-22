import { supabase } from "./supabaseClient";

// ---------- Courses ----------

export async function fetchAllCourses() {
  // Pull courses + teacher name + chapter count + enrollment count in one go
  const { data, error } = await supabase
    .from("courses")
    .select(`
      *,
      teacher:profiles!courses_teacher_id_fkey(id, name),
      chapters(count),
      enrollments(count)
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((c) => ({
    ...c,
    teacherName: c.teacher?.name || "Inconnu",
    chapterCount: c.chapters?.[0]?.count || 0,
    enrolledCount: c.enrollments?.[0]?.count || 0,
  }));
}

export async function fetchTeacherCourses(teacherId) {
  const { data, error } = await supabase
    .from("courses")
    .select(`*, chapters(count), enrollments(count)`)
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((c) => ({
    ...c,
    chapterCount: c.chapters?.[0]?.count || 0,
    enrolledCount: c.enrollments?.[0]?.count || 0,
  }));
}

export async function fetchStudentCourses(studentId) {
  const { data, error } = await supabase
    .from("enrollments")
    .select(`course:courses(*, teacher:profiles!courses_teacher_id_fkey(id, name), chapters(count))`)
    .eq("student_id", studentId);
  if (error) throw error;
  return (data || []).map((row) => ({
    ...row.course,
    teacherName: row.course.teacher?.name || "Inconnu",
    chapterCount: row.course.chapters?.[0]?.count || 0,
  }));
}

export async function createCourse({ teacherId, title, subject, description, price, durationDays, color, chapterCount, coverImageUrl, maxStudents, prerequisiteIds }) {
  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      teacher_id: teacherId,
      title, subject, description,
      price: parseFloat(price) || 0,
      duration_days: parseInt(durationDays) || 30,
      color: color || "#7C6FFF",
      cover_image_url: coverImageUrl || null,
      max_students: maxStudents ? parseInt(maxStudents) : null,
    })
    .select()
    .single();
  if (error) throw error;

  if (prerequisiteIds && prerequisiteIds.length > 0) {
    const rows = prerequisiteIds.map((id) => ({ course_id: course.id, prerequisite_course_id: id }));
    const { error: prereqErr } = await supabase.from("course_prerequisites").insert(rows);
    if (prereqErr) throw prereqErr;
  }

  // Auto-create N empty chapters
  const n = Math.min(Math.max(parseInt(chapterCount) || 4, 1), 100);
  const chapterRows = Array.from({ length: n }, (_, i) => ({
    course_id: course.id,
    number: i + 1,
    title: `Chapitre ${i + 1}`,
  }));
  const { error: chErr } = await supabase.from("chapters").insert(chapterRows);
  if (chErr) throw chErr;

  return course;
}

export async function deleteCourse(courseId) {
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) throw error;
}

export async function updateCourseLiveStatus(courseId, live) {
  const { error } = await supabase.from("courses").update({ live }).eq("id", courseId);
  if (error) throw error;
}

// ---------- Enrollments ----------

export async function enrollStudent(courseId, studentId) {
  const { error } = await supabase.from("enrollments").insert({ course_id: courseId, student_id: studentId });
  if (error && error.code !== "23505") throw error; // ignore duplicate-enrollment conflicts
}

export async function unenrollStudent(courseId, studentId) {
  const { error } = await supabase.from("enrollments").delete().eq("course_id", courseId).eq("student_id", studentId);
  if (error) throw error;
}

export async function fetchCourseStudents(courseId) {
  const { data, error } = await supabase
    .from("enrollments")
    .select(`student:profiles!student_id(id, name, avatar_url)`)
    .eq("course_id", courseId);
  if (error) throw error;
  return (data || []).map((r) => r.student);
}

export async function fetchAllStudents() {
  const { data, error } = await supabase.from("profiles").select("*").eq("role", "student").order("name");
  if (error) throw error;
  return data || [];
}

// ---------- Chapters ----------

export async function fetchChapters(courseId) {
  const { data, error } = await supabase
    .from("chapters")
    .select(`*, chapter_content(*)`)
    .eq("course_id", courseId)
    .order("number");
  if (error) throw error;
  return data || [];
}

export async function addChapter(courseId, number) {
  const { data, error } = await supabase
    .from("chapters")
    .insert({ course_id: courseId, number, title: `Chapitre ${number}` })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameChapter(chapterId, title) {
  const { error } = await supabase.from("chapters").update({ title }).eq("id", chapterId);
  if (error) throw error;
}

export async function deleteChapter(chapterId) {
  const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
  if (error) throw error;
}

export async function fetchChapterProgress(courseId, studentId) {
  const { data, error } = await supabase
    .from("chapter_progress")
    .select(`chapter_id, chapters!inner(course_id)`)
    .eq("student_id", studentId)
    .eq("chapters.course_id", courseId);
  if (error) throw error;
  return (data || []).map((r) => r.chapter_id);
}

export async function markChapterComplete(chapterId, studentId) {
  const { error } = await supabase.from("chapter_progress").insert({ chapter_id: chapterId, student_id: studentId });
  if (error && error.code !== "23505") throw error;
}

// ---------- Chapter content (text/video/audio blocks) ----------

export async function fetchChapterContent(chapterId) {
  const { data, error } = await supabase
    .from("chapter_content")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("sort_order");
  if (error) throw error;
  return data || [];
}

export async function addTextContent(chapterId, { label, body }, sortOrder) {
  const { error } = await supabase.from("chapter_content").insert({
    chapter_id: chapterId, type: "text", label, body, sort_order: sortOrder,
  });
  if (error) throw error;
}

export async function uploadChapterFile(file, courseId, chapterId) {
  const ext = file.name.split(".").pop();
  const path = `${courseId}/${chapterId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage.from("course-files").upload(path, file);
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("course-files").getPublicUrl(path);
  return data.publicUrl;
}

export async function addMediaContent(chapterId, { type, label, fileUrl }, sortOrder) {
  // type is "video" or "audio"
  const { error } = await supabase.from("chapter_content").insert({
    chapter_id: chapterId, type, label, file_url: fileUrl, sort_order: sortOrder,
  });
  if (error) throw error;
}

export async function deleteChapterContent(contentId) {
  const { error } = await supabase.from("chapter_content").delete().eq("id", contentId);
  if (error) throw error;
}

// ---------- Community chat ----------

export async function fetchCommunityMessages(courseId) {
  const { data, error } = await supabase
    .from("community_messages")
    .select(`*, author:profiles!user_id(id, name, role, avatar_url), reactions:message_reactions(emoji, user_id)`)
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function postCommunityMessage(courseId, userId, text, replyTo = null) {
  const { error } = await supabase.from("community_messages").insert({
    course_id: courseId, user_id: userId, text, reply_to: replyTo,
  });
  if (error) throw error;
}

export async function togglePin(messageId, pinned) {
  const { error } = await supabase.from("community_messages").update({ pinned }).eq("id", messageId);
  if (error) throw error;
}

export async function deleteMessage(messageId) {
  const { error } = await supabase.from("community_messages").delete().eq("id", messageId);
  if (error) throw error;
}

export async function toggleReaction(messageId, userId, emoji) {
  const { data: existing } = await supabase
    .from("message_reactions").select("*")
    .eq("message_id", messageId).eq("user_id", userId).eq("emoji", emoji).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("message_reactions").delete()
      .eq("message_id", messageId).eq("user_id", userId).eq("emoji", emoji);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("message_reactions").insert({ message_id: messageId, user_id: userId, emoji });
    if (error) throw error;
  }
}

// ---------- Homeworks ----------

export async function fetchHomeworks(courseId) {
  const { data, error } = await supabase.from("homeworks").select("*").eq("course_id", courseId).order("created_at");
  if (error) throw error;
  return data || [];
}

export async function createHomework(courseId, title, dueDate) {
  const { error } = await supabase.from("homeworks").insert({ course_id: courseId, title, due_date: dueDate || null });
  if (error) throw error;
}

export async function deleteHomework(id) {
  const { error } = await supabase.from("homeworks").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchHomeworkSubmissions(homeworkId) {
  const { data, error } = await supabase
    .from("homework_submissions")
    .select(`*, student:profiles!student_id(id, name, avatar_url)`)
    .eq("homework_id", homeworkId);
  if (error) throw error;
  return data || [];
}

export async function fetchMySubmission(homeworkId, studentId) {
  const { data, error } = await supabase
    .from("homework_submissions").select("*")
    .eq("homework_id", homeworkId).eq("student_id", studentId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function submitHomework(homeworkId, studentId, text) {
  const { error } = await supabase.from("homework_submissions")
    .upsert({ homework_id: homeworkId, student_id: studentId, text }, { onConflict: "homework_id,student_id" });
  if (error) throw error;
}

// ---------- Quizzes ----------

export async function fetchQuizzes(courseId, finalOnly = false) {
  let q = supabase.from("quizzes").select(`*, quiz_questions(*)`).eq("course_id", courseId);
  if (finalOnly) q = q.eq("is_final", true);
  const { data, error } = await q.order("created_at");
  if (error) throw error;
  return data || [];
}

export async function createQuiz(courseId, title, questions, isFinal = false) {
  const { data: quiz, error } = await supabase.from("quizzes")
    .insert({ course_id: courseId, title, is_final: isFinal }).select().single();
  if (error) throw error;
  const rows = questions.map((q, i) => ({
    quiz_id: quiz.id, question: q.question, options: q.options, correct_answer: q.correctAnswer, sort_order: i,
  }));
  const { error: qErr } = await supabase.from("quiz_questions").insert(rows);
  if (qErr) throw qErr;
  return quiz;
}

export async function deleteQuiz(id) {
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchMyQuizSubmission(quizId, studentId) {
  const { data, error } = await supabase
    .from("quiz_submissions").select("*")
    .eq("quiz_id", quizId).eq("student_id", studentId)
    .order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function submitQuiz(quizId, studentId, score, total) {
  const { error } = await supabase.from("quiz_submissions").insert({ quiz_id: quizId, student_id: studentId, score, total });
  if (error) throw error;
}

export async function fetchQuizSubmissions(quizId) {
  const { data, error } = await supabase
    .from("quiz_submissions").select(`*, student:profiles!student_id(id, name)`).eq("quiz_id", quizId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// ---------- Certificates ----------

export async function fetchMyCertificates(studentId) {
  const { data, error } = await supabase.from("certificates").select("*").eq("student_id", studentId).order("issued_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchCertificateById(id) {
  const { data, error } = await supabase.from("certificates").select(`*, student:profiles!student_id(name)`).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function issueCertificate(studentId, courseId, courseTitle, hoursSpent) {
  const { data: existing } = await supabase.from("certificates").select("id")
    .eq("student_id", studentId).eq("course_id", courseId).maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase.from("certificates")
    .insert({ student_id: studentId, course_id: courseId, course_title: courseTitle, hours_spent: hoursSpent })
    .select().single();
  if (error) throw error;
  return data;
}

// ---------- Admin: real user deletion (via Edge Function) ----------

export async function deleteUserCompletely(userId) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke("delete-user", {
    body: { userId },
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

// ---------- Announcements / notifications ----------

export async function fetchAnnouncements(limit = 30) {
  const { data, error } = await supabase
    .from("announcements")
    .select(`*, author:profiles!created_by(name)`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createAnnouncement(createdBy, title, message) {
  const { error } = await supabase.from("announcements").insert({ created_by: createdBy, title, message });
  if (error) throw error;
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}

export async function markAnnouncementsSeen(userId) {
  const { error } = await supabase.from("profiles").update({ last_seen_announcements: new Date().toISOString() }).eq("id", userId);
  if (error) throw error;
}

// ---------- Account status (suspend/activate) ----------

export async function setUserStatus(userId, status) {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
  if (error) throw error;
}

// ---------- Chapter-level quizzes (attached to a lesson, not the whole course) ----------

export async function fetchChapterQuiz(chapterId) {
  const { data, error } = await supabase
    .from("quizzes")
    .select(`*, quiz_questions(*)`)
    .eq("chapter_id", chapterId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createChapterQuiz(courseId, chapterId, title, questions) {
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .insert({ course_id: courseId, chapter_id: chapterId, title, is_final: false })
    .select().single();
  if (error) throw error;
  const rows = questions.map((q, i) => ({
    quiz_id: quiz.id, question: q.question, options: q.options, correct_answer: q.correctAnswer, sort_order: i,
  }));
  const { error: qErr } = await supabase.from("quiz_questions").insert(rows);
  if (qErr) throw qErr;
  return quiz;
}

// ---------- Diaporama slides (admin-managed) ----------

export async function fetchDiaporamaSlides() {
  const { data, error } = await supabase.from("diaporama_slides").select("*").order("sort_order");
  if (error) throw error;
  return data || [];
}

export async function uploadDiaporamaImage(file) {
  const ext = file.name.split(".").pop();
  const path = `diaporama/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage.from("course-files").upload(path, file);
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("course-files").getPublicUrl(path);
  return data.publicUrl;
}

export async function createDiaporamaSlide(imageUrl, linkUrl, title, sortOrder) {
  const { error } = await supabase.from("diaporama_slides").insert({ image_url: imageUrl, link_url: linkUrl || null, title: title || null, sort_order: sortOrder });
  if (error) throw error;
}

export async function deleteDiaporamaSlide(id) {
  const { error } = await supabase.from("diaporama_slides").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Course cover images ----------

export async function uploadCourseCoverImage(file, courseIdOrTemp) {
  const ext = file.name.split(".").pop();
  const path = `covers/${courseIdOrTemp}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("course-files").upload(path, file);
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("course-files").getPublicUrl(path);
  return data.publicUrl;
}

export async function updateCourseCover(courseId, coverImageUrl) {
  const { error } = await supabase.from("courses").update({ cover_image_url: coverImageUrl }).eq("id", courseId);
  if (error) throw error;
}

// ---------- Course prerequisites (qualifications) ----------

export async function fetchAllPrerequisites() {
  // one query: courseId -> [{id, title}]
  const { data, error } = await supabase
    .from("course_prerequisites")
    .select(`course_id, prereq:courses!course_prerequisites_prerequisite_course_id_fkey(id, title)`);
  if (error) throw error;
  const map = {};
  (data || []).forEach((row) => {
    if (!map[row.course_id]) map[row.course_id] = [];
    map[row.course_id].push(row.prereq);
  });
  return map;
}

export async function fetchCoursePrerequisites(courseId) {
  const { data, error } = await supabase
    .from("course_prerequisites")
    .select(`prereq:courses!course_prerequisites_prerequisite_course_id_fkey(id, title)`)
    .eq("course_id", courseId);
  if (error) throw error;
  return (data || []).map((r) => r.prereq);
}

export async function replaceCoursePrerequisites(courseId, prerequisiteIds) {
  const { error: delErr } = await supabase.from("course_prerequisites").delete().eq("course_id", courseId);
  if (delErr) throw delErr;
  if (prerequisiteIds.length === 0) return;
  const rows = prerequisiteIds.map((id) => ({ course_id: courseId, prerequisite_course_id: id }));
  const { error } = await supabase.from("course_prerequisites").insert(rows);
  if (error) throw error;
}

export async function updateCourseSettings(courseId, { maxStudents }) {
  const { error } = await supabase.from("courses").update({ max_students: maxStudents }).eq("id", courseId);
  if (error) throw error;
}

// ---------- Admin: student activity monitoring ----------

export async function fetchRecentActivity(limit = 50) {
  const [enrolls, hwSubs, quizSubs, msgs] = await Promise.all([
    supabase.from("enrollments").select(`id, enrolled_at, student:profiles!student_id(name), course:courses(title)`).order("enrolled_at", { ascending: false }).limit(limit),
    supabase.from("homework_submissions").select(`id, submitted_at, student:profiles!student_id(name), homework:homeworks(title, course:courses(title))`).order("submitted_at", { ascending: false }).limit(limit),
    supabase.from("quiz_submissions").select(`id, submitted_at, score, total, student:profiles!student_id(name), quiz:quizzes(title, course:courses(title))`).order("submitted_at", { ascending: false }).limit(limit),
    supabase.from("community_messages").select(`id, created_at, text, author:profiles!user_id(name), course:courses(title)`).order("created_at", { ascending: false }).limit(limit),
  ]);
  const events = [];
  (enrolls.data || []).forEach((e) => events.push({ id: "enr-" + e.id, type: "enroll", ts: e.enrolled_at, student: e.student?.name, detail: `s'est inscrit à "${e.course?.title}"` }));
  (hwSubs.data || []).forEach((e) => events.push({ id: "hw-" + e.id, type: "homework", ts: e.submitted_at, student: e.student?.name, detail: `a soumis le devoir "${e.homework?.title}" (${e.homework?.course?.title})` }));
  (quizSubs.data || []).forEach((e) => events.push({ id: "quiz-" + e.id, type: "quiz", ts: e.submitted_at, student: e.student?.name, detail: `a passé "${e.quiz?.title}" — ${e.score}/${e.total} (${e.quiz?.course?.title})` }));
  (msgs.data || []).forEach((e) => events.push({ id: "msg-" + e.id, type: "message", ts: e.created_at, student: e.author?.name, detail: `a écrit dans la communauté de "${e.course?.title}"` }));
  events.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  return events.slice(0, limit);
}

// ---------- Message reporting (moderation) ----------

export async function reportMessage(messageId, reporterId, reason) {
  const { error } = await supabase.from("message_reports").insert({ message_id: messageId, reporter_id: reporterId, reason });
  if (error) throw error;
}

export async function fetchMessageReports() {
  const { data, error } = await supabase
    .from("message_reports")
    .select(`*, message:community_messages(id, text, course_id, author:profiles!user_id(id, name)), reporter:profiles!reporter_id(name)`)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function resolveReport(reportId, status) {
  const { error } = await supabase.from("message_reports").update({ status }).eq("id", reportId);
  if (error) throw error;
}
