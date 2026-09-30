import {
  abs,
  convertToTexture,
  dot,
  float,
  max,
  nodeObject,
  passTexture,
  select,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import {
  HalfFloatType,
  NodeMaterial,
  NodeUpdateType,
  QuadMesh,
  RenderTarget,
  RendererUtils,
  TempNode,
  Vector2,
} from 'three/webgpu';

const quad = /* @__PURE__ */ new QuadMesh();
const size = /* @__PURE__ */ new Vector2();
let rendererState;

const LUMA = vec3(0.299, 0.587, 0.114);
const TAP13 = [
  [-1, -1, 1],
  [0, -1, 2],
  [1, -1, 1],
  [-0.5, -0.5, 4],
  [0.5, -0.5, 4],
  [-1, 0, 2],
  [0, 0, 4],
  [1, 0, 2],
  [-0.5, 0.5, 4],
  [0.5, 0.5, 4],
  [-1, 1, 1],
  [0, 1, 2],
  [1, 1, 1],
];
const TAP9 = [
  [-1, -1, 1],
  [0, -1, 2],
  [1, -1, 1],
  [-1, 0, 2],
  [0, 0, 4],
  [1, 0, 2],
  [-1, 1, 1],
  [0, 1, 2],
  [1, 1, 1],
];

const inside = (at) =>
  max(abs(at.x.sub(0.5)), abs(at.y.sub(0.5))).lessThan(0.5);

// 0b5vr's present-pass bloom (the rect cubes reference): a 13-tap
// downsample whose weights are damped by luminance, a threshold on the first
// level, then a 9-tap tent upsample that sums every level back up. Samples
// outside a level read as nothing, as they do in the reference's atlas.
function tap13(source, at, texel) {
  let sum = vec4(0);
  TAP13.forEach(([x, y, w]) => {
    const p = at.sub(texel.mul(vec2(x, y)));
    const c = source.sample(p).rgb;
    const tap = vec4(c, dot(LUMA, c).mul(0.5).add(1));
    sum = sum.add(select(inside(p), tap, vec4(0)).mul(w));
  });
  return select(sum.w.greaterThan(1e-3), sum.rgb.div(sum.w), vec3(0));
}

function tap9(source, at, texel) {
  let sum = vec4(0);
  TAP9.forEach(([x, y, w]) => {
    const p = at.sub(texel.mul(vec2(x, y)));
    sum = sum.add(select(inside(p), source.sample(p), vec4(0)).mul(w / 16));
  });
  return sum;
}

export default class MipBloomNode extends TempNode {
  static get type() {
    return 'MipBloomNode';
  }

  constructor(inputNode, { levels = 6, strength = 1, threshold = 1 } = {}) {
    super('vec4');
    this.inputNode = inputNode;
    this.levels = levels;
    this.strength = uniform(strength);
    this.threshold = uniform(threshold);
    this.updateBeforeType = NodeUpdateType.FRAME;

    const target = () =>
      new RenderTarget(1, 1, { depthBuffer: false, type: HalfFloatType });
    this.down = Array.from({ length: levels + 1 }, target);
    this.up = Array.from({ length: levels }, target);
    this.texels = {
      down: this.down.map(() => uniform(new Vector2())),
      input: uniform(new Vector2()),
      up: this.up.map(() => uniform(new Vector2())),
    };
    this.downMaterials = [];
    this.upMaterials = [];
  }

  setSize(width, height) {
    this.texels.input.value.set(1 / width, 1 / height);
    this.down.forEach((rt, i) => {
      const w = Math.max(1, Math.floor(width / 2 ** (i + 1)));
      const h = Math.max(1, Math.floor(height / 2 ** (i + 1)));
      rt.setSize(w, h);
      this.texels.down[i].value.set(1 / w, 1 / h);
      if (this.up[i]) {
        this.up[i].setSize(w, h);
        this.texels.up[i].value.set(1 / w, 1 / h);
      }
    });
  }

  updateBefore(frame) {
    const { renderer } = frame;
    rendererState = RendererUtils.resetRendererState(renderer, rendererState);
    renderer.getDrawingBufferSize(size);
    this.setSize(size.width, size.height);

    this.down.forEach((rt, i) => {
      renderer.setRenderTarget(rt);
      quad.material = this.downMaterials[i];
      quad.name = `MipBloom [ Down ${i} ]`;
      quad.render(renderer);
    });
    for (let i = this.up.length - 1; i >= 0; i -= 1) {
      renderer.setRenderTarget(this.up[i]);
      quad.material = this.upMaterials[i];
      quad.name = `MipBloom [ Up ${i} ]`;
      quad.render(renderer);
    }

    RendererUtils.restoreRendererState(renderer, rendererState);
  }

  setup(builder) {
    const context = builder.getSharedContext();
    const at = uv();
    const material = (node, name) => {
      const m = new NodeMaterial();
      m.fragmentNode = node.context(context);
      m.name = name;
      return m;
    };

    this.downMaterials = this.down.map((rt, i) => {
      if (i === 0) {
        const col = tap13(this.inputNode, at, this.texels.input);
        const brightness = dot(LUMA, col);
        const hue = select(
          brightness.lessThan(1e-4),
          vec3(brightness),
          col.div(brightness)
        );
        return material(
          vec4(max(brightness.sub(this.threshold), 0).mul(hue), 1),
          'MipBloom_down0'
        );
      }
      return material(
        vec4(
          tap13(texture(this.down[i - 1].texture), at, this.texels.down[i - 1]),
          1
        ),
        `MipBloom_down${i}`
      );
    });

    this.upMaterials = this.up.map((rt, i) => {
      let sum = tap9(
        texture(this.down[i + 1].texture),
        at,
        this.texels.down[i + 1]
      );
      if (i < this.up.length - 1) {
        sum = sum.add(
          tap9(texture(this.up[i + 1].texture), at, this.texels.up[i + 1])
        );
      }
      return material(vec4(sum.rgb, 1), `MipBloom_up${i}`);
    });

    const bloom = tap9(
      passTexture(this, this.up[0].texture),
      at,
      this.texels.up[0]
    );
    return vec4(bloom.rgb.mul(this.strength), float(1));
  }

  dispose() {
    [...this.down, ...this.up].forEach((rt) => rt.dispose());
    [...this.downMaterials, ...this.upMaterials].forEach((m) => m.dispose());
  }
}

// The bloom alone; add it to the frame it was taken from.
export const mipBloom = (node, options) =>
  nodeObject(new MipBloomNode(convertToTexture(node), options));
