import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { NavBar, Badge, Btn, Inp, TA, Modal, fmt, Av, Spinner } from "./ui";
import {
  fetchTeacherCourses, createCourse, deleteCourse,
  fetchCourseStudents, fetchAllStudents, enrollStudent, unenrollStudent,
  fetchChapters, addChapter, renameChapter, deleteChapter,
  uploadCourseCoverImage, updateCourseCover,
  fetchAllCourses, fetchCoursePrerequisites, replaceCoursePrerequisites, updateCourseSettings,
} from "./coursesApi";
import ChapterEditor from "./ChapterEditor";
import CourseCommunity from "./CourseCommunity";
import { TeacherHomeworkPanel } from "./HomeworkPanel";
import { TeacherQuizPanel } from "./QuizPanel";
import Diaporama from "./Diaporama";
import { BookIcon } from "./Icons";

const FONTS = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap";
const COLORS = ["#7C6FFF", "#00D4AA", "#FF6B8A", "#FFB347", "#4ECDC4", "#FF6B6B", "#A8E6CF", "#C7A6FF"];

export default function TeacherPortal({ onProfile }) {
  const { profile, user, signOut } = useAuth();
  const [tab, setTab] = useState("courses");
  const [courses, setCourses] = useState([]);
  const [sel, setSel] = useState(null); // selected course id
  const [chapters, setChapters] = useState([]);
  const [editChapter, setEditChapter] = useState(null); // chapter object being edited
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(null);
  const [cf, setCf] = useState({ title: "", subject: "", description: "", price: "0", durationDays: "30", color: COLORS[0], chapterCount: "8", maxStudents: "" });
  const [newPrereqIds, setNewPrereqIds] = useState([]);
  const [allCoursesForPicker, setAllCoursesForPicker] = useState([]);
  const [coursePrereqs, setCoursePrereqs] = useState([]); // prereqs of the currently open course
  const [editPrereqIds, setEditPrereqIds] = useState([]);
  const [editMaxStudents, setEditMaxStudents] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverUpdating, setCoverUpdating] = useState(false);
  const coverEditRef = useRef(null);

  const handleCoverChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !sel) return;
    setCoverUpdating(true); setErr("");
    try {
      const url = await uploadCourseCoverImage(f, sel);
      await updateCourseCover(sel, url);
      await loadCourses();
    } catch (err2) { setErr(err2.message); }
    finally { setCoverUpdating(false); }
  };
  const [busy, setBusy] = useState(false);

  const course = sel ? courses.find((c) => c.id === sel) : null;

  const loadCourses = async () => {
    setLoading(true); setErr("");
    try {
      const data = await fetchTeacherCourses(user.id);
      setCourses(data);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCourses(); }, []);

  const openCourse = async (id) => {
    setSel(id);
    try {
      const [ch, stu, all, prereqs] = await Promise.all([
        fetchChapters(id), fetchCourseStudents(id), fetchAllStudents(), fetchCoursePrerequisites(id),
      ]);
      setChapters(ch);
      setStudents(stu);
      setAllStudents(all);
      setCoursePrereqs(prereqs);
      setEditPrereqIds(prereqs.map((p) => p.id));
      const c = courses.find((x) => x.id === id);
      setEditMaxStudents(c?.max_students != null ? String(c.max_students) : "");
      if (allCoursesForPicker.length === 0) setAllCoursesForPicker(await fetchAllCourses());
    } catch (e) { setErr(e.message); }
  };

  const openCreateModal = async () => {
    setModal("create");
    if (allCoursesForPicker.length === 0) {
      try { setAllCoursesForPicker(await fetchAllCourses()); } catch (e) { setErr(e.message); }
    }
  };

  const handleCreateCourse = async () => {
    if (!cf.title.trim()) return;
    setBusy(true); setErr("");
    try {
      let coverImageUrl = null;
      if (coverFile) {
        coverImageUrl = await uploadCourseCoverImage(coverFile, "new" + Date.now());
      }
      await createCourse({ teacherId: user.id, ...cf, coverImageUrl, prerequisiteIds: newPrereqIds });
      setCf({ title: "", subject: "", description: "", price: "0", durationDays: "30", color: COLORS[0], chapterCount: "8", maxStudents: "" });
      setCoverFile(null); setCoverPreview(null); setNewPrereqIds([]);
      setModal(null);
      await loadCourses();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const saveQualificationSettings = async () => {
    if (!sel) return;
    setSavingSettings(true); setErr("");
    try {
      await replaceCoursePrerequisites(sel, editPrereqIds);
      await updateCourseSettings(sel, { maxStudents: editMaxStudents.trim() ? parseInt(editMaxStudents) : null });
      setCoursePrereqs(allCoursesForPicker.filter((c) => editPrereqIds.includes(c.id)));
      await loadCourses();
    } catch (e) { setErr(e.message); }
    finally { setSavingSettings(false); }
  };

  const handleDeleteCourse = async (id) => {
    try { await deleteCourse(id); setSel(null); await loadCourses(); }
    catch (e) { setErr(e.message); }
  };

  const handleAddChapter = async () => {
    if (!sel) return;
    try {
      const n = chapters.length + 1;
      await addChapter(sel, n);
      setChapters(await fetchChapters(sel));
    } catch (e) { setErr(e.message); }
  };

  const handleRenameChapter = async (chId, title) => {
    setChapters((prev) => prev.map((c) => (c.id === chId ? { ...c, title } : c))); // optimistic
    try { await renameChapter(chId, title); } catch (e) { setErr(e.message); }
  };

  const handleDeleteChapter = async (chId) => {
    try { await deleteChapter(chId); setChapters(await fetchChapters(sel)); }
    catch (e) { setErr(e.message); }
  };

  const handleEnroll = async (studentId) => {
    try { await enrollStudent(sel, studentId); setStudents(await fetchCourseStudents(sel)); }
    catch (e) { setErr(e.message); }
  };

  const handleUnenroll = async (studentId) => {
    try { await unenrollStudent(sel, studentId); setStudents(await fetchCourseStudents(sel)); }
    catch (e) { setErr(e.message); }
  };

  const TABS = [{ id: "courses", label: "Mes cours", icon: <BookIcon size={16} /> }];

  if (editChapter && course) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F8FA", fontFamily: "'DM Sans',sans-serif", color: "#12141C", display: "flex", flexDirection: "column" }}>
        <link href={FONTS} rel="stylesheet" />
        <NavBar user={{ name: profile?.name || "…", role: profile?.role || "teacher" }} tabs={TABS} active={tab} onTab={setTab} onLogout={signOut} onProfile={onProfile} userId={user?.id} lastSeenAnnouncements={profile?.last_seen_announcements} />
        <div style={{ padding: 28, maxWidth: 1000, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          <ChapterEditor course={course} chapter={editChapter} onBack={() => setEditChapter(null)} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", fontFamily: "'DM Sans',sans-serif", color: "#12141C", display: "flex", flexDirection: "column" }}>
      <link href={FONTS} rel="stylesheet" />
      <NavBar user={{ name: profile?.name || "…", role: profile?.role || "teacher" }} tabs={TABS} active={tab} onTab={setTab} onLogout={signOut} onProfile={onProfile} userId={user?.id} lastSeenAnnouncements={profile?.last_seen_announcements} />
      <Diaporama />
      <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {err && <div style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{err} <button onClick={() => setErr("")} style={{ background: "none", border: "none", color: "#FF6677", cursor: "pointer", float: "right" }}>✕</button></div>}

        {loading && <Spinner label="Chargement…" />}

        {!loading && !sel && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>Mes cours</h2>
              <Btn onClick={openCreateModal} color="#7C6FFF" style={{ fontFamily: "inherit" }}>+ Créer un cours</Btn>
            </div>
            {courses.length === 0 && (
              <div style={{ padding: 60, textAlign: "center", color: "#9CA3AF", border: "2px dashed #E2E5EB", borderRadius: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}></div>
                <p style={{ margin: 0, fontSize: 15 }}>Aucun cours pour le moment. Créez le premier!</p>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {courses.map((c) => (
                <div key={c.id} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 16, overflow: "hidden" }}>
                  {c.cover_image_url ? (
                    <div style={{ height: 120, overflow: "hidden" }}><img src={c.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                  ) : (
                    <div style={{ height: 6, background: c.color }} />
                  )}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <Badge label={fmt(c.price)} color={c.price === 0 ? "#00D4AA" : "#FFB347"} />
                    </div>
                    <h3 style={{ margin: "0 0 6px", fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{c.title}</h3>
                    <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280" }}>{c.description}</p>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#6B7280", marginBottom: 16 }}>
                      <span>{c.enrolledCount}</span><span>{c.chapterCount} ch.</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn onClick={() => openCourse(c.id)} color="#7C6FFF" small style={{ flex: 1, fontFamily: "inherit" }}>Gérer →</Btn>
                      <button onClick={() => handleDeleteCourse(c.id)} style={{ background: "#FF444515", border: "1px solid #FF444535", color: "#FF6677", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Supprimer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && sel && course && (
          <>
            <button onClick={() => setSel(null)} style={{ background: "none", border: "none", color: "#7C6FFF", cursor: "pointer", fontWeight: 700, marginBottom: 20, fontSize: 14 }}>← Cours</button>
            <div style={{ position: "relative", height: 140, borderRadius: 14, overflow: "hidden", marginBottom: 16, background: course.cover_image_url ? "#F7F8FA" : course.color }}>
              {course.cover_image_url && <img src={course.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              <input ref={coverEditRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
              <button onClick={() => coverEditRef.current?.click()} disabled={coverUpdating} style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(10,12,24,.85)", border: "1px solid #E2E5EB", color: "#12141C", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                {coverUpdating ? "…" : "Changer l'image"}
              </button>
            </div>
            <h2 style={{ margin: "0 0 4px", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>{course.title}</h2>
            <p style={{ margin: "0 0 24px", color: "#6B7280", fontSize: 13 }}>{course.subject} · {fmt(course.price)} · {students.length} élèves</p>

            <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E5EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontSize: 16 }}>Chapitres ({chapters.length})</h3>
                <Btn onClick={handleAddChapter} color="#7C6FFF" small style={{ fontFamily: "inherit" }}>+ Ajouter un chapitre</Btn>
              </div>
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {chapters.map((ch) => (
                  <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: "1px solid #EDEFF3" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FFFFFF", border: "1px solid #E2E5EB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#6B7280", flexShrink: 0 }}>{ch.number}</div>
                    <input defaultValue={ch.title} onBlur={(e) => handleRenameChapter(ch.id, e.target.value)} style={{ flex: 1, background: "none", border: "none", color: "#12141C", fontWeight: 600, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
                    <Btn onClick={() => setEditChapter(ch)} color="#7C6FFF" small style={{ fontFamily: "inherit" }}>Éditer le contenu</Btn>
                    <button onClick={() => handleDeleteChapter(ch.id)} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 17, padding: "2px 6px" }}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 18 }}>
              <h3 style={{ margin: "0 0 14px", fontFamily: "'Syne',sans-serif", fontSize: 15 }}>Élèves ({students.length})</h3>
              {students.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun élève inscrit.</p>}
              {students.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #EDEFF3" }}>
                  <Av name={s.name} size={34} color="#00D4AA" img={s.avatar_url} />
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div></div>
                  <button onClick={() => handleUnenroll(s.id)} style={{ background: "#FF444518", border: "1px solid #FF444540", color: "#FF6677", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Retirer</button>
                </div>
              ))}
              {allStudents.filter((s) => !students.find((st) => st.id === s.id)).length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Inscrire un élève</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {allStudents.filter((s) => !students.find((st) => st.id === s.id)).map((s) => (
                      <button key={s.id} onClick={() => handleEnroll(s.id)} style={{ background: "#7C6FFF18", border: "1px solid #7C6FFF40", color: "#A899FF", borderRadius: 8, padding: "5px 13px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+ {s.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 18, marginTop: 20 }}>
              <h3 style={{ margin: "0 0 6px", fontFamily: "'Syne',sans-serif", fontSize: 15 }}>Qualifications & Capacité</h3>
              <p style={{ margin: "0 0 14px", fontSize: 12, color: "#6B7280" }}>Limitez le nombre d'élèves et/ou exigez des certificats d'autres cours avant l'inscription.</p>
              <Inp label="Limite d'élèves (vide = illimité)" value={editMaxStudents} onChange={setEditMaxStudents} placeholder="ex. 30" />
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Qualifications requises</label>
                <div style={{ maxHeight: 160, overflowY: "auto", background: "#F7F8FA", borderRadius: 9, padding: 10 }}>
                  {allCoursesForPicker.filter((c) => c.id !== sel).length === 0 && <p style={{ color: "#9CA3AF", fontSize: 12, margin: 0 }}>Aucun autre cours disponible.</p>}
                  {allCoursesForPicker.filter((c) => c.id !== sel).map((c) => (
                    <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: "#1F2430", cursor: "pointer" }}>
                      <input type="checkbox" checked={editPrereqIds.includes(c.id)} onChange={(e) => {
                        setEditPrereqIds((ids) => e.target.checked ? [...ids, c.id] : ids.filter((id) => id !== c.id));
                      }} style={{ accentColor: "#7C6FFF" }} />
                      {c.title}
                    </label>
                  ))}
                </div>
              </div>
              <Btn onClick={saveQualificationSettings} disabled={savingSettings} color="#00D4AA" style={{ fontFamily: "inherit" }}>{savingSettings ? "Enregistrement…" : "Enregistrer"}</Btn>
            </div>

            <div style={{ marginTop: 20 }}>
              <h3 style={{ margin: "0 0 14px", fontFamily: "'Syne',sans-serif", fontSize: 15 }}>Communauté du cours</h3>
              <CourseCommunity courseId={sel} userId={user.id} userRole="teacher" courseColor={course.color} />
            </div>

            <div style={{ marginTop: 20 }}>
              <TeacherHomeworkPanel courseId={sel} />
            </div>

            <div style={{ marginTop: 20 }}>
              <TeacherQuizPanel courseId={sel} isFinal={true} />
            </div>
          </>
        )}
      </div>

      {modal === "create" && (
        <Modal title="Créer un cours" onClose={() => setModal(null)} width={560}>
          <Inp label="Titre" value={cf.title} onChange={(v) => setCf({ ...cf, title: v })} placeholder="ex. Calcul avancé" />
          <Inp label="Matière" value={cf.subject} onChange={(v) => setCf({ ...cf, subject: v })} placeholder="ex. Mathématiques" />
          <TA label="Description" value={cf.description} onChange={(v) => setCf({ ...cf, description: v })} rows={3} placeholder="Que vont apprendre les élèves?" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Image de couverture (optionnel)</label>
            {coverPreview && <img src={coverPreview} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />}
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setCoverFile(f);
              setCoverPreview(f ? URL.createObjectURL(f) : null);
            }} style={{ color: "#12141C", fontSize: 13 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Inp label="Prix ($)" value={cf.price} onChange={(v) => setCf({ ...cf, price: v })} placeholder="0" />
            <Inp label="Durée (jours)" value={cf.durationDays} onChange={(v) => setCf({ ...cf, durationDays: v })} placeholder="30" />
            <Inp label="Nb. chapitres" value={cf.chapterCount} onChange={(v) => setCf({ ...cf, chapterCount: v })} placeholder="8" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Couleur</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLORS.map((col) => (
                <div key={col} onClick={() => setCf({ ...cf, color: col })} style={{ width: 28, height: 28, borderRadius: "50%", background: col, cursor: "pointer", border: cf.color === col ? "3px solid #fff" : "3px solid transparent" }} />
              ))}
            </div>
          </div>
          <Inp label="Limite d'élèves (optionnel — vide = illimité)" value={cf.maxStudents} onChange={(v) => setCf({ ...cf, maxStudents: v })} placeholder="ex. 30" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Qualifications requises (optionnel)</label>
            <p style={{ margin: "0 0 8px", fontSize: 11, color: "#6B7280" }}>L'élève devra avoir un certificat pour chaque cours coché ci-dessous avant de pouvoir s'inscrire.</p>
            <div style={{ maxHeight: 160, overflowY: "auto", background: "#F7F8FA", borderRadius: 9, padding: 10 }}>
              {allCoursesForPicker.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 12, margin: 0 }}>Aucun autre cours disponible.</p>}
              {allCoursesForPicker.map((c) => (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13, color: "#1F2430", cursor: "pointer" }}>
                  <input type="checkbox" checked={newPrereqIds.includes(c.id)} onChange={(e) => {
                    setNewPrereqIds((ids) => e.target.checked ? [...ids, c.id] : ids.filter((id) => id !== c.id));
                  }} style={{ accentColor: "#7C6FFF" }} />
                  {c.title}
                </label>
              ))}
            </div>
          </div>
          <Btn onClick={handleCreateCourse} disabled={busy || !cf.title.trim()} color="#7C6FFF" style={{ width: "100%", fontFamily: "inherit" }}>
            {busy ? "Création…" : "Créer le cours"}
          </Btn>
        </Modal>
      )}
    </div>
  );
}
