import {
  Break,
  Fn,
  If,
  Loop,
  atan,
  cameraPosition,
  cameraProjectionMatrix,
  clamp,
  dot,
  float,
  length,
  mix,
  modelViewMatrix,
  modelWorldMatrixInverse,
  normalize,
  positionGeometry,
  pow,
  sqrt,
  struct,
  vec3,
  vec4,
} from 'three/tsl';

// Color + per-pixel depth of the first hit, so the hole occludes / is occluded
// by store geometry correctly while sharing a single raymarch.
const BlackHoleVolumeResult = struct(
  { color: 'vec4', depth: 'float' },
  'BlackHoleVolumeResult'
);

import {
  createAccretionDiskColor,
  createNebulaField,
  createStarField,
} from './blackHoleShader';

// Local sim-space radius of the bounding sphere geometry. The raymarch is
// confined to this volume, so the disk (radii in the same sim units) is always
// reachable regardless of how far the camera is or how the group is scaled.
export const BLACK_HOLE_VOLUME_BOUND = 20;

/**
 * In-scene volumetric black hole. Unlike the screen-space compositor, the ray
 * origin and direction come from the rasterized geometry (real camera FOV) and
 * the march starts at the bounding-sphere surface, so the core + disk render
 * from any camera. Up to three opaque "bodies" are intersected inside the bent
 * ray loop, so they are gravitationally lensed as they orbit.
 */
