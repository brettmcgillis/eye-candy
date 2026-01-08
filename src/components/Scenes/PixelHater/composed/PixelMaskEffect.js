import { Effect } from 'postprocessing';
import * as THREE from 'three';

class PixelMaskEffectImpl extends Effect {
  constructor(scene, camera, { pixelSize = 8, maskScene }) {
    super(
      'PixelMaskEffect',
      `
      uniform sampler2D maskTex;
      uniform sampler2D maskDepthTex;
      uniform float pixelSize;
      uniform vec2 resolution;

      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {

        float mask = texture(maskTex, uv).r;
        float sceneDepth = texture(depthBuffer, uv).r;
        float maskDepth = texture(maskDepthTex, uv).r;

        vec4 color = inputColor;

        if (mask > 0.01 && sceneDepth > maskDepth + 0.0005) {
          vec2 grid = pixelSize / resolution;
          vec2 pUv = floor(uv / grid) * grid;
          color = texture(inputBuffer, pUv);
        }

        outputColor = color;
      }
      `,
      {
        uniforms: new Map([
          ['maskTex', new THREE.Uniform(null)],
          ['maskDepthTex', new THREE.Uniform(null)],
          ['pixelSize', new THREE.Uniform(pixelSize)],
          ['resolution', new THREE.Uniform(new THREE.Vector2())],
        ]),
      }
    );

    // 🔴 required for depthBuffer to exist
    this.needsDepthTexture = true;

    this.scene = scene;
    this.camera = camera;
    this.maskScene = maskScene;

    this.maskTarget = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: true,
    });

    this.maskTarget.depthTexture = new THREE.DepthTexture();
    this.maskTarget.depthTexture.type = THREE.UnsignedShortType;
  }

  update(renderer) {
    const size = renderer.getSize(new THREE.Vector2());
    this.uniforms.get('resolution').value.set(size.x, size.y);

    if (this.maskTarget.width !== size.x || this.maskTarget.height !== size.y) {
      this.maskTarget.setSize(size.x, size.y);
    }

    renderer.setRenderTarget(this.maskTarget);
    renderer.clear();
    renderer.render(this.maskScene, this.camera);
    renderer.setRenderTarget(null);

    this.uniforms.get('maskTex').value = this.maskTarget.texture;
    this.uniforms.get('maskDepthTex').value = this.maskTarget.depthTexture;
  }
}
export default PixelMaskEffectImpl;
