import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { NavBar, Badge, Av, Btn, Inp, TA, Modal, Spinner } from "./ui";
import { supabase } from "./supabaseClient";
import { deleteUserCompletely, fetchAnnouncements, createAnnouncement, deleteAnnouncement, setUserStatus, fetchDiaporamaSlides, uploadDiaporamaImage, createDiaporamaSlide, deleteDiaporamaSlide, fetchRecentActivity, fetchMessageReports, resolveReport, deleteMessage } from "./coursesApi";
import { UsersIcon, EyeIcon, ClipboardIcon, MegaphoneIcon, ImageIcon, BookIcon, ChartIcon, GraduationCapIcon, FileTextIcon, CheckCircleIcon, ChatIcon, FlagIcon, TrashIcon } from "./Icons";

const FONTS = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap";
const RC = { admin: "#FF6B6B", teacher: "#7C6FFF", student: "#00D4AA" };

function genInviteCode() {
  return "TK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function AdminPortal({ onProfile }) {
  const { profile, user, signOut } = useAuth();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [revealCode, setRevealCode] = useState(null); // {email, code}
  const [announcements, setAnnouncements] = useState([]);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [slides, setSlides] = useState([]);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [slideFile, setSlideFile] = useState(null);
  const [slideLink, setSlideLink] = useState("");
  const [slideTitle, setSlideTitle] = useState("");
  const [slideBusy, setSlideBusy] = useState(false);
  const [activity, setActivity] = useState([]);
  const [reports, setReports] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const [{ data: u, error: uErr }, { data: c, error: cErr }, { data: apps, error: aErr }, ann, sl, rep] = await Promise.all([
        supabase.from("profiles").select("*").order("join_date", { ascending: false }),
        supabase.from("courses").select(`*, teacher:profiles!courses_teacher_id_fkey(name), enrollments(count)`),
        supabase.from("teacher_applications").select("*").order("created_at", { ascending: false }),
        fetchAnnouncements(),
        fetchDiaporamaSlides(),
        fetchMessageReports(),
      ]);
      if (uErr) throw uErr;
      if (cErr) throw cErr;
      if (aErr) throw aErr;
      setUsers(u || []);
      setCourses((c || []).map((x) => ({ ...x, enrolledCount: x.enrollments?.[0]?.count || 0 })));
      setApplications(apps || []);
      setAnnouncements(ann || []);
      setSlides(sl || []);
      setReports(rep || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (tab !== "activity") return;
    setActivityLoading(true);
    fetchRecentActivity().then(setActivity).catch((e) => setErr(e.message)).finally(() => setActivityLoading(false));
  }, [tab]);

  const students = users.filter((u) => u.role === "student");
  const teachers = users.filter((u) => u.role === "teacher");
  const pendingApps = applications.filter((a) => a.status === "pending");

  const approveApplication = async (app) => {
    const code = genInviteCode();
    try {
      const { error } = await supabase.from("teacher_applications").update({ status: "approved", invite_code: code }).eq("id", app.id);
      if (error) throw error;
      setRevealCode({ email: app.email, code });
      await load();
    } catch (e) { setErr(e.message); }
  };

  const rejectApplication = async (app) => {
    try {
      const { error } = await supabase.from("teacher_applications").update({ status: "rejected" }).eq("id", app.id);
      if (error) throw error;
      await load();
    } catch (e) { setErr(e.message); }
  };

  const removeUser = async (userId, userName) => {
    if (!window.confirm(`Supprimer définitivement le compte de ${userName} ? Cette action est irréversible.`)) return;
    try {
      await deleteUserCompletely(userId);
      await load();
    } catch (e) { setErr(e.message); }
  };

  const toggleStatus = async (u) => {
    const next = u.status === "suspended" ? "active" : "suspended";
    try { await setUserStatus(u.id, next); await load(); }
    catch (e) { setErr(e.message); }
  };

  const submitAnnouncement = async () => {
    if (!annTitle.trim() || !annMessage.trim()) return;
    try {
      await createAnnouncement(user.id, annTitle.trim(), annMessage.trim());
      setAnnTitle(""); setAnnMessage(""); setShowAddAnnouncement(false);
      await load();
    } catch (e) { setErr(e.message); }
  };

  const removeAnnouncement = async (id) => {
    try { await deleteAnnouncement(id); await load(); }
    catch (e) { setErr(e.message); }
  };

  const submitSlide = async () => {
    if (!slideFile) { setErr("Veuillez choisir une image."); return; }
    setSlideBusy(true); setErr("");
    try {
      const url = await uploadDiaporamaImage(slideFile);
      await createDiaporamaSlide(url, slideLink.trim(), slideTitle.trim(), slides.length);
      setSlideFile(null); setSlideLink(""); setSlideTitle(""); setShowAddSlide(false);
      await load();
    } catch (e) { setErr(e.message); }
    finally { setSlideBusy(false); }
  };

  const removeSlide = async (id) => {
    try { await deleteDiaporamaSlide(id); await load(); }
    catch (e) { setErr(e.message); }
  };

  const handleDismissReport = async (reportId) => {
    try { await resolveReport(reportId, "dismissed"); await load(); }
    catch (e) { setErr(e.message); }
  };

  const handleDeleteReportedMessage = async (report) => {
    try {
      await deleteMessage(report.message.id);
      await resolveReport(report.id, "resolved");
      await load();
    } catch (e) { setErr(e.message); }
  };

  const displayId = (id) => "ID " + id.slice(0, 8).toUpperCase();

  const TABS = [
    { id: "users", label: "Utilisateurs", icon: <UsersIcon size={16} /> },
    { id: "activity", label: "Activité", icon: <EyeIcon size={16} /> },
    { id: "reports", label: `Signalements${reports.length ? ` (${reports.length})` : ""}`, icon: <FlagIcon size={16} /> },
    { id: "applications", label: `Candidatures${pendingApps.length ? ` (${pendingApps.length})` : ""}`, icon: <ClipboardIcon size={16} /> },
    { id: "announcements", label: "Annonces", icon: <MegaphoneIcon size={16} /> },
    { id: "diaporama", label: "Diaporama", icon: <ImageIcon size={16} /> },
    { id: "courses", label: "Cours", icon: <BookIcon size={16} /> },
    { id: "stats", label: "Statistiques", icon: <ChartIcon size={16} /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", fontFamily: "'DM Sans',sans-serif", color: "#12141C", display: "flex", flexDirection: "column" }}>
      <link href={FONTS} rel="stylesheet" />
      <NavBar user={{ name: profile?.name || "…", role: "admin" }} tabs={TABS} active={tab} onTab={setTab} onLogout={signOut} onProfile={onProfile} userId={user?.id} lastSeenAnnouncements={profile?.last_seen_announcements} />
      <div style={{ padding: 28, maxWidth: 980, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {err && <div style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{err}</div>}
        {loading && <Spinner label="Chargement…" />}

        {!loading && tab === "users" && (
          <>
            <h2 style={{ margin: "0 0 24px", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>Gérer les utilisateurs</h2>
            {[["Élèves", students], ["Professeurs", teachers]].map(([lbl, list]) => (
              <div key={lbl}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, marginTop: 20 }}>{lbl} ({list.length})</div>
                {list.map((u) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, marginBottom: 8 }}>
                    <Av name={u.name} size={40} color={RC[u.role]} img={u.avatar_url} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 2 }}>
                        <span style={{ fontFamily: "monospace" }}>{displayId(u.id)}</span>
                        <span>·</span>
                        <span>Statut: <b style={{ color: u.status === "suspended" ? "#FF6677" : "#00D4AA" }}>{u.status === "suspended" ? "Suspendu" : "Actif"}</b></span>
                        {u.subject && <><span>·</span><span>{u.subject}</span></>}
                      </div>
                    </div>
                    <Badge label={u.role} color={RC[u.role]} />
                    <button onClick={() => toggleStatus(u)} style={{ background: u.status === "suspended" ? "#00D4AA22" : "#FFB34722", border: `1px solid ${u.status === "suspended" ? "#00D4AA55" : "#FFB34755"}`, color: u.status === "suspended" ? "#00D4AA" : "#FFB347", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                      {u.status === "suspended" ? "Réactiver" : "Suspendre"}
                    </button>
                    <button onClick={() => removeUser(u.id, u.name)} style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Retirer</button>
                  </div>
                ))}
                {list.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun pour le moment.</p>}
              </div>
            ))}
          </>
        )}

        {tab === "activity" && (
          <>
            <h2 style={{ margin: "0 0 8px", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>Activité des élèves</h2>
            <p style={{ margin: "0 0 24px", color: "#6B7280", fontSize: 14 }}>Inscriptions, devoirs, quiz, et messages — les 50 actions les plus récentes.</p>
            {activityLoading && <Spinner label="Chargement…" />}
            {!activityLoading && activity.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucune activité pour le moment.</p>}
            {!activityLoading && activity.map((a) => {
              const iconMap = { enroll: <GraduationCapIcon size={18} color="#00D4AA" />, homework: <FileTextIcon size={18} color="#FFB347" />, quiz: <CheckCircleIcon size={18} color="#7C6FFF" />, message: <ChatIcon size={18} color="#FF6B8A" /> };
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 10, marginBottom: 8 }}>
                  <span style={{ display: "flex" }}>{iconMap[a.type]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}><b>{a.student || "Quelqu'un"}</b> {a.detail}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{new Date(a.ts).toLocaleString("fr-FR")}</div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === "reports" && (
          <>
            <h2 style={{ margin: "0 0 8px", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>Signalements</h2>
            <p style={{ margin: "0 0 24px", color: "#6B7280", fontSize: 14 }}>Messages signalés par des élèves ou professeurs, en attente de modération.</p>
            {reports.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun signalement en attente.</p>}
            {reports.map((r) => (
              <div key={r.id} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                      Signalé par <b>{r.reporter?.name || "quelqu'un"}</b> · Motif : <b>{r.reason}</b>
                    </div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                      Auteur du message : {r.message?.author?.name || "utilisateur supprimé"}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <div style={{ background: "#F7F8FA", borderRadius: 8, padding: 12, fontSize: 13, color: "#12141C", marginBottom: 12 }}>
                  {r.message?.text || "(message déjà supprimé)"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {r.message && (
                    <button onClick={() => handleDeleteReportedMessage(r)} style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <TrashIcon size={13} color="#FF6677" /> Supprimer le message
                    </button>
                  )}
                  <button onClick={() => handleDismissReport(r.id)} style={{ background: "none", border: "1px solid #E2E5EB", color: "#6B7280", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                    Ignorer le signalement
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {!loading && tab === "applications" && (
          <>
            <h2 style={{ margin: "0 0 8px", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>Candidatures professeurs</h2>
            <p style={{ margin: "0 0 24px", color: "#6B7280", fontSize: 14 }}>Approuvez pour générer un code d'invitation à transmettre au candidat.</p>

            {revealCode && (
              <div style={{ background: "#00D4AA18", border: "1px solid #00D4AA55", borderRadius: 12, padding: 18, marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#00D4AA", fontWeight: 700, marginBottom: 6 }}>✓ Candidature approuvée pour {revealCode.email}</div>
                <div style={{ fontSize: 13, color: "#4B5568", marginBottom: 10 }}>Transmettez ce code au candidat pour qu'il finalise son compte :</div>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 800, color: "#12141C", background: "#FFFFFF", padding: "10px 16px", borderRadius: 8, display: "inline-block" }}>{revealCode.code}</div>
                <div><button onClick={() => setRevealCode(null)} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 12, cursor: "pointer", marginTop: 10 }}>Fermer</button></div>
              </div>
            )}

            {applications.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucune candidature pour le moment.</p>}
            {applications.map((a) => (
              <div key={a.id} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{a.email} · {a.subject}</div>
                  </div>
                  <Badge label={a.status === "pending" ? "En attente" : a.status === "approved" ? "Approuvée" : "Rejetée"} color={a.status === "pending" ? "#FFB347" : a.status === "approved" ? "#00D4AA" : "#FF6677"} />
                </div>
                {a.message && <p style={{ fontSize: 13, color: "#4B5568", margin: "0 0 10px" }}>{a.message}</p>}
                {a.status === "pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={() => approveApplication(a)} small color="#00D4AA" style={{ fontFamily: "inherit" }}>Approuver</Btn>
                    <Btn onClick={() => rejectApplication(a)} small secondary color="#FF6677" style={{ fontFamily: "inherit" }}>Rejeter</Btn>
                  </div>
                )}
                {a.status === "approved" && !a.used && <div style={{ fontSize: 12, color: "#6B7280" }}>Code : <span style={{ fontFamily: "monospace", color: "#00D4AA" }}>{a.invite_code}</span> (non utilisé)</div>}
                {a.used && <div style={{ fontSize: 12, color: "#6B7280" }}>Compte déjà créé avec ce code.</div>}
              </div>
            ))}
          </>
        )}

        {!loading && tab === "announcements" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>Annonces</h2>
              <Btn onClick={() => setShowAddAnnouncement((v) => !v)} small color="#7C6FFF" style={{ fontFamily: "inherit" }}>{showAddAnnouncement ? "Annuler" : "+ Nouvelle annonce"}</Btn>
            </div>
            <p style={{ margin: "0 0 24px", color: "#6B7280", fontSize: 14 }}>Visible par tous les utilisateurs via la cloche de notification .</p>

            {showAddAnnouncement && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 18, marginBottom: 20 }}>
                <Inp label="Titre" value={annTitle} onChange={setAnnTitle} placeholder="ex. Maintenance prévue" />
                <TA label="Message" value={annMessage} onChange={setAnnMessage} rows={3} placeholder="Détails de l'annonce…" />
                <Btn onClick={submitAnnouncement} color="#7C6FFF" style={{ fontFamily: "inherit" }}>Publier</Btn>
              </div>
            )}

            {announcements.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucune annonce pour le moment.</p>}
            {announcements.map((a) => (
              <div key={a.id} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                    <p style={{ margin: "0 0 6px", fontSize: 13, color: "#4B5568" }}>{a.message}</p>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>{a.author?.name || "Admin"} · {new Date(a.created_at).toLocaleString("fr-FR")}</div>
                  </div>
                  <button onClick={() => removeAnnouncement(a.id)} style={{ background: "none", border: "none", color: "#FF6677", cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
              </div>
            ))}
          </>
        )}

        {!loading && tab === "diaporama" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>Diaporama</h2>
              <Btn onClick={() => setShowAddSlide((v) => !v)} small color="#7C6FFF" style={{ fontFamily: "inherit" }}>{showAddSlide ? "Annuler" : "+ Ajouter une image"}</Btn>
            </div>
            <p style={{ margin: "0 0 24px", color: "#6B7280", fontSize: 14 }}>Images affichées en rotation sous l'en-tête. Chaque image peut avoir un lien cliquable.</p>

            {showAddSlide && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 18, marginBottom: 20 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Image</label>
                  <input type="file" accept="image/*" onChange={(e) => setSlideFile(e.target.files?.[0] || null)} style={{ color: "#12141C", fontSize: 13 }} />
                </div>
                <Inp label="Titre affiché (optionnel)" value={slideTitle} onChange={setSlideTitle} placeholder="ex. Nouvelle rentrée 2026" />
                <Inp label="Lien au clic (optionnel)" value={slideLink} onChange={setSlideLink} placeholder="https://…" />
                <Btn onClick={submitSlide} disabled={slideBusy || !slideFile} color="#7C6FFF" style={{ fontFamily: "inherit" }}>{slideBusy ? "Envoi…" : "Ajouter au diaporama"}</Btn>
              </div>
            )}

            {slides.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucune image — le diaporama affiche des textes par défaut.</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {slides.map((s) => (
                <div key={s.id} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ height: 110, background: "#F7F8FA" }}><img src={s.image_url} alt={s.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{s.title || <span style={{ color: "#6B7280" }}>Sans titre</span>}</div>
                    {s.link_url && <div style={{ fontSize: 11, color: "#7C6FFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 8 }}>{s.link_url}</div>}
                    <button onClick={() => removeSlide(s.id)} style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && tab === "courses" && (
          <>
            <h2 style={{ margin: "0 0 24px", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>Tous les cours</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {courses.map((c) => (
                <div key={c.id} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, overflow: "hidden" }}>
                  {c.cover_image_url ? (
                    <div style={{ height: 90, overflow: "hidden" }}><img src={c.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                  ) : (
                    <div style={{ height: 5, background: c.color }} />
                  )}
                  <div style={{ padding: 18 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>{c.teacher?.name} · {c.duration_days} jours</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{c.enrolledCount} inscrits</div>
                  </div>
                </div>
              ))}
            </div>
            {courses.length === 0 && <p style={{ color: "#9CA3AF" }}>Aucun cours créé pour le moment.</p>}
          </>
        )}

        {!loading && tab === "stats" && (
          <>
            <h2 style={{ margin: "0 0 24px", fontFamily: "'Syne',sans-serif", fontWeight: 800 }}>Statistiques de la plateforme</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 14 }}>
              {[
                { l: "Élèves", v: students.length, c: "#00D4AA" },
                { l: "Professeurs", v: teachers.length, c: "#7C6FFF" },
                { l: "Cours", v: courses.length, c: "#FFB347" },
                { l: "Candidatures en attente", v: pendingApps.length, c: "#FF6677" },
                { l: "Inscriptions", v: courses.reduce((a, c) => a + c.enrolledCount, 0), c: "#A899FF" },
              ].map((s) => (
                <div key={s.l} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: s.c, fontFamily: "'Syne',sans-serif" }}>{s.v}</div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
