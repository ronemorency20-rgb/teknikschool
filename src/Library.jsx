import { useEffect, useState } from "react";
import { fetchLibraryDocuments, generateDownloadPin } from "./coursesApi";
import { Spinner, Btn } from "./ui";
import { FileTextIcon, Box3DIcon, ImageIcon, MusicIcon, VideoIcon, DownloadIcon, KeyIcon } from "./Icons";

// Picks a fitting icon based on the file's extension — supports any
// format, not just documents (books/PDF, 3D print files, images, audio, video…)
function iconForFile(name = "") {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["stl", "obj", "3mf", "gcode"].includes(ext)) return { Icon: Box3DIcon, color: "#00D4AA", label: "Fichier 3D" };
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return { Icon: ImageIcon, color: "#FFB347", label: "Image" };
  if (["mp3", "wav", "m4a", "ogg"].includes(ext)) return { Icon: MusicIcon, color: "#FF6B8A", label: "Audio" };
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return { Icon: VideoIcon, color: "#FF6B8A", label: "Vidéo" };
  return { Icon: FileTextIcon, color: "#7C6FFF", label: ext ? ext.toUpperCase() : "Document" };
}

export default function Library({ studentId }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [pinModal, setPinModal] = useState(null); // { doc, pin }
  const [generating, setGenerating] = useState(null);

  const load = async () => {
    setLoading(true); setErr("");
    try { setDocs(await fetchLibraryDocuments(studentId)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDownload = async (doc) => {
    setGenerating(doc.id);
    try {
      const pin = await generateDownloadPin(doc.id, studentId);
      setPinModal({ doc, pin });
      window.open(doc.file_url, "_blank");
    } catch (e) { setErr(e.message); }
    finally { setGenerating(null); }
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 8px", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(22px, 5vw, 28px)" }}>Bibliothèque</h2>
      <p style={{ margin: "0 0 22px", color: "#6B7280", fontSize: 14 }}>
        Tous les documents (livres, fichiers 3D, images, et plus) des cours auxquels vous êtes inscrit.
      </p>

      {err && <div style={{ background: "#FF445522", border: "1px solid #FF444555", color: "#FF6677", padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{err}</div>}
      {loading && <Spinner label="Chargement…" />}
      {!loading && docs.length === 0 && (
        <div style={{ padding: 50, textAlign: "center", color: "#9CA3AF", border: "2px dashed #E2E5EB", borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: 14 }}>Aucun document disponible pour le moment. Vos professeurs peuvent ajouter des fichiers à leurs cours.</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {docs.map((doc) => {
          const { Icon, color, label } = iconForFile(doc.file_name || doc.title);
          return (
            <div key={doc.id} style={{ background: "#FFFFFF", border: "1px solid #E2E5EB", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#12141C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{doc.course?.title} · {label}</div>
                </div>
              </div>
              <Btn onClick={() => handleDownload(doc)} disabled={generating === doc.id} color="#7C6FFF" style={{ width: "100%", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <DownloadIcon size={14} color="#fff" /> {generating === doc.id ? "…" : "Télécharger"}
              </Btn>
            </div>
          );
        })}
      </div>

      {pinModal && (
        <div onClick={() => setPinModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: 16, padding: 28, maxWidth: 360, width: "100%", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#7C6FFF18", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <KeyIcon size={22} color="#7C6FFF" />
            </div>
            <h3 style={{ margin: "0 0 6px", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(22px, 5vw, 28px)" }}>Téléchargement démarré</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>Votre code PIN pour « {pinModal.doc.title} » :</p>
            <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 800, letterSpacing: 4, color: "#12141C", background: "#F7F8FA", borderRadius: 10, padding: "12px 0", marginBottom: 16 }}>
              {pinModal.pin}
            </div>
            <Btn onClick={() => setPinModal(null)} color="#12141C" style={{ width: "100%", fontFamily: "inherit" }}>Fermer</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
