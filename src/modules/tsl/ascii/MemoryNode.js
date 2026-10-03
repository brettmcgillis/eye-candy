/* eslint-disable no-underscore-dangle, no-param-reassign */
import {
  Fn,
  abs,
  exp,
  floor,
  min,
  mix,
  passTexture,
  screenCoordinate,
  select,
  smoothstep,
  texture,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import {
  HalfFloatType,
  NearestFilter,
  NodeMaterial,
  NodeUpdateType,
  QuadMesh,
  RenderTarget,
  RendererUtils,
  TempNode,
  Vector2,
} from 'three/webgpu';

import { isOn, luma } from './shared';

const _size = new Vector2();
const _quadMesh = new QuadMesh();
const MAX_DT = 0.1;
// Even a very high rate never lands in one frame, so a jump never snaps.
const MAX_STEP = 0.85;

let _rendererState;

const makeTarget = () => {
  const target = new RenderTarget(1, 1, {
    depthBuffer: false,
    generateMipmaps: false,
    magFilter: NearestFilter,
    minFilter: NearestFilter,
    type: HalfFloatType,
  });
  target.texture.name = 'AsciiMemory';
  return target;
};

// One texel per cell: rgb eases toward the cell's source colour, alpha is
// how far the cell still has to travel in luma (the "morph activity" that
// drives the glyph cross-fade). The current state is copied to `previous`
// before each update so the output texture never changes identity.
class MemoryNode extends TempNode {
  static get type() {
    return 'AsciiMemoryNode';
  }

  constructor(textureNode, { cellSize, morphRate, gridSize }, initFromSource) {
    super('vec4');

    this.textureNode = textureNode;
    this.cellSize = cellSize;
    this.morphRate = morphRate;
    this.gridSize = gridSize;
    this.dt = uniform(0);
    this.initFromSource = initFromSource;

    this._bufferPx = uniform(new Vector2(1, 1));
    this._resetting = uniform(1);
    this._needsInit = true;

    this._current = makeTarget();
    this._previous = makeTarget();
    this._textureNode = passTexture(this, this._current.texture);
    this._history = texture(this._previous.texture);
    this._material = null;

    this.updateBeforeType = NodeUpdateType.FRAME;
  }

  getTextureNode() {
    return this._textureNode;
  }

  reset() {
    this._needsInit = true;
  }

  _resize(renderer) {
    renderer.getDrawingBufferSize(_size);
    this._bufferPx.value.copy(_size);
    const cell = Math.max(1, Math.round(this.cellSize.value));
    const w = Math.max(1, Math.ceil(_size.x / cell));
    const h = Math.max(1, Math.ceil(_size.y / cell));
    this.gridSize.value.set(w, h);
    if (this._current.width === w && this._current.height === h) return;
    this._current.setSize(w, h);
    this._previous.setSize(w, h);
    this._needsInit = true;
  }

  updateBefore({ renderer }) {
    _rendererState = RendererUtils.resetRendererState(renderer, _rendererState);

    this._resize(renderer);
    this._resetting.value = this._needsInit ? 1 : 0;
    this._needsInit = false;

    if (!this._resetting.value) {
      renderer.copyTextureToTexture(
        this._current.texture,
        this._previous.texture
      );
    }

    _quadMesh.material = this._material;
    _quadMesh.name = 'AsciiMemory';
    renderer.setRenderTarget(this._current);
    _quadMesh.render(renderer);

    RendererUtils.restoreRendererState(renderer, _rendererState);
  }

  setup(builder) {
    const { textureNode, gridSize } = this;

    const update = Fn(() => {
      const cell = floor(screenCoordinate.xy);
      const cellPx = this.cellSize.round().max(1);
      const sourceUv = cell.add(0.5).mul(cellPx).div(this._bufferPx);
      const target = textureNode.sample(sourceUv).level(0).rgb;
      const prev = this._history
        .sample(cell.add(0.5).div(gridSize))
        .level(0).rgb;

      const dt = this.dt.clamp(0, MAX_DT);
      const k = min(exp(dt.mul(this.morphRate).negate()).oneMinus(), MAX_STEP);
      const next = mix(prev, target, k);
      const activity = smoothstep(
        0.01,
        0.12,
        abs(luma(target).sub(luma(next)))
      );

      const init = this.initFromSource ? target : vec3(1);
      return select(isOn(this._resetting), vec4(init, 0), vec4(next, activity));
    });

    this._material ||= new NodeMaterial();
    this._material.name = 'AsciiMemory';
    this._material.fragmentNode = update();

    builder.getNodeProperties(this).textureNode = textureNode;

    return this._textureNode;
  }

  dispose() {
    this._current.dispose();
    this._previous.dispose();
    this._material?.dispose();
  }
}

export default MemoryNode;
