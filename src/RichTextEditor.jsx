import { useRef, useEffect } from "react";

// A lightweight, dependency-free rich text editor — Word-style basics
// (bold, italic, underline, headings, lists) without pulling in a heavy
// external library. Stores/returns HTML.
const BTN = { background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 13, color: "#374151", fontFamily: "inherit" };

export default function RichTextEditor({ value, onChange, placeholder = "Écrivez vos notes…" }) {
  const ref = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Only set innerHTML once on mount / when switching to a different chapter draft —
    // never on every keystroke, or the cursor would jump to the start each time.
    if (ref.current && !initialized.current) {
      ref.current.innerHTML = value || "";
      initialized.current = true;
    }
  }, [value]);

  const exec = (command, arg = null) => {
    document.execCommand(command, false, arg);
    ref.current?.focus();
    onChange(ref.current?.innerHTML || "");
  };

  const btns = [
    { label: "B", title: "Gras", cmd: "bold", style: { fontWeight: 800 } },
    { label: "I", title: "Italique", cmd: "italic", style: { fontStyle: "italic" } },
    { label: "U", title: "Souligné", cmd: "underline", style: { textDecoration: "underline" } },
    { label: "H2", title: "Titre", cmd: "formatBlock", arg: "<h2>" },
    { label: "H3", title: "Sous-titre", cmd: "formatBlock", arg: "<h3>" },
    { label: "•", title: "Liste à puces", cmd: "insertUnorderedList" },
    { label: "1.", title: "Liste numérotée", cmd: "insertOrderedList" },
  ];

  return (
    <div style={{ border: "1px solid #E2E5EB", borderRadius: 9, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 6, padding: 8, background: "#F7F8FA", borderBottom: "1px solid #E2E5EB", flexWrap: "wrap" }}>
        {btns.map((b) => (
          <button key={b.label} type="button" title={b.title} onMouseDown={(e) => { e.preventDefault(); exec(b.cmd, b.arg); }} style={{ ...BTN, ...b.style }}>
            {b.label}
          </button>
        ))}
        <button type="button" title="Effacer la mise en forme" onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); exec("formatBlock", "<p>"); }} style={BTN}>
          ✕ format
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || "")}
        onBlur={() => onChange(ref.current?.innerHTML || "")}
        data-placeholder={placeholder}
        style={{
          minHeight: 180, padding: 14, fontSize: 14, color: "#12141C", lineHeight: 1.6,
          outline: "none", fontFamily: "inherit",
        }}
        className="rte-content"
      />
      <style>{`
        .rte-content:empty:before { content: attr(data-placeholder); color: #9CA3AF; }
        .rte-content h2 { font-size: 20px; font-weight: 800; margin: 12px 0 6px; font-family: 'Syne', sans-serif; }
        .rte-content h3 { font-size: 16px; font-weight: 700; margin: 10px 0 5px; font-family: 'Syne', sans-serif; }
        .rte-content ul, .rte-content ol { margin: 6px 0; padding-left: 24px; }
        .rte-content p { margin: 0 0 8px; }
      `}</style>
    </div>
  );
}
