// Production captions for vertical shorts, driven by the voice's word timings (words.json from align_words.py).
// Style: Montserrat ExtraBold, upper case, 1-3 words per line group, a dark rounded outline + soft drop shadow, the word
// being spoken pops (scale + accent colour), chosen KEYWORDS are drawn bigger in the accent colour so the key facts land.
// Placed in the YouTube Shorts safe zone (since 2026-11-03: block centre at 70 % of the height, about 530 px above the
// bottom of a 1920 frame, clear of the title / channel / description overlay that covers the bottom ~300-450 px, and
// 16 % in from the right edge, clear of the like / comment / share buttons) and kept small (6.2 % of the width; keywords 1.4x) so the picture stays the star.
// Every size is a fraction of the frame width, so 1080, 1440 and 2160 wide renders look identical.
// The font ships in public/fonts (OFL), so captions render the same on any machine without system fonts.
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

export type Word = { word: string; start: number; end: number };
export type CaptionStyle = {
  /** accent colour for the active word and keywords */ accent?: string;
  /** base text colour */ color?: string;
  /** outline colour */ outline?: string;
  /** font size as a fraction of the frame width */ size?: number;
  /** keyword size multiplier */ keyScale?: number;
  /** vertical centre of the caption block as a fraction of the frame height */ y?: number;
  /** most words per group */ maxWords?: number;
  /** most characters per group */ maxChars?: number;
  upper?: boolean;
  /** plain "speed" captions: no per-word highlight or pop, every word shown whole; only keywords get a colour */ plain?: boolean;
  /** colour per keyword phrase (same text as in keywords, any case); unlisted keywords use `accent` */ keyColors?: Record<string, string>;
};
const DEF: Required<CaptionStyle> = { accent: "#FFD84A", color: "#FFFFFF", outline: "#14101c", size: 0.062, keyScale: 1.4, y: 0.70, maxWords: 3, maxChars: 16, upper: true, plain: false, keyColors: {} };
const FONT = "CaptionSans";

let fontP: Promise<void> | null = null;
const loadFont = () => {
  if (!fontP) {
    const f = new FontFace(FONT, `url(${staticFile("fonts/Montserrat-Variable.ttf")}) format("truetype")`, { weight: "100 900" });
    fontP = f.load().then((ff) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff); });
  }
  return fontP;
};

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
/** display form: drop trailing commas / full stops / colons, keep ? and ! */
const show = (w: string) => w.replace(/[,.;:]+$/g, "").replace(/^["']|["']$/g, "");

type Group = { words: (Word & { key: boolean; col?: string })[]; a: number; b: number };
/** split the word list into short caption groups: break on punctuation (incl. commas), pauses > 0.35 s, size limits;
 *  a keyword phrase is never split across two groups */
export const groupWords = (words: Word[], keywords: string[], s: Required<CaptionStyle>): Group[] => {
  const phrases = keywords.map((k) => k.split(/\s+/).map(norm).filter(Boolean)).filter((p) => p.length);
  const isKey = words.map(() => false), phraseEnd = words.map(() => -1), keyCol: (string | undefined)[] = words.map(() => undefined);
  const colOf = new Map(Object.entries(s.keyColors).map(([k, v]) => [k.split(/\s+/).map(norm).filter(Boolean).join(" "), v]));
  for (let i = 0; i < words.length; i++) for (const p of phrases) {
    if (p.every((w, k) => i + k < words.length && norm(words[i + k].word) === w)) {
      for (let k = 0; k < p.length; k++) { isKey[i + k] = true; phraseEnd[i + k] = i + p.length - 1; keyCol[i + k] = colOf.get(p.join(" ")); }
    }
  }
  const out: Group[] = [];
  let cur: Group | null = null;
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const gap = prev ? w.start - prev.end : 0;
    const chars = cur ? cur.words.reduce((a, x) => a + show(x.word).length + 1, 0) + show(w.word).length : 0;
    const inPhrase = prev && phraseEnd[i - 1] >= i;
    const brk = !cur || (!inPhrase && (/[.?!:,;]$/.test(prev.word) || gap > 0.35 || cur.words.length >= s.maxWords || chars > s.maxChars
      || (isKey[i] && phraseEnd[i] - i + 1 + cur.words.length > s.maxWords)));
    if (brk) { cur = { words: [], a: w.start, b: w.end }; out.push(cur); }
    cur!.words.push({ ...w, key: isKey[i], col: keyCol[i] });
    cur!.b = w.end;
  });
  // each group stays up until the next starts (max 0.6 s after its last word)
  out.forEach((g, i) => { const nx = out[i + 1]; g.b = nx ? Math.min(nx.a, g.b + 0.6) : g.b + 0.6; g.a = Math.max(0, g.a - 0.04); });
  return out;
};

export const Captions: React.FC<{ words: Word[]; keywords?: string[]; style?: CaptionStyle; offset?: number }> = ({ words, keywords = [], style = {}, offset = 0 }) => {
  const s = { ...DEF, ...style };
  const f = useCurrentFrame(), { fps, width, height } = useVideoConfig();
  const [handle] = useState(() => delayRender("caption font"));
  useEffect(() => { loadFont().then(() => continueRender(handle)); }, [handle]);
  const groups = useMemo(() => groupWords(words, keywords, s), [words, keywords, s.maxWords, s.maxChars, s.keyColors]);
  const t = f / fps - offset;
  const g = groups.find((x) => t >= x.a && t < x.b);
  if (!g) return null;
  const fs = s.size * width, age = (t - g.a) * fps;
  const enter = s.plain ? 1 : interpolate(age, [0, 5], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
  const fade = interpolate(age, [0, 2], [0, 1], { extrapolateRight: "clamp" });
  const ol = (s.plain ? 0.2 : 0.13) * fs;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: 0.08 * width, right: 0.16 * width, top: s.y * height, transform: `translate(0, -50%) scale(${0.86 + 0.14 * enter})`,
        transformOrigin: "50% 50%", opacity: fade, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline",
        columnGap: 0.44 * fs, rowGap: 0.02 * fs, fontFamily: `${FONT}, sans-serif`, fontWeight: 800, lineHeight: 1.08, textAlign: "center",
      }}>
        {g.words.map((w, i) => {
          const active = !s.plain && t >= w.start - 0.03 && (t < w.end + 0.05 || i === g.words.length - 1);
          const pop = active ? interpolate((t - w.start) * fps, [0, 3, 7], [1.0, 1.12, 1.06], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
          const size = fs * (w.key ? s.keyScale : 1);
          const col = s.plain ? (w.key ? w.col ?? s.accent : s.color) : active || w.key ? s.accent : s.color;
          const txt = s.upper ? show(w.word).toUpperCase() : show(w.word);
          return (
            <span key={i} style={{
              fontSize: size, color: col, display: "inline-block", transform: `scale(${pop})`, letterSpacing: "0.01em",
              WebkitTextStroke: `${ol}px ${s.outline}`, paintOrder: "stroke fill",
              textShadow: `0 ${0.07 * fs}px 0 rgba(10,8,16,.55), 0 0 ${0.35 * fs}px rgba(0,0,0,.35)`,
            }}>{txt}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
