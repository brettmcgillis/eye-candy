import {
  Fn,
  float,
  floor,
  fract,
  mix,
  step,
  time,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  curveUvNode,
  hash21Node,
  staticNoiseNode,
  vignetteFactorNode,
} from '@materials/WebGPU/crt/crtSharedNodes';
import applySecurityCamOverlay from '@materials/WebGPU/crt/securityCamOverlayNode';

import { SCREEN } from './rig';

const UV_MIN = vec2(...SCREEN.uvMin);
const UV_SPAN = vec2(
  SCREEN.uvMax[0] - SCREEN.uvMin[0],
  SCREEN.uvMax[1] - SCREEN.uvMin[1]
);

export function createScreenUniforms() {
  return {
    curvature: uniform(0.14),
    scanlines: uniform(0.5),
    brightness: uniform(0.92),
    idleStatic: uniform(0.06),
    burst: uniform(0),
    surveillanceOverlayEnabled: uniform(1),
    surveillanceHudOpacity: uniform(0.7),
    surveillanceEffectBoost: uniform(1),
    surveillanceFrameMin: uniform(new THREE.Vector2(0, 0)),
    surveillanceFrameMax: uniform(new THREE.Vector2(1, 1)),
  };
}

// The feed as the tube shows it: curved glass, sync loss and snow while the
// channel changes, the camera's burned-in HUD, scanlines and a soft edge.
export function createScreenMaterial(feedTexture, hudTexture, u) {
  const color = Fn(() => {
    const local = uv().sub(UV_MIN).div(UV_SPAN);
    const curved = curveUvNode(local, u.curvature);
    const inside = step(0, curved.x)
      .mul(step(curved.x, 1))
      .mul(step(0, curved.y))
      .mul(step(curved.y, 1));

    const roll = fract(time.mul(2.3)).mul(u.burst.mul(u.burst));
    const tear = hash21Node(vec2(floor(curved.y.mul(90)), floor(time.mul(40))))
      .sub(0.5)
      .mul(u.burst.mul(0.08));
    const sampleUv = vec2(
      fract(curved.x.add(tear)),
      fract(float(1).sub(curved.y).add(roll))
    );
    const split = vec2(u.burst.mul(0.012).add(0.0015), 0);
    const feed = vec3(
      feedTexture.sample(sampleUv.add(split)).r,
      feedTexture.sample(sampleUv).g,
      feedTexture.sample(sampleUv.sub(split)).b
    );

    const snow = staticNoiseNode(curved, time, float(260), float(30));
    const snowMix = u.idleStatic.add(u.burst).clamp(0, 1);
    const picture = mix(feed, vec3(snow), snowMix);

    const hudUv = vec2(curved.x, float(1).sub(curved.y));
    const withHud = applySecurityCamOverlay(
      vec4(picture, 1),
      u,
      hudTexture,
      hudUv
    ).rgb.mul(float(1).sub(u.burst.mul(0.85)));

    const scan = curved.y.mul(560).sin().mul(0.5).add(0.5);
    const scanned = withHud.mul(
      mix(float(1), scan.mul(0.55).add(0.45), u.scanlines)
    );
    return scanned
      .mul(vignetteFactorNode(curved, float(1.05)))
      .mul(u.brightness)
      .mul(inside);
  });

  const material = new THREE.MeshBasicNodeMaterial({ toneMapped: false });
  material.colorNode = color();
  return material;
}
