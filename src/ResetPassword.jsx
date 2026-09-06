import { useState } from "react";
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

export default function ResetPassword({ onDone }) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr("");
    if (password.length < 6) { setErr("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (password !== confirm) { setErr("Les mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) setErr(error.message);
    else setDone(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ background: "#fff", border: "1px solid #E2E5EB", borderRadius: 20, padding: 44, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(20,20,40,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <img src="/logo.png" alt="TeknikSchool" style={{ width: 84, height: 84, objectFit: "contain", marginBottom: 10 }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#12141C", fontFamily: "'Syne',sans-serif" }}>Nouveau mot de passe</h1>
        </div>

        {done ? (
          <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: 16, textAlign: "center" }}>
            <p style={{ color: "#059669", fontSize: 13, margin: "0 0 14px" }}>Mot de passe mis à jour avec succès !</p>
            <Btn onClick={onDone} color="#12141C" style={{ width: "100%", fontFamily: "inherit" }}>Continuer</Btn>
          </div>
        ) : (
          <>
            <Inp label="Nouveau mot de passe" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
            <Inp label="Confirmer le mot de passe" value={confirm} onChange={setConfirm} type="password" placeholder="••••••••" />
            {err && <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}
            <Btn onClick={submit} disabled={busy} color="#12141C" style={{ width: "100%", fontFamily: "inherit" }}>{busy ? "Un instant…" : "Mettre à jour"}</Btn>
          </>
        )}
      </div>
    </div>
  );
}
