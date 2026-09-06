import { useEffect, useRef, useState } from "react";
import { Btn, Inp, TA, Modal, Badge, Spinner } from "./ui";
import RichTextEditor from "./RichTextEditor";
import ChapterViewer from "./ChapterViewer";
import { BLOCK_TYPES, getBlockStyle, getEmbedUrl } from "./blockTypes";
import { EyeOpenIcon, ChevronLeftIcon } from "./Icons";
import {
  fetchChapterContent, addMediaContent,
  addTextBlock, addImageBlock, addQuizCheckBlock,
  updateChapterContentBlock, reorderChapterContentBlocks, setChapterPublished,
  uploadChapterFile, deleteChapterContent,
  fetchChapterQuiz, createChapterQuiz, deleteQuiz, updateQuizPassingScore,
} from "./coursesApi";

const emptyDraft = { label: "", body: "", altText: "", mediaLink: "", question: "", options: ["", "", "", ""], correctAnswer: 0 };

export default function ChapterEditor({ course, chapter, onBack }) {
  const [items, setItems] = useState([]);
  const [published, setPublished] = useState(chapter.published !== false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modalType, setModalType] = useState(null); // one of BLOCK_TYPES ids, when adding/editing
  const [editingId, setEditingId] = useState(null); // set when editing an existing block instead of adding new
  const [draft, setDraft] = useState(emptyDraft);
  const [uploadFile, setUploadFile] = useState(null);
  const [mediaMode, setMediaMode] = useState("upload"); // "upload" | "link"
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true); setErr("");
    try { setItems(await fetchChapterContent(chapter.id)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [chapter.id]);

  const openAdd = (blockId) => {
    setEditingId(null);
    setDraft(emptyDraft);
    setUploadFile(null);
    setMediaMode("upload");
    setModalType(blockId);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setModalType(item.block_type);
    setUploadFile(null);
    setMediaMode("upload");
    if (item.block_type === "quiz_check") {
      const q = item.quiz_data || {};
      setDraft({ ...emptyDraft, label: item.label, question: q.question || "", options: q.options || ["", "", "", ""], correctAnswer: q.correctAnswer ?? 0 });
    } else {
      setDraft({ ...emptyDraft, label: item.label, body: item.body || "", altText: item.alt_text || "", mediaLink: (item.block_type === "video" || item.block_type === "audio") ? item.file_url || "" : "" });
    }
  };

  const style = modalType ? getBlockStyle(modalType) : null;

  const handleSubmit = async () => {
    if (!draft.label.trim()) return;
    setBusy(true); setErr("");
    try {
      const nextOrder = items.length;
      if (style.kind === "text") {
        if (editingId) await updateChapterContentBlock(editingId, { label: draft.label, body: draft.body });
        else await addTextBlock(chapter.id, { label: draft.label, body: draft.body, blockType: modalType }, nextOrder);
      } else if (style.kind === "quiz_check") {
        if (!draft.question.trim() || draft.options.some((o) => !o.trim())) { setErr("Veuillez remplir la question et les 4 options."); setBusy(false); return; }
        const quizData = { question: draft.question, options: draft.options, correctAnswer: draft.correctAnswer };
        if (editingId) await updateChapterContentBlock(editingId, { label: draft.label, quiz_data: quizData });
        else await addQuizCheckBlock(chapter.id, { label: draft.label, ...quizData }, nextOrder);
      } else if (style.kind === "image") {
        if (!editingId && !uploadFile) { setErr("Veuillez choisir une image."); setBusy(false); return; }
        if (editingId) {
          const updates = { label: draft.label, alt_text: draft.altText };
          if (uploadFile) updates.file_url = await uploadChapterFile(uploadFile, course.id, chapter.id);
          await updateChapterContentBlock(editingId, updates);
        } else {
          const url = await uploadChapterFile(uploadFile, course.id, chapter.id);
          await addImageBlock(chapter.id, { label: draft.label, fileUrl: url, altText: draft.altText }, nextOrder);
        }
      } else {
        // video / audio — either an uploaded file or a pasted link
        if (mediaMode === "link") {
          if (!draft.mediaLink.trim()) { setErr("Veuillez coller un lien."); setBusy(false); return; }
          if (editingId) await updateChapterContentBlock(editingId, { label: draft.label, file_url: draft.mediaLink.trim(), type: modalType, block_type: modalType });
          else await addMediaContent(chapter.id, { type: modalType, label: draft.label, fileUrl: draft.mediaLink.trim() }, nextOrder);
        } else {
          if (!editingId && !uploadFile) { setErr("Veuillez choisir un fichier."); setBusy(false); return; }
          if (editingId) {
            const updates = { label: draft.label, type: modalType, block_type: modalType };
            if (uploadFile) updates.file_url = await uploadChapterFile(uploadFile, course.id, chapter.id);
            await updateChapterContentBlock(editingId, updates);
          } else {
            const url = await uploadChapterFile(uploadFile, course.id, chapter.id);
            await addMediaContent(chapter.id, { type: modalType, label: draft.label, fileUrl: url }, nextOrder);
          }
        }
      }
      setModalType(null); setEditingId(null);
      await load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteChapterContent(id); await load(); }
    catch (e) { setErr(e.message); }
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setItems(reordered); // optimistic
    try { await reorderChapterContentBlocks(reordered.map((it) => it.id)); }
    catch (e) { setErr(e.message); await load(); }
  };

  const togglePublished = async () => {
    const next = !published;
    setPublished(next); // optimistic
    try { await setChapterPublished(chapter.id, next); }
    catch (e) { setErr(e.message); setPublished(!next); }
  };

  if (showPreview) {
    return (
      <div>
        <button onClick={() => setShowPreview(false)} style={{ background: "none", border: "none", color: "#7C6FFF", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 4, marginBottom: 18 }}>
          <ChevronLeftIcon size={16} color="#7C6FFF" /> Retour à l'édition
        </button>
        <div style={{ background: "#7C6FFF12", border: "1px solid #7C6FFF40", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#5B4FDB" }}>
          Aperçu — vue élève (ceci n'enregistre aucune progression)
        </div>
        <ChapterViewer chapter={chapter} studentId={null} isDone={false} onBack={() => setShowPreview(false)} onMarkedDone={() => {}} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#7C6FFF", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>← Retour</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>Chapitre {chapter.number}: {chapter.title}</h2>
          <p style={{ margin: "3px 0 0", color: "#6B7280", fontSize: 13 }}>{course.title}</p>
        </div>
        <Badge label={published ? "Publié" : "Brouillon"} color={published ? "#00D4AA" : "#9CA3AF"} />
        <button onClick={togglePublished} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#374151" }}>
          {published ? "Passer en brouillon" : "Publier"}
        </button>
        <button onClick={() => setShowPreview(true)} disabled={items.length === 0} style={{ background: "#7C6FFF18", border: "1px solid #7C6FFF40", color: "#7C6FFF", borderRadius: 8, padding: "7px 14px", cursor: items.length === 0 ? "not-allowed" : "pointer", opacity: items.length === 0 ? 0.5 : 1, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <EyeOpenIcon size={14} color="#7C6FFF" /> Aperçu élève
        </button>
      </div>

      {!published && (
        <div style={{ background: "#9CA3AF18", border: "1px solid #9CA3AF40", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#6B7280" }}>
          Ce chapitre est en brouillon — invisible pour les élèves tant qu'il n'est pas publié.
        </div>
      )}

      {err && <div style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{err}</div>}
      {loading && <Spinner label="Chargement…" />}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {items.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF", border: "2px dashed #E2E5EB", borderRadius: 12 }}>
              <p style={{ margin: 0, fontSize: 14 }}>Aucun contenu pour le moment — ajoutez un bloc ci-dessous.</p>
            </div>
          )}
          {items.map((it, idx) => {
            const s = getBlockStyle(it.block_type);
            const Icon = s.icon;
            return (
              <div key={it.id} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ background: s.bg, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #E2E5EB" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: s.color + "1c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={13} color={s.color} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: "uppercase" }}>{s.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#12141C", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1, color: "#6B7280", fontSize: 14, padding: "0 4px" }}>↑</button>
                  <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} style={{ background: "none", border: "none", cursor: idx === items.length - 1 ? "default" : "pointer", opacity: idx === items.length - 1 ? 0.3 : 1, color: "#6B7280", fontSize: 14, padding: "0 4px" }}>↓</button>
                  <button onClick={() => openEdit(it)} style={{ background: "#7C6FFF18", border: "1px solid #7C6FFF40", color: "#7C6FFF", borderRadius: 7, padding: "3px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Modifier</button>
                  <button onClick={() => handleDelete(it.id)} style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", borderRadius: 7, padding: "3px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Retirer</button>
                </div>
                <div style={{ padding: 14 }}>
                  {s.kind === "text" && <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: it.body }} />}
                  {s.kind === "quiz_check" && <div style={{ fontSize: 13, color: "#6B7280" }}>{it.quiz_data?.question}</div>}
                  {s.kind === "image" && <img src={it.file_url} alt={it.alt_text || ""} style={{ maxHeight: 140, borderRadius: 8, display: "block" }} />}
                  {s.kind === "video" && (
                    getEmbedUrl(it.file_url) ? (
                      <iframe src={getEmbedUrl(it.file_url)} allow="encrypted-media; picture-in-picture" style={{ width: "100%", height: 200, border: "none", borderRadius: 8, display: "block" }} />
                    ) : (
                      <video src={it.file_url} controls style={{ width: "100%", maxHeight: 220, background: "#000", borderRadius: 8, display: "block" }} />
                    )
                  )}
                  {s.kind === "audio" && <audio src={it.file_url} controls style={{ width: "100%" }} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Ajouter un bloc</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {BLOCK_TYPES.map((bt) => {
          const Icon = bt.icon;
          return (
            <button key={bt.id} onClick={() => openAdd(bt.id)} style={{ background: bt.color + "14", border: `1px solid ${bt.color}40`, color: bt.color, borderRadius: 10, padding: "9px 14px", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon size={14} color={bt.color} />{bt.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 24 }}>
        <ChapterQuizManager courseId={course.id} chapterId={chapter.id} />
      </div>

      {modalType && (
        <Modal title={(editingId ? "Modifier — " : "Ajouter — ") + style.label} onClose={() => { setModalType(null); setEditingId(null); }}>
          <Inp label="Titre du bloc" value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} placeholder="ex. Introduction" />

          {style.kind === "text" && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Contenu</label>
              <RichTextEditor value={draft.body} onChange={(html) => setDraft({ ...draft, body: html })} placeholder="Écrivez le contenu de ce bloc…" />
            </div>
          )}

          {style.kind === "quiz_check" && (
            <>
              <Inp label="Question" value={draft.question} onChange={(v) => setDraft({ ...draft, question: v })} placeholder="ex. Quel appareil permet d'entrer des données ?" />
              {draft.options.map((o, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input type="radio" checked={draft.correctAnswer === i} onChange={() => setDraft({ ...draft, correctAnswer: i })} style={{ accentColor: "#7C6FFF" }} />
                  <input value={o} onChange={(e) => { const n = [...draft.options]; n[i] = e.target.value; setDraft({ ...draft, options: n }); }} placeholder={`Option ${i + 1}`}
                    style={{ flex: 1, background: "#F7F8FA", border: "1px solid #E2E5EB", borderRadius: 7, padding: "8px 11px", color: "#12141C", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                </div>
              ))}
              <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 14px" }}>Sélectionnez le bouton radio de la bonne réponse.</p>
            </>
          )}

          {style.kind === "image" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Image {editingId && "(laisser vide pour garder l'actuelle)"}</label>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                <Btn onClick={() => fileRef.current?.click()} secondary color="#FFB347" style={{ width: "100%", fontFamily: "inherit" }}>
                  {uploadFile ? uploadFile.name : "Choisir une image"}
                </Btn>
              </div>
              <Inp label="Texte alternatif (accessibilité)" value={draft.altText} onChange={(v) => setDraft({ ...draft, altText: v })} placeholder="Décrivez l'image pour les lecteurs d'écran" />
            </>
          )}

          {(style.kind === "video" || style.kind === "audio") && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 4, background: "#F7F8FA", borderRadius: 9, padding: 4, marginBottom: 10, width: "fit-content" }}>
                <button type="button" onClick={() => setMediaMode("upload")} style={{ background: mediaMode === "upload" ? "#FFFFFF" : "none", boxShadow: mediaMode === "upload" ? "0 1px 4px rgba(0,0,0,.08)" : "none", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: 700, fontSize: 12, color: mediaMode === "upload" ? "#12141C" : "#6B7280", fontFamily: "inherit" }}>Envoyer un fichier</button>
                <button type="button" onClick={() => setMediaMode("link")} style={{ background: mediaMode === "link" ? "#FFFFFF" : "none", boxShadow: mediaMode === "link" ? "0 1px 4px rgba(0,0,0,.08)" : "none", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: 700, fontSize: 12, color: mediaMode === "link" ? "#12141C" : "#6B7280", fontFamily: "inherit" }}>Coller un lien</button>
              </div>

              {mediaMode === "upload" ? (
                <>
                  <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Fichier {editingId && "(laisser vide pour garder l'actuel)"}</label>
                  <input ref={fileRef} type="file" accept={style.kind === "video" ? "video/*" : "audio/*"} style={{ display: "none" }} onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  <Btn onClick={() => fileRef.current?.click()} secondary color={style.color} style={{ width: "100%", fontFamily: "inherit" }}>
                    {uploadFile ? uploadFile.name : "Choisir un fichier"}
                  </Btn>
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: "6px 0 0" }}>Limite : 500Mo. Pour un fichier plus gros, utilisez plutôt un lien.</p>
                </>
              ) : (
                <>
                  <Inp label="Lien du fichier (URL directe, YouTube, Vimeo, Google Drive...)" value={draft.mediaLink} onChange={(v) => setDraft({ ...draft, mediaLink: v })} placeholder="https://…" />
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: "-8px 0 0" }}>Aucune limite de taille — le fichier reste hébergé où vous l'avez mis.</p>
                </>
              )}
            </div>
          )}

          <Btn onClick={handleSubmit} disabled={busy || !draft.label.trim()} color={style.color} style={{ width: "100%", fontFamily: "inherit" }}>
            {busy ? "Envoi…" : editingId ? "Enregistrer les modifications" : "Ajouter au chapitre"}
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
  const [passingScore, setPassingScore] = useState(70);
  const [editingScore, setEditingScore] = useState(false);
  const [scoreInput, setScoreInput] = useState(70);
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
    try { await createChapterQuiz(courseId, chapterId, title, questions, passingScore); setTitle(""); setQuestions([]); setPassingScore(70); setShowBuild(false); await load(); }
    catch (e) { setErr(e.message); }
  };

  const saveScore = async () => {
    try { await updateQuizPassingScore(quiz.id, scoreInput); setEditingScore(false); await load(); }
    catch (e) { setErr(e.message); }
  };

  const remove = async () => {
    try { await deleteQuiz(quiz.id); await load(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontSize: 15 }}>Quiz de fin de chapitre (noté)</h3>
        {!quiz && !loading && <Btn onClick={() => setShowBuild((v) => !v)} small color="#00D4AA" style={{ fontFamily: "inherit" }}>{showBuild ? "Annuler" : "+ Créer"}</Btn>}
      </div>
      <p style={{ margin: "-8px 0 14px", fontSize: 12, color: "#9CA3AF" }}>Différent des "Questions rapides" ci-dessus — ce quiz compte pour la progression. L'élève doit le réussir pour déverrouiller le chapitre suivant.</p>
      {err && <p style={{ color: "#FF6677", fontSize: 12 }}>{err}</p>}
      {loading && <Spinner size={18} label="Chargement…" />}
      {!loading && quiz && (
        <div style={{ padding: 10, background: "#F7F8FA", borderRadius: 9 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontWeight: 600, fontSize: 13 }}>{quiz.title}</div><div style={{ fontSize: 11, color: "#6B7280" }}>{quiz.quiz_questions?.length || 0} questions — apparaît après ce chapitre pour l'élève</div></div>
            <button onClick={remove} style={{ background: "none", border: "none", color: "#FF6677", cursor: "pointer", fontSize: 13 }}>✕</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid #E2E5EB" }}>
            <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>Score de réussite requis :</span>
            {editingScore ? (
              <>
                <input type="number" min="0" max="100" value={scoreInput} onChange={(e) => setScoreInput(Number(e.target.value))} style={{ width: 60, background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontFamily: "inherit" }} />
                <span style={{ fontSize: 12, color: "#6B7280" }}>%</span>
                <button onClick={saveScore} style={{ background: "#00D4AA", border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Enregistrer</button>
              </>
            ) : (
              <>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#12141C" }}>{quiz.passing_score ?? 70}%</span>
                <button onClick={() => { setScoreInput(quiz.passing_score ?? 70); setEditingScore(true); }} style={{ background: "none", border: "1px solid #E2E5EB", color: "#6B7280", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Modifier</button>
              </>
            )}
          </div>
        </div>
      )}
      {!loading && !quiz && !showBuild && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun quiz pour ce chapitre.</p>}
      {showBuild && (
        <div style={{ marginTop: 10 }}>
          <Inp label="Titre" value={title} onChange={setTitle} placeholder="ex. Vérification des connaissances" />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 5, fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Score de réussite requis (%)</label>
            <input type="number" min="0" max="100" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} style={{ width: 100, background: "#F7F8FA", border: "1px solid #E2E5EB", borderRadius: 7, padding: "8px 11px", fontSize: 13, fontFamily: "inherit" }} />
          </div>
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
