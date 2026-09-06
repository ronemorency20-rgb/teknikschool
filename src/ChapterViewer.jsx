import { useEffect, useMemo, useRef, useState } from "react";
import { Btn, Badge, Spinner } from "./ui";
import { fetchChapterContent, markChapterComplete, fetchChapterQuiz, fetchMyQuizSubmission, fetchMyQuizAttempts, submitQuiz } from "./coursesApi";
import { CheckCircleIcon, ShareIcon, ChevronLeftIcon, ChevronRightIcon, AlertTriangleIcon } from "./Icons";
import { getBlockStyle, getEmbedUrl } from "./blockTypes";

// ---- One lesson step's content, styled by its block type ----
function StepContent({ item }) {
  const style = getBlockStyle(item.block_type);
  const Icon = style.icon;

  if (style.kind === "quiz_check") {
    return <QuickCheck item={item} style={style} Icon={Icon} />;
  }

  if (style.kind === "image") {
    return (
      <div>
        <BlockLabel item={item} style={style} Icon={Icon} />
        <img src={item.file_url} alt={item.alt_text || item.label} style={{ width: "100%", borderRadius: 14, display: "block" }} />
      </div>
    );
  }

  if (style.kind === "video") {
    const embedUrl = getEmbedUrl(item.file_url);
    return (
      <div>
        <BlockLabel item={item} style={style} Icon={Icon} />
        {embedUrl ? (
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 14, overflow: "hidden", background: "#000" }}>
            <iframe src={embedUrl} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} />
          </div>
        ) : (
          <video src={item.file_url} controls style={{ width: "100%", maxHeight: 420, background: "#000", borderRadius: 14, display: "block" }} />
        )}
      </div>
    );
  }

  if (style.kind === "audio") {
    return (
      <div>
        <BlockLabel item={item} style={style} Icon={Icon} />
        <audio src={item.file_url} controls style={{ width: "100%" }} />
      </div>
    );
  }

  // Every text-like block (explanation/definition/example/important/activity/summary)
  return (
    <div style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: 16, padding: "20px 22px" }}>
      <BlockLabel item={item} style={style} Icon={Icon} noMargin />
      <div className="lesson-body" style={{ color: "#2D3340", marginTop: 14 }} dangerouslySetInnerHTML={{ __html: item.body }} />
      <style>{`
        .lesson-body { font-family: 'Inter', sans-serif; font-size: clamp(16px, 4.4vw, 19px); line-height: 1.65; font-weight: 400; }
        .lesson-body h2 { font-size: clamp(19px, 5vw, 22px); font-weight: 700; margin: 16px 0 8px; color: #12141C; font-family: 'Poppins', sans-serif; }
        .lesson-body h3 { font-size: clamp(17px, 4.5vw, 19px); font-weight: 700; margin: 14px 0 6px; color: #12141C; font-family: 'Poppins', sans-serif; }
        .lesson-body ul, .lesson-body ol { margin: 8px 0; padding-left: 26px; }
        .lesson-body p { margin: 0 0 12px; }
      `}</style>
    </div>
  );
}

function BlockLabel({ item, style, Icon, noMargin }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 12 }}>
      <div className="lesson-type" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: item.label ? 12 : 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: style.color + "1c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={12} color={style.color} />
        </div>
        <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 11, color: style.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{style.label}</span>
      </div>
      {item.label && <h2 className="lesson-block-title" style={{ color: "#12141C" }}>{item.label}</h2>}
      <style>{`.lesson-block-title { font-family: 'Poppins', sans-serif; font-size: clamp(22px, 5.8vw, 30px); line-height: 1.25; font-weight: 700; letter-spacing: -0.015em; margin-bottom: 18px; overflow-wrap: anywhere; }`}</style>
    </div>
  );
}

