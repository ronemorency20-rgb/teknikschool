import { useState } from "react";
import { useAuth } from "./AuthContext";

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

export default function AuthScreen({ onGoForgot, onGoApply, onGoFinalize }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const traduireErreur = (msg) => {
    if (/already registered|already exists/i.test(msg)) return "Un compte existe déjà avec cet e-mail.";
    if (/invalid login credentials/i.test(msg)) return "E-mail ou mot de passe invalide.";
    if (/email not confirmed/i.test(msg)) return "Veuillez confirmer votre e-mail avant de vous connecter.";
    return msg;
  };

  const handleLogin = async () => {
    setErr(""); setBusy(true);
    const { error } = await signIn({ email, password });
    setBusy(false);
    if (error) setErr(traduireErreur(error.message));
  };

  const handleSignup = async () => {
    setErr(""); setInfo(""); setBusy(true);
    if (!name.trim() || !email.trim() || !password) { setBusy(false); setErr("Veuillez remplir tous les champs."); return; }
    if (password.length < 6) { setBusy(false); setErr("Le mot de passe doit contenir au moins 6 caractères."); return; }
    const { error, data } = await signUp({ email, password, name, role: "student" });
    setBusy(false);
    if (error) { setErr(traduireErreur(error.message)); return; }
    if (data?.user && !data.user.confirmed_at && !data.session) {
      setInfo("Compte créé ! Vérifiez votre e-mail pour confirmer votre inscription avant de vous connecter.");
      setMode("login");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ background: "#fff", border: "1px solid #E2E5EB", borderRadius: 20, padding: 44, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(20,20,40,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img src="/logo.png" alt="TeknikSchool" style={{ width: 110, height: 110, objectFit: "contain", marginBottom: 10 }} />
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#12141C", letterSpacing: -1, fontFamily: "'Syne',sans-serif" }}>TeknikSchool</h1>
          <p style={{ margin: "6px 0 0", color: "#6B7280", fontSize: 13, fontStyle: "italic" }}>L'éducation américaine à votre portée</p>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#F1F2F5", borderRadius: 11, padding: 4 }}>
          <button onClick={() => { setMode("login"); setErr(""); setInfo(""); }} style={{ flex: 1, background: mode === "login" ? "#12141C" : "none", border: "none", color: mode === "login" ? "#fff" : "#6B7280", padding: "9px 0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Syne',sans-serif" }}>Se connecter</button>
          <button onClick={() => { setMode("signup"); setErr(""); setInfo(""); }} style={{ flex: 1, background: mode === "signup" ? "#12141C" : "none", border: "none", color: mode === "signup" ? "#fff" : "#6B7280", padding: "9px 0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Syne',sans-serif" }}>Créer un compte</button>
        </div>

        {mode === "signup" && (
          <>
            <Inp label="Nom complet" value={name} onChange={setName} placeholder="Marie Dupont" />
            <p style={{ margin: "-8px 0 14px", fontSize: 11, color: "#9CA3AF" }}>Les nouveaux comptes sont créés en tant qu'élève.</p>
          </>
        )}

        <Inp label="E-mail" value={email} onChange={setEmail} type="email" placeholder="votre@ecole.edu" />
        <Inp label="Mot de passe" value={password} onChange={setPassword} type="password" placeholder="••••••••" />

        {mode === "login" && (
          <button onClick={onGoForgot} style={{ background: "none", border: "none", color: "#4F46E5", fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 14, display: "block" }}>
            Mot de passe oublié ?
          </button>
        )}

        {err && <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}
        {info && <p style={{ color: "#059669", fontSize: 13, margin: "0 0 12px" }}>{info}</p>}

        <button
          onClick={mode === "login" ? handleLogin : handleSignup}
          disabled={busy}
          style={{ width: "100%", padding: "12px", fontFamily: "inherit", fontSize: 15, background: "#12141C", border: "1px solid #12141C", borderRadius: 9, color: "#fff", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "Un instant…" : mode === "login" ? "Se connecter →" : "Créer mon compte →"}
        </button>

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
          <button onClick={onGoApply} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 12, cursor: "pointer" }}>
            Vous êtes professeur ? <span style={{ color: "#D97706", fontWeight: 700 }}>Postulez ici</span>
          </button>
          <button onClick={onGoFinalize} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 12, cursor: "pointer" }}>
            Candidature approuvée ? <span style={{ color: "#059669", fontWeight: 700 }}>Finaliser mon compte</span>
          </button>
        </div>

        <div style={{ marginTop: 22, padding: 14, background: "#F7F8FA", borderRadius: 10, fontSize: 12, color: "#6B7280", lineHeight: 1.7, textAlign: "center" }}>
          Nous sommes entièrement gratuits grâce à notre sponsor <b style={{ color: "#4F46E5" }}>Morency Tech</b>, et nous restons ouverts à de nouveaux sponsors.
        </div>
      </div>
    </div>
  );
}
