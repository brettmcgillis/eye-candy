import { abs, exp, float, max, uniform, uv, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

// A lamp's glare: a hot core, a soft halo and a thin horizontal streak, as
// a lens sees a bright bulb. Additive and untonemapped, so bloom picks it up.
export default function createFlare() {
  const u = {
    color: uniform(new THREE.Color()),
    strength: uniform(0),
  };
  const q = uv().mul(2).sub(1);
  const r2 = q.dot(q);
  const core = exp(r2.mul(-60));
  const halo = exp(r2.mul(-7)).mul(0.35);
  const streak = exp(abs(q.y).mul(-70))
    .mul(exp(abs(q.x).mul(-2.6)))
    .mul(0.5);
  const shape = max(core.add(halo).add(streak), float(0));
  const material = new THREE.SpriteNodeMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    transparent: true,
  });
  material.colorNode = vec3(u.color)
    .mul(u.strength)
    .mul(shape.add(core.mul(2)));
  material.opacityNode = shape.clamp(0, 1);
  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = 3;
  return {
    dispose: () => material.dispose(),
    sprite,
    uniforms: u,
  };
}
