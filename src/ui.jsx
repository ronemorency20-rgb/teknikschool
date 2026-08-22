// Shared UI atoms — light TeknikSchool theme
import { useState, useEffect, useRef } from "react";
import NotificationBell from "./NotificationBell";
import { UserIcon, LogOutIcon } from "./Icons";
export const RC = { admin: "#FF6B6B", teacher: "#7C6FFF", student: "#00D4AA" };
export const fmt = (n) => (n === 0 ? "Gratuit" : `$${Number(n).toFixed(2)}`);
export const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function SchoolEmblem({ size = 32, color = "#7C6FFF" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="32" cy="32" r="31" fill={color} fillOpacity="0.12" stroke={color} strokeOpacity="0.5" strokeWidth="1.5" />
      <path d="M32 14 C 29 14 26.5 15.5 25 18 C 21 16 15 16.5 9 21 C 13 21.5 16.5 23 19 25.5 C 15 26.5 11.5 29 9 33 C 13.5 31.5 18 30.5 21.5 31 C 20 33.5 19.5 36.5 20 39 C 22.5 35.5 25.5 33 29 31.5 C 29.5 32.5 30 33.7 32 34 C 34 33.7 34.5 32.5 35 31.5 C 38.5 33 41.5 35.5 44 39 C 44.5 36.5 44 33.5 42.5 31 C 46 30.5 50.5 31.5 55 33 C 52.5 29 49 26.5 45 25.5 C 47.5 23 51 21.5 55 21 C 49 16.5 43 16 39 18 C 37.5 15.5 35 14 32 14 Z" fill={color} />
      <circle cx="32" cy="20" r="3.4" fill={color} />
      <path d="M32 17.2 L34.2 19 L32 19.6 Z" fill="#FFB347" />
      <path d="M14 42 C 20 39.5 26 39.5 32 42 C 38 39.5 44 39.5 50 42 L 50 49 C 44 46.5 38 46.5 32 49 C 26 46.5 20 46.5 14 49 Z" fill={color} fillOpacity="0.9" />
    </svg>
  );
}