// ---- Quick, ungraded, in-lesson multiple choice check ----
function QuickCheck({ item, style, Icon }) {
  const [selected, setSelected] = useState(null);
  const q = item.quiz_data || {};

  return (
    <div style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: 16, padding: "20px 22px" }}>
      <BlockLabel item={item} style={style} Icon={Icon} />
      <p style={{ fontSize: 17, fontWeight: 700, color: "#12141C", margin: "12px 0 14px" }}>{q.question}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(q.options || []).map((opt, i) => {
          const isCorrect = i === q.correctAnswer;
          const isChosen = selected === i;
          let bg = "#FFFFFF", border = "#E2E5EB", color = "#374151";
          if (selected !== null) {
            if (isCorrect) { bg = "#ECFDF5"; border = "#00D4AA"; color = "#00A88A"; }
            else if (isChosen) { bg = "#FEF2F2"; border = "#FF6677"; color = "#DC2626"; }
          }
          return (
            <button key={i} onClick={() => selected === null && setSelected(i)} style={{ textAlign: "left", padding: "12px 16px", borderRadius: 10, background: bg, border: `1.5px solid ${border}`, color, fontSize: 15, cursor: selected === null ? "pointer" : "default", fontFamily: "inherit" }}>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <p style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: selected === q.correctAnswer ? "#00A88A" : "#DC2626" }}>
          {selected === q.correctAnswer ? "✓ Bonne réponse !" : "Pas tout à fait — regardez la bonne réponse en vert."}
        </p>
      )}
    </div>
  );
}

