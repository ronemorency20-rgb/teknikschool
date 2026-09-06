import { useEffect, useState } from "react";
import { fetchPublicPreview } from "./coursesApi";
import { Spinner } from "./ui";
import { LockIcon, GraduationCapIcon } from "./Icons";

const FONTS = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap";

// Public, no-login-required preview page — reachable at
// teknikskool.com/#/preview/<chapterId>. A student shares this link with
// someone outside the app; they see a teaser and a call-to-action to sign
// up, but never the actual lesson content (that stays behind enrollment).
export default function PreviewPage({ chapterId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try { setData(await fetchPublicPreview(chapterId)); }
      catch (e) { setErr("Ce lien n'est plus valide ou ce contenu a été retiré."); }
      finally { setLoading(false); }
    })();
  }, [chapterId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F8FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={28} label="Chargement…" />
      </div>
    );
  }

  if (err || !data) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F8FA", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", padding: 20, textAlign: "center" }}>
        <p style={{ color: "#6B7280" }}>{err || "Contenu introuvable."}</p>
      </div>
    );
  }

  const c = data.course;

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", fontFamily: "'DM Sans',sans-serif" }}>
      <link href={FONTS} rel="stylesheet" />

      <div style={{ background: "#12141C", padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/logo.png" alt="TeknikSchool" style={{ width: 30, height: 30, objectFit: "contain" }} />
        <span style={{ color: "#fff", fontWeight: 800, fontFamily: "'Syne',sans-serif", fontSize: 15 }}>TeknikSchool</span>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 0 60px" }}>
        {c.cover_image_url ? (
          <div style={{ height: 220, overflow: "hidden" }}><img src={c.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
        ) : (
          <div style={{ height: 100, background: c.color || "#7C6FFF" }} />
        )}

        <div style={{ padding: "28px 20px" }}>
          <div style={{ fontSize: 12, color: "#7C6FFF", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>{c.title}</div>
          <h1 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: "#12141C", fontFamily: "'Syne',sans-serif" }}>
            Chapitre {data.number} — {data.title}
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>{c.description}</p>

          <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 24, textAlign: "center", marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#7C6FFF18", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <LockIcon size={22} color="#7C6FFF" />
            </div>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15, color: "#12141C" }}>Ce contenu est réservé aux élèves inscrits</p>
            <p style={{ margin: "0 0 18px", fontSize: 13, color: "#6B7280" }}>Créez un compte gratuit pour accéder à ce chapitre et à tout le cours.</p>
            <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#12141C", color: "#fff", padding: "12px 28px", borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: "none", fontFamily: "inherit" }}>
              <GraduationCapIcon size={16} color="#fff" /> Créer mon compte gratuit
            </a>
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
            {c.price === 0 ? "Ce cours est gratuit." : `Prix du cours : ${c.price}$`} · Rejoignez TeknikSchool dès aujourd'hui.
          </p>
        </div>
      </div>
    </div>
  );
}
