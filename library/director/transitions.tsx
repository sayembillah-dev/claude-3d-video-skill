// Screen-space transition and overlay pieces for makeShort (reference study 2026-11-03).
//   Ripple: an SVG displacement filter over both stacked shot layers. The map is concentric rings moving outward,
//           drawn per frame from the progress k only (deterministic), strongest mid-transition, zero at both ends.
//   SpeedLines: anime radial wedges around a centre, re-seeded every 2 frames (animation on twos), white.
// All sizes are in the 1080x1920 composition space, so 1440 / 2160 finals match the stills.
import React from "react";
import { AbsoluteFill } from "remotion";

const W = 1080, H = 1920;
const hash = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

/** displacement map (R = dx, G = dy around .5) for rings at progress k, as a data URL; quarter resolution */
const rippleMap = (k: number) => {
  const w = 270, h = 480, cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d")!, im = g.createImageData(w, h), ph = k * Math.PI * 2 * 2.5, lam = 140 / 4;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - w / 2, dy = y - h * 0.45, r = Math.hypot(dx, dy) || 1;
    const d = Math.sin((r / lam) * Math.PI * 2 - ph) * Math.min(1, r / 40);
    const o = (y * w + x) * 4;
    im.data[o] = 128 + 127 * d * (dx / r); im.data[o + 1] = 128 + 127 * d * (dy / r); im.data[o + 2] = 128; im.data[o + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return cv.toDataURL("image/png");
};

/** wraps the shot layers; k = ripple progress 0..1 (null = no filter) */
export const RippleWrap: React.FC<{ k: number | null; children: React.ReactNode }> = ({ k, children }) => {
  // the same tree every frame (a changing tree would remount the shot canvases and rebuild the world)
  const s = k === null ? 0 : Math.sin(Math.PI * k);
  return (
    <AbsoluteFill style={k === null ? undefined : { filter: "url(#shotRipple)", transform: `scale(${1 + 0.035 * s})` }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        {k === null ? null : (
          <filter id="shotRipple" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x={0} y={0} width={W} height={H} colorInterpolationFilters="sRGB">
            <feImage href={rippleMap(k)} x={0} y={0} width={W} height={H} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={34 * s} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        )}
      </svg>
      {children}
    </AbsoluteFill>
  );
};

/** radial speed lines; k = strength 0..1 (more lines, deeper reach, more opaque) */
export const SpeedLines: React.FC<{ f: number; k: number; cx: number; cy: number; color?: string }> = ({ f, k, cx, cy, color = "#ffffff" }) => {
  if (k <= 0) return null;
  const seed = Math.floor(f / 2), n = Math.round(26 + 22 * k), R = Math.hypot(W, H) * 0.75, x0 = cx * W, y0 = cy * H;
  const polys: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((i + hash(i, seed) * 0.8) / n) * Math.PI * 2;
    const r0 = R * (0.62 - 0.22 * k + 0.22 * hash(i, seed + 7)), w = 6 + 16 * hash(i, seed + 3);
    const c = Math.cos(a), sn = Math.sin(a), px = -sn, py = c;
    const ix = x0 + c * r0, iy = y0 + sn * r0, ox = x0 + c * R, oy = y0 + sn * R;
    polys.push(`${ix.toFixed(1)},${iy.toFixed(1)} ${(ox + px * w).toFixed(1)},${(oy + py * w).toFixed(1)} ${(ox - px * w).toFixed(1)},${(oy - py * w).toFixed(1)}`);
  }
  return (
    <AbsoluteFill>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ opacity: 0.55 + 0.4 * k }}>
        {polys.map((p, i) => <polygon key={i} points={p} fill={color} />)}
      </svg>
    </AbsoluteFill>
  );
};
