/* eslint-disable no-underscore-dangle, no-param-reassign */
import {
  Fn,
  convertToTexture,
  floor,
  mix,
  passTexture,
  screenSize,
  texture,
  uniform,
  uv,
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

// A frame that is never fully refreshed, dragged along the scene's own motion
// vectors before it is shown again, quantized to macroblocks the way a codec's
// P-frames are — which is what makes a moving camera paint the last frame
// across the screen in blocks instead of redrawing it.
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

  setup(builder) {
    const { textureNode } = this;
    const textureNodeOld = this._textureNodeOld;
    const { velocityNode } = this;

    const mosh = Fn(() => {
      const screenUv = uv();

      // One motion vector per macroblock, sampled at the block's center, so a
      // whole block of stale pixels moves as a unit — the blockiness is the
      // effect, not an optimisation.
      const block = this.blockSize.max(1);
      const blockUv = floor(screenUv.mul(screenSize).div(block))
        .add(0.5)
        .mul(block)
        .div(screenSize);
      const motion = velocityNode.sample(blockUv).xy.mul(this.displace);

      const fresh = textureNode.sample(screenUv);
      const stale = textureNodeOld.sample(screenUv.sub(motion));

      return mix(fresh, stale, this.corruption);
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
