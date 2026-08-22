// Minimal line-style icon set — replaces emoji throughout the app.
// Every icon inherits color via the `color` prop (defaults to currentColor),
// so it automatically matches whatever accent color it's placed in.

const base = (size, color) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
  stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round",
  style: { flexShrink: 0, display: "block" },
});

export function BellIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function UsersIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function ClipboardIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

export function MegaphoneIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M3 11v3a1 1 0 0 0 1 1h1l3 6h2l-2-6h6l6 4V6l-6 4H8L5 5H4a1 1 0 0 0-1 1z" />
    </svg>
  );
}

export function ImageIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function BookIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export function ChatIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function ChartIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M3 3v18h18" />
      <path d="M18 17V9M13 17V5M8 17v-4" />
    </svg>
  );
}

export function SearchIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function EyeIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function TrophyIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M8 21h8M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H3a4 4 0 0 0 4 4M17 5h4a4 4 0 0 1-4 4" />
    </svg>
  );
}

export function FlagIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M4 22V4" />
      <path d="M4 4h14l-2 4 2 4H4" />
    </svg>
  );
}

export function FileTextIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}

export function GraduationCapIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}

export function LockIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function TrashIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
    </svg>
  );
}

export function PinIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M12 2a6 6 0 0 0-6 6c0 4.5 6 12 6 12s6-7.5 6-12a6 6 0 0 0-6-6z" />
      <circle cx="12" cy="8" r="2" />
    </svg>
  );
}

export function CameraIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function VideoIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  );
}

export function MusicIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function DownloadIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

export function LogOutIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function UserIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </svg>
  );
}

export function FolderIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}

export function CalendarIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg {...base(size, color)}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
