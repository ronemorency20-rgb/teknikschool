import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import AuthScreen from "./AuthScreen";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import DeleteAccountPage from "./DeleteAccountPage";
import TeacherApply from "./TeacherApply";
import TeacherFinalize from "./TeacherFinalize";
import AdminPortal from "./AdminPortal";
import TeacherPortal from "./TeacherPortal";
import StudentPortal from "./StudentPortal";
import { FullPageSpinner } from "./ui";
import MyProfile from "./MyProfile";

function useHashRoute() {
  const [route, setRoute] = useState(window.location.hash.replace(/^#/, "") || "/");
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace(/^#/, "") || "/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (path) => { window.location.hash = path; };
  return [route, go];
}

function Root() {
  const { user, profile, loading, signOut } = useAuth();
  const [route, go] = useHashRoute();
  const [showProfile, setShowProfile] = useState(false);

  // Supabase's password-recovery link lands here with a recovery session
  if (route === "/reset-password") {
    return <ResetPassword onDone={() => go("/")} />;
  }

  // Standalone account-deletion page (Google Play requirement) — works
  // independently of the normal login flow, reachable at /#/delete-account
  if (route === "/delete-account") {
    return <DeleteAccountPage />;
  }

  if (loading) {
    return <FullPageSpinner />;
  }

  if (!user) {
    if (route === "/forgot-password") return <ForgotPassword onBack={() => go("/")} />;
    if (route === "/apply-teacher") return <TeacherApply onBack={() => go("/")} />;
    if (route === "/finalize-teacher") return <TeacherFinalize onBack={() => go("/")} onDone={() => go("/")} />;
    return (
      <AuthScreen
        onGoForgot={() => go("/forgot-password")}
        onGoApply={() => go("/apply-teacher")}
        onGoFinalize={() => go("/finalize-teacher")}
      />
    );
  }

  if (!profile) {
    return <FullPageSpinner label="Préparation de votre profil…" />;
  }

  if (profile.status === "suspended") {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F8FA", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", padding: 20 }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 16, padding: 36, maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 14 }}></div>
          <h2 style={{ margin: "0 0 10px", color: "#FF6677", fontFamily: "'Syne',sans-serif" }}>Compte suspendu</h2>
          <p style={{ margin: "0 0 22px", color: "#4B5568", fontSize: 14 }}>Votre compte a été suspendu par un administrateur. Contactez l'école pour plus d'informations.</p>
          <button onClick={signOut} style={{ background: "#7C6FFF", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Déconnexion</button>
        </div>
      </div>
    );
  }

  const onProfile = () => setShowProfile(true);

  return (
    <>
      {profile.role === "admin" && <AdminPortal onProfile={onProfile} />}
      {profile.role === "teacher" && <TeacherPortal onProfile={onProfile} />}
      {profile.role === "student" && <StudentPortal onProfile={onProfile} />}
      {showProfile && <MyProfile onClose={() => setShowProfile(false)} />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
