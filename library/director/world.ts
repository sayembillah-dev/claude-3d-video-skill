// Director: the world runtime shared by every short. One three.js scene holds every place of the film side by side
// (each built once by a library set builder, shown only during its own shots), the sky shader, fog = horizon colour,
// a camera-relative sun frozen per shot, the two-tone light uniforms, clouds and the character/fx card pool.
// update(id, f, camera) poses everything for shot `id` at frame f (a pure function of id + f).
// The video supplies a Production: its Film (story.ts), its places (which sets, where), its stage() (cast.ts) and an
// optional pose() hook for per-shot toggles (e.g. hide tables in one shot, wave a flag).
import * as THREE from "three";
import { V } from "../engine/build";
import { ctex, cloudHD } from "../engine/paint";
import { LIGHTS, LOOK, LightPreset, LightName, LIGHT_NAMES, LOW_SUN, mixLight, mixLook } from "../engine/lights";
import { TONE, CHAR, untone } from "../engine/shade";
import { NOINK } from "../engine/ink";
import { Pool, Actor, Fx, Stage, CamInfo, beginStage } from "./stage";
import { FPS, Film, ShotDef, Cam } from "./camera";

/** put a three.js camera at a film framing (also used for the motion blur's earlier camera) */
export const poseCam = (cam: THREE.PerspectiveCamera, c: Cam) => {
  cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
  cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
};
export type Place = { build: (G: THREE.Group) => any; x?: number; z?: number };
export type Production = {
  film: Film;
  places: Record<string, Place>;
  stage: (id: number, t: number, cam: CamInfo) => Stage;
  pose?: (id: number, f: number, t: number, handles: Record<string, any>) => void;
};