// ---- End-of-chapter graded quiz (unchanged logic, just becomes the final step) ----
function ChapterQuizStep({ chapterId, studentId, onSubmitted, onReview, onAdvanceChapter, isLastChapter, onBack }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mySub, setMySub] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [err, setErr] = useState("");

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null); // null | "correct" | "incorrect"
  const [transitioning, setTransitioning] = useState(false);
  const [firstCorrectMap, setFirstCorrectMap] = useState({}); // qIndex -> bool, first-attempt accuracy only
  const [finished, setFinished] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);
  const [savingRetry, setSavingRetry] = useState(false);
  const advanceTimerRef = useRef(null);

  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const advanceDelay = prefersReducedMotion ? 100 : 700;

  const load = async () => {
    setLoading(true);
    try {
      const q = await fetchChapterQuiz(chapterId);
      setQuiz(q);
      if (q && studentId) { // skip entirely in preview — no reads or writes tied to a real student
        setMySub(await fetchMyQuizSubmission(q.id, studentId));
        setAttempts(await fetchMyQuizAttempts(q.id, studentId));
      }
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [chapterId]);

  // Auto-continue to the next chapter shortly after a pass — but the
  // primary button works immediately if tapped, and this never fires
  // before the save has actually succeeded (finished/finalResult only
  // become true after submitQuiz resolves, see finishQuiz below).
  useEffect(() => {
    if (finished && finalResult?.passed && !isLastChapter && onAdvanceChapter) {
      advanceTimerRef.current = setTimeout(() => onAdvanceChapter(), 1500);
    }
    return () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); };
  }, [finished, finalResult, isLastChapter]);

  const handleAdvanceNow = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    onAdvanceChapter?.();
  };

  if (loading) return <Spinner label="Chargement…" />;
  if (!quiz) return null;

  const questions = quiz.quiz_questions;
  const total = questions.length;
  const passingScore = quiz.passing_score ?? 70;
  const bestPct = attempts.length > 0 ? Math.max(...attempts.map((a) => (a.total > 0 ? Math.round((a.score / a.total) * 100) : 0))) : null;

  const startRetry = () => {
    setRetrying(true);
    setQIndex(0); setSelected(null); setFeedback(null); setTransitioning(false);
    setFirstCorrectMap({}); setFinished(false); setFinalResult(null); setSaveFailed(false); setPendingResult(null);
  };

  const isPreview = !studentId; // teacher/admin previewing — never a real attempt

  const finishQuiz = async (updatedMap) => {
    const score = Object.values(updatedMap).filter(Boolean).length;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const passed = pct >= passingScore;

    if (isPreview) {
      // Local-only — never create/update quiz attempts, scores,
      // enrollments, progress, or chapter unlocking during a preview.
      setFinalResult({ score, total, pct, passed });
      setFinished(true);
      setSaveFailed(false);
      return;
    }

    try {
      await submitQuiz(quiz.id, studentId, score, total);
      setFinalResult({ score, total, pct, passed });
      setMySub({ score, total });
      setAttempts((prev) => [{ score, total, submitted_at: new Date().toISOString() }, ...prev]);
      setFinished(true);
      setSaveFailed(false);
      onSubmitted?.(passed);
    } catch (e) {
      // Keep the student on a results-style screen with what would have
      // been their score, and let them retry just the save — never leave
      // them stranded on the last question with only a stray error line.
      setPendingResult({ score, total, pct, passed });
      setSaveFailed(true);
    }
  };

  const retrySave = async () => {
    if (!pendingResult) return;
    setSavingRetry(true);
    try {
      await submitQuiz(quiz.id, studentId, pendingResult.score, pendingResult.total);
      setFinalResult(pendingResult);
      setMySub({ score: pendingResult.score, total: pendingResult.total });
      setAttempts((prev) => [{ score: pendingResult.score, total: pendingResult.total, submitted_at: new Date().toISOString() }, ...prev]);
      setFinished(true);
      setSaveFailed(false);
      onSubmitted?.(pendingResult.passed);
    } catch (e) { setErr(e.message); }
    finally { setSavingRetry(false); }
  };

  // The per-answer click handler — this is the one that went missing in
  // an earlier edit, causing clicks to silently do nothing. Local
  // feedback (select/correct/incorrect/advance/tally) runs identically
  // for preview and real students; only finishQuiz() branches on
  // isPreview to decide whether to touch the database.
  const handleSelect = (optionIndex) => {
    if (transitioning) return; // guard against double-clicks mid-transition

    const isFirstAttemptOnThisQuestion = !(qIndex in firstCorrectMap);
    const isCorrect = optionIndex === questions[qIndex].correct_answer;

    let updatedMap = firstCorrectMap;
    if (isFirstAttemptOnThisQuestion) {
      updatedMap = { ...firstCorrectMap, [qIndex]: isCorrect };
      setFirstCorrectMap(updatedMap);
    }

    setSelected(optionIndex);

    if (isCorrect) {
      setFeedback("correct");
      setTransitioning(true);
      setTimeout(() => {
        const isLast = qIndex === total - 1;
        if (isLast) {
          finishQuiz(updatedMap);
        } else {
          setQIndex((i) => i + 1);
          setSelected(null);
          setFeedback(null);
          setTransitioning(false);
        }
      }, advanceDelay);
    } else {
      setFeedback("incorrect");
      // No auto-advance — student stays on this question and may pick again.
    }
  };

  // ---- Save failed — distinct retry state, per spec ----
  if (saveFailed && pendingResult) {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 16, padding: 28, textAlign: "center" }}>
        <AlertTriangleIcon size={26} color="#FFB347" />
        <h3 style={{ margin: "12px 0 6px", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 18, color: "#12141C" }}>Enregistrement échoué</h3>
        <p style={{ margin: "0 0 18px", fontSize: 14, color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>
          Votre score ({pendingResult.pct}%) n'a pas pu être sauvegardé. Vérifiez votre connexion et réessayez.
        </p>
        <Btn onClick={retrySave} disabled={savingRetry} color="#7C6FFF" style={{ fontFamily: "inherit" }}>{savingRetry ? "…" : "Réessayer l'enregistrement"}</Btn>
      </div>
    );
  }

  // ---- Already-attempted summary (shown before starting a new attempt) ----
  if (mySub && !retrying && !finished) {
    const pct = mySub.total > 0 ? Math.round((mySub.score / mySub.total) * 100) : 0;
    const passed = pct >= passingScore;
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 16, padding: 28, textAlign: "center" }}>
        <SuccessCheck passed={passed} reducedMotion={prefersReducedMotion} />
        <h3 style={{ margin: "14px 0 6px", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 20, color: "#12141C" }}>{passed ? "Chapitre terminé !" : "Quiz non réussi"}</h3>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>
          {passed ? "Vous avez déjà réussi ce quiz." : `Il vous faut ${passingScore}% pour réussir.`}
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 28, margin: "0 0 20px" }}>
          <div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 26, color: passed ? "#00D4AA" : "#FF6677" }}>{pct}%</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'Inter',sans-serif" }}>Score</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 26, color: "#12141C" }}>{attempts.length}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'Inter',sans-serif" }}>Tentative{attempts.length > 1 ? "s" : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onReview} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", color: "#374151", borderRadius: 9, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>Revoir le chapitre</button>
          <Btn onClick={startRetry} color={passed ? "#7C6FFF" : "#FF6677"} style={{ fontFamily: "inherit" }}>
            {passed ? "Repasser le quiz" : "Réessayer le quiz"}
          </Btn>
        </div>
      </div>
    );
  }

  // ---- Final result screen — the compact, redesigned success/fail state ----
  if (finished && finalResult) {
    const { passed, pct, score, total: t } = finalResult;
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 16, padding: 28, textAlign: "center" }}>
        <SuccessCheck passed={passed} reducedMotion={prefersReducedMotion} />
        <h3 style={{ margin: "14px 0 6px", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 20, color: "#12141C" }}>
          {passed ? "Chapitre terminé !" : "Pas encore réussi"}
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6B7280", fontFamily: "'Inter',sans-serif", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
          {passed
            ? "Excellent travail. Vous avez réussi le quiz et débloqué le chapitre suivant."
            : `Il vous faut ${passingScore}% pour réussir et débloquer le chapitre suivant.`}
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 28, margin: "0 0 22px" }}>
          <div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 30, color: passed ? "#00D4AA" : "#FF6677" }}>{pct}%</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'Inter',sans-serif" }}>Score</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 30, color: "#12141C" }}>{score}/{t}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'Inter',sans-serif" }}>{score} bonne{score > 1 ? "s" : ""} réponse{score > 1 ? "s" : ""} sur {t}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onReview} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", color: "#374151", borderRadius: 9, padding: "11px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>Revoir le chapitre</button>
          {isPreview ? (
            <Badge label="Aperçu — aucune donnée enregistrée" color="#9CA3AF" />
          ) : passed ? (
            isLastChapter ? (
              <Btn onClick={onBack} color="#7C6FFF" style={{ fontFamily: "inherit" }}>Retour aux chapitres</Btn>
            ) : (
              <Btn onClick={handleAdvanceNow} color="#7C6FFF" style={{ fontFamily: "inherit" }}>Commencer le chapitre suivant</Btn>
            )
          ) : (
            <Btn onClick={startRetry} color="#FF6677" style={{ fontFamily: "inherit" }}>Réessayer le quiz</Btn>
          )}
        </div>
        {passed && isLastChapter && (
          <p style={{ margin: "16px 0 0", fontSize: 12, color: "#9CA3AF", fontFamily: "'Inter',sans-serif" }}>
            Vous avez terminé tous les chapitres ! Consultez l'onglet "Examen final" pour votre certificat.
          </p>
        )}
      </div>
    );
  }

