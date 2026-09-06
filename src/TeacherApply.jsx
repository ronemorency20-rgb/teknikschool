import { useState } from "react";
import { supabase } from "./supabaseClient";
import { Btn } from "./ui";

const FONTS = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap";

function Inp({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: "#F7F8FA", border: "1px solid #E2E5EB", borderRadius: 8, padding: "10px 13px", color: "#1A1D29", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
    </div>
  );
}
function TA({ label, value, onChange, rows = 4, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        style={{ width: "100%", background: "#F7F8FA", border: "1px solid #E2E5EB", borderRadius: 8, padding: "10px 13px", color: "#1A1D29", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />
    </div>
  );
}

export default function TeacherApply({ onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !subject.trim()) { setErr("Veuillez remplir les champs obligatoires."); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.from("teacher_applications").insert({ name, email, subject, message });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", padding: 20 }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ background: "#fff", border: "1px solid #E2E5EB", borderRadius: 20, padding: 44, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(20,20,40,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <img src="/logo.png" alt="TeknikSchool" style={{ width: 84, height: 84, objectFit: "contain", marginBottom: 10 }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#12141C", fontFamily: "'Syne',sans-serif" }}>Devenir professeur</h1>
          <p style={{ margin: "8px 0 0", color: "#6B7280", fontSize: 13 }}>Soumettez votre candidature. Notre équipe l'examinera et vous contactera.</p>
        </div>

        {sent ? (
          <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: 16, textAlign: "center", fontSize: 13, color: "#059669" }}>
            Candidature envoyée ! Vous recevrez un e-mail avec un code d'invitation si elle est approuvée.
          </div>
        ) : (
          <>
            <Inp label="Nom complet" value={name} onChange={setName} placeholder="Marie Dupont" />
            <Inp label="E-mail" value={email} onChange={setEmail} type="email" placeholder="votre@email.com" />
            <Inp label="Matière" value={subject} onChange={setSubject} placeholder="ex. Mathématiques" />
            <TA label="Message (optionnel)" value={message} onChange={setMessage} rows={4} placeholder="Parlez-nous de votre expérience…" />
            {err && <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}
            <Btn onClick={submit} disabled={busy} color="#D97706" style={{ width: "100%", fontFamily: "inherit" }}>{busy ? "Envoi…" : "Envoyer ma candidature"}</Btn>
          </>
        )}

        <button onClick={onBack} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 12, cursor: "pointer", marginTop: 18, display: "block", width: "100%", textAlign: "center" }}>← Retour</button>
      </div>
    </div>
  );
}
