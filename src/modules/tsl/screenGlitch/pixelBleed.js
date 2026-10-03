/* eslint-disable no-underscore-dangle, no-param-reassign */
// Pixel bleed, split out of DatamoshNode and rebuilt as a spatial filter.
//
// The original version got its look from feedback: each frame mixed in the
// PREVIOUS frame's own output, offset per channel, so the image converged over
// ~40 frames onto a rich per-channel smear. Per channel that recursion is
//
//   out = (1 - s) * fresh + s * out(uv - step)
//
// whose fixed point, for a still camera, is
//
//   out = (1 - s) * SUM over k of s^k * fresh(uv - k * step)
//
// — a geometric-weighted directional blur. The photograph look lives entirely
// in that sum, and the sum needs no history, so computing it directly in one
// pass from the current frame gives the identical converged image with no
// temporal component at all, and therefore nothing to smear when the camera
// moves. Motion Smear is now a separate, deliberate temporal persistence on
// top (see PixelBleedNode) rather than the thing generating the colour.
import {
  Fn,
  cos,
  float,
  luminance,
  mix,
  passTexture,
  radians,
  screenSize,
  screenUV,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import {
  NodeMaterial,
  NodeUpdateType,
  QuadMesh,
  RenderTarget,
  RendererUtils,
  TempNode,
  Vector2,
} from 'three/webgpu';
import * as THREE from 'three/webgpu';

// 'fast' walks taps at (2^k - 1) steps, which lands a handful of samples along
// the same decaying curve the linear walk traces one step at a time — for a
// smooth monotonic falloff the two are hard to tell apart, at a fifth of the
// texture reads.
export const BLEED_QUALITY = {
  fast: { taps: 8, exponential: true },
  full: { taps: 32, exponential: false },
};

export function createPixelBleedUniforms() {
  return {
    reach: uniform(0.9),
    strength: uniform(0.89),
    angle: uniform(90),
    offsetR: uniform(6),
    offsetG: uniform(1),
    offsetB: uniform(0.17),
    highlights: uniform(0),
    tintColor: uniform(new THREE.Color('#ffffff')),
    tintAmount: uniform(0),
    smear: uniform(0),
  };
}

function tapDistance(index, exponential) {
  return exponential ? 2 ** index - 1 : index;
}

// The k = 0 tap is the untouched pixel and carries weight 1, so the normalized
// sum already contains the original image at the same proportion the feedback
// version converged to — there's no separate wet/dry mix to also get right.
export function buildPixelBleedNode(sceneColor, u, { taps, exponential }) {
  return Fn(() => {
    const theta = radians(u.angle);
    const step = vec2(cos(theta), sin(theta)).mul(u.reach).div(screenSize);
    const channelSteps = [
      step.mul(u.offsetR),
      step.mul(u.offsetG),
      step.mul(u.offsetB),
    ];

    const base = sceneColor.sample(screenUV).toVar('bleedBase');
    const accumulated = vec3(0).toVar('bleedAcc');
    const weightSum = float(0).toVar('bleedWeight');

    // Unrolled in JS rather than Loop(): the tap count is a build-time
    // constant, and a constant offset per tap keeps every sample coordinate
    // uniform instead of loop-dependent.
    for (let k = 0; k < taps; k += 1) {
      const distance = tapDistance(k, exponential);
      const weight = u.strength.pow(distance);

      accumulated.addAssign(
        vec3(
          sceneColor.sample(screenUV.sub(channelSteps[0].mul(distance))).r,
          sceneColor.sample(screenUV.sub(channelSteps[1].mul(distance))).g,
          sceneColor.sample(screenUV.sub(channelSteps[2].mul(distance))).b
        ).mul(weight)
      );
      weightSum.addAssign(weight);
    }

    const bled = accumulated.div(weightSum.max(0.00001));

    // Aged emulsion runs in the highlights and stays tight in the shadows, so
    // the gate pulls dark areas back toward the untouched pixel. At 0 it is a
    // constant 1 and the result matches the ungated sum exactly.
    const gate = mix(
      float(1),
      smoothstep(0.2, 0.9, luminance(base.rgb)),
      u.highlights
    );
    const gated = mix(base.rgb, bled, gate);
    const tinted = mix(gated, luminance(gated).mul(u.tintColor), u.tintAmount);

    return vec4(tinted, base.a);
  })();
}

const _size = new Vector2();
const _quadMesh = new QuadMesh();

let _rendererState;

// Motion Smear. The spatial bleed above is what makes the photograph; this is
// plain temporal persistence layered on it — the previous output held at the
// same screen position, so a still camera converges to exactly the spatial
// result and changes nothing, while a moving one leaves trails.
class PixelBleedNode extends TempNode {
  static get type() {
    return 'PixelBleedNode';
  }

  constructor(textureNode, uniforms, quality) {
    super('vec4');

    this.textureNode = textureNode;
    this.uniforms = uniforms;
    this.quality = quality;

    this._compRT = new RenderTarget(1, 1, { depthBuffer: false });
    this._compRT.texture.name = 'PixelBleedNode.comp';
    this._oldRT = new RenderTarget(1, 1, { depthBuffer: false });
    this._oldRT.texture.name = 'PixelBleedNode.old';

    this._textureNode = passTexture(this, this._compRT.texture);
    this._textureNodeOld = texture(this._oldRT.texture);
    this._materialComposed = null;

    this.updateBeforeType = NodeUpdateType.FRAME;
  }

  getTextureNode() {
    return this._textureNode;
  }

  setSize(width, height) {
    this._compRT.setSize(width, height);
    this._oldRT.setSize(width, height);
  }

  updateBefore(frame) {
    const { renderer } = frame;

    _rendererState = RendererUtils.resetRendererState(renderer, _rendererState);

    const { type } = this.textureNode.value;
    this._compRT.texture.type = type;
    this._oldRT.texture.type = type;

    renderer.getDrawingBufferSize(_size);
    this.setSize(_size.x, _size.y);

    this._textureNode.value = this._compRT.texture;
    this._textureNodeOld.value = this._oldRT.texture;

    _quadMesh.material = this._materialComposed;
    _quadMesh.name = 'PixelBleed';

    renderer.setRenderTarget(this._compRT);
    _quadMesh.render(renderer);

    const temp = this._oldRT;
    this._oldRT = this._compRT;
    this._compRT = temp;

    RendererUtils.restoreRendererState(renderer, _rendererState);
  }

  setup(builder) {
    const composed = Fn(() => {
      const bled = buildPixelBleedNode(
        this.textureNode,
        this.uniforms,
        this.quality
      );
      const previous = this._textureNodeOld.sample(uv());
      return mix(bled, previous, this.uniforms.smear.min(0.99));
    });

    const material =
      this._materialComposed || (this._materialComposed = new NodeMaterial());
    material.name = 'PixelBleed';
    material.fragmentNode = composed();

    builder.getNodeProperties(this).textureNode = this.textureNode;

    return this._textureNode;
  }

  dispose() {
    this._compRT.dispose();
    this._oldRT.dispose();
    if (this._materialComposed !== null) this._materialComposed.dispose();
  }
}

export default PixelBleedNode;
