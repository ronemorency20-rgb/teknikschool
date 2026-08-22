import { useEffect, useRef, useState } from "react";
import { Btn, Inp, TA, Modal, Badge, Spinner } from "./ui";
import {
  fetchChapterContent, addTextContent, addMediaContent,
  uploadChapterFile, deleteChapterContent,
  fetchChapterQuiz, createChapterQuiz, deleteQuiz,
} from "./coursesApi";

const CC = { text: "#7C6FFF", video: "#FF6B8A", audio: "#FFB347" };

export default function ChapterEditor({ course, chapter, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(null); // "text" | "video" | "audio"
  const [draft, setDraft] = useState({ label: "", body: "" });
  const [uploadFile, setUploadFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const data = await fetchChapterContent(chapter.id);
      setItems(data);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [chapter.id]);

  const openModal = (type) => {
    setDraft({ label: "", body: "" });
    setUploadFile(null);
    setModal(type);
  };

  const handleSubmit = async () => {
    if (!draft.label.trim()) return;
    setBusy(true); setErr("");
    try {
      const nextOrder = items.length;
      if (modal === "text") {
        await addTextContent(chapter.id, draft, nextOrder);
      } else {
        if (!uploadFile) { setErr("Veuillez choisir un fichier."); setBusy(false); return; }
        const url = await uploadChapterFile(uploadFile, course.id, chapter.id);
        await addMediaContent(chapter.id, { type: modal, label: draft.label, fileUrl: url }, nextOrder);
      }
      setModal(null);
      await load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteChapterContent(id); await load(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#7C6FFF", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>← Retour</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>Chapitre {chapter.number}: {chapter.title}</h2>
          <p style={{ margin: "3px 0 0", color: "#6B7280", fontSize: 13 }}>{course.title}</p>
        </div>
      </div>

      {err && <div style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{err}</div>}
      {loading && <Spinner label="Chargement…" />}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {items.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF", border: "2px dashed #E2E5EB", borderRadius: 12 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}></div>
              <p style={{ margin: 0, fontSize: 14 }}>Aucun contenu pour le moment.</p>
            </div>
          )}
          {items.map((it, idx) => (
            <div key={it.id} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ background: "#FFFFFF", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #E2E5EB" }}>
                <Badge label={it.type} color={CC[it.type]} />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#12141C", flex: 1 }}>{it.label}</span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>#{idx + 1}</span>
                <button onClick={() => handleDelete(it.id)} style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", borderRadius: 7, padding: "3px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✕ Retirer</button>
              </div>
              <div style={{ padding: 16 }}>
                {it.type === "text" && <div style={{ fontSize: 13, color: "#6B7280", whiteSpace: "pre-line", lineHeight: 1.7 }}>{it.body}</div>}
                {it.type === "video" && <video src={it.file_url} controls style={{ width: "100%", maxHeight: 280, background: "#000", borderRadius: 8, display: "block" }} />}
                {it.type === "audio" && <audio src={it.file_url} controls style={{ width: "100%" }} />}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { type: "text", label: "Ajouter texte / notes", color: "#7C6FFF", icon: "" },
          { type: "video", label: "Ajouter vidéo", color: "#FF6B8A", icon: "" },
          { type: "audio", label: "Ajouter audio", color: "#FFB347", icon: "" },
        ].map((bt) => (
          <button key={bt.type} onClick={() => openModal(bt.type)} style={{ background: bt.color + "18", border: `1px solid ${bt.color}40`, color: bt.color, borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{bt.icon}</span>{bt.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <ChapterQuizManager courseId={course.id} chapterId={chapter.id} />
      </div>

      {modal && (
        <Modal title={modal === "text" ? "Ajouter texte / notes" : modal === "video" ? "Ajouter vidéo" : "Ajouter audio"} onClose={() => setModal(null)}>
          <Inp label="Titre" value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} placeholder="ex. Notes de cours" />
          {modal === "text" && (
            <TA label="Contenu" value={draft.body} onChange={(v) => setDraft({ ...draft, body: v })} rows={8} placeholder="Écrivez vos notes…" />
          )}
          {modal !== "text" && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Fichier</label>
              <input ref={fileRef} type="file" accept={modal === "video" ? "video/*" : "audio/*"} style={{ display: "none" }} onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
              <Btn onClick={() => fileRef.current?.click()} secondary color="#7C6FFF" style={{ width: "100%", fontFamily: "inherit" }}>
                {uploadFile ? uploadFile.name : "Choisir un fichier"}
              </Btn>
            </div>
          )}
          <Btn onClick={handleSubmit} disabled={busy || !draft.label.trim()} color={CC[modal]} style={{ width: "100%", fontFamily: "inherit" }}>
            {busy ? "Envoi…" : "Ajouter au chapitre"}
          </Btn>
        </Modal>
      )}
    </div>
  );
}

function QuestionBuilder({ onAdd }) {
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [ans, setAns] = useState(0);
  return (
    <div style={{ background: "#F7F8FA", borderRadius: 11, padding: 14, border: "1px solid #E2E5EB" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 10 }}>Ajouter une question</div>
      <Inp label="Question" value={q} onChange={setQ} placeholder="Quelle est…?" />
      {opts.map((o, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <input type="radio" checked={ans === i} onChange={() => setAns(i)} style={{ accentColor: "#7C6FFF" }} />
          <input value={o} onChange={(e) => { const n = [...opts]; n[i] = e.target.value; setOpts(n); }} placeholder={`Option ${i + 1}`}
            style={{ flex: 1, background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 7, padding: "7px 11px", color: "#12141C", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
        </div>
      ))}
      <Btn onClick={() => { if (q && opts.every((o) => o)) { onAdd({ question: q, options: opts, correctAnswer: ans }); setQ(""); setOpts(["", "", "", ""]); setAns(0); } }} small color="#7C6FFF" style={{ marginTop: 8, fontFamily: "inherit" }}>+ Ajouter la question</Btn>
    </div>
  );
}

function ChapterQuizManager({ courseId, chapterId }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBuild, setShowBuild] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try { setQuiz(await fetchChapterQuiz(chapterId)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [chapterId]);

  const create = async () => {
    if (!title.trim() || questions.length === 0) return;
    try { await createChapterQuiz(courseId, chapterId, title, questions); setTitle(""); setQuestions([]); setShowBuild(false); await load(); }
    catch (e) { setErr(e.message); }
  };

  const remove = async () => {
    try { await deleteQuiz(quiz.id); await load(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontSize: 15 }}>Quiz de fin de chapitre</h3>
        {!quiz && !loading && <Btn onClick={() => setShowBuild((v) => !v)} small color="#00D4AA" style={{ fontFamily: "inherit" }}>{showBuild ? "Annuler" : "+ Créer"}</Btn>}
      </div>
      {err && <p style={{ color: "#FF6677", fontSize: 12 }}>{err}</p>}
      {loading && <Spinner size={18} label="Chargement…" />}
      {!loading && quiz && (
        <div style={{ padding: 10, background: "#F7F8FA", borderRadius: 9, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontWeight: 600, fontSize: 13 }}>{quiz.title}</div><div style={{ fontSize: 11, color: "#6B7280" }}>{quiz.quiz_questions?.length || 0} questions — apparaît après ce chapitre pour l'élève</div></div>
          <button onClick={remove} style={{ background: "none", border: "none", color: "#FF6677", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>
      )}
      {!loading && !quiz && !showBuild && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun quiz pour ce chapitre.</p>}
      {showBuild && (
        <div style={{ marginTop: 10 }}>
          <Inp label="Titre" value={title} onChange={setTitle} placeholder="ex. Vérification des connaissances" />
          <div style={{ marginBottom: 10 }}>
            {questions.map((q, i) => <div key={i} style={{ background: "#F7F8FA", borderRadius: 8, padding: 8, marginBottom: 6, fontSize: 12, color: "#6B7280" }}>Q{i + 1}: {q.question}</div>)}
          </div>
          <QuestionBuilder onAdd={(q) => setQuestions((qs) => [...qs, q])} />
          <Btn onClick={create} color="#00D4AA" style={{ width: "100%", marginTop: 10, fontFamily: "inherit" }} disabled={!title.trim() || questions.length === 0}>Enregistrer le quiz</Btn>
        </div>
      )}
    </div>
  );
}
