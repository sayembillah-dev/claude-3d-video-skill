// Camera motion blur for whips, fly-throughs and fast glides (the reference shorts smear the frame on every fast move).
// Deterministic reprojection: each pixel's world point (from depth) is projected with the camera of `dt` frames
// earlier (the film's camAt, never the previous render), and the colour is gathered along that screen-space path.
// Only the camera's motion blurs, so moving cards that a follow camera tracks would ghost: follow() keys default to
// shutter 0. Taps are jittered per pixel (interleaved gradient noise) so long smears never show stepped copies.
// A dead zone keeps creeping holds sharp: paths shorter than DEAD px (at 1080x1920) give no blur and longer ones
// lose those px. Pixel sizes are specified at 1080x1920 and scale with the output height.
import { Uniform, Matrix4 } from "three";
import { Effect, EffectAttribute, BlendFunction } from "postprocessing";

const frag = /* glsl */ `
uniform mat4 invViewProj;  // current camera: clip -> world
uniform mat4 prevViewProj; // camera dt frames ago: world -> clip
uniform float on;          // 0 = pass through
uniform float dead;        // px at 1080x1920
uniform float maxPx;       // px at 1080x1920
#define TAPS 16

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  if (on < 0.5) { outputColor = inputColor; return; }
  vec4 w = invViewProj * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  w /= w.w;
  vec4 p = prevViewProj * w;
  vec2 puv = p.xy / max(p.w, 1e-4) * 0.5 + 0.5;
  if (p.w <= 0.0) { outputColor = inputColor; return; }
  float s = resolution.y / 1920.0;
  vec2 v = (uv - puv) / texelSize;              // path in output px
  float L = length(v);
  float keep = max(0.0, L - dead * s);
  if (keep < 0.75) { outputColor = inputColor; return; }
  v *= min(keep, maxPx * s) / L;
  vec3 acc = vec3(0.0);
  vec2 px = uv / texelSize;
  float j = fract(52.9829189 * fract(dot(px, vec2(0.06711056, 0.00583715))));
  for (int i = 0; i < TAPS; i++) {
    float t = (float(i) + j) / float(TAPS) - 0.5;
    acc += texture2D(inputBuffer, uv + v * t * texelSize).rgb;
  }
  outputColor = vec4(acc / float(TAPS), inputColor.a);
}`;

export class MotionBlurEffect extends Effect {
  constructor({ dead = 2, maxPx = 90 }: { dead?: number; maxPx?: number } = {}) {
    super("MotionBlurEffect", frag, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.DEPTH | EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ["invViewProj", new Uniform(new Matrix4())], ["prevViewProj", new Uniform(new Matrix4())],
        ["on", new Uniform(0)], ["dead", new Uniform(dead)], ["maxPx", new Uniform(maxPx)],
      ]),
    });
  }
  /** set once per frame: current and previous view-projection matrices, or off */
  set(cur: Matrix4 | null, prev?: Matrix4) {
    this.uniforms.get("on")!.value = cur && prev ? 1 : 0;
    if (cur && prev) { (this.uniforms.get("invViewProj")!.value as Matrix4).copy(cur).invert(); (this.uniforms.get("prevViewProj")!.value as Matrix4).copy(prev); }
  }
}
