import { useRef } from "react";
import { Modal, Btn, SchoolEmblem, fmtDate } from "./ui";
import { QRCodeSVG } from "./qr";

const SCHOOL_NAME = "TeknikSchool";
const DIRECTOR_NAME = "Rone Fils Morency";
const genCode = (id) => `EDU-${id.slice(0, 8).toUpperCase()}`;
const verifyUrl = (id) => `https://teknikschool.edu/verify/${genCode(id)}`;

export default function CertificateView({ cert, studentName, color = "#7C6FFF", onClose }) {
  const ref = useRef(null);

  const download = async () => {
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = 1000 * scale; canvas.height = 700 * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    const grad = ctx.createLinearGradient(0, 0, 1000, 700);
    grad.addColorStop(0, "#FFFFFF"); grad.addColorStop(1, "#FFFFFF");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1000, 700);
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.strokeRect(20, 20, 960, 660);
    ctx.strokeStyle = color + "55"; ctx.lineWidth = 1; ctx.strokeRect(32, 32, 936, 636);
    ctx.font = "22px serif"; ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.beginPath(); ctx.arc(500, 55, 20, 0, Math.PI * 2); ctx.fillStyle = color + "22"; ctx.fill();
    ctx.strokeStyle = color + "88"; ctx.lineWidth = 1.5; ctx.stroke();
    try {
      const logoImg = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = "/logo.png";
      });
      ctx.drawImage(logoImg, 484, 39, 32, 32);
    } catch { /* logo failed to load — badge circle alone still looks fine */ }
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#12141C"; ctx.font = "700 20px Georgia, serif"; ctx.textAlign = "center";
    ctx.fillText(SCHOOL_NAME.toUpperCase(), 500, 100);
    ctx.fillStyle = color; ctx.font = "800 42px Georgia, serif";
    ctx.fillText("Certificat de Réussite", 500, 168);
    ctx.fillStyle = "#6B7280"; ctx.font = "16px Georgia, serif";
    ctx.fillText("Ceci certifie que", 500, 224);
    ctx.fillStyle = "#fff"; ctx.font = "700 36px Georgia, serif";
    ctx.fillText(studentName || "Élève", 500, 275);
    ctx.fillStyle = "#6B7280"; ctx.font = "16px Georgia, serif";
    ctx.fillText("a complété avec succès le cours", 500, 320);
    ctx.fillStyle = color; ctx.font = "700 28px Georgia, serif";
    ctx.fillText(cert.course_title, 500, 365);
    ctx.fillStyle = "#6B7280"; ctx.font = "15px Georgia, serif";
    ctx.fillText(`ayant consacré ${cert.hours_spent || 0} heures d'étude, démontrant sa maîtrise`, 500, 400);
    ctx.fillText("par une évaluation complète et un examen final.", 500, 422);
    ctx.fillStyle = "#6B7280"; ctx.font = "13px monospace";
    ctx.fillText(`Délivré le ${fmtDate(cert.issued_at)}  ·  ID: ${genCode(cert.id)}`, 500, 465);
    ctx.strokeStyle = "#6B7280"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(360, 560); ctx.lineTo(640, 560); ctx.stroke();
    ctx.fillStyle = "#12141C"; ctx.font = "italic 24px Georgia, serif";
    ctx.fillText(DIRECTOR_NAME, 500, 545);
    ctx.fillStyle = "#6B7280"; ctx.font = "13px Georgia, serif";
    ctx.fillText("Directeur, " + SCHOOL_NAME, 500, 582);
    const link = document.createElement("a");
    link.download = `Certificat-${cert.course_title.replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <Modal title="Certificat de réussite" onClose={onClose} width={720}>
      <div ref={ref} style={{ background: "linear-gradient(135deg,#FFFFFF,#FFFFFF)", border: `3px solid ${color}`, borderRadius: 14, padding: "36px 40px", position: "relative" }}>
        <div style={{ position: "absolute", inset: 8, border: `1px solid ${color}44`, borderRadius: 10, pointerEvents: "none" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <SchoolEmblem size={22} color={color} />
            <div style={{ fontSize: 12, letterSpacing: 3, color: "#6B7280", fontWeight: 700 }}>{SCHOOL_NAME.toUpperCase()}</div>
          </div>
          <h1 style={{ margin: "0 0 18px", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 30, color }}>Certificat de Réussite</h1>
          <p style={{ margin: "0 0 6px", color: "#6B7280", fontSize: 14 }}>Ceci certifie que</p>
          <h2 style={{ margin: "0 0 10px", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26 }}>{studentName}</h2>
          <p style={{ margin: "0 0 6px", color: "#6B7280", fontSize: 14 }}>a complété avec succès le cours</p>
          <h3 style={{ margin: "0 0 14px", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 20, color }}>{cert.course_title}</h3>
          <p style={{ margin: 0, color: "#6B7280", fontSize: 13, lineHeight: 1.6 }}>
            ayant consacré <b style={{ color: "#4B5568" }}>{cert.hours_spent || 0} heures</b> d'étude, démontrant sa maîtrise<br />par une évaluation complète et un examen final.
          </p>
          <p style={{ margin: "18px 0 0", color: "#6B7280", fontSize: 11, fontFamily: "monospace" }}>Délivré le {fmtDate(cert.issued_at)} · ID: {genCode(cert.id)}</p>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 32 }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontStyle: "italic", fontSize: 22, borderBottom: "1px solid #6B7280", paddingBottom: 6, marginBottom: 6, display: "inline-block", minWidth: 200 }}>{DIRECTOR_NAME}</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>Directeur, {SCHOOL_NAME}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginLeft: 20 }}>
            <div style={{ background: "#fff", padding: 6, borderRadius: 8 }}><QRCodeSVG value={verifyUrl(cert.id)} size={86} /></div>
            <span style={{ fontSize: 9, color: "#6B7280" }}>Scanner pour vérifier</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <Btn onClick={download} color="#00D4AA" style={{ flex: 1, fontFamily: "inherit" }}>⬇ Télécharger</Btn>
        <Btn onClick={onClose} secondary color="#7C6FFF" style={{ fontFamily: "inherit" }}>Fermer</Btn>
      </div>
    </Modal>
  );
}
