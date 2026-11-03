// Thumbnail card for any short: a frame (or any image in public/) full-bleed, a soft vignette, and 1-3 short title
// lines in heavy Montserrat with an outline, accent words in a second colour. Works for vertical (1080x1920 Shorts
// cover) and wide (1280x720 YouTube custom thumbnail): the text sits at the top on vertical, the left on wide.
// Render with: npx remotion still src/index.ts <ThumbComp> out/<name>/thumb.png
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile, useVideoConfig } from "remotion";

export type ThumbProps = { image: string; lines: string[]; accent?: string[]; accentColor?: string; color?: string };
const FONT = "ThumbSans";
let fontP: Promise<void> | null = null;
const loadFont = () => (fontP ??= new FontFace(FONT, `url(${staticFile("fonts/Montserrat-Variable.ttf")}) format("truetype")`, { weight: "100 900" })
  .load().then((ff) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff); }));

export const Thumbnail: React.FC<ThumbProps> = ({ image, lines, accent = [], accentColor = "#FFD84A", color = "#FFFFFF" }) => {
  const { width, height } = useVideoConfig();
  const [h] = useState(() => delayRender("thumb font"));
  useEffect(() => { loadFont().then(() => continueRender(h)); }, [h]);
  const wide = width > height, fs = wide ? 0.105 * height : 0.118 * width, acc = new Set(accent.map((a) => a.toUpperCase()));
  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <AbsoluteFill style={{ background: wide
        ? "linear-gradient(90deg, rgba(12,8,20,.78) 0%, rgba(12,8,20,.35) 48%, rgba(12,8,20,0) 70%)"
        : "linear-gradient(180deg, rgba(12,8,20,.72) 0%, rgba(12,8,20,.2) 34%, rgba(12,8,20,0) 50%)" }} />
      <div style={{
        position: "absolute", left: wide ? 0.05 * width : 0.06 * width, right: wide ? 0.42 * width : 0.06 * width,
        top: wide ? "50%" : 0.07 * height, transform: wide ? "translateY(-50%) rotate(-2deg)" : "rotate(-2deg)",
        fontFamily: `${FONT}, sans-serif`, fontWeight: 900, lineHeight: 1.0, textAlign: wide ? "left" : "center",
      }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontSize: fs * (i === lines.length - 1 ? 1.12 : 1), marginBottom: 0.08 * fs }}>
            {l.split(" ").map((w, k) => (
              <span key={k} style={{ color: acc.has(w.replace(/[^A-Z0-9]/gi, "").toUpperCase()) ? accentColor : color,
                WebkitTextStroke: `${0.14 * fs}px #120c1c`, paintOrder: "stroke fill", textShadow: `0 ${0.08 * fs}px 0 rgba(0,0,0,.5)` }}>
                {w}{k < l.split(" ").length - 1 ? " " : ""}
              </span>
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
