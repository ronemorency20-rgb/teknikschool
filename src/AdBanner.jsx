import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

// ---- Configure your real AdSense IDs here once your account is approved ----
const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || ""; // e.g. "ca-pub-1234567890123456"
const ADSENSE_SLOT_ID = import.meta.env.VITE_ADSENSE_SLOT_ID || "";     // e.g. "1234567890"

// NOTE: AdMob (native Android ads) is intentionally disconnected for now —
// re-add the @capacitor-community/admob package and its logic here once
// ready to wire up real mobile ads. Keeping it out for now avoids Android
// build issues on machines where the Kotlin compiler struggles with it.

let adsenseScriptLoaded = false;

function loadAdsenseScript(clientId) {
  if (adsenseScriptLoaded || document.getElementById("adsbygoogle-script")) return;
  const script = document.createElement("script");
  script.id = "adsbygoogle-script";
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
  adsenseScriptLoaded = true;
}

// Renders a real ad on web (AdSense) once configured. Renders nothing on
// native mobile for now, and renders nothing anywhere until real AdSense
// IDs are set — never shows a broken/empty ad box.
export default function AdBanner({ style = {} }) {
  const insRef = useRef(null);
  const [isNative] = useState(() => Capacitor.isNativePlatform());

  useEffect(() => {
    if (isNative || !ADSENSE_CLIENT_ID || !ADSENSE_SLOT_ID) return;
    loadAdsenseScript(ADSENSE_CLIENT_ID);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) { /* script may not have loaded yet on first render — harmless */ }
  }, [isNative]);

  if (isNative) return null; // AdMob not wired up yet — nothing shown on the mobile app for now

  if (!ADSENSE_CLIENT_ID || !ADSENSE_SLOT_ID) return null; // no ad shown until real IDs are configured

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: "block", ...style }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={ADSENSE_SLOT_ID}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
