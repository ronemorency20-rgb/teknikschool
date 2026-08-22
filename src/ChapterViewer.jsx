import { useEffect, useState } from "react";
import { Btn, Badge, Spinner } from "./ui";
import { fetchChapterContent, markChapterComplete, fetchChapterQuiz, fetchMyQuizSubmission, submitQuiz } from "./coursesApi";
import { FileTextIcon, VideoIcon, MusicIcon, CheckCircleIcon } from "./Icons";

function ContentBlock({ item }) {
  if (item.type === "text") {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <FileTextIcon size={16} color="#7C6FFF" /><span style={{ fontWeight: 700, fontSize: 14, color: "#12141C" }}>{item.label}</span>
        </div>
        <div style={{ fontSize: 14, color: "#4B5568", lineHeight: 1.85, whiteSpace: "pre-line" }}>{item.body}</div>
      </div>
    );
  }
  if (item.type === "video") {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #E2E5EB", display: "flex", alignItems: "center", gap: 8 }}>
          <VideoIcon size={16} color="#FF6B8A" /><span style={{ fontWeight: 700, fontSize: 14, color: "#12141C" }}>{item.label}</span>
        </div>
        <video src={item.file_url} controls style={{ width: "100%", maxHeight: 400, background: "#000", display: "block" }} />
      </div>
    );
  }
  if (item.type === "audio") {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <MusicIcon size={16} color="#FFB347" /><span style={{ fontWeight: 700, fontSize: 14, color: "#12141C" }}>{item.label}</span>
        </div>
        <audio src={item.file_url} controls style={{ width: "100%" }} />
      </div>
    );
  }
  return null;
}

function ChapterQuiz({ chapterId, studentId }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mySub, setMySub] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = await fetchChapterQuiz(chapterId);
        setQuiz(q);
        if (q) setMySub(await fetchMyQuizSubmission(q.id, studentId));
      } catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, [chapterId]);

  if (loading || !quiz) return null;

  const submit = async () => {
    let score = 0;
    quiz.quiz_questions.forEach((q, i) => { if (answers[i] === q.correct_answer) score++; });
    const total = quiz.quiz_questions.length;
    try {
      await submitQuiz(quiz.id, studentId, score, total);
      setResult({ score, total });
      setMySub({ score, total });
    } catch (e) { setErr(e.message); }
  };

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 12, padding: 20, marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <CheckCircleIcon size={16} color="#00D4AA" /><span style={{ fontWeight: 700, fontSize: 14, color: "#12141C" }}>{quiz.title}</span>
        {mySub && <Badge label={`${mySub.score}/${mySub.total}`} color={mySub.score === mySub.total ? "#00D4AA" : "#FFB347"} />}
      </div>
      {err && <p style={{ color: "#FF6677", fontSize: 12 }}>{err}</p>}
      {result && (
        <div style={{ background: result.score / result.total >= 0.7 ? "#00D4AA22" : "#FFB34722", borderRadius: 10, padding: 14, marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: result.score / result.total >= 0.7 ? "#00D4AA" : "#FFB347" }}>{result.score}/{result.total}</div>
        </div>
      )}
      {quiz.quiz_questions.map((q, i) => (
        <div key={q.id} style={{ background: "#F7F8FA", borderRadius: 10, padding: 14, marginBottom: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Q{i + 1}. {q.question}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {q.options.map((opt, j) => (
              <button key={j} onClick={() => setAnswers((a) => ({ ...a, [i]: j }))} style={{
                padding: "8px 12px", borderRadius: 8, textAlign: "left", cursor: "pointer", fontSize: 12,
                background: answers[i] === j ? "#7C6FFF25" : "#FFFFFF",
                border: answers[i] === j ? "1px solid #7C6FFF" : "1px solid #E2E5EB",
                color: answers[i] === j ? "#C4BEFF" : "#4B5568", fontFamily: "inherit",
              }}>{opt}</button>
            ))}
          </div>
        </div>
      ))}
      <Btn onClick={submit} color="#7C6FFF" style={{ fontFamily: "inherit" }}>{mySub ? "Repasser" : "Soumettre"}</Btn>
    </div>
  );
}

export default function ChapterViewer({ chapter, studentId, isDone, onMarkedDone, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr("");
      try { setItems(await fetchChapterContent(chapter.id)); }
      catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, [chapter.id]);

  const handleComplete = async () => {
    setMarking(true);
    try {
      await markChapterComplete(chapter.id, studentId);
      onMarkedDone?.();
    } catch (e) { setErr(e.message); }
    finally { setMarking(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#00D4AA", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>← Chapitres</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#6B7280", background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 6, padding: "2px 8px" }}>Ch. {chapter.number}</span>
            <h2 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>{chapter.title}</h2>
            {isDone && <Badge label="✓ Terminé" color="#00D4AA" />}
          </div>
        </div>
        {!isDone && <Btn onClick={handleComplete} disabled={marking} color="#00D4AA" style={{ fontFamily: "inherit" }}>{marking ? "…" : "Marquer terminé ✓"}</Btn>}
      </div>

      {err && <div style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{err}</div>}
      {loading && <Spinner label="Chargement…" />}

      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.length === 0 && (
            <div style={{ padding: 50, textAlign: "center", color: "#9CA3AF", border: "2px dashed #E2E5EB", borderRadius: 12 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}></div>
              <p style={{ margin: 0, fontSize: 14 }}>Aucun contenu pour le moment.</p>
            </div>
          )}
          {items.map((item) => <ContentBlock key={item.id} item={item} />)}
        </div>
      )}

      {!loading && <ChapterQuiz chapterId={chapter.id} studentId={studentId} />}
    </div>
  );
}