export default function createBlackHoleVolumeShader(uniforms) {
  const accretionDiskColor = createAccretionDiskColor(uniforms);
  const starField = createStarField(uniforms);
  const nebulaField = createNebulaField(uniforms);
  const bound = float(BLACK_HOLE_VOLUME_BOUND);

  return Fn(() => {
    const rs = uniforms.blackHoleMass.mul(2);

    // Camera + fragment in the black hole's local (sim) space.
    const objCamPos = modelWorldMatrixInverse.mul(vec4(cameraPosition, 1)).xyz;
    const objFragPos = positionGeometry;
    // When the camera is inside the volume we seed from the camera; otherwise
    // from the surface point the camera is looking at (skips empty space).
    const startCoords = mix(objFragPos, objCamPos, uniforms.cameraInside);
    const rayDir = normalize(objFragPos.sub(objCamPos)).toVar('rayDir');

    const rayPos = startCoords.toVar('rayPos');
    const prevPos = startCoords.toVar('prevPos');
    const color = vec3(0, 0, 0).toVar('color');
    const alpha = float(0).toVar('alpha');
    const escaped = float(0).toVar('escaped');
    const captured = float(0).toVar('captured');
    // Local-space position of the first visible hit (for depth / occlusion).
    const hitLocal = vec3(0, 0, 0).toVar('hitLocal');
    const hitRecorded = float(0).toVar('hitRecorded');

    const innerR = uniforms.diskInnerRadius;
    const outerR = uniforms.diskOuterRadius;

    Loop(80, () => {
      If(
        escaped
          .greaterThan(0.5)
          .or(captured.greaterThan(0.5))
          .or(alpha.greaterThan(0.99)),
        () => {
          Break();
        }
      );

      const r = length(rayPos);

      If(r.lessThan(rs.mul(1.01)), () => {
        If(hitRecorded.lessThan(0.5), () => {
          hitLocal.assign(rayPos);
          hitRecorded.assign(1);
        });
        captured.assign(1);
        Break();
      });

      If(r.greaterThan(bound), () => {
        escaped.assign(1);
        Break();
      });

      const toCenter = rayPos.negate().div(r);
      const bendStrength = rs
        .div(r.mul(r))
        .mul(uniforms.stepSize)
        .mul(uniforms.gravitationalLensing);
      rayDir.addAssign(toCenter.mul(bendStrength));
      rayDir.assign(normalize(rayDir));

      prevPos.assign(rayPos);
      rayPos.addAssign(rayDir.mul(uniforms.stepSize));

      // Orbiting bodies: opaque ray-sphere intersection along this segment.
      // Because the ray is already bent, bodies behind the hole get lensed.
      uniforms.bodies.forEach((body) => {
        const seg = rayPos.sub(prevPos);
        const oc = prevPos.sub(body.position);
        const aQ = dot(seg, seg);
        const bQ = float(2).mul(dot(oc, seg));
        const cQ = dot(oc, oc).sub(body.radius.mul(body.radius));
        const disc = bQ.mul(bQ).sub(float(4).mul(aQ).mul(cQ));

        If(
          body.enabled
            .greaterThan(0.5)
            .and(disc.greaterThan(0))
            .and(captured.lessThan(0.5))
            .and(alpha.lessThan(0.99)),
          () => {
            const tb = bQ.negate().sub(sqrt(disc)).div(aQ.mul(2));
            If(tb.greaterThan(0).and(tb.lessThan(1)), () => {
              const hitP = mix(prevPos, rayPos, tb);
              const normal = normalize(hitP.sub(body.position));
              const shade = clamp(dot(normal, rayDir.negate()), 0.25, 1);
              const bodyColor = body.color.mul(shade);
              const remaining = float(1).sub(alpha);
              color.addAssign(bodyColor.mul(remaining));
              alpha.addAssign(remaining);
              If(hitRecorded.lessThan(0.5), () => {
                hitLocal.assign(hitP);
                hitRecorded.assign(1);
              });
              captured.assign(1);
            });
          }
        );
      });

      const crossedPlane = prevPos.y.mul(rayPos.y).lessThan(0);

      If(
        crossedPlane.and(alpha.lessThan(0.99)).and(captured.lessThan(0.5)),
        () => {
          const t = prevPos.y.negate().div(rayPos.y.sub(prevPos.y));
          const hitPos = mix(prevPos, rayPos, t);
          const hitR = sqrt(hitPos.x.mul(hitPos.x).add(hitPos.z.mul(hitPos.z)));
          const inDisk = hitR.greaterThan(innerR).and(hitR.lessThan(outerR));

          If(inDisk, () => {
            const hitAngle = atan(hitPos.z, hitPos.x);
            const diskResult = accretionDiskColor(
              hitR,
              hitAngle,
              uniforms.time,
              rayDir
            );

            const remainingAlpha = float(1).sub(alpha);
            color.addAssign(
              diskResult.xyz.mul(diskResult.w).mul(remainingAlpha)
            );
            alpha.addAssign(remainingAlpha.mul(diskResult.w));
            // Record the first time the disk is actually visible (alpha rises).
            If(hitRecorded.lessThan(0.5).and(diskResult.w.greaterThan(0.05)), () => {
              hitLocal.assign(hitPos);
              hitRecorded.assign(1);
            });
          });
        }
      );
    });

    If(captured.lessThan(0.5), () => {
      escaped.assign(1);
    });

    If(escaped.greaterThan(0.5).and(alpha.lessThan(0.99)), () => {
      const bgColor = uniforms.starBackgroundColor.toVar('bgColor');

      If(uniforms.starsEnabled.greaterThan(0.5), () => {
        bgColor.addAssign(starField(rayDir));
      });

      If(uniforms.nebulaEnabled.greaterThan(0.5), () => {
        bgColor.addAssign(nebulaField(rayDir));
      });

      color.addAssign(bgColor.mul(float(1).sub(alpha)));
    });

    const holeAlpha = captured.max(alpha);
    const finalAlpha = mix(holeAlpha, float(1), uniforms.backgroundOpacity);
    // `color` is accumulated pre-multiplied by alpha; the transparent material
    // multiplies by opacity again, so un-premultiply here to avoid the disk
    // rendering at alpha^2 (washed-out grey).
    const straightColor = color.div(finalAlpha.max(0.0001));
    const finalColor = pow(straightColor, vec3(1 / 2.2));

    // Per-pixel device depth of the first hit so store geometry can occlude the
    // hole (and vice-versa). Escaped/empty pixels stay at the far plane.
    const depthValue = float(1).toVar('depthValue');
    If(hitRecorded.greaterThan(0.5), () => {
      const clipPos = cameraProjectionMatrix.mul(
        modelViewMatrix.mul(vec4(hitLocal, 1))
      );
      depthValue.assign(clipPos.z.div(clipPos.w));
    });

    return BlackHoleVolumeResult(vec4(finalColor, finalAlpha), depthValue);
  })();
}
