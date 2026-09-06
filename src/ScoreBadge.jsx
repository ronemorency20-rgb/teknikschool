import { useEffect, useRef, useState } from "react";
import { CheckCircleIcon, LockIcon } from "./Icons";

// Reusable chapter-score badge — shared by the chapter list and the
// results panel. Animates 0 → final % once, respecting the user's
// reduced-motion preference. Never invents a score: pass `pct={null}`
// for "never attempted".
export default function ScoreBadge({ pct, passed, state, onClick }) {
  const [display, setDisplay] = useState(state === "start" || state === "locked" ? 0 : pct ?? 0);
  const animated = useRef(false);

  useEffect(() => {
    if (pct == null || animated.current) return;
    animated.current = true;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setDisplay(pct); return; }
    const duration = 600;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * pct));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [pct]);

  if (state === "locked") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F7F8FA", border: "1px solid #E2E5EB", borderRadius: 20, padding: "5px 12px" }}>
        <LockIcon size={12} color="#9CA3AF" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF" }}>Verrouillé</span>
      </div>
    );
  }

  if (state === "start") {
    return (
      <button onClick={onClick} style={{ background: "#F7F8FA", border: "1px solid #E2E5EB", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "#6B7280", cursor: onClick ? "pointer" : "default", fontFamily: "inherit" }}>
        À commencer
      </button>
    );
  }

  const color = passed ? "#00D4AA" : "#FF6677";
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 5, background: color + "18", border: `1px solid ${color}55`, borderRadius: 20, padding: "5px 12px", cursor: onClick ? "pointer" : "default", fontFamily: "inherit" }}>
      {passed && <CheckCircleIcon size={12} color={color} />}
      <span style={{ fontSize: 12, fontWeight: 800, color }}>{display}%</span>
    </button>
  );
}
