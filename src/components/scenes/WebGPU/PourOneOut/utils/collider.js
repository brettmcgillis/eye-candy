import { Fn, If, Loop, max, uniform, uniformArray, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MAX_PINS } from './domain';

function filled(count, factory) {
  return Array.from({ length: count }, factory);
}

export default function createCollider() {
  const uniforms = {
    // vec4(ax, ay, az, radius) and vec4(bx, by, bz, active)
    pinA: uniformArray(
      filled(MAX_PINS, () => new THREE.Vector4()),
      'vec4'
    ),
    pinB: uniformArray(
      filled(MAX_PINS, () => new THREE.Vector4()),
      'vec4'
    ),
    plateCenter: uniform(new THREE.Vector3()),
    plateEnabled: uniform(1),
    plateHalf: uniform(new THREE.Vector3()),
    solidFriction: uniform(0.12),
    solidRestitution: uniform(0),
  };

  // vec4(outward normal, penetration depth). depth <= 0 means "outside".
  // Deliberately NOT setLayout'd: as a standalone WGSL function the pin
  // uniformArray it reads is never declared as a binding in the calling
  // kernel, and the compute pipeline fails with `unresolved value`.
  const sampleSolid = Fn(([point]) => {
    const best = vec4(0, 1, 0, -1e4).toVar('best');

    Loop({ start: 0, end: MAX_PINS, type: 'int', name: 'i' }, ({ i }) => {
      const a = uniforms.pinA.element(i).toConst('pinA');
      const b = uniforms.pinB.element(i).toConst('pinB');

      If(b.w.greaterThan(0.5), () => {
        const pa = point.sub(a.xyz).toConst('pa');
        const ba = b.xyz.sub(a.xyz).toConst('ba');
        const h = pa.dot(ba).div(ba.dot(ba).max(1e-5)).clamp(0, 1).toConst('h');
        const offset = pa.sub(ba.mul(h)).toConst('offset');
        const distance = offset.length().toConst('distance');
        const depth = a.w.sub(distance).toConst('depth');

        If(depth.greaterThan(best.w), () => {
          best.assign(vec4(offset.div(distance.max(1e-4)), depth));
        });
      });
    });

    // Push-out is always along z, which is only the shortest way out while the
    // plate stays thinner in z than it is wide — the control ranges enforce it.
    If(uniforms.plateEnabled.greaterThan(0.5), () => {
      const d = point
        .sub(uniforms.plateCenter)
        .abs()
        .sub(uniforms.plateHalf)
        .toConst('d');
      const outside = max(d.x, max(d.y, d.z)).toConst('outside');

      If(outside.lessThan(0), () => {
        const depth = d.z.negate().toConst('plateDepth');
        If(depth.greaterThan(best.w), () => {
          best.assign(
            vec4(0, 0, point.z.sub(uniforms.plateCenter.z).sign(), depth)
          );
        });
      });
    });

    return best;
  });

  const deflect = (position, velocity, hit, bounce) => {
    position.addAssign(hit.xyz.mul(hit.w));
    const normalSpeed = velocity.dot(hit.xyz).toConst('normalSpeed');
    If(normalSpeed.lessThan(0), () => {
      velocity.subAssign(hit.xyz.mul(normalSpeed).mul(bounce.add(1)));
    });
    velocity.mulAssign(uniforms.solidFriction.oneMinus());
  };

  function update(pins, plate, config) {
    for (let i = 0; i < MAX_PINS; i += 1) {
      const pin = pins[i];
      const a = uniforms.pinA.array[i];
      const b = uniforms.pinB.array[i];
      if (!pin) {
        b.set(0, 0, 0, 0);
      } else {
        a.set(pin.a.x, pin.a.y, pin.a.z, pin.radius);
        b.set(pin.b.x, pin.b.y, pin.b.z, 1);
      }
    }
    uniforms.plateCenter.value.copy(plate.center);
    uniforms.plateHalf.value.copy(plate.half);
    uniforms.plateEnabled.value = config.showPlate ? 1 : 0;
    uniforms.solidFriction.value = config.solidFriction;
    uniforms.solidRestitution.value = config.solidRestitution;
  }

  return {
    collide: ({ position, velocity }) => {
      const hit = sampleSolid(position).toConst('hit');
      If(hit.w.greaterThan(0), () => {
        deflect(position, velocity, hit, uniforms.solidRestitution);
      });
    },
    // Zeroing the inward component on the grid as well as on the particles is
    // what stops a fast stream tunnelling through a thin pin.
    gridVelocity: ({ position, velocity }) => {
      const hit = sampleSolid(position).toConst('gridHit');
      If(hit.w.greaterThan(0), () => {
        const normalSpeed = velocity.dot(hit.xyz).toConst('gridNormalSpeed');
        If(normalSpeed.lessThan(0), () => {
          velocity.subAssign(hit.xyz.mul(normalSpeed));
        });
      });
    },
    sampleSolid,
    uniforms,
    update,
  };
}