function SuccessCheck({ passed, reducedMotion }) {
  const color = passed ? "#00D4AA" : "#FF6677";
  return (
    <div style={{ width: 56, height: 56, borderRadius: "50%", background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", animation: reducedMotion ? "none" : "successPop .4s ease" }}>
      <CheckCircleIcon size={28} color={color} />
      <style>{`@keyframes successPop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }`}</style>
    </div>
  );
}

  // ---- One question at a time, auto-advancing on a correct answer ----
  const q = questions[qIndex];
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 16, padding: 22 }}>
      {err && <p style={{ color: "#FF6677", fontSize: 13 }}>{err}</p>}

      <div className="chapter-eyebrow" style={{ color: "#7C6FFF", textTransform: "uppercase" }}>Évaluation</div>
      <h2 className="lesson-block-title" style={{ color: "#12141C" }}>Testez vos connaissances</h2>
      <p style={{ margin: "0 0 16px", fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#9CA3AF" }}>{total} questions · {passingScore}% requis pour réussir</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>Question {qIndex + 1} sur {total}</span>
      </div>
      <div style={{ height: 5, background: "#E2E5EB", borderRadius: 3, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ height: "100%", width: `${((qIndex + 1) / total) * 100}%`, background: "#7C6FFF", borderRadius: 3, transition: prefersReducedMotion ? "none" : "width .3s" }} />
      </div>

      <p style={{ fontSize: "clamp(19px, 5vw, 22px)", fontWeight: 700, color: "#12141C", margin: "0 0 16px", lineHeight: 1.35 }}>{q.question}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
        {q.options.map((opt, j) => {
          const isChosen = selected === j;
          let bg = "#FFFFFF", border = "#E2E5EB", color = "#374151";
          if (isChosen && feedback === "correct") { bg = "#ECFDF5"; border = "#00D4AA"; color = "#00A88A"; }
          else if (isChosen && feedback === "incorrect") { bg = "#FEF2F2"; border = "#FF6677"; color = "#DC2626"; }
          return (
            <button key={j} onClick={() => handleSelect(j)} disabled={transitioning} style={{
              textAlign: "left", padding: "12px 15px", borderRadius: 10, background: bg,
              border: `1.5px solid ${border}`, color, fontSize: 14, cursor: transitioning ? "default" : "pointer",
              fontFamily: "inherit", transition: prefersReducedMotion ? "none" : "background .2s, border-color .2s",
            }}>
              {opt}
            </button>
          );
        })}
      </div>

      {feedback === "correct" && (
        <p style={{ fontSize: 14, fontWeight: 700, color: "#00A88A" }}>✓ Bonne réponse !</p>
      )}
      {feedback === "incorrect" && (
        <p style={{ fontSize: 14, fontWeight: 700, color: "#DC2626" }}>Mauvaise réponse, réessayez.</p>
      )}
    </div>
  );
}

