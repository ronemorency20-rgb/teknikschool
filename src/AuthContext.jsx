import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error) setProfile(data);
    return data;
  };

  useEffect(() => {
    // Restore session on page load / refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    // Keep session in sync (login, logout, token refresh) across the app
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = async ({ email, password, name, role, subject }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, subject: subject || null } },
    });
    if (error) return { error };
    // profile row is auto-created by the DB trigger; give it a moment then load it
    if (data.user) {
      // subject isn't set by the trigger (trigger only sets name+role) — patch it in if provided
      if (subject) {
        await supabase.from("profiles").update({ subject }).eq("id", data.user.id);
      }
      await loadProfile(data.user.id);
    }
    return { data };
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) await loadProfile(data.user.id);
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!session?.user) return { error: "Not logged in" };
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", session.user.id)
      .select()
      .single();
    if (!error) setProfile(data);
    return { data, error };
  };

  const sendPasswordReset = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/#/reset-password",
    });
    return { error };
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const value = {
    session,
    user: session?.user || null,
    profile,       // { id, name, role, subject, avatar_url, join_date }
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    sendPasswordReset,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
