// Horror post layer (first made for "sleep-experiment"): an archival-film overlay for makeShort's `overlay` slot, and a
// handheld camera shake for its `shake` slot. Deterministic per frame (pure functions of f).
//   <HorrorFX f vig grain flicker scratches dust tint flashImg flashes />  : vignette, animated grain, exposure flicker
//                                    (+ hard flicker spans), film scratches and dust, a colour wash, subliminal flash frames
//   handheld(f, { amp, hits })      : slow handheld wander + decaying jolts at hit frames
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

const h1 = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
/** smooth 1D value noise in -1..1 */
const vnoise = (t: number, s: number) => {
  const i = Math.floor(t), u = t - i, w = u * u * (3 - 2 * u);
  return (h1(i, s) * (1 - w) + h1(i + 1, s) * w) * 2 - 1;
};

export type Span = [number, number, number?]; // [from, to, strength]
export type HorrorOpts = {
  vig?: number; grain?: number; flicker?: number; scratches?: number; dust?: number; tint?: string;
  /** frames where the bulb dies / stutters: [a, b, depth 0..1] */
  hardFlicker?: Span[];
  /** subliminal flash frames: [frame, count] of the image at flashImg (public/), shown inverted and high-contrast */
  flashImg?: string; flashes?: [number, number][];
  /** fully black frames (cut to black): [a, b] */
  black?: [number, number][];
};
export const HorrorFX: React.FC<{ f: number; o: HorrorOpts }> = ({ f, o }) => {
  const grain = o.grain ?? 0.16, vig = o.vig ?? 0.75;
  let dark = (o.flicker ?? 0.05) * (0.5 + 0.5 * vnoise(f * 0.7, 3)) + (h1(f, 9) < 0.04 ? (o.flicker ?? 0.05) * 1.5 : 0);
  for (const [a, b, k = 0.8] of o.hardFlicker ?? []) if (f >= a && f < b) dark = Math.max(dark, ((f * 7) % 11 < 4 ? k : k * 0.15));
  const isBlack = (o.black ?? []).some(([a, b]) => f >= a && f < b);
  const fl = (o.flashes ?? []).find(([a, n]) => f >= a && f < a + n);
  const scr = o.scratches ?? 0.5, nS = h1(f, 21) < scr ? 1 + Math.floor(h1(f, 22) * 2) : 0;
  const dustN = Math.floor((o.dust ?? 0.5) * 6 * h1(f, 31));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {o.tint && <AbsoluteFill style={{ background: o.tint, mixBlendMode: "multiply" }} />}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 72% 58% at 50% 46%, rgba(0,0,0,0) 35%, rgba(0,0,0,${vig}) 100%)` }} />
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: grain * 2.2 }}>
        <filter id={`g${f % 24}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 97} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter={`url(#g${f % 24})`} />
      </svg>
      {Array.from({ length: nS }, (_, i) => (
        <div key={"s" + i} style={{ position: "absolute", top: 0, bottom: 0, left: `${h1(f, 40 + i) * 100}%`, width: 1 + h1(f, 50 + i) * 2,
          background: h1(f, 60 + i) < 0.5 ? "rgba(255,250,230,.35)" : "rgba(0,0,0,.45)" }} />
      ))}
      {Array.from({ length: dustN }, (_, i) => (
        <div key={"d" + i} style={{ position: "absolute", left: `${h1(f, 70 + i) * 100}%`, top: `${h1(f, 80 + i) * 100}%`, width: 3 + h1(f, 90 + i) * 6,
          height: 2 + h1(f, 95 + i) * 5, borderRadius: "50%", background: "rgba(10,8,8,.7)" }} />
      ))}
      {fl && o.flashImg && <AbsoluteFill style={{ background: "#000" }}><Img src={staticFile(o.flashImg)} style={{ width: "100%", height: "100%", objectFit: "cover",
        filter: `invert(${(f - fl[0]) % 2 ? 0 : 1}) contrast(2.2) grayscale(1)`, transform: `scale(${1.15 + 0.1 * (f - fl[0])})` }} /></AbsoluteFill>}
      <AbsoluteFill style={{ background: "#000", opacity: isBlack ? 1 : Math.min(0.92, dark) }} />
    </AbsoluteFill>
  );
};

/** handheld wander (px at 1080 wide) + decaying jolts at [frame, strength] hits */
export const handheld = (f: number, o: { amp?: number; hits?: [number, number][]; calm?: [number, number][] } = {}) => {
  let amp = o.amp ?? 6;
  for (const [a, b] of o.calm ?? []) if (f >= a && f < b) amp *= 0.35;
  let x = amp * (vnoise(f / 22, 1) + 0.35 * vnoise(f / 7, 2)), y = amp * (vnoise(f / 25, 4) + 0.35 * vnoise(f / 8, 5)), rot = 0.25 * amp / 6 * vnoise(f / 30, 6);
  for (const [hf, k] of o.hits ?? []) {
    const d = f - hf;
    if (d >= 0 && d < 14) { const e = Math.exp(-d / 3.5) * k; x += 28 * e * vnoise(f * 1.7, 11); y += 28 * e * vnoise(f * 1.9, 12); rot += 1.2 * e * vnoise(f * 1.3, 13); }
  }
  return { x, y, rot, s: 1.06 };
};
