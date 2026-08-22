import { useEffect, useState } from "react";
import { Btn, Inp, Badge } from "./ui";
import { fetchHomeworks, createHomework, deleteHomework, fetchMySubmission, submitHomework, fetchHomeworkSubmissions } from "./coursesApi";

export function TeacherHomeworkPanel({ courseId }) {
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [subsByHw, setSubsByHw] = useState({});
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const hw = await fetchHomeworks(courseId);
      setItems(hw);
      const subs = {};
      for (const h of hw) subs[h.id] = await fetchHomeworkSubmissions(h.id);
      setSubsByHw(subs);
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, [courseId]);

  const add = async () => {
    if (!title.trim()) return;
    try { await createHomework(courseId, title, due); setTitle(""); setDue(""); setShowAdd(false); await load(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontSize: 15 }}>Devoirs</h3>
        <Btn onClick={() => setShowAdd((v) => !v)} small color="#FFB347" style={{ fontFamily: "inherit" }}>{showAdd ? "Annuler" : "+ Ajouter"}</Btn>
      </div>
      {err && <p style={{ color: "#FF6677", fontSize: 12 }}>{err}</p>}
      {showAdd && (
        <div style={{ background: "#F7F8FA", padding: 12, borderRadius: 9, marginBottom: 12 }}>
          <Inp label="Titre" value={title} onChange={setTitle} placeholder="ex. Exercices chapitre 2" />
          <Inp label="Date limite" value={due} onChange={setDue} type="date" />
          <Btn onClick={add} small color="#FFB347" style={{ fontFamily: "inherit" }}>Créer</Btn>
        </div>
      )}
      {items.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun devoir pour le moment.</p>}
      {items.map((h) => (
        <div key={h.id} style={{ padding: 10, background: "#F7F8FA", borderRadius: 9, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{h.title}</div>
            <button onClick={() => deleteHomework(h.id).then(load)} style={{ background: "none", border: "none", color: "#FF6677", cursor: "pointer", fontSize: 13 }}>✕</button>
          </div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{h.due_date ? `À rendre: ${h.due_date} · ` : ""}{(subsByHw[h.id] || []).length} soumission(s)</div>
          {(subsByHw[h.id] || []).map((s) => (
            <div key={s.id} style={{ marginTop: 6, padding: 8, background: "#FFFFFF", borderRadius: 7 }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{s.student?.name}</div>
              <div style={{ fontSize: 12, color: "#4B5568" }}>{s.text}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function StudentHomeworkPanel({ courseId, studentId }) {
  const [items, setItems] = useState([]);
  const [subs, setSubs] = useState({});
  const [drafts, setDrafts] = useState({});
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const hw = await fetchHomeworks(courseId);
      setItems(hw);
      const s = {};
      for (const h of hw) s[h.id] = await fetchMySubmission(h.id, studentId);
      setSubs(s);
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, [courseId]);

  const submit = async (hwId) => {
    const text = drafts[hwId];
    if (!text?.trim()) return;
    try { await submitHomework(hwId, studentId, text); await load(); }
    catch (e) { setErr(e.message); }
  };

  if (items.length === 0) return <p style={{ color: "#6B7280" }}>Aucun devoir pour le moment.</p>;

  return (
    <div>
      {err && <p style={{ color: "#FF6677", fontSize: 13 }}>{err}</p>}
      {items.map((h) => {
        const mySub = subs[h.id];
        return (
          <div key={h.id} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 22, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div><h3 style={{ margin: "0 0 4px", fontFamily: "'Syne',sans-serif" }}>{h.title}</h3>{h.due_date && <span style={{ fontSize: 12, color: "#6B7280" }}>À rendre: {h.due_date}</span>}</div>
              {mySub && <Badge label="✓ Soumis" color="#00D4AA" />}
            </div>
            {mySub && <div style={{ background: "#F7F8FA", borderRadius: 9, padding: 12, marginBottom: 12, fontSize: 13, color: "#4B5568", borderLeft: "3px solid #00D4AA" }}>{mySub.text}</div>}
            <textarea value={drafts[h.id] ?? ""} onChange={(e) => setDrafts({ ...drafts, [h.id]: e.target.value })} placeholder={mySub ? "Mettre à jour…" : "Écrivez votre réponse…"} rows={4}
              style={{ width: "100%", background: "#F7F8FA", border: "1px solid #E2E5EB", borderRadius: 9, padding: 12, color: "#12141C", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />
            <Btn onClick={() => submit(h.id)} color="#FFB347" style={{ marginTop: 10, fontFamily: "inherit" }}>{mySub ? "Resoumettre" : "Soumettre"}</Btn>
          </div>
        );
      })}
    </div>
  );
}