export default function ChapterViewer({ chapter, studentId, isDone, onMarkedDone, onBack, onAdvanceChapter, isLastChapter }) {
  const [items, setItems] = useState([]);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [marking, setMarking] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [step, setStep] = useState(0);

  const storageKey = `teknik_step_${chapter.id}`;

  useEffect(() => {
    (async () => {
      setLoading(true); setErr("");
      try {
        const [content, quiz] = await Promise.all([fetchChapterContent(chapter.id), fetchChapterQuiz(chapter.id)]);
        setItems(content);
        setHasQuiz(!!quiz);
        const saved = parseInt(localStorage.getItem(storageKey) || "0", 10);
        const maxStep = content.length + (quiz ? 1 : 0) - 1;
        setStep(Number.isFinite(saved) ? Math.min(Math.max(saved, 0), Math.max(maxStep, 0)) : 0);
      } catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, [chapter.id]);

  const totalSteps = items.length + (hasQuiz ? 1 : 0);
  const isQuizStep = hasQuiz && step === items.length;
  const isLastStep = step === totalSteps - 1;

  const goTo = (n) => {
    const clamped = Math.min(Math.max(n, 0), Math.max(totalSteps - 1, 0));
    setStep(clamped);
    localStorage.setItem(storageKey, String(clamped));
  };

  const isPreviewMode = !studentId;

  const handleComplete = async () => {
    if (isPreviewMode) {
      // Never touch the database during a preview — just reflect the
      // completed state locally so the teacher can see what it looks like.
      onMarkedDone?.();
      return;
    }
    setMarking(true);
    try {
      await markChapterComplete(chapter.id, studentId);
      onMarkedDone?.();
    } catch (e) { setErr(e.message); }
    finally { setMarking(false); }
  };

  // Passing the quiz automatically completes the chapter and unlocks the
  // next one — no separate manual "Marquer terminé" click needed.
  const handleQuizSubmitted = async (passed) => {
    if (!passed) return;
    try {
      await markChapterComplete(chapter.id, studentId);
      onMarkedDone?.();
    } catch (e) { setErr(e.message); }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/#/preview/${chapter.id}`;
    const shareData = { title: `TeknikSchool — ${chapter.title}`, text: "Découvre ce cours sur TeknikSchool !", url };
    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch { /* clipboard unavailable */ }
  };

  const progressPct = totalSteps > 0 ? Math.round(((step + 1) / totalSteps) * 100) : 0;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      {/* ---- Header ---- */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#00D4AA", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
            <ChevronLeftIcon size={16} color="#00D4AA" /> Chapitres
          </button>
          <button onClick={handleShare} title="Partager ce chapitre" style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 9, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShareIcon size={14} color="#6B7280" />
          </button>
        </div>

        <div className="chapter-eyebrow" style={{ color: "#7C6FFF", textTransform: "uppercase" }}>
          Chapitre {chapter.number}
        </div>
        <h1 className="chapter-title" style={{ color: "#12141C" }}>
          {chapter.title}
        </h1>
        {chapter.subtitle && (
          <p style={{ margin: "0 0 10px", fontFamily: "'Inter',sans-serif", fontSize: "clamp(15px, 4vw, 17px)", color: "#6B7280", lineHeight: 1.4 }}>{chapter.subtitle}</p>
        )}
        {isDone && <div style={{ marginBottom: 12 }}><Badge label="✓ Terminé" color="#00D4AA" /></div>}
        <style>{`
          .chapter-eyebrow { font-family: 'Inter', sans-serif; font-size: clamp(13px, 3.5vw, 15px); font-weight: 700; letter-spacing: 0.08em; margin-bottom: 10px; }
          .chapter-title { font-family: 'Poppins', sans-serif; font-size: clamp(30px, 8vw, 44px); line-height: 1.12; font-weight: 700; letter-spacing: -0.025em; overflow-wrap: anywhere; margin-bottom: 16px; }
        `}</style>

        {!loading && totalSteps > 0 && (
          <>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>Étape {step + 1} sur {totalSteps}</div>
            <div style={{ height: 6, background: "#E2E5EB", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "#00D4AA", borderRadius: 3, transition: "width .3s" }} />
            </div>
          </>
        )}
      </div>

      {shareCopied && (
        <div style={{ background: "#00D4AA18", border: "1px solid #00D4AA40", borderRadius: 9, padding: "8px 14px", fontSize: 12, color: "#00D4AA", marginBottom: 16 }}>
          Lien copié ! Partagez-le pour inviter quelqu'un à découvrir ce cours.
        </div>
      )}

      {err && <div style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{err}</div>}
      {loading && <Spinner label="Chargement…" />}

      {!loading && totalSteps === 0 && (
        <div style={{ padding: 50, textAlign: "center", color: "#9CA3AF", border: "2px dashed #E2E5EB", borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: 14 }}>Aucun contenu pour le moment.</p>
        </div>
      )}

      {/* ---- Current step ---- */}
      {!loading && totalSteps > 0 && (
        <div style={{ marginBottom: 24 }}>
          {isQuizStep ? (
            <ChapterQuizStep chapterId={chapter.id} studentId={studentId} onSubmitted={handleQuizSubmitted} onReview={() => goTo(0)} onAdvanceChapter={onAdvanceChapter} isLastChapter={isLastChapter} onBack={onBack} />
          ) : (
            <StepContent item={items[step]} />
          )}
        </div>
      )}

      {/* ---- Step navigation footer ---- */}
      {!loading && totalSteps > 0 && !isQuizStep && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button onClick={() => goTo(step - 1)} disabled={step === 0} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 10, padding: "10px 18px", cursor: step === 0 ? "default" : "pointer", opacity: step === 0 ? 0.4 : 1, fontSize: 14, fontWeight: 700, color: "#374151", fontFamily: "inherit" }}>
            <ChevronLeftIcon size={15} color="#374151" /> Précédent
          </button>

          {!isLastStep ? (
            <button onClick={() => goTo(step + 1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#7C6FFF", border: "none", borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "inherit" }}>
              {!hasQuiz || step < items.length - 1 ? "Continuer" : "Commencer le quiz"} <ChevronRightIcon size={15} color="#fff" />
            </button>
          ) : !isDone ? (
            <Btn onClick={handleComplete} disabled={marking} color="#00D4AA" style={{ fontFamily: "inherit" }}>
              {marking ? "…" : "Marquer comme terminé ✓"}
            </Btn>
          ) : (
            <Badge label="Chapitre terminé ✓" color="#00D4AA" />
          )}
        </div>
      )}
    </div>
  );
}
