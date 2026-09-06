import { useState } from "react";
import { supabase } from "./supabaseClient";
import { deleteUserCompletely } from "./coursesApi";

const FONTS = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap";

// Standalone account-deletion page, reachable at teknikskool.com/#/delete-account
// This exists as a REQUIREMENT from Google Play: apps that allow account
// creation must offer a way to delete an account and its data from the web,
// even for someone who no longer has the app installed. It's intentionally
// separate from the main app's navigation.
export default function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState("login"); // login | confirm | done
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async () => {
    setErr(""); setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setStep("confirm");
    } catch (e) {
      setErr("E-mail ou mot de passe invalide.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "SUPPRIMER") return;
    setErr(""); setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée, veuillez recommencer.");
      await deleteUserCompletely(user.id);
      await supabase.auth.signOut();
      setStep("done");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", padding: 20 }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ background: "#fff", border: "1px solid #E2E5EB", borderRadius: 20, padding: 40, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(20,20,40,0.08)" }}>
        <img src="/logo.png" alt="TeknikSchool" style={{ width: 64, height: 64, objectFit: "contain", display: "block", margin: "0 auto 16px" }} />
        <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#12141C", fontFamily: "'Syne',sans-serif", textAlign: "center" }}>Supprimer mon compte</h1>

        {step === "login" && (
          <>
            <p style={{ margin: "0 0 22px", color: "#6B7280", fontSize: 13, textAlign: "center" }}>
              Connectez-vous pour demander la suppression définitive de votre compte TeknikSchool et de toutes vos données.
            </p>
            <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600 }}>E-MAIL</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="votre@ecole.edu"
              style={{ width: "100%", background: "#F7F8FA", border: "1px solid #E2E5EB", borderRadius: 8, padding: "10px 13px", marginBottom: 14, boxSizing: "border-box", fontSize: 14, fontFamily: "inherit" }} />
            <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600 }}>MOT DE PASSE</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••"
              style={{ width: "100%", background: "#F7F8FA", border: "1px solid #E2E5EB", borderRadius: 8, padding: "10px 13px", marginBottom: 16, boxSizing: "border-box", fontSize: 14, fontFamily: "inherit" }} />
            {err && <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}
            <button onClick={handleLogin} disabled={busy || !email || !password}
              style={{ width: "100%", padding: 12, background: "#12141C", border: "none", borderRadius: 9, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              {busy ? "Connexion…" : "Continuer"}
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <div style={{ background: "#FF445510", border: "1px solid #FF444540", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "#12141C", fontWeight: 700 }}>Cette action est irréversible</p>
              <p style={{ margin: 0, fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
                Votre profil, vos inscriptions, certificats et messages seront supprimés définitivement de nos serveurs.
              </p>
            </div>
            <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600 }}>
              Tapez SUPPRIMER pour confirmer
            </label>
            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="SUPPRIMER"
              style={{ width: "100%", background: "#F7F8FA", border: "1px solid #E2E5EB", borderRadius: 8, padding: "10px 13px", marginBottom: 16, boxSizing: "border-box", fontSize: 14, fontFamily: "inherit" }} />
            {err && <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}
            <button onClick={handleDelete} disabled={busy || confirmText.trim().toUpperCase() !== "SUPPRIMER"}
              style={{ width: "100%", padding: 12, background: "#DC2626", border: "none", borderRadius: 9, color: "#fff", fontWeight: 700, fontSize: 14, cursor: confirmText.trim().toUpperCase() === "SUPPRIMER" ? "pointer" : "not-allowed", opacity: confirmText.trim().toUpperCase() === "SUPPRIMER" ? 1 : 0.5, fontFamily: "inherit" }}>
              {busy ? "Suppression…" : "Supprimer définitivement mon compte"}
            </button>
          </>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#12141C", margin: "10px 0" }}>
              Votre compte a été supprimé avec succès. Toutes vos données ont été effacées.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
