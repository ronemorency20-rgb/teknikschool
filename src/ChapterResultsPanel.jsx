import { useEffect, useState } from "react";
import { Modal, Spinner, Btn } from "./ui";
import { fetchChapterQuiz, fetchMyQuizAttempts, fetchChapterCompletionDate } from "./coursesApi";
import { CheckCircleIcon } from "./Icons";

// Real data only — every number here comes from actual quiz_submissions
// rows, never a placeholder. Opened by tapping a chapter's score badge.
export default function ChapterResultsPanel({ chapter, studentId, onClose, onReview, onRetake }) {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = await fetchChapterQuiz(chapter.id);
        setQuiz(q);
        if (q) setAttempts(await fetchMyQuizAttempts(q.id, studentId));
        setCompletedAt(await fetchChapterCompletionDate(chapter.id, studentId));
      } catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, [chapter.id]);

  const pcts = attempts.map((a) => (a.total > 0 ? Math.round((a.score / a.total) * 100) : 0));
  const bestPct = pcts.length ? Math.max(...pcts) : null;
  const latestPct = pcts.length ? pcts[0] : null;
  const passingScore = quiz?.passing_score ?? 70;

  return (
    <Modal title={chapter.title} onClose={onClose} width={440}>
      {loading && <Spinner label="Chargement…" />}
      {err && <p style={{ color: "#FF6677", fontSize: 13 }}>{err}</p>}
      {!loading && attempts.length === 0 && (
        <p style={{ color: "#9CA3AF", fontSize: 14 }}>Aucune tentative de quiz enregistrée pour ce chapitre pour le moment.</p>
      )}
      {!loading && attempts.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            <div style={{ background: "#00D4AA12", borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Meilleur score</div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: "#00D4AA" }}>{bestPct}%</div>
            </div>
            <div style={{ background: "#7C6FFF12", borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Score récent</div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: "#7C6FFF" }}>{latestPct}%</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7280", marginBottom: 4, padding: "0 2px" }}>
            <span>Tentatives</span><b style={{ color: "#12141C" }}>{attempts.length}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7280", marginBottom: 4, padding: "0 2px" }}>
            <span>Score requis</span><b style={{ color: "#12141C" }}>{passingScore}%</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7280", marginBottom: 4, padding: "0 2px" }}>
            <span>Dernière tentative</span><b style={{ color: "#12141C" }}>{new Date(attempts[0].submitted_at).toLocaleDateString("fr-FR")}</b>
          </div>
          {completedAt && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7280", marginBottom: 18, padding: "0 2px" }}>
              <span>Terminé le</span><b style={{ color: "#12141C" }}>{new Date(completedAt).toLocaleDateString("fr-FR")}</b>
            </div>
          )}

          {bestPct >= passingScore && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#00D4AA18", borderRadius: 9, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#00A88A", fontWeight: 700 }}>
              <CheckCircleIcon size={16} color="#00A88A" /> Chapitre réussi
            </div>
          )}
        </>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onReview} style={{ flex: 1, background: "#FFFFFF", border: "1px solid #E2E5EB", color: "#374151", borderRadius: 9, padding: "11px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Revoir le chapitre</button>
        {quiz && <Btn onClick={onRetake} color="#7C6FFF" style={{ flex: 1, fontFamily: "inherit" }}>Refaire le quiz</Btn>}
      </div>
    </Modal>
  );
}
