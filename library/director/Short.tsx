// Director: the composition every short renders through (post chain from the bridge short's look-match pass).
//   InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF from the film's dof table) ->
//   camera motion blur (reprojected from the film's camera dt frames earlier, engine/blur.ts) ->
//   [bloom (emissive only) + NEUTRAL tone mapping + colour grade], MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and 2K / 4K finals match.
// Place changes crossfade by stacking a second canvas for the fade frames (dissolve, ripple = SVG displacement over both
// layers, double = held half-mix: transitions.tsx); speed-line overlay; optional 4-frame white flash; captions last.
// Usage (a video's index.tsx): export const MyShort = makeShort(PRODUCTION, { words, keywords });
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World, Production, poseCam } from "./world";
import { MotionBlurEffect } from "../engine/blur";
import { InkPass, noInkFallback } from "../engine/ink";
import { LensBlur, GrainEffect } from "../engine/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeMix } from "../engine/grade";
import { Captions, Word, CaptionStyle } from "../captions/Captions";
import { RippleWrap, SpeedLines } from "./transitions";
import { propFont } from "../sets/props";

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; blur: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, blur: true, bloom: true, grade: true, grain: false, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** Bloom for emissive sources only (depth.md 6.4). Its MIP chain always starts at 540x960 (half of 1080x1920),
 *  whatever the output size, so the glow keeps the same size relative to the frame (e-fold ~30 px at 1080p,
 *  ~1.5 % of the frame height) at 540, 1080 and 1440 widths. ADD blend: HDR-safe (SCREEN darkens values > 1). */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
const prevCam = new THREE.PerspectiveCamera(), vpCur = new THREE.Matrix4(), vpPrev = new THREE.Matrix4();

const Inner: React.FC<{ id: number; prod: Production }> = ({ id, prod }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(prod), [prod]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    blur: new MotionBlurEffect(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }), // film grain, OFF by default (inputProps post.grain): the reference measures no grain and it quadruples the file size
  }), [camera, scene]);
  // InkPass may not implement dispose(); a crossfade layer unmounting must not crash the render
  useEffect(() => () => (fx.ink as unknown as { dispose?: () => void }).dispose?.(), [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
      {on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : null}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
      {on.blur ? <primitive object={fx.blur} dispose={null} /> : null}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
      {on.grain ? <primitive object={fx.grain} dispose={null} /> : null}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene));
  noInkFallback(world.root);
  // thin-lens focus: distance along the view axis to the shot's focus point (default: the camera's look target)
  const d = prod.film.dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  // motion blur: this frame's view-projection against the film camera `dt` frames earlier (pure function of the frame)
  const sh = prod.film.shutterAt(id, f);
  if (sh) {
    prevCam.aspect = cam.aspect; poseCam(prevCam, sh.prev);
    vpCur.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    vpPrev.multiplyMatrices(prevCam.projectionMatrix, prevCam.matrixWorldInverse);
    fx.blur.set(vpCur, vpPrev);
  } else fx.blur.set(null);
  const lt = prod.film.lightAt(id, f);
  gradeMix(fx.grade, lt.A, lt.B, lt.k);
  fx.grain.seed = f; // deterministic per frame
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** test stills only: inputProps `{ post: { dpr: 0.5 } }` forces the WebGL buffer size (R3F clamps dpr to >= 1 by default) */
const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; prod: Production; alpha: number }> = ({ id, prod, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner id={id} prod={prod} />
    </ThreeCanvas>
  </AbsoluteFill>
);

export type ShortOptions = { words?: Word[]; keywords?: string[]; captionStyle?: CaptionStyle; background?: string };
/** the composition for a production: crossfaded shot layers, the white flash after the hook, captions on top
 *  (inputProps `{ captions: false }` renders without captions, e.g. for a clean master) */
export const makeShort = (prod: Production, o: ShortOptions = {}): React.FC => () => {
  const f = useCurrentFrame();
  // text props paint at build time: mount the shot canvases only once the prop font is loaded, and release the
  // frame after they have mounted (their own delayRender holds it from then on)
  const [handle] = useState(() => delayRender("prop font"));
  const [ready, setReady] = useState(false);
  useEffect(() => { propFont().then(() => setReady(true), () => setReady(true)); }, []);
  useEffect(() => { if (ready) continueRender(handle); }, [ready, handle]);
  const fa = prod.film.flashAt ?? -99;
  const flash = f >= fa && f < fa + 4 ? [1, 0.75, 0.45, 0.2][f - fa] : 0;
  const caps = o.words && (getInputProps() as { captions?: boolean }).captions !== false;
  const tr = prod.film.transAt(f), sp = prod.film.speedAt(f);
  return (
    <AbsoluteFill style={{ background: o.background ?? "#cfe3f2" }}>
      <RippleWrap k={tr && tr.kind === "ripple" ? tr.k : null}>
        {ready && prod.film.layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} prod={prod} alpha={l.alpha} />)}
      </RippleWrap>
      <SpeedLines f={f} k={sp.k} cx={sp.cx} cy={sp.cy} />
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {caps && <Captions words={o.words!} keywords={o.keywords} style={o.captionStyle} />}
    </AbsoluteFill>
  );
};
