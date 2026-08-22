import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabaseClient";
import { Modal, Av, Badge, RC, fmtDate, Spinner } from "./ui";
import { CameraIcon, TrophyIcon } from "./Icons";
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
      // Account is now gone — sign out locally so the app returns to the login screen
      await supabase.auth.signOut();
      window.location.reload();
    } catch (e) {
      setErr(e.message);
      setDeleting(false);
    }
  };

  const color = RC[profile?.role] || "#7C6FFF";

  return (
    <Modal title="Mon profil" onClose={onClose} width={560}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E5EB" }}>
        <div style={{ position: "relative" }}>
          <Av name={profile?.name} size={72} color={color} img={profile?.avatar_url} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: "50%", background: color, border: "2px solid #FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {uploading ? <Spinner size={12} color="#fff" /> : <CameraIcon size={13} color="#fff" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </div>
        <div>
          <h2 style={{ margin: "0 0 4px", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22 }}>{profile?.name}</h2>
          <p style={{ margin: "0 0 6px", color: "#6B7280", fontSize: 13 }}>{user?.email}</p>
          <Badge label={profile?.role} color={color} />
        </div>
      </div>

      {err && <p style={{ color: "#FF6677", fontSize: 12, marginBottom: 14 }}>{err}</p>}

      <div style={{ display: "grid", gridTemplateColumns: profile?.role === "student" ? "repeat(3,1fr)" : "repeat(2,1fr)", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Inscrit le</div>
          <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif" }}>{profile?.join_date ? fmtDate(profile.join_date) : "—"}</div>
        </div>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{profile?.role === "student" ? "Cours" : "Enseigne"}</div>
          <div style={{ fontWeight: 700, fontSize: 20, fontFamily: "'Syne',sans-serif", color }}>{courses.length}</div>
        </div>
        {profile?.role === "student" && (
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Certificats</div>
            <div style={{ fontWeight: 700, fontSize: 20, fontFamily: "'Syne',sans-serif", color: "#FFB347" }}>{certificates.length}</div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: profile?.role === "student" ? 24 : 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
          {profile?.role === "student" ? "Cours inscrits" : "Cours enseignés"}
        </div>
        {loading && <Spinner size={18} label="Chargement…" />}
        {!loading && courses.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun pour le moment.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {courses.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</div>
            </div>
          ))}
        </div>
      </div>

      {profile?.role === "student" && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Certificats obtenus</div>
          {certificates.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun certificat obtenu. Réussissez un examen final pour en obtenir un!</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {certificates.map((cert) => (
              <div key={cert.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg, #FFB34712, transparent)", border: "1px solid #FFB34740", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#FFB34722", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><TrophyIcon size={18} color="#FFB347" /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#FFB347" }}>{cert.course_title}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>Délivré le {fmtDate(cert.issued_at)}</div>
                </div>
              </div>
            ))}
          </div>
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
    </Modal>
  );
}
