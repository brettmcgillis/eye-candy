import {
  Fn,
  If,
  float,
  hash,
  instanceIndex,
  mix,
  smoothstep,
  vec3,
  vec4,
} from 'three/tsl';

import { curlNoise } from '@modules/tsl';

import bedSurface from './bedSurface';

export const BED = 0;
export const BOLT = 1;
export const FREE = 2;

export default function createGrainCompute({ buffers, count, uniforms }) {
  return Fn(() => {
    const store = buffers.posRole.element(instanceIndex);
    const motion = buffers.velLife.element(instanceIndex);
    const home = buffers.bedHome.element(instanceIndex);
    const burial = home.w.toVar();
    const target = buffers.boltTarget.element(instanceIndex);
    const parent = buffers.boltParent.element(instanceIndex).xyz.toVar();

    const { dt } = uniforms;
    const pos = store.xyz.toVar();
    const role = store.w.toVar();
    const vel = motion.xyz.toVar();
    const life = motion.w.toVar();
    const arc = target.w.toVar();
    const isBoltGrain = arc.greaterThanEqual(0);

    const restY = (x, z) =>
      uniforms.bedBaseY
        .add(
          bedSurface(
            x,
            z,
            uniforms.bedNoiseScale,
            uniforms.bedDuneHeight,
            uniforms.bedNoisePhase
          )
        )
        .sub(burial);

    If(
      uniforms.cycleReset.greaterThan(0.5).and(role.equal(float(BOLT))),
      () => {
        role.assign(FREE);
        life.assign(1);
      }
    );

    If(isBoltGrain, () => {
      If(
        uniforms.boltDissolving.greaterThan(0.5).and(role.equal(float(BOLT))),
        () => {
          role.assign(FREE);
          life.assign(1);
          vel.assign(
            vec3(
              hash(instanceIndex.toFloat()).sub(0.5),
              hash(instanceIndex.toFloat().add(7717)).mul(-0.4),
              hash(instanceIndex.toFloat().add(3313)).sub(0.5)
            ).mul(uniforms.boltFallSpeed)
          );
        }
      );

      // Anything not mid-fall re-tests the front every frame, so a grain that
      // dissolved last cycle is eligible for the next one. Gated on the
      // dissolve: without it a landed grain re-enters BOLT, snaps back to its
      // target and collapses a second time, every frame until the cycle ends.
      If(
        role.notEqual(float(FREE)).and(uniforms.boltDissolving.lessThan(0.5)),
        () => {
          If(uniforms.frontArc.greaterThanEqual(arc), () => {
            const emerge = uniforms.frontArc
              .sub(arc)
              .div(uniforms.emergeArc)
              .clamp(0, 1);
            role.assign(BOLT);
            pos.assign(mix(parent, target.xyz, smoothstep(0, 1, emerge)));
            vel.assign(vec3(0));
          });
        }
      );
    }).Else(() => {
      // The trunk wanders as it descends and lands up to ~0.7 units off the
      // origin, so the ring has to expand from where the bolt actually hit.
      // Expanding it from the origin is visibly wrong.
      const radial = vec3(
        pos.x.sub(uniforms.impactCenter.x),
        0,
        pos.z.sub(uniforms.impactCenter.z)
      ).toVar();
      const distance = radial.length().max(1e-4);

      If(
        role
          .equal(float(BED))
          .and(distance.greaterThanEqual(uniforms.shockInner))
          .and(distance.lessThan(uniforms.shockOuter)),
        () => {
          const falloff = float(1).div(
            float(1).add(distance.mul(distance).mul(uniforms.ejectFalloff))
          );
          const outward = radial.div(distance);
          const tangent = vec3(outward.z.negate(), 0, outward.x);

          role.assign(FREE);
          life.assign(1);
          vel.assign(
            outward
              .mul(uniforms.ejectSpeed)
              .add(tangent.mul(uniforms.ejectSwirl))
              .add(
                vec3(
                  0,
                  uniforms.ejectLift.mul(
                    mix(float(0.35), float(1), hash(instanceIndex.toFloat()))
                  ),
                  0
                )
              )
              .mul(falloff)
          );
        }
      );
    });

    If(role.equal(float(FREE)), () => {
      const flow = curlNoise(
        pos
          .mul(uniforms.curlFrequency)
          .add(uniforms.time.mul(uniforms.curlEvolve))
      );
      vel.addAssign(
        flow
          .mul(uniforms.curlStrength)
          .add(vec3(0, uniforms.gravity.negate(), 0))
          .mul(dt)
      );
      vel.mulAssign(float(1).sub(uniforms.drag.mul(dt)).clamp(0, 1));
      pos.addAssign(vel.mul(dt));

      // `life` only drives the glow now. Visibility ends by landing, never by
      // ageing out — a grain fading in mid-air reads as vanishing, not falling.
      life.assign(life.sub(dt.div(uniforms.boltLifeSpan)).max(0));

      const landing = restY(pos.x, pos.z).toVar();

      If(pos.y.lessThanEqual(landing).and(vel.y.lessThan(0)), () => {
        pos.assign(vec3(pos.x, landing, pos.z));

        If(vel.y.abs().greaterThan(uniforms.bounceThreshold), () => {
          vel.assign(
            vec3(
              vel.x.mul(uniforms.bounceFriction),
              vel.y.abs().mul(uniforms.bounceRestitution),
              vel.z.mul(uniforms.bounceFriction)
            )
          );
        }).Else(() => {
          role.assign(BED);
          life.assign(0);
          vel.assign(vec3(0));
        });
      });
    });

    // Vertical settle only. Pulling a grain back toward its original xz undid
    // the ejection a few seconds after it happened; leaving it where it landed
    // is what makes the impact look like it actually moved sand.
    If(role.equal(float(BED)), () => {
      pos.y.assign(
        mix(pos.y, restY(pos.x, pos.z), uniforms.bedSettle.mul(dt).clamp(0, 1))
      );
    });

    store.assign(vec4(pos, role));
    motion.assign(vec4(vel, life));
  })()
    .compute(count)
    .setName('Thunder And Lightness Grains');
}
