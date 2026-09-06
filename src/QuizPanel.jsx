import { useEffect, useState } from "react";
import { Btn, Inp, Badge } from "./ui";
import { fetchQuizzes, createQuiz, deleteQuiz, fetchMyQuizSubmission, submitQuiz, issueCertificate } from "./coursesApi";

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

export function TeacherQuizPanel({ courseId, isFinal = false }) {
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    try { setItems(await fetchQuizzes(courseId, isFinal)); }
    catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, [courseId]);

  const create = async () => {
    if (!title.trim() || questions.length === 0) return;
    try { await createQuiz(courseId, title, questions, isFinal); setTitle(""); setQuestions([]); setShowAdd(false); await load(); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontSize: 15 }}>{isFinal ? "Examen final" : "Quiz"}</h3>
        <Btn onClick={() => setShowAdd((v) => !v)} small color="#7C6FFF" style={{ fontFamily: "inherit" }}>{showAdd ? "Annuler" : "+ Ajouter"}</Btn>
      </div>
      {err && <p style={{ color: "#FF6677", fontSize: 12 }}>{err}</p>}
      {isFinal && <p style={{ fontSize: 12, color: "#6B7280", marginTop: -6, marginBottom: 12 }}>70% requis pour réussir et recevoir un certificat automatiquement.</p>}
      {showAdd && (
        <div style={{ marginBottom: 14 }}>
          <Inp label="Titre" value={title} onChange={setTitle} placeholder={isFinal ? "Examen final" : "Quiz du chapitre 1"} />
          <div style={{ marginBottom: 10 }}>
            {questions.map((q, i) => <div key={i} style={{ background: "#F7F8FA", borderRadius: 8, padding: 8, marginBottom: 6, fontSize: 12, color: "#6B7280" }}>Q{i + 1}: {q.question}</div>)}
          </div>
          <QuestionBuilder onAdd={(q) => setQuestions((qs) => [...qs, q])} />
          <Btn onClick={create} color="#7C6FFF" style={{ width: "100%", marginTop: 10, fontFamily: "inherit" }} disabled={!title.trim() || questions.length === 0}>Créer</Btn>
        </div>
      )}
      {items.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Aucun pour le moment.</p>}
      {items.map((q) => (
        <div key={q.id} style={{ padding: 10, background: "#F7F8FA", borderRadius: 9, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontWeight: 600, fontSize: 13 }}>{q.title}</div><div style={{ fontSize: 11, color: "#6B7280" }}>{q.quiz_questions?.length || 0} questions</div></div>
          <button onClick={() => deleteQuiz(q.id).then(load)} style={{ background: "none", border: "none", color: "#FF6677", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>
      ))}
    </div>
  );
}

export function StudentQuizPanel({ courseId, studentId, course, isFinal = false, onCertificateEarned }) {
  const [items, setItems] = useState([]);
  const [subs, setSubs] = useState({});
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const qs = await fetchQuizzes(courseId, isFinal);
      setItems(qs);
      const s = {};
      for (const q of qs) s[q.id] = await fetchMyQuizSubmission(q.id, studentId);
      setSubs(s);
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, [courseId]);

  const submit = async (quiz) => {
    let score = 0;
    quiz.quiz_questions.forEach((q, i) => { if (answers[`${quiz.id}-${i}`] === q.correct_answer) score++; });
    const total = quiz.quiz_questions.length;
    try {
      await submitQuiz(quiz.id, studentId, score, total);
      setResult({ quizId: quiz.id, score, total });
      if (isFinal && score / total >= 0.7) {
        const cert = await issueCertificate(studentId, courseId, course?.title || "Cours", Math.round((course?.duration_days || 30) * 0.6));
        onCertificateEarned?.(cert);
      }
      await load();
    } catch (e) { setErr(e.message); }
  };

  if (items.length === 0) return <p style={{ color: "#6B7280" }}>{isFinal ? "Aucun examen final configuré." : "Aucun quiz pour le moment."}</p>;

  return (
    <div>
      {err && <p style={{ color: "#FF6677", fontSize: 13 }}>{err}</p>}
      {items.map((quiz) => {
        const mySub = subs[quiz.id];
        const showResult = result && result.quizId === quiz.id;
        return (
          <div key={quiz.id} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 22, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontFamily: "'Syne',sans-serif" }}>{quiz.title}</h3>
              {mySub && <Badge label={`${mySub.score}/${mySub.total}`} color={mySub.score === mySub.total ? "#00D4AA" : "#FFB347"} />}
            </div>
            {showResult && (
              <div style={{ background: result.score / result.total >= 0.7 ? "#00D4AA22" : "#FFB34722", border: `1px solid ${result.score / result.total >= 0.7 ? "#00D4AA" : "#FFB347"}`, borderRadius: 11, padding: 18, marginBottom: 20, textAlign: "center" }}>
                <div style={{ fontSize: 42, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: result.score / result.total >= 0.7 ? "#00D4AA" : "#FFB347" }}>{result.score}/{result.total}</div>
                <div style={{ color: "#4B5568", marginTop: 4 }}>{result.score === result.total ? "Parfait!" : result.score / result.total >= 0.7 ? "Réussi!" : "Continuez à étudier!"}</div>
              </div>
            )}
            {quiz.quiz_questions?.map((q, i) => (
              <div key={i} style={{ background: "#F7F8FA", borderRadius: 11, padding: 16, marginBottom: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Q{i + 1}. {q.question}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {q.options.map((opt, j) => (
                    <button key={j} onClick={() => setAnswers((a) => ({ ...a, [`${quiz.id}-${i}`]: j }))} style={{
                      padding: "10px 13px", borderRadius: 8, textAlign: "left", cursor: "pointer", fontSize: 13,
                      background: answers[`${quiz.id}-${i}`] === j ? "#7C6FFF25" : "#FFFFFF",
                      border: answers[`${quiz.id}-${i}`] === j ? "1px solid #7C6FFF" : "1px solid #E2E5EB",
                      color: answers[`${quiz.id}-${i}`] === j ? "#C4BEFF" : "#4B5568", fontFamily: "inherit",
                    }}>{opt}</button>
                  ))}
                </div>
              </div>
            ))}
            <Btn onClick={() => submit(quiz)} color="#7C6FFF" style={{ fontFamily: "inherit" }}>{mySub ? "Repasser" : "Soumettre"}</Btn>
          </div>
        );
      })}
    </div>
  );
}
