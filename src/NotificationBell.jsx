import { useEffect, useRef, useState } from "react";
import { fetchAnnouncements, markAnnouncementsSeen } from "./coursesApi";
import { Spinner } from "./ui";
import { BellIcon } from "./Icons";

export default function NotificationBell({ userId, lastSeen, color = "#7C6FFF" }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  const unreadCount = items.filter((a) => !lastSeen || new Date(a.created_at) > new Date(lastSeen)).length;

  const load = async () => {
    setLoading(true);
    try { setItems(await fetchAnnouncements()); }
    catch { /* silent - notifications are non-critical */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      try { await markAnnouncementsSeen(userId); } catch {}
    }
  };

  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return "à l'instant";
    if (s < 3600) return `il y a ${Math.floor(s / 60)}min`;
    if (s < 86400) return `il y a ${Math.floor(s / 3600)}h`;
    return `il y a ${Math.floor(s / 86400)}j`;
  };

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button onClick={toggle} style={{ position: "relative", background: "none", border: "1px solid #E2E5EB", borderRadius: 9, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BellIcon size={18} color={color} />
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, background: "#FF4455", color: "#fff", borderRadius: "50%", minWidth: 16, height: 16, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: 44, right: 0, background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, width: 280, maxHeight: 320, overflowY: "auto", zIndex: 200, boxShadow: "0 20px 60px #000c" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #E2E5EB", fontWeight: 700, fontSize: 13, color: "#12141C", fontFamily: "'Syne',sans-serif" }}>Annonces</div>
          {loading && <div style={{ padding: 14 }}><Spinner size={16} label="Chargement…" /></div>}
          {!loading && items.length === 0 && <p style={{ padding: 14, color: "#9CA3AF", fontSize: 12 }}>Aucune annonce pour le moment.</p>}
          {!loading && items.map((a) => {
            const isUnread = !lastSeen || new Date(a.created_at) > new Date(lastSeen);
            return (
              <div key={a.id} style={{ padding: "10px 14px", borderBottom: "1px solid #E2E5EB", background: isUnread ? color + "0A" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  {isUnread && <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />}
                  <span style={{ fontWeight: 700, fontSize: 12, color: "#12141C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title?.trim() || "(sans titre)"}</span>
                </div>
                <p style={{ margin: "0 0 3px", fontSize: 11, color: "#4B5568", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.message?.trim() || "(message vide)"}</p>
                <div style={{ fontSize: 9, color: "#6B7280" }}>{a.author?.name || "Admin"} · {timeAgo(a.created_at)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
