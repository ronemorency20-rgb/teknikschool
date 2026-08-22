import { useEffect, useState } from "react";
import { fetchDiaporamaSlides } from "./coursesApi";

const FALLBACK_SLIDES = [
  { title: "Bienvenue à TeknikSchool", link_url: null, image_url: null, color: "#7C6FFF" },
  { title: "Apprenez à votre rythme", link_url: null, image_url: null, color: "#00D4AA" },
  { title: "Obtenez votre certificat", link_url: null, image_url: null, color: "#FFB347" },
];

export default function Diaporama() {
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDiaporamaSlides();
        if (data.length > 0) setSlides(data);
      } catch { /* fall back to default slides */ }
    })();
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(iv);
  }, [slides.length]);

  const slide = slides[index];
  const hasImage = !!slide.image_url;

  const Inner = () => (
    <div style={{
      position: "absolute", inset: 0,
      background: hasImage ? "#FFFFFF" : `linear-gradient(135deg, ${slide.color || "#7C6FFF"}33, #F7F8FA 85%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      transition: "background 0.6s ease",
    }}>
      {hasImage ? (
        <img src={slide.image_url} alt={slide.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <>
          <h2 style={{ margin: "0 0 6px", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#12141C", textAlign: "center" }}>{slide.title}</h2>
        </>
      )}
      {hasImage && slide.title && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 20px 16px", background: "linear-gradient(0deg, rgba(0,0,0,.75), transparent)" }}>
          <h3 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>{slide.title}</h3>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: "relative", width: "100%", height: 220, overflow: "hidden" }}>
      {slide.link_url ? (
        <a href={slide.link_url} target="_blank" rel="noopener noreferrer" style={{ display: "block", position: "absolute", inset: 0, cursor: "pointer" }}>
          <Inner />
        </a>
      ) : (
        <Inner />
      )}
      <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2 }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} style={{
            width: i === index ? 20 : 6, height: 6, borderRadius: 3, border: "none", cursor: "pointer",
            background: i === index ? (slide.color || "#7C6FFF") : "#6B7280", transition: "all 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}
