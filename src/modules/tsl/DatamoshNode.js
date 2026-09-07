/* eslint-disable no-underscore-dangle, no-param-reassign */
import {
  Fn,
  abs,
  convertToTexture,
  dot,
  float,
  floor,
  fract,
  length,
  luminance,
  max,
  min,
  mix,
  passTexture,
  round,
  screenSize,
  sign,
  smoothstep,
  step,
  texture,
  time,
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

const _size = new Vector2();
const _quadMesh = new QuadMesh();

let _rendererState;

// Dave Hoskins, "Hash without Sine".
const hash21 = /* @__PURE__ */ Fn(([p]) => {
  const p3 = fract(vec3(p.x, p.y, p.x).mul(0.1031)).toVar();
  p3.addAssign(dot(p3, p3.yzx.add(33.33)));
  return fract(p3.x.add(p3.y).mul(p3.z));
});

// Bilinear resampling inside a feedback loop is a low-pass filter applied once
// per frame, so a long smear dissolves into mush in about twenty frames.
// Catmull-Rom reconstructs a sharper value from the surrounding texels and the
// edges survive; the result is clamped to the four nearest texels because the
// filter's negative lobes overshoot, and the loop would amplify the overshoot
// into blown-out fringes.
function sampleHistory(tex, coord, texSize) {
  const samplePos = coord.mul(texSize);
  const texPos1 = samplePos.sub(0.5).floor().add(0.5);
  const f = samplePos.sub(texPos1);

  const w0 = f.mul(float(-0.5).add(f.mul(float(1).sub(f.mul(0.5)))));
  const w1 = float(1).add(f.mul(f).mul(float(-2.5).add(f.mul(1.5))));
  const w2 = f.mul(float(0.5).add(f.mul(float(2).sub(f.mul(1.5)))));
  const w3 = f.mul(f).mul(float(-0.5).add(f.mul(0.5)));

  const w12 = w1.add(w2);
  const offset12 = w2.div(w12);

  const pos0 = texPos1.sub(1).div(texSize);
  const pos3 = texPos1.add(2).div(texSize);
  const pos12 = texPos1.add(offset12).div(texSize);

  const at = (x, y) => tex.sample(vec2(x, y));

  const filtered = at(pos0.x, pos0.y)
    .mul(w0.x.mul(w0.y))
    .add(at(pos12.x, pos0.y).mul(w12.x.mul(w0.y)))
    .add(at(pos3.x, pos0.y).mul(w3.x.mul(w0.y)))
    .add(at(pos0.x, pos12.y).mul(w0.x.mul(w12.y)))
    .add(at(pos12.x, pos12.y).mul(w12.x.mul(w12.y)))
    .add(at(pos3.x, pos12.y).mul(w3.x.mul(w12.y)))
    .add(at(pos0.x, pos3.y).mul(w0.x.mul(w3.y)))
    .add(at(pos12.x, pos3.y).mul(w12.x.mul(w3.y)))
    .add(at(pos3.x, pos3.y).mul(w3.x.mul(w3.y)));

  const n0 = texPos1.div(texSize);
  const n1 = texPos1.add(1).div(texSize);

  const a = at(n0.x, n0.y);
  const b = at(n1.x, n0.y);
  const c = at(n0.x, n1.y);
  const d = at(n1.x, n1.y);

  const lo = min(min(a, b), min(c, d));
  const hi = max(max(a, b), max(c, d));

  return filtered.clamp(lo, hi);
}

// Luminance high-pass: what a codec would have to spend bits on.
function highFrequency(tex, coord, texel) {
  const centre = luminance(tex.sample(coord).rgb);
  const around = luminance(tex.sample(coord.add(vec2(texel.x, 0))).rgb)
    .add(luminance(tex.sample(coord.sub(vec2(texel.x, 0))).rgb))
    .add(luminance(tex.sample(coord.add(vec2(0, texel.y))).rgb))
    .add(luminance(tex.sample(coord.sub(vec2(0, texel.y))).rgb))
    .mul(0.25);

  return centre.sub(around);
}

// A frame that is never fully refreshed, dragged along the scene's own motion
// vectors before it is shown again, quantized to macroblocks the way a codec's
// P-frames are — which is what makes a moving camera paint the last frame
// across the screen in blocks instead of redrawing it.
//
// The decode is `warp(previous output) + residual`, not a crossfade with the
// fresh render: a crossfade ghosts everything uniformly and refreshes colour
// along with detail, where a codec carries the old picture forward wholesale
// and spends its residual only on the detail its prediction failed to supply.
// That is why the residual here is high-frequency (a flat region the warp got
// roughly right costs nothing) and luminance-only (colour is the thing that
// should stay wrong, otherwise the new shot repaints the old one's palette).
//
// Motion vectors come from the scene pass's velocity MRT, which VelocityNode
// derives from the model/camera matrices and the position *attribute* — it
// does not see the vertex displacement the glitch material does in its
// positionNode, so camera and object movement smear here and the geometry
// glitches themselves do not.
class DatamoshNode extends TempNode {
  static get type() {
    return 'DatamoshNode';
  }

  constructor(textureNode, velocityNode) {
    super('vec4');

    this.textureNode = textureNode;
    this.velocityNode = velocityNode;

    // uniform(), not float(): the scene writes these every frame from Leva,
    // and a const node has no `.value` to write to.
    this.corruption = uniform(0);
    this.displace = uniform(1);
    this.blockSize = uniform(16);

    this.residual = uniform(1);
    this.residualQuant = uniform(0);

    this.mvPrecision = uniform(0);
    this.skipThreshold = uniform(0);
    this.wrongVectors = uniform(0);

    this.lostLayers = uniform(0);
    this.lostCell = uniform(64);
    this.lostLife = uniform(0.4);
    this.lostChance = uniform(0);

    this._compRT = new RenderTarget(1, 1, { depthBuffer: false });
    this._compRT.texture.name = 'DatamoshNode.comp';

    this._oldRT = new RenderTarget(1, 1, { depthBuffer: false });
    this._oldRT.texture.name = 'DatamoshNode.old';

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

    const map = this.textureNode.value;
    this._compRT.texture.type = map.type;
    this._oldRT.texture.type = map.type;

    renderer.getDrawingBufferSize(_size);
    this.setSize(_size.x, _size.y);

    this._textureNode.value = this._compRT.texture;
    this._textureNodeOld.value = this._oldRT.texture;

    _quadMesh.material = this._materialComposed;
    _quadMesh.name = 'Datamosh';

    renderer.setRenderTarget(this._compRT);
    _quadMesh.render(renderer);

    const temp = this._oldRT;
    this._oldRT = this._compRT;
    this._compRT = temp;

    RendererUtils.restoreRendererState(renderer, _rendererState);
  }

  // Overlapping hashed grids at several scales, each cell running its own clock
  // offset by its hash and re-rolling the drop each cycle. Only motion is
  // suppressed — the residual keeps arriving, so a dropped cell freezes in
  // place and crawls rather than holding a flat patch of colour.
  _packetLoss(screenUv) {
    const loss = float(0).toVar();

    for (let layer = 0; layer < 3; layer += 1) {
      const active = step(float(layer + 1), this.lostLayers);
      const cell = this.lostCell.max(2).mul(2 ** layer);
      const id = floor(screenUv.mul(screenSize).div(cell));

      const offset = hash21(id.add(layer * 37.1 + 3.7));
      const cycle = floor(time.div(this.lostLife.max(0.01)).add(offset));
      const roll = hash21(
        id
          .mul(1.37)
          .add(cycle.mul(7.77))
          .add(layer * 23.1)
      );

      loss.assign(max(loss, step(roll, this.lostChance).mul(active)));
    }

    return loss;
  }

  // The four codec-blockiness mechanisms, in the order a decoder would hit
  // them: one vector per macroblock, some blocks reading the wrong neighbour's
  // vector, the vector snapped to a coarse lattice, and near-still blocks
  // skipped outright.
  _motion(screenUv) {
    const block = this.blockSize.max(1);
    const blockId = floor(screenUv.mul(screenSize).div(block));

    const wrong = step(hash21(blockId.add(11.3)), this.wrongVectors);
    const readUv = blockId.add(wrong).add(0.5).mul(block).div(screenSize);

    const raw = this.velocityNode.sample(readUv).xy.mul(this.displace);
    const pixels = raw.mul(screenSize).toVar();

    const lattice = this.mvPrecision;
    pixels.assign(
      lattice
        .greaterThan(0)
        .select(round(pixels.mul(lattice)).div(lattice.max(0.001)), pixels)
    );

    const cutoff = this.skipThreshold.max(0.001);
    const keep = smoothstep(cutoff.mul(0.5), cutoff, length(pixels));

    const alive = keep.mul(this._packetLoss(screenUv).oneMinus());

    return pixels.mul(alive).div(screenSize).clamp(-0.25, 0.25);
  }

  setup(builder) {
    const { textureNode } = this;
    const history = this._textureNodeOld;

    const mosh = Fn(() => {
      const screenUv = uv();
      const texel = vec2(1).div(screenSize);

      const motion = this._motion(screenUv).toVar();
      const historyUv = screenUv.sub(motion);

      const fresh = textureNode.sample(screenUv);
      const warped = sampleHistory(history, historyUv, screenSize);

      // Only the detail the prediction failed to carry is transmitted. Once
      // the warp brings an edge across strongly enough the residual for it
      // falls to zero, which is what stops edges being re-encoded into the
      // loop every frame and burning in.
      const wanted = highFrequency(textureNode, screenUv, texel);
      const predicted = highFrequency(history, historyUv, texel);
      const excess = max(abs(wanted).sub(abs(predicted)), 0).mul(sign(wanted));

      const steps = this.residualQuant;
      const encoded = steps
        .greaterThan(0)
        .select(round(excess.mul(steps)).div(steps.max(0.001)), excess);

      const decoded = warped.rgb.add(vec3(encoded.mul(this.residual)));

      return mix(fresh, vec4(decoded, warped.a), this.corruption);
    });

    const materialComposed =
      this._materialComposed || (this._materialComposed = new NodeMaterial());
    materialComposed.name = 'Datamosh';
    materialComposed.fragmentNode = mosh();

    builder.getNodeProperties(this).textureNode = textureNode;

    return this._textureNode;
  }

  dispose() {
    this._compRT.dispose();
    this._oldRT.dispose();
    if (this._materialComposed !== null) this._materialComposed.dispose();
  }
}

export const datamosh = (node, velocityNode) =>
  new DatamoshNode(convertToTexture(node), velocityNode);

export default DatamoshNode;
