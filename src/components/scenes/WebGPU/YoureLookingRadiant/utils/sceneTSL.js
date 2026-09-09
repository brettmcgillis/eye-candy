/* eslint-disable no-param-reassign */
import {
  If,
  Loop,
  cos,
  float,
  mix,
  select,
  sin,
  uniform,
  uniformArray,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { NO_HIT, rotate2D, sdArc, sdDiamond } from '@modules/radialShadow';

// Lights and bodies are separate lists: one body per particle, but several
// lights spread along it, because a long arc lit from one point glows from its
// middle. Both loops run to a live count rather than the array cap, so a scene
// with a handful of particles does not pay for the maximum it could hold.
export const MAX_LIGHTS = 128;
export const MAX_BODIES = 112;

function filled(count, factory) {
  return Array.from({ length: count }, factory);
}

export function createSceneUniforms() {
  return {
    bodyColor: uniformArray(
      filled(MAX_BODIES, () => new THREE.Color(0, 0, 0)),
      'color'
    ),
    bodyCount: uniform(0, 'int'),
    // A third role beside emitting and occluding: a body that bends light
    // through itself instead of blocking it or making it.
    bodyRefract: uniformArray(
      filled(MAX_BODIES, () => 0),
      'float'
    ),
    // 0 arc, 1 outlined diamond, 2 filled diamond.
    bodyShape: uniformArray(
      filled(MAX_BODIES, () => 0),
      'float'
    ),
    // vec4(centreX, centreY, orbitRadius, angle) in pixels.
    bodyData: uniformArray(
      filled(MAX_BODIES, () => new THREE.Vector4(0, 0, 0, 0)),
      'vec4'
    ),
    // vec4(occluderThickness, bodyThickness, emission, halfAperture).
    bodyInfo: uniformArray(
      filled(MAX_BODIES, () => new THREE.Vector4(0, 0, 0, 0)),
      'vec4'
    ),
    lightColor: uniformArray(
      filled(MAX_LIGHTS, () => new THREE.Color(0, 0, 0)),
      'color'
    ),
    lightCount: uniform(0, 'int'),
    // vec4(x, y, radius, intensity) — intensity <= 0 means "not emitting".
    lightData: uniformArray(
      filled(MAX_LIGHTS, () => new THREE.Vector4(0, 0, 0, 0)),
      'vec4'
    ),
    // Which body each light belongs to, so the march can skip its own.
    lightOwner: uniformArray(
      filled(MAX_LIGHTS, () => 0),
      'float'
    ),
  };
}

// `thickness` is whatever the shape treats as its cross-section: an arc's
// half-width, an outlined diamond's line width, or a filled diamond's own
// half-size. Every body shrinks that toward nothing as it lights up, which is
// how anything here stops occluding.
//
// bodyData.z carries the shape's primary radius — the arc's orbit, the
// outline's half-size — and is unused by a fill.
function bodyDistance(u, worldPos, i, thickness) {
  const data = u.bodyData.element(i);
  const shape = u.bodyShape.element(i);
  const dist = float(NO_HIT).toVar();

  If(shape.lessThan(0.5), () => {
    // sdArc is symmetric about +y, so rotate into the arc's own frame. The
    // aperture is per body, not one shared uniform: the reference gives every
    // ring its own sweep, and identically-swept arcs read as a machine part.
    const aperture = u.bodyInfo.element(i).w;
    const local = rotate2D(
      worldPos.sub(data.xy),
      float(Math.PI / 2).sub(data.w)
    );

    dist.assign(
      sdArc(local, vec2(sin(aperture), cos(aperture)), data.z, thickness)
    );
  })
    .ElseIf(shape.lessThan(1.5), () => {
      const local = rotate2D(worldPos.sub(data.xy), data.w.negate());

      dist.assign(sdDiamond(local, data.z).abs().sub(thickness));
    })
    .Else(() => {
      const local = rotate2D(worldPos.sub(data.xy), data.w.negate());

      dist.assign(sdDiamond(local, thickness));
    });

  return dist;
}

// Signed distance to everything that occludes, skipping the body the marching
// light belongs to. A light sits on its own arc, so without the exclusion
// every ray it casts terminates on itself at t = 0 and the whole frame reads
// as shadowed.
export function buildSceneSDF(u, growth) {
  return (worldPos, exclude) => {
    const best = float(NO_HIT).toVar();

    Loop({ end: u.bodyCount, start: 0, type: 'int' }, ({ i }) => {
      const mine = float(i).equal(exclude);
      const glass = u.bodyRefract.element(i).greaterThan(0.5);
      const dist = bodyDistance(u, worldPos, i, u.bodyInfo.element(i).x);

      best.assign(select(mine.or(glass), best, best.min(dist)));
    });

    // Gated on a uniform, not on whether the object exists. Its compute passes
    // only run while growth is on, so with it off the distance texture is
    // uninitialised and reads as zero — which the march takes as an occluder
    // at every step, and the whole frame goes black.
    if (growth) {
      best.assign(
        best.min(select(growth.enabled, growth.distanceAt(worldPos), NO_HIT))
      );
    }

    return best;
  };
}

// Nearest visible body: its distance, the albedo to paint it with, and how
// much light it is putting out.
//
// The albedo crosses from the occluder tint to the field colour as a particle
// lights up, so an emitter has no surface of its own — exactly like CrossTalk's
// lights. What you see where it sits is `glow` fed into the same accumulator
// the halo comes from, and multiplied by the same albedo, so the body and its
// radiance are continuous rather than a flat disc sitting on top of a gradient.
//
// Returns plain node fields rather than an Fn: an Fn returns one node, and
// splitting this into two would walk every body twice.
export function buildBodySDF(u, occluderTint, fieldColor, growth) {
  return (worldPos) => {
    const nearest = vec4(0, 0, 0, NO_HIT).toVar();
    const glow = vec3(0).toVar();

    Loop({ end: u.bodyCount, start: 0, type: 'int' }, ({ i }) => {
      const info = u.bodyInfo.element(i);
      const glass = u.bodyRefract.element(i).greaterThan(0.5);
      const dist = select(
        glass,
        float(NO_HIT),
        bodyDistance(u, worldPos, i, info.y)
      );
      // Its own colour as it lights up, the occluder tint as it goes out.
      // Fading to the FIELD colour instead made an emitter invisible — you saw
      // dark bodies and unexplained light with nothing joining them.
      const albedo = mix(occluderTint, u.bodyColor.element(i), info.z);
      const closer = dist.lessThan(nearest.w);

      nearest.assign(select(closer, vec4(albedo, dist), nearest));
      glow.assign(select(closer, u.bodyColor.element(i).mul(info.z), glow));
    });

    // The pattern is an occluder, so it takes the occluder tint and adds no
    // glow — what you see of it is the light the particles throw onto it.
    if (growth) {
      const grown = select(
        growth.enabled,
        growth.distanceAt(worldPos),
        float(NO_HIT)
      );

      nearest.assign(
        select(grown.lessThan(nearest.w), vec4(occluderTint, grown), nearest)
      );
      glow.assign(select(grown.lessThan(nearest.w), vec3(0), glow));
    }

    return { albedo: nearest.xyz, dist: nearest.w, glow };
  };
}

export function updateSceneUniforms(u, buffers, counts) {
  for (let i = 0; i < counts.lightCount; i += 1) {
    const light = buffers.lights[i];
    u.lightData.array[i].set(light.x, light.y, light.radius, light.intensity);
    u.lightColor.array[i].set(light.color);
    u.lightOwner.array[i] = light.owner;
  }

  for (let i = 0; i < counts.bodyCount; i += 1) {
    const body = buffers.bodies[i];
    u.bodyData.array[i].set(body.centerX, body.centerY, body.orbit, body.angle);
    u.bodyInfo.array[i].set(
      body.occluderRadius,
      body.bodyRadius,
      body.emission,
      body.aperture
    );
    u.bodyColor.array[i].set(body.color);
    u.bodyShape.array[i] = body.shape;
    u.bodyRefract.array[i] = body.refract ?? 0;
  }

  u.lightCount.value = counts.lightCount;
  u.bodyCount.value = counts.bodyCount;
}
