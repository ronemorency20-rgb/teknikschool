import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { NavBar, Badge, Btn, fmt, fmtDate, Spinner } from "./ui";
import { fetchAllCourses, fetchStudentCourses, enrollStudent, fetchChapters, fetchChapterProgress, fetchMyCertificates, fetchAllPrerequisites } from "./coursesApi";
import ChapterViewer from "./ChapterViewer";
import CourseCommunity from "./CourseCommunity";
import { StudentHomeworkPanel } from "./HomeworkPanel";
import { StudentQuizPanel } from "./QuizPanel";
import CertificateView from "./CertificateView";
import Diaporama from "./Diaporama";
import AdBanner from "./AdBanner";
import { SearchIcon, GraduationCapIcon, TrophyIcon, BookIcon, ChatIcon, FileTextIcon, FlagIcon } from "./Icons";

const FONTS = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap";

export default function StudentPortal({ onProfile }) {
  const { profile, user, signOut } = useAuth();
  const [tab, setTab] = useState("catalog");
  const [allCourses, setAllCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [enrollingId, setEnrollingId] = useState(null);

  // course detail / chapters state
  const [selCourse, setSelCourse] = useState(null); // course object
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState([]); // array of completed chapter ids
  const [chLoading, setChLoading] = useState(false);
  const [selChapter, setSelChapter] = useState(null); // chapter object
  const [courseSubTab, setCourseSubTab] = useState("chapters");
  const [certificates, setCertificates] = useState([]);
  const [prerequisites, setPrerequisites] = useState({}); // courseId -> [{id,title}]
  const [search, setSearch] = useState("");
  const [viewCert, setViewCert] = useState(null);
  const [justEarned, setJustEarned] = useState(null);

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [all, mine, certs, prereqMap] = await Promise.all([
        fetchAllCourses(),
        fetchStudentCourses(user.id),
        fetchMyCertificates(user.id),
        fetchAllPrerequisites(),
      ]);
      setAllCourses(shuffle(all));
      setMyCourses(mine);
      setCertificates(certs);
      setPrerequisites(prereqMap);
    } catch (e) {
      setErr(e.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const myCourseIds = new Set(myCourses.map((c) => c.id));
  const certifiedCourseIds = new Set(certificates.map((c) => c.course_id));

  const checkEligibility = (course) => {
    const isFull = course.max_students != null && (course.enrolledCount ?? 0) >= course.max_students;
    const prereqs = prerequisites[course.id] || [];
    const missing = prereqs.filter((p) => !certifiedCourseIds.has(p.id));
    return { isFull, missing, eligible: !isFull && missing.length === 0 };
  };

  const requestEnroll = async (course) => {
    const { isFull, missing } = checkEligibility(course);
    if (isFull) {
      alert("Ce cours a atteint sa limite d'élèves. Il n'est plus possible de s'inscrire.");
      return;
    }
    if (missing.length > 0) {
      alert("Vous n'êtes pas encore qualifié pour ce cours.\n\nCours requis (avec certificat) :\n" + missing.map((m) => "• " + m.title).join("\n"));
      return;
    }
    setEnrollingId(course.id);
    try {
      await enrollStudent(course.id, user.id);
      await load();
    } catch (e) {
      setErr(e.message || "Erreur lors de l'inscription.");
    } finally {
      setEnrollingId(null);
    }
  };

  const openCourse = async (c) => {
    setSelCourse(c);
    setSelChapter(null);
    setCourseSubTab("chapters");
    setChLoading(true);
    try {
      const [ch, prog] = await Promise.all([
        fetchChapters(c.id),
        fetchChapterProgress(c.id, user.id),
      ]);
      setChapters(ch);
      setProgress(prog);
    } catch (e) { setErr(e.message); }
    finally { setChLoading(false); }
  };

  const refreshProgress = async () => {
    if (!selCourse) return;
    try { setProgress(await fetchChapterProgress(selCourse.id, user.id)); }
    catch (e) { setErr(e.message); }
  };

  const TABS = [
    { id: "catalog", label: "Catalogue", icon: <SearchIcon size={16} /> },
    { id: "learning", label: "Mon apprentissage", icon: <GraduationCapIcon size={16} /> },
    { id: "certificates", label: "Certificats", icon: <TrophyIcon size={16} /> },
  ];

  const CourseCard = ({ c, clickable }) => {
    const enrolled = myCourseIds.has(c.id);
    const { isFull, missing } = !enrolled ? checkEligibility(c) : { isFull: false, missing: [] };
    return (
      <div
        onClick={clickable && enrolled ? () => openCourse(c) : undefined}
        style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 16, overflow: "hidden", cursor: clickable && enrolled ? "pointer" : "default" }}
      >
        {c.cover_image_url ? (
          <div style={{ height: 120, overflow: "hidden" }}><img src={c.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
        ) : (
          <div style={{ height: 6, background: c.color || "#7C6FFF" }} />
        )}
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
            <Badge label={fmt(c.price)} color={c.price === 0 ? "#00D4AA" : "#FFB347"} />
            {c.live && <Badge label="EN DIRECT" color="#FF6677" />}
          </div>
          <h3 style={{ margin: "0 0 6px", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>{c.title}</h3>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B7280" }}>{c.description}</p>
          <div style={{ fontSize: 12, color: "#6B7280", display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
            <span>Durée : {c.duration_days} jours</span>
            {c.max_students != null && <span>{c.enrolledCount ?? 0}/{c.max_students} inscrits</span>}
          </div>
          {!enrolled && missing.length > 0 && (
            <div style={{ fontSize: 11, color: "#FFB347", marginBottom: 10 }}>Nécessite: {missing.map((m) => m.title).join(", ")}</div>
          )}
          {enrolled ? (
            <div style={{ padding: "8px 12px", background: "#00D4AA22", borderRadius: 8, fontSize: 12, color: "#00D4AA", textAlign: "center", fontWeight: 700 }}>
              ✓ Inscrit{clickable ? " — Ouvrir" : ""}
            </div>
          ) : isFull ? (
            <div style={{ padding: "8px 12px", background: "#FF445522", borderRadius: 8, fontSize: 12, color: "#FF6677", textAlign: "center", fontWeight: 700 }}>Complet</div>
          ) : (
            <Btn onClick={(e) => { e.stopPropagation(); requestEnroll(c); }} disabled={enrollingId === c.id} color={missing.length > 0 ? "#6B7280" : "#7C6FFF"} style={{ width: "100%", fontFamily: "inherit" }}>
              {enrollingId === c.id ? "…" : missing.length > 0 ? "Non qualifié" : "S'inscrire"}
            </Btn>
          )}
        </div>
      </div>
    );
  };

  // ---- Chapter viewer screen ----
  if (selCourse && selChapter) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F8FA", fontFamily: "'DM Sans',sans-serif", color: "#12141C", display: "flex", flexDirection: "column" }}>
        <link href={FONTS} rel="stylesheet" />
        <NavBar user={{ name: profile?.name || "…", role: "student" }} tabs={TABS} active={tab} onTab={setTab} onLogout={signOut} onProfile={onProfile} userId={user?.id} lastSeenAnnouncements={profile?.last_seen_announcements} />
        <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          <ChapterViewer
            chapter={selChapter}
            studentId={user.id}
            isDone={progress.includes(selChapter.id)}
            onMarkedDone={refreshProgress}
            onBack={() => setSelChapter(null)}
          />
        </div>
      </div>
    );
  }

  // ---- Course detail (chapter list + subtabs) screen ----
  if (selCourse) {
    const SUBTABS = [
      { id: "chapters", label: "Chapitres", icon: <BookIcon size={15} /> },
      { id: "community", label: "Communauté", icon: <ChatIcon size={15} /> },
      { id: "homework", label: "Devoirs", icon: <FileTextIcon size={15} /> },
      { id: "final", label: "Examen final", icon: <FlagIcon size={15} /> },
    ];
    return (
      <div style={{ minHeight: "100vh", background: "#F7F8FA", fontFamily: "'DM Sans',sans-serif", color: "#12141C", display: "flex", flexDirection: "column" }}>
        <link href={FONTS} rel="stylesheet" />
        <NavBar user={{ name: profile?.name || "…", role: "student" }} tabs={TABS} active={tab} onTab={setTab} onLogout={signOut} onProfile={onProfile} userId={user?.id} lastSeenAnnouncements={profile?.last_seen_announcements} />
        <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          <button onClick={() => setSelCourse(null)} style={{ background: "none", border: "none", color: "#00D4AA", cursor: "pointer", fontWeight: 700, marginBottom: 20, fontSize: 14 }}>← Retour</button>
          <h2 style={{ margin: "0 0 4px", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>{selCourse.title}</h2>
          <p style={{ margin: "0 0 20px", color: "#6B7280", fontSize: 13 }}>Durée : {selCourse.duration_days} jours · {fmt(selCourse.price)}</p>

          <div style={{ display: "flex", gap: 4, marginBottom: 22, background: "#FFFFFF", borderRadius: 11, padding: 5, width: "fit-content", flexWrap: "wrap" }}>
            {SUBTABS.map((v) => (
              <button key={v.id} onClick={() => setCourseSubTab(v.id)} style={{ background: courseSubTab === v.id ? "#00D4AA" : "none", border: "none", color: courseSubTab === v.id ? "#F7F8FA" : "#6B7280", padding: "7px 15px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'Syne',sans-serif", display: "flex", alignItems: "center", gap: 7 }}>{v.icon}{v.label}</button>
            ))}
          </div>

          {courseSubTab === "chapters" && (
            <>
              {chLoading && <Spinner label="Chargement…" />}
              {!chLoading && chapters.length === 0 && <p style={{ color: "#6B7280" }}>Aucun chapitre pour le moment.</p>}
              {!chLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {chapters.map((ch) => {
                    const done = progress.includes(ch.id);
                    const hasContent = ch.chapter_content && ch.chapter_content.length > 0;
                    return (
                      <div key={ch.id}
                        onClick={hasContent ? () => setSelChapter(ch) : undefined}
                        style={{ background: "#FFFFFF", border: `1px solid ${done ? "#00D4AA33" : "#E2E5EB"}`, borderRadius: 12, overflow: "hidden", cursor: hasContent ? "pointer" : "default" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: done ? "#00D4AA22" : "#FFFFFF", border: `1px solid ${done ? "#00D4AA55" : "#E2E5EB"}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: done ? "#00D4AA" : "#6B7280", flexShrink: 0 }}>{done ? "✓" : ch.number}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{ch.title}</div>
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>{hasContent ? `${ch.chapter_content.length} élément(s)` : "Aucun contenu"}</div>
                          </div>
                          {hasContent ? <span style={{ color: "#6B7280", fontSize: 18 }}>›</span> : <span style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>Bientôt disponible</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {courseSubTab === "community" && (
            <CourseCommunity courseId={selCourse.id} userId={user.id} userRole="student" courseColor={selCourse.color} />
          )}

          {courseSubTab === "homework" && (
            <StudentHomeworkPanel courseId={selCourse.id} studentId={user.id} />
          )}

          {courseSubTab === "final" && (
            <StudentQuizPanel courseId={selCourse.id} studentId={user.id} course={selCourse} isFinal={true}
              onCertificateEarned={(cert) => { setJustEarned(cert); load(); }} />
          )}
        </div>

        {justEarned && (
          <CertificateView cert={justEarned} studentName={profile?.name} color={selCourse.color} onClose={() => setJustEarned(null)} />
        )}
      </div>
    );
  }

  // ---- Catalog / My learning / Certificates list screens ----
  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", fontFamily: "'DM Sans',sans-serif", color: "#12141C", display: "flex", flexDirection: "column" }}>
      <link href={FONTS} rel="stylesheet" />
      <NavBar user={{ name: profile?.name || "…", role: profile?.role || "student" }} tabs={TABS} active={tab} onTab={setTab} onLogout={signOut} onProfile={onProfile} userId={user?.id} lastSeenAnnouncements={profile?.last_seen_announcements} />
      <Diaporama />
      <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {err && <div style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{err}</div>}

        {loading && <Spinner label="Chargement…" />}

        {!loading && tab === "catalog" && (
          <>
            <h2 style={{ margin: "0 0 8px", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>Catalogue de cours</h2>
            <p style={{ margin: "0 0 18px", color: "#6B7280", fontSize: 14 }}>Parcourez et inscrivez-vous aux cours disponibles.</p>
            <div style={{ position: "relative", maxWidth: 420, marginBottom: 24 }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un cours par titre…"
                style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 10, padding: "11px 16px", color: "#12141C", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 24 }}><AdBanner /></div>
            {(() => {
              const filtered = search.trim()
                ? allCourses.filter((c) => c.title.toLowerCase().includes(search.trim().toLowerCase()))
                : allCourses;
              if (filtered.length === 0) return <p style={{ color: "#6B7280" }}>{search.trim() ? "Aucun cours ne correspond à votre recherche." : "Aucun cours disponible pour le moment."}</p>;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
                  {filtered.map((c) => <CourseCard key={c.id} c={c} clickable />)}
                </div>
              );
            })()}
          </>
        )}

        {!loading && tab === "learning" && (
          <>
            <h2 style={{ margin: "0 0 24px", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>Mon apprentissage</h2>
            {myCourses.length === 0 && <p style={{ color: "#6B7280" }}>Pas encore inscrit à un cours. Allez dans le Catalogue pour vous inscrire.</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {myCourses.map((c) => <CourseCard key={c.id} c={c} clickable />)}
            </div>
          </>
        )}

        {!loading && tab === "certificates" && (
          <>
            <h2 style={{ margin: "0 0 24px", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>Mes certificats</h2>
            {certificates.length === 0 && (
              <div style={{ padding: 60, textAlign: "center", color: "#9CA3AF", border: "2px dashed #E2E5EB", borderRadius: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}></div>
                <p style={{ margin: 0, fontSize: 15 }}>Aucun certificat pour le moment.</p>
                <p style={{ margin: "8px 0 0", color: "#9CA3AF", fontSize: 13 }}>Réussissez l'examen final d'un cours pour en obtenir un.</p>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {certificates.map((cert) => (
                <div key={cert.id} onClick={() => setViewCert(cert)} style={{ background: "linear-gradient(135deg,#FFB34714,transparent)", border: "1px solid #FFB34744", borderRadius: 14, padding: 20, cursor: "pointer" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}></div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#FFB347", marginBottom: 4 }}>{cert.course_title}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>Délivré le {fmtDate(cert.issued_at)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {viewCert && <CertificateView cert={viewCert} studentName={profile?.name} onClose={() => setViewCert(null)} />}
    </div>
  );
}
