import { FileTextIcon, BookIcon, LightbulbIcon, StarIcon, AlertTriangleIcon, ImageIcon, VideoIcon, MusicIcon, ActivityIcon, HelpCircleIcon, ClipboardIcon } from "./Icons";

// Single source of truth for every lesson block's look — used by both
// the teacher editor (to build/edit blocks) and the student viewer
// (to render them). "kind" tells the UI which fields/renderer to use;
// "explanation/definition/example/important/warning/activity/summary"
// are all kind:"text" (rich text body), just styled differently.
export const BLOCK_TYPES = [
  { id: "explanation", label: "Texte", icon: FileTextIcon, color: "#6B7280", bg: "#FFFFFF", border: "#E2E5EB", kind: "text" },
  { id: "definition", label: "Définition", icon: BookIcon, color: "#7C6FFF", bg: "#F5F3FF", border: "#DDD6FE", kind: "text" },
  { id: "example", label: "Exemple", icon: LightbulbIcon, color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", kind: "text" },
  { id: "important", label: "Point important", icon: StarIcon, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", kind: "text" },
  { id: "warning", label: "Avertissement", icon: AlertTriangleIcon, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", kind: "text" },
  { id: "image", label: "Image", icon: ImageIcon, color: "#FFB347", bg: "#FFFFFF", border: "#E2E5EB", kind: "image" },
  { id: "video", label: "Vidéo", icon: VideoIcon, color: "#FF6B8A", bg: "#FFFFFF", border: "#E2E5EB", kind: "video" },
  { id: "audio", label: "Audio", icon: MusicIcon, color: "#FFB347", bg: "#FFFFFF", border: "#E2E5EB", kind: "audio" },
  { id: "activity", label: "Activité", icon: ActivityIcon, color: "#00D4AA", bg: "#ECFDF5", border: "#A7F3D0", kind: "text" },
  { id: "quiz_check", label: "Question rapide", icon: HelpCircleIcon, color: "#7C6FFF", bg: "#FFFFFF", border: "#DDD6FE", kind: "quiz_check" },
  { id: "summary", label: "Résumé", icon: ClipboardIcon, color: "#12141C", bg: "#F7F8FA", border: "#E2E5EB", kind: "text" },
];

export function getBlockStyle(id) {
  return BLOCK_TYPES.find((b) => b.id === id) || BLOCK_TYPES[0];
}

// Converts a YouTube or Vimeo watch/share link into its embeddable form.
// Returns null for anything else (direct video files), so the caller
// falls back to a plain <video> tag.
export function getEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}
