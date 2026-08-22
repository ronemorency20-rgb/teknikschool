import { useState } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";
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

export default function TeacherFinalize({ onBack, onDone }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!email.trim() || !code.trim() || !name.trim() || password.length < 6) {
      setErr("Veuillez remplir tous les champs (mot de passe : 6 caractères min).");
      return;
    }
    setBusy(true); setErr("");
    try {
      const { data: app, error: findErr } = await supabase
        .from("teacher_applications")
        .select("*")
        .eq("email", email.trim())
        .eq("invite_code", code.trim())
        .eq("status", "approved")
        .eq("used", false)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!app) { setErr("Code invalide, déjà utilisé, ou candidature non approuvée."); setBusy(false); return; }

      const { error: signErr } = await signUp({ email: email.trim(), password, name, role: "teacher", subject: app.subject });
      if (signErr) throw signErr;

      await supabase.from("teacher_applications").update({ used: true }).eq("id", app.id);
      onDone();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", padding: 20 }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ background: "#fff", border: "1px solid #E2E5EB", borderRadius: 20, padding: 44, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(20,20,40,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <img src="/logo.png" alt="TeknikSchool" style={{ width: 84, height: 84, objectFit: "contain", marginBottom: 10 }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#12141C", fontFamily: "'Syne',sans-serif" }}>Finaliser mon compte</h1>
          <p style={{ margin: "8px 0 0", color: "#6B7280", fontSize: 13 }}>Entrez l'e-mail utilisé pour postuler et le code reçu.</p>
        </div>
        <Inp label="E-mail" value={email} onChange={setEmail} type="email" placeholder="votre@email.com" />
        <Inp label="Code d'invitation" value={code} onChange={setCode} placeholder="ex. TK-A1B2C3" />
        <Inp label="Nom complet" value={name} onChange={setName} placeholder="Marie Dupont" />
        <Inp label="Choisir un mot de passe" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
        {err && <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}
        <Btn onClick={submit} disabled={busy} color="#059669" style={{ width: "100%", fontFamily: "inherit" }}>{busy ? "Un instant…" : "Créer mon compte professeur"}</Btn>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 12, cursor: "pointer", marginTop: 18, display: "block", width: "100%", textAlign: "center" }}>← Retour</button>
      </div>
    </div>
  );
}
