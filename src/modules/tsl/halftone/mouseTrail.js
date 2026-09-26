import {
  Fn,
  distance,
  length,
  mix,
  screenUV,
  smoothstep,
  texture,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Ping-pong feedback buffer: each frame fades the previous one by `decay` and
// stamps the cursor's velocity (rg, screen-UV units per second) wherever the
// cursor is. Signed values, so it needs a float target.
export default function createMouseTrail({ decay = 0.994, size = 0.06 } = {}) {
  const makeTarget = () =>
    new THREE.RenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      depthBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
  const targets = [makeTarget(), makeTarget()];

  const uniforms = {
    mousePosition: uniform(new THREE.Vector2(-2, -2)),
    mouseVelocity: uniform(new THREE.Vector2()),
    aspect: uniform(1),
    decay: uniform(decay),
    size: uniform(size),
  };

  const previousFrame = texture(targets[1].texture);
  const material = new THREE.NodeMaterial();
  material.fragmentNode = Fn(() => {
    const { mousePosition, mouseVelocity, aspect } = uniforms;
    const uvAspect = vec2(screenUV.x.mul(aspect), screenUV.y);
    const mouse = vec2(mousePosition.x.mul(aspect), mousePosition.y);
    const prev = previousFrame.sample(screenUV);

    const trail = smoothstep(0, uniforms.size, distance(uvAspect, mouse))
      .oneMinus()
      .mul(smoothstep(0, 0.5, length(mouseVelocity)));

    return vec4(
      mix(prev.rgb.mul(uniforms.decay), vec3(mouseVelocity, 0).mul(0.5), trail),
      1
    );
  })();
  const quad = new THREE.QuadMesh(material);

  const output = texture(targets[0].texture);
  let writeIndex = 0;

  return {
    texture: output,
    uniforms,
    setSize(width, height) {
      targets.forEach((target) => target.setSize(width, height));
      uniforms.aspect.value = width / height;
    },
    render(renderer) {
      const write = targets[writeIndex];
      previousFrame.value = targets[1 - writeIndex].texture;

      const restoreTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(write);
      quad.render(renderer);
      renderer.setRenderTarget(restoreTarget);

      output.value = write.texture;
      writeIndex = 1 - writeIndex;
    },
    dispose() {
      targets.forEach((target) => target.dispose());
      material.dispose();
    },
  };
}
