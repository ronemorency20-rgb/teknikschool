import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabaseClient";
import { Modal, Av, Badge, RC, fmtDate, Spinner } from "./ui";
import { CameraIcon, TrophyIcon, BookIcon, GraduationCapIcon, CalendarIcon } from "./Icons";
import { fetchStudentCourses, fetchTeacherCourses, fetchMyCertificates, deleteUserCompletely } from "./coursesApi";

export default function MyProfile({ onClose }) {
  const { user, profile, updateProfile } = useAuth();
  const fileRef = useRef(null);
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("courses");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (profile?.role === "student") {
          const [c, certs] = await Promise.all([fetchStudentCourses(user.id), fetchMyCertificates(user.id)]);
          setCourses(c); setCertificates(certs);
        } else if (profile?.role === "teacher") {
          setCourses(await fetchTeacherCourses(user.id));
        }
      } catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, [profile?.role]);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErr("");
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("course-files").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("course-files").getPublicUrl(path);
      await updateProfile({ avatar_url: data.publicUrl });
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText.trim().toUpperCase() !== "SUPPRIMER") return;
    setDeleting(true); setErr("");
    try {
      await deleteUserCompletely(user.id);
      await supabase.auth.signOut();
      window.location.reload();
    } catch (e) {
      setErr(e.message);
      setDeleting(false);
    }
  };

  const color = RC[profile?.role] || "#7C6FFF";
  const isStudent = profile?.role === "student";

  return (
    <Modal title="" onClose={onClose} width={600} noPadding>
      {/* ---- Cover banner + overlapping avatar (Facebook-style) ---- */}
      <div style={{ position: "relative" }}>
        <div style={{ height: 128, background: `linear-gradient(135deg, ${color}, ${color}99)`, borderRadius: "16px 16px 0 0" }} />
        <div style={{ position: "absolute", left: 24, bottom: -40 }}>
          <div style={{ position: "relative" }}>
            <div style={{ padding: 4, background: "#FFFFFF", borderRadius: "50%" }}>
              <Av name={profile?.name} size={84} color={color} img={profile?.avatar_url} />
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ position: "absolute", bottom: 2, right: 2, width: 28, height: 28, borderRadius: "50%", background: color, border: "2px solid #FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {uploading ? <Spinner size={12} color="#fff" /> : <CameraIcon size={13} color="#fff" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
          </div>
        </div>
      </div>

      <div style={{ padding: "50px 24px 24px" }}>
        <h2 style={{ margin: "0 0 4px", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: "#12141C" }}>{profile?.name}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <Badge label={profile?.role} color={color} />
          <span style={{ color: "#9CA3AF", fontSize: 13 }}>{user?.email}</span>
        </div>

        {err && <p style={{ color: "#FF6677", fontSize: 12, marginBottom: 14 }}>{err}</p>}

        {/* ---- Stat pills ---- */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F7F8FA", borderRadius: 10, padding: "10px 16px" }}>
            <CalendarIcon size={16} color="#6B7280" />
            <div>
              <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>Inscrit le</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#12141C" }}>{profile?.join_date ? fmtDate(profile.join_date) : "—"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: color + "12", borderRadius: 10, padding: "10px 16px" }}>
            <BookIcon size={16} color={color} />
            <div>
              <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>{isStudent ? "Cours" : "Enseigne"}</div>
              <div style={{ fontWeight: 800, fontSize: 16, color }}>{courses.length}</div>
            </div>
          </div>
          {isStudent && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFB34712", borderRadius: 10, padding: "10px 16px" }}>
              <TrophyIcon size={16} color="#FFB347" />
              <div>
                <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>Certificats</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#FFB347" }}>{certificates.length}</div>
              </div>
            </div>
          )}
        </div>

        {/* ---- Tabs ---- */}
        <div style={{ display: "flex", gap: 4, background: "#F7F8FA", borderRadius: 10, padding: 4, marginBottom: 18, width: "fit-content" }}>
          <button onClick={() => setActiveTab("courses")} style={{ background: activeTab === "courses" ? "#FFFFFF" : "none", border: "none", boxShadow: activeTab === "courses" ? "0 1px 4px rgba(0,0,0,.08)" : "none", borderRadius: 7, padding: "7px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13, color: activeTab === "courses" ? "#12141C" : "#6B7280", fontFamily: "'Syne',sans-serif" }}>
            {isStudent ? "Cours" : "Cours enseignés"}
          </button>
          {isStudent && (
            <button onClick={() => setActiveTab("certificates")} style={{ background: activeTab === "certificates" ? "#FFFFFF" : "none", border: "none", boxShadow: activeTab === "certificates" ? "0 1px 4px rgba(0,0,0,.08)" : "none", borderRadius: 7, padding: "7px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13, color: activeTab === "certificates" ? "#12141C" : "#6B7280", fontFamily: "'Syne',sans-serif" }}>
              Certificats
            </button>
          )}
        </div>

        {loading && <Spinner size={18} label="Chargement…" />}

        {!loading && activeTab === "courses" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {courses.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun cours pour le moment.</p>}
            {courses.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 10, padding: "12px 14px" }}>
                {c.cover_image_url ? (
                  <img src={c.cover_image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: c.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <GraduationCapIcon size={18} color="#fff" />
                  </div>
                )}
                <div style={{ fontWeight: 600, fontSize: 14, color: "#12141C" }}>{c.title}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === "certificates" && isStudent && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {certificates.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun certificat obtenu. Réussissez un examen final pour en obtenir un !</p>}
            {certificates.map((cert) => (
              <div key={cert.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg, #FFB34712, transparent)", border: "1px solid #FFB34740", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FFB34722", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><TrophyIcon size={18} color="#FFB347" /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#FFB347" }}>{cert.course_title}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>Délivré le {fmtDate(cert.issued_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #E2E5EB" }}>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} style={{ background: "none", border: "1px solid #FF444555", color: "#FF6677", borderRadius: 9, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
              Supprimer mon compte
            </button>
          ) : (
            <div style={{ background: "#FF445510", border: "1px solid #FF444540", borderRadius: 12, padding: 16 }}>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#12141C", fontWeight: 700 }}>Cette action est irréversible</p>
              <p style={{ margin: "0 0 14px", fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
                Votre compte, votre profil, vos inscriptions, certificats et messages seront supprimés définitivement.
                Tapez <b>SUPPRIMER</b> ci-dessous pour confirmer.
              </p>
              <input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="SUPPRIMER"
                style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 10, boxSizing: "border-box", fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleDeleteAccount} disabled={deleteText.trim().toUpperCase() !== "SUPPRIMER" || deleting}
                  style={{ background: "#FF4455", border: "none", color: "#fff", borderRadius: 8, padding: "9px 16px", cursor: deleteText.trim().toUpperCase() === "SUPPRIMER" ? "pointer" : "not-allowed", opacity: deleteText.trim().toUpperCase() === "SUPPRIMER" ? 1 : 0.5, fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
                  {deleting ? "Suppression…" : "Confirmer la suppression"}
                </button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }} style={{ background: "none", border: "1px solid #E2E5EB", color: "#6B7280", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
