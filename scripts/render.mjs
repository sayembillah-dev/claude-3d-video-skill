// Final render with live progress + ETA, chosen resolution and optional audio mux.
// usage: node scripts/render.mjs <CompositionId> <out.mp4> [--res 1080|1440|2160] [--audio mix.wav] [--crf 16]
//                                [--props '{"captions":false}'] [--frames 0-299]
//   --res     output WIDTH of the 9:16 frame: 1080 (1080x1920), 1440 (1440x2560, default), 2160 (2160x3840 4K)
//   progress  written every 2 s to <outdir>/render_progress.json (+ one log line per 5 %): rendered / encoded frames,
//             fps, elapsed, ETA. Read that file to answer "how long?" instead of polling the process.
// BRIDGE_ENTRY=src/sandboxes/<name>/index.tsx renders a sandbox instead of the main entry. Run `source env.sh` first (keeps the ~1.3 GB bundles on this drive). Compositions are designed at 1080 wide, so
// the scale is exact (1, 4/3, 2) and every pixel parameter scales with it.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
const { bundle } = await import("@remotion/bundler");
const { renderMedia, selectComposition } = await import("@remotion/renderer");

const args = process.argv.slice(2);
const [comp, outArg] = args;
if (!comp || !outArg) { console.error("usage: node scripts/render.mjs <Comp> <out.mp4> [--res 1440] [--audio mix.wav]"); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const res = Number(opt("res", "1440")), crf = Number(opt("crf", "16")), audio = opt("audio"), frames = opt("frames");
const inputProps = JSON.parse(opt("props", "{}"));
const out = path.resolve(outArg), dir = path.dirname(out);
fs.mkdirSync(dir, { recursive: true });
const progFile = path.join(dir, "render_progress.json");
const silent = audio ? out.replace(/\.mp4$/, "_silent.mp4") : out;

const browserExecutable = process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : null;
const chromiumOptions = { gl: "angle" };
const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.BRIDGE_ENTRY || "src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: comp, inputProps, browserExecutable, chromiumOptions });
const scale = res / composition.width; // 1080-wide designs: 1, 4/3, 2 (exact in float for these widths)
const total = frames ? Number(frames.split("-")[1]) - Number(frames.split("-")[0]) + 1 : composition.durationInFrames;
const W = Math.round(composition.width * scale), H = Math.round(composition.height * scale);
console.log(`render ${comp}: ${total} frames at ${W}x${H} (scale ${scale.toFixed(4)}), crf ${crf} -> ${out}`);
const t1 = Date.now();
let lastWrite = 0, lastPct = -5;
const write = (p, done = false) => {
  const el = (Date.now() - t1) / 1000, fps = p.renderedFrames / Math.max(el, 1e-3);
  const eta = fps > 0 ? (total - p.renderedFrames) / fps : null;
  const o = { comp, out, width: W, height: H, total, rendered: p.renderedFrames, encoded: p.encodedFrames, pct: Math.round(100 * p.progress),
    fps: +fps.toFixed(2), elapsed_s: Math.round(el), eta_s: eta === null ? null : Math.round(eta),
    eta_clock: eta === null ? null : new Date(Date.now() + eta * 1000).toLocaleTimeString(), done, updated: new Date().toISOString() };
  fs.writeFileSync(progFile, JSON.stringify(o, null, 1));
  return o;
};
await renderMedia({
  composition, serveUrl, codec: "h264", crf, scale, outputLocation: silent, inputProps, browserExecutable, chromiumOptions,
  frameRange: frames ? frames.split("-").map(Number) : null, timeoutInMilliseconds: 180000,
  onProgress: (p) => {
    const now = Date.now();
    if (now - lastWrite > 2000) { lastWrite = now; write(p); }
    const pct = Math.floor(p.progress * 100);
    if (pct >= lastPct + 5) { lastPct = pct - (pct % 5); const o = write(p); console.log(`${o.pct}%  ${o.rendered}/${total} frames  ${o.fps} fps  ETA ${o.eta_s ?? "?"} s (${o.eta_clock ?? "?"})`); }
  },
});
if (audio) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", silent, "-i", path.resolve(audio), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
    "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest", "-movflags", "+faststart", out]);
  fs.unlinkSync(silent);
}
const mins = ((Date.now() - t0) / 60000).toFixed(1);
write({ renderedFrames: total, encodedFrames: total, progress: 1 }, true);
console.log(`done in ${mins} min (bundle ${((t1 - t0) / 1000).toFixed(0)} s): ${out}`);
fs.appendFileSync(path.join(dir, "render_log.txt"), `${new Date().toISOString()} ${comp} ${W}x${H} ${total}f ${mins} min -> ${path.basename(out)}\n`);