export function Av({ name, size = 36, color = "#7C6FFF", style = {}, img = null }) {
  if (img) return <img src={img} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, ...style }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: size * 0.38, flexShrink: 0, fontFamily: "'Syne',sans-serif", ...style }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export function Spinner({ size = 24, color = "#7C6FFF", label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: size, height: size, border: `3px solid ${color}33`, borderTopColor: color, borderRadius: "50%", animation: "tk-spin 0.8s linear infinite" }} />
      {label && <span style={{ color: "#6B7280", fontSize: 13 }}>{label}</span>}
      <style>{`@keyframes tk-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function FullPageSpinner({ label = "Chargement…" }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: "'DM Sans',sans-serif" }}>
      <img src="/logo.png" alt="TeknikSchool" style={{ width: 64, height: 64, objectFit: "contain" }} />
      <Spinner size={32} label={label} />
    </div>
  );
}

export function Badge({ label, color = "#7C6FFF" }) {
  return <span style={{ background: color + "25", color, border: `1px solid ${color}50`, padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>;
}

export function Btn({ children, onClick, color = "#7C6FFF", secondary, small, danger, style = {}, disabled, type = "button" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      background: danger ? "#FF4455" : secondary ? "transparent" : color,
      border: `1px solid ${danger ? "#FF4455" : color}`,
      color: secondary && !danger ? color : "#fff",
      padding: small ? "5px 13px" : "10px 20px",
      borderRadius: 9, fontWeight: 700, fontSize: small ? 12 : 14,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
      fontFamily: "inherit", lineHeight: 1.3, ...style,
    }}>{children}</button>
  );
}

export function Inp({ label, value, onChange, type = "text", placeholder, style = {} }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 8, padding: "9px 13px", color: "#12141C", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", ...style }} />
    </div>
  );
}

export function TA({ label, value, onChange, rows = 4, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 8, padding: "9px 13px", color: "#12141C", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />
    </div>
  );
}

export function Modal({ title, onClose, children, width = 500 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", backdropFilter: "blur(8px)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", padding: 26, boxShadow: "0 40px 100px #000a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: "#12141C", fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function NavBar({ user, tabs, active, onTab, onLogout, onProfile, avatarImg, userId, lastSeenAnnouncements }) {
  const c = RC[user.role];
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E5EB", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, flexShrink: 0, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div ref={menuRef} style={{ position: "relative" }}>
          <button onClick={() => setOpen((v) => !v)} style={{
            background: open ? c + "1A" : "none", border: `1px solid ${open ? c + "55" : "#E2E5EB"}`, borderRadius: 9,
            width: 38, height: 38, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 4, transition: "all .15s",
          }}>
            <span style={{ width: 16, height: 2, background: open ? c : "#6B7280", borderRadius: 2, transition: "all .2s", transform: open ? "rotate(45deg) translate(3px,3px)" : "none" }} />
            <span style={{ width: 16, height: 2, background: open ? c : "#6B7280", borderRadius: 2, transition: "all .2s", opacity: open ? 0 : 1 }} />
            <span style={{ width: 16, height: 2, background: open ? c : "#6B7280", borderRadius: 2, transition: "all .2s", transform: open ? "rotate(-45deg) translate(3px,-3px)" : "none" }} />
          </button>
          {open && (
            <div style={{ position: "absolute", top: 46, left: 0, background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 8, minWidth: 230, zIndex: 100, boxShadow: "0 20px 60px #000c", animation: "navIn .15s ease" }}>
              {tabs.map((t) => (
                <button key={t.id} onClick={() => { onTab(t.id); setOpen(false); }} style={{
                  width: "100%", background: active === t.id ? c + "18" : "none", border: "none", borderRadius: 9,
                  padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 11,
                  color: active === t.id ? c : "#1F2430", fontWeight: active === t.id ? 700 : 500, fontSize: 14,
                  fontFamily: "'Syne',sans-serif", textAlign: "left", marginBottom: 2,
                }}>
                  {t.icon && <span style={{ display: "flex", color: active === t.id ? c : "#6B7280" }}>{t.icon}</span>}
                  <span>{t.label}</span>
                  {active === t.id && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: c }} />}
                </button>
              ))}
              <div style={{ height: 1, background: "#E2E5EB", margin: "6px 4px" }} />
              {onProfile && (
                <button onClick={() => { onProfile(); setOpen(false); }} style={{ width: "100%", background: "none", border: "none", borderRadius: 9, padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, color: "#1F2430", fontWeight: 500, fontSize: 14, fontFamily: "'Syne',sans-serif", textAlign: "left" }}>
                  <UserIcon size={16} /><span>Mon profil</span>
                </button>
              )}
              <button onClick={() => { onLogout(); setOpen(false); }} style={{ width: "100%", background: "none", border: "none", borderRadius: 9, padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, color: "#FF6677", fontWeight: 500, fontSize: 14, fontFamily: "'Syne',sans-serif", textAlign: "left" }}>
                <LogOutIcon size={16} /><span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="TeknikSchool" style={{ width: 34, height: 34, objectFit: "contain" }} />
        </span>
        <Badge label={user.role} color={c} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {userId && <NotificationBell userId={userId} lastSeen={lastSeenAnnouncements} color={c} />}
        <button onClick={onProfile || (() => {})} style={{ display: "flex", alignItems: "center", gap: 10, background: "#F7F8FA", border: "1px solid #E2E5EB", cursor: onProfile ? "pointer" : "default", padding: "5px 14px 5px 5px", borderRadius: 24 }}>
          <Av name={user.name} size={30} color={c} img={avatarImg} />
          <span style={{ fontSize: 13, color: "#12141C", fontWeight: 600 }}>{user.name}</span>
        </button>
      </div>
      <style>{`@keyframes navIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
