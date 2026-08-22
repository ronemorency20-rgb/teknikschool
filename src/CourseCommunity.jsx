import { useEffect, useRef, useState } from "react";
import { Av, Badge, RC, Spinner } from "./ui";
import { fetchCommunityMessages, postCommunityMessage, toggleReaction, togglePin, deleteMessage, reportMessage } from "./coursesApi";
import { PinIcon, TrashIcon, FlagIcon, CheckCircleIcon } from "./Icons";

const EMOJIS = ["", "", "", "", "", ""];

export default function CourseCommunity({ courseId, userId, userRole, courseColor = "#7C6FFF" }) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [hovered, setHovered] = useState(null);
  const [reportingId, setReportingId] = useState(null);
  const [reportSent, setReportSent] = useState(new Set());
  const endRef = useRef(null);
  const canMod = userRole === "teacher" || userRole === "admin";

  const submitReport = async (messageId, reason) => {
    try {
      await reportMessage(messageId, userId, reason);
      setReportSent((s) => new Set(s).add(messageId));
      setReportingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const load = async () => {
    setLoading(true); setErr("");
    try { setMessages(await fetchCommunityMessages(courseId)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [courseId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const send = async () => {
    if (!msg.trim()) return;
    try { await postCommunityMessage(courseId, userId, msg.trim()); setMsg(""); await load(); }
    catch (e) { setErr(e.message); }
  };

  const react = async (messageId, emoji) => {
    try { await toggleReaction(messageId, userId, emoji); await load(); }
    catch (e) { setErr(e.message); }
  };

  const pinned = messages.filter((m) => m.pinned);

  return (
    <div>
      {err && <div style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{err}</div>}
      {pinned.map((pm) => (
        <div key={pm.id} style={{ background: "#FFB34712", border: "1px solid #FFB34733", borderRadius: 11, padding: "10px 15px", marginBottom: 10, display: "flex", gap: 10 }}>
          <PinIcon size={16} color="#FFB347" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#FFB347", fontWeight: 700, marginBottom: 2 }}>Épinglé · {pm.author?.name}</div>
            <div style={{ fontSize: 13, color: "#4B5568" }}>{pm.text.length > 120 ? pm.text.slice(0, 120) + "…" : pm.text}</div>
          </div>
        </div>
      ))}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ maxHeight: 420, overflowY: "auto", padding: 14 }}>
          {loading && <Spinner size={18} label="Chargement…" />}
          {!loading && messages.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13, textAlign: "center", padding: 30 }}>Aucun message pour le moment. Soyez le premier!</p>}
          {messages.map((m) => {
            const isMe = m.user_id === userId;
            const reactCounts = {};
            (m.reactions || []).forEach((r) => { reactCounts[r.emoji] = reactCounts[r.emoji] || []; reactCounts[r.emoji].push(r.user_id); });
            return (
              <div key={m.id} onMouseEnter={() => setHovered(m.id)} onMouseLeave={() => setHovered(null)} style={{ padding: "7px 6px", borderRadius: 10, marginBottom: 2 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Av name={m.author?.name} size={30} color={RC[m.author?.role] || "#7C6FFF"} img={m.author?.avatar_url} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: isMe ? courseColor : "#12141C" }}>{isMe ? "Vous" : m.author?.name}</span>
                      {m.author?.role === "teacher" && <Badge label="Professeur" color="#7C6FFF" />}
                      {m.pinned && <PinIcon size={12} color="#FFB347" />}
                      <span style={{ fontSize: 10, color: "#6B7280" }}>{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#1F2430", lineHeight: 1.5, wordBreak: "break-word" }}>{m.text}</div>
                    {Object.keys(reactCounts).length > 0 && (
                      <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                        {Object.entries(reactCounts).map(([emoji, uids]) => (
                          <button key={emoji} onClick={() => react(m.id, emoji)} style={{ background: uids.includes(userId) ? courseColor + "22" : "#FFFFFF", border: `1px solid ${uids.includes(userId) ? courseColor + "55" : "#E2E5EB"}`, borderRadius: 20, padding: "2px 8px", cursor: "pointer", fontSize: 12, color: uids.includes(userId) ? courseColor : "#6B7280" }}>{emoji} {uids.length}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {hovered === m.id && (
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      {EMOJIS.slice(0, 3).map((e) => <button key={e} onClick={() => react(m.id, e)} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer" }}>{e}</button>)}
                      {canMod && <button onClick={() => togglePin(m.id, !m.pinned).then(load)} style={{ background: "none", border: "none", cursor: "pointer", color: "#FFB347", display: "flex" }}><PinIcon size={14} color="#FFB347" /></button>}
                      {!isMe && !reportSent.has(m.id) && <button onClick={() => setReportingId(reportingId === m.id ? null : m.id)} title="Signaler" style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", display: "flex" }}><FlagIcon size={14} color="#6B7280" /></button>}
                      {(isMe || canMod) && <button onClick={() => deleteMessage(m.id).then(load)} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF6677", display: "flex" }}><TrashIcon size={14} color="#FF6677" /></button>}
                    </div>
                  )}
                </div>
                {reportSent.has(m.id) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, marginLeft: 40, fontSize: 11, color: "#00D4AA" }}>
                    <CheckCircleIcon size={12} color="#00D4AA" /> Signalement envoyé
                  </div>
                )}
                {reportingId === m.id && (
                  <div style={{ marginTop: 6, marginLeft: 40, background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 10, padding: 10 }}>
                    <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6, fontWeight: 600 }}>Pourquoi signalez-vous ce message ?</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {["Spam", "Harcèlement", "Contenu inapproprié", "Autre"].map((reason) => (
                        <button key={reason} onClick={() => submitReport(m.id, reason)} style={{ background: "#F7F8FA", border: "1px solid #E2E5EB", borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 11, color: "#374151" }}>{reason}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <div style={{ padding: 10, borderTop: "1px solid #E2E5EB", display: "flex", gap: 8 }}>
          <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Partagez une idée, posez une question…"
            style={{ flex: 1, background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 9, padding: "9px 12px", color: "#12141C", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
          <button onClick={send} style={{ width: 36, height: 36, background: courseColor, border: "none", borderRadius: 8, color: "#fff", fontSize: 15, cursor: "pointer" }}>↑</button>
        </div>
      </div>
    </div>
  );
}