/** sun disc (solid, soft rim) and the flat golden halo (lighting.md 6 / depth.md 6.4: r50 13-26 % of the frame width) */
const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
/** a god-ray shaft: soft across, quick fade-in at the top (y = 1), long fade toward the ground (y = 0) */
const shaftTex = () => ctex("godShaft", 64, 256, (g) => {
  const im = g.createImageData(64, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 64; x++) {
    const u = (x - 31.5) / 32, v = 1 - y / 255; // v = 1 at the top of the canvas
    const across = Math.exp(-((u / 0.45) ** 2)), along = Math.min(1, (1 - v) / 0.12) * Math.pow(v, 0.7);
    const i = (y * 64 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * across * along);
  }
  g.putImageData(im, 0, 0);
});
const RAYS_MAX = 8;
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cA = new THREE.Color(); private cB = new THREE.Color();
  private rays: THREE.Mesh[] = [];
  private rayAt = new Map<number, THREE.Vector3>();
  private cloudMaps = {} as Record<LightName, THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private sets: Record<string, THREE.Group> = {};
  /** whatever each place builder returned (groups / meshes the video's pose() toggles or animates) */
  handles: Record<string, any> = {};
  private film: Film;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(private prod: Production) {
    const R = this.root;
    this.film = prod.film;
    // ---- sky + light (bridge rig) ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    for (const n of LIGHT_NAMES) this.cloudMaps[n] = [0, 1, 2, 3].map((k) => cloudHD(k, LOOK[n].cloud));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }
    // god rays (ShotDef.rays): additive soft shafts, no ink, no fog, never brighter than the bloom threshold
    const rayMap = shaftTex();
    for (let i = 0; i < RAYS_MAX; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: rayMap, transparent: true, depthWrite: false,
        fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: true }));
      m.visible = false; m.frustumCulled = false; m.renderOrder = 4; m.layers.set(NOINK);
      this.rays.push(m); R.add(m);
    }
    for (const [name, p] of Object.entries(prod.places)) {
      const G = new THREE.Group();
      G.position.set(p.x ?? 0, 0, p.z ?? 0);
      this.handles[name] = p.build(G);
      this.sets[name] = G; R.add(G);
    }
  }





  /** camera-relative sun, frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    const camAt = this.film.camAt;
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  /** shafts lie along the sun direction, spread across it, each turned about its own axis to face the lens */
  private poseRays(id: number, s: ShotDef, sunDir: THREE.Vector3, col: string, cam: THREE.PerspectiveCamera) {
    const o = s.rays, n = o ? Math.min(RAYS_MAX, o.n ?? 5) : 0;
    for (let i = n; i < RAYS_MAX; i++) this.rays[i].visible = false;
    if (!o) return;
    let at = this.rayAt.get(id);
    if (!at) {
      // default: on the ground halfway from the shot's first camera to its look point, so shafts cross the open space
      const c0 = this.film.camAt(id, s.a);
      at = o.at ? V(...o.at) : V((c0.pos[0] + c0.look[0]) / 2, 1, (c0.pos[2] + c0.look[2]) / 2);
      this.rayAt.set(id, at);
    }
    const len = o.len ?? 40, spread = o.spread ?? 10, k = o.k ?? 0.6;
    const side = V(0, 1, 0).cross(sunDir).normalize(), fwd = new THREE.Vector3().crossVectors(sunDir, side).normalize();
    for (let i = 0; i < n; i++) {
      const m = this.rays[i], h1 = ((i * 0.618034) % 1), h2 = ((i * 0.414214 + 0.3) % 1);
      const lat = (n > 1 ? i / (n - 1) - 0.5 : 0) * spread + (h1 - 0.5) * spread * 0.25, dep = (h2 - 0.5) * spread * 0.5;
      // the shaft's lower end sits on the ground near `at`; it rises toward the sun
      const foot = at.clone().addScaledVector(side, lat).addScaledVector(fwd, dep); foot.y = at.y - 1;
      const mid = foot.clone().addScaledVector(sunDir, len / 2);
      m.position.copy(mid);
      const toCam = cam.position.clone().sub(mid), nrm = toCam.addScaledVector(sunDir, -toCam.dot(sunDir)).normalize();
      const xAx = new THREE.Vector3().crossVectors(sunDir, nrm).normalize();
      m.matrixAutoUpdate = true;
      m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAx, sunDir, nrm));
      m.scale.set(2.4 + 3.6 * h2, len, 1);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.color.set(col).multiplyScalar(k * (0.35 + 0.25 * h1));
      m.visible = true;
    }
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = this.film.shots[id - 1], lt = this.film.lightAt(id, f), L = mixLight(lt.A, lt.B, lt.k);
    const c = this.film.camAt(id, f);
    poseCam(cam, c);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = mixLook(lt.A, lt.B, lt.k), sunDir = this.shotSun(id, s, LIGHTS[s.light]);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (LOW_SUN[s.light]) Rr = Math.max(Rr, 24);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    // sun disc + halo fade across an in-shot light change (low-sun lights show them)
    const sunA = (LOW_SUN[lt.A] ? 1 : 0) + ((LOW_SUN[lt.B] ? 1 : 0) - (LOW_SUN[lt.A] ? 1 : 0)) * lt.k, showSun = sunA > 0;
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    const discMat = this.sunDisc.material as THREE.SpriteMaterial;
    discMat.transparent = sunA < 1; discMat.opacity = sunA;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3 * sunA);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.position.x = (this.prod.places[s.set]?.x ?? 0) + Math.cos((i / 9) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
      // clouds keep the start light's painting; an in-shot change tints them toward the new light's lit colour
      if (lt.k > 0) { this.cA.set(LOOK[lt.A].cloud.lit); this.cB.set(LOOK[lt.B].cloud.lit); mat.color.setRGB(1.1 * (1 + (this.cB.r / this.cA.r - 1) * lt.k), 1.1 * (1 + (this.cB.g / this.cA.g - 1) * lt.k), 1.1 * (1 + (this.cB.b / this.cA.b - 1) * lt.k)); }
      else mat.color.setRGB(1.1, 1.1, 1.1);
    }
    this.poseRays(id, s, sunDir, L.sunCol, cam);
    // ---- which place, which furniture ----
    for (const [k, g] of Object.entries(this.sets)) g.visible = k === s.set;
    this.prod.pose?.(id, f, t, this.handles);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0), up = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 1);
    const fwd = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 2).negate();
    beginStage(lt.k < 0.5 ? lt.A : lt.B, { pos: cam.position, right });
    const st = this.prod.stage(id, t, { pos: cam.position, right, up, fwd, fov: cam.fov, aspect: cam.aspect });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 2.4 * sc2 + 0.3))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}
