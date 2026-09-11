import {
  Fn,
  If,
  PI,
  float,
  int,
  positionGeometry,
  reflect,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  BOX_EXTENT,
  M_GROUND,
  M_STRATA,
  M_WATER,
  atmosphere,
  fdLambert,
  fresnel,
  groundDiffuse,
  hash2,
  march,
  shade,
  skyColor,
  strataDiffuse,
  tonemapACES,
  waterDiffuse,
} from '@modules/terrainErosion';

import applyDebugView from './debugView';

const F0 = 0.04;

// Fewes' terrain renderer (https://www.shadertoy.com/view/7ljcRW) as the
// reference reworked it: the march reads only the height channel, and the full
// four-channel fetch plus its two neighbours happens once, at the hit.
export default function buildRaymarchMaterial({
  field,
  quality,
  uniforms,
  view,
}) {
  const boxSize = vec3(...BOX_EXTENT);
  const sun = uniforms.sunDirection;
  const heightAt = (posXZ) => field.sampleHeight(field.toFieldUV(posXZ));

  const trace = (ro, rd) =>
    march({
      boxSize,
      heightAt,
      quality,
      rd,
      ro,
      waterEnabled: uniforms.waterEnabled,
      waterHeight: uniforms.waterHeight,
    });

  const colorNode = Fn(() => {
    const screen = uv().toVar();
    const ndc = screen.mul(2).sub(1).toVar();

    const rd = view.camForward
      .add(
        view.camRight.mul(
          ndc.x
            .mul(view.tanHalfFov)
            .mul(view.resolution.x.div(view.resolution.y))
        )
      )
      .add(view.camUp.mul(ndc.y.mul(view.tanHalfFov)))
      .normalize()
      .toVar();
    const ro = view.camPos.toVar();

    const primary = trace(ro, rd);
    const hit = primary.hit.toVar();

    const fog = skyColor(
      rd,
      sun,
      uniforms.ambientColor,
      uniforms.ambientIntensity
    )
      .mul(-2)
      .exp()
      .oneMinus()
      .toVar();

    const color = fog.mul(screen.y.pow(3).mul(3).add(1)).mul(0.5).toVar();

    const pos = ro.add(rd.mul(hit)).toVar();
    const fieldUV = field.toFieldUV(pos.xz).toVar();
    const data = field.sampleData(fieldUV);
    const breakup = field.detailAt(fieldUV).toVar();
    const diffuse = vec3(0.5).toVar();
    const normal = primary.normal.toVar();
    const depth = pos.y.sub(data.height).toVar();

    If(hit.greaterThan(0), () => {
      const smoothness = float(0).toVar();
      const occlusion = float(1).toVar();

      If(
        uniforms.detailAmount
          .greaterThan(0)
          .and(primary.material.equal(int(M_WATER))),
        () => {
          normal.assign(
            vec3(
              normal.x.add(breakup.z.mul(0.1)),
              normal.y,
              normal.z.add(breakup.y.mul(0.1))
            ).normalize()
          );
        }
      );

      If(primary.material.equal(int(M_GROUND)), () => {
        normal.assign(data.normal);
        occlusion.assign(data.erosion.add(0.5).clamp(0, 1));
        diffuse.assign(
          groundDiffuse({
            breakup: breakup.x.mul(uniforms.detailAmount),
            erosion: data.erosion,
            height: pos.y,
            normalY: normal.y,
            occlusion,
            ridgemap: data.ridgemap,
            trees: data.trees,
            uniforms,
          })
        );
      })
        .ElseIf(primary.material.equal(int(M_STRATA)), () => {
          diffuse.assign(strataDiffuse(depth));
        })
        .Else(() => {
          diffuse.assign(
            waterDiffuse({
              breakup: breakup.x.mul(uniforms.detailAmount),
              depth,
              facingUp: normal.y.greaterThan(1e-2),
              uniforms,
            })
          );
          smoothness.assign(0.95);
        });

      const shadow = float(1).toVar();
      If(
        uniforms.shadowsEnabled
          .greaterThan(0.5)
          .and(primary.material.notEqual(int(M_STRATA))),
        () => {
          const shadowRay = trace(pos.add(vec3(0, 1e-4, 0)), sun);
          shadow.assign(shadowRay.proximity.mul(-20).exp().oneMinus());
        }
      );

      const sunLight = uniforms.sunColor.mul(uniforms.sunIntensity).toVar();

      const lit = diffuse
        .mul(
          skyColor(
            normal,
            sun,
            uniforms.ambientColor,
            uniforms.ambientIntensity
          )
        )
        .mul(fdLambert())
        .mul(occlusion)
        .toVar();

      lit.addAssign(
        shade(
          diffuse,
          vec3(F0),
          smoothness,
          normal,
          rd.negate(),
          sun,
          sunLight.mul(shadow)
        )
      );
      lit.addAssign(
        diffuse
          .mul(sunLight)
          .mul(
            normal
              .dot(sun.mul(vec3(1, -1, 1)))
              .mul(0.5)
              .add(0.5)
          )
          .mul(fdLambert())
          .div(PI)
      );

      // Only water is smooth enough for the reflection to survive its own
      // roughness falloff, so the second march is gated rather than spent on
      // every ground pixel for a zero contribution.
      If(smoothness.greaterThan(0), () => {
        const r = reflect(rd, normal).toVar();
        const bounce = trace(pos, r);
        const reflected = skyColor(
          r,
          sun,
          uniforms.ambientColor,
          uniforms.ambientIntensity
        )
          .mul(4)
          .mul(
            bounce.proximity
              .mul(-10)
              .mul(smoothness.mul(smoothness))
              .exp()
              .oneMinus()
          );

        lit.addAssign(
          reflected.mul(fresnel(vec3(F0), rd.negate().dot(normal)))
        );
      });

      color.assign(lit);
    });

    const air = atmosphere({
      boxEntry: primary.boxEntry,
      boxExit: primary.boxExit,
      hitDistance: hit,
      rd,
      ro,
      sun,
    });

    color.assign(color.mul(air.transmittance).add(air.scattered.mul(10)));
    color.assign(tonemapACES(color).pow(1 / 2.2));

    // The reference dithers from a blue-noise channel; a value hash over the
    // pixel grid is the closest stand-in without shipping a texture for it.
    color.addAssign(
      hash2(screen.mul(view.resolution)).x.mul(0.5).add(0.5).div(255)
    );

    applyDebugView({
      color,
      data,
      debugView: view.debugView,
      diffuse,
      hit,
    });

    return vec4(color, 1);
  })();

  const material = new THREE.NodeMaterial();
  material.vertexNode = vec4(positionGeometry.xy, 0, 1);
  material.colorNode = colorNode;
  material.depthTest = false;
  material.depthWrite = false;

  return material;
}
