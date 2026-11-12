import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useLoader, useThree } from '@react-three/fiber';

import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import {
  max,
  pass,
  screenCoordinate,
  screenSize,
  screenUV,
  texture,
  uniform,
  vec2,
  vec4,
  wgslFn,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { imageFile } from '@utils/appUtils';

import FLARE_WGSL from '../utils/flareWgsl';
import { GRADE_WGSL } from '../utils/sky/postWgsl';

const gradeFn = wgslFn(GRADE_WGSL);
const flareFn = wgslFn(FLARE_WGSL);
const REVERSAL = imageFile('reversal-inner.png');
const SUN_TINT = new THREE.Color(1, 0.92, 0.8);
const MOON_TINT = new THREE.Color(0.7, 0.82, 1);
const LOW_SUN_TINT = new THREE.Color(1, 0.68, 0.42);
const lightPoint = new THREE.Vector3();
const forward = new THREE.Vector3();

const linear = (hex, out) => {
  out.set(hex);
  return out.set(
    Math.max(out.r, 0.002),
    Math.max(out.g, 0.002),
    Math.max(out.b, 0.002)
  );
};

// Nightscape's grade controls onto the shader's uniforms. White balance:
// temperature trades red against blue, tint green against magenta,
// normalised to keep luminance.
function applyGrade(u, grade) {
  const t = grade.temp;
  const g = grade.tint;
  const bal = [
    (1 + 0.28 * t) * (1 - 0.08 * g),
    1 + 0.16 * g,
    (1 - 0.28 * t) * (1 - 0.08 * g),
  ];
  const l = 0.2126 * bal[0] + 0.7152 * bal[1] + 0.0722 * bal[2];
  u.balance.value.set(bal[0] / l, bal[1] / l, bal[2] / l);
  linear(grade.shadow, u.shadowTint.value);
  linear(grade.high, u.highTint.value);
  u.a.value.set(grade.exposure, grade.shadowAmt, grade.highAmt, grade.lift);
  u.b.value.set(grade.sat, grade.contrast, grade.vignette, grade.grain);
}

// The frame through Nightscape's grade (ACES, split toning, grain and the
// rest), so the plane and its fire sit in the same film as the sky. Bloom,
// when on, adds to the linear frame before the grade. A `volume` (the fire
// and smoke) is marched at its own resolution and laid over the frame first.
// While the day cycle runs, its blended grade stands in for `grade`. The
// lens flare, ghosts shaped like the Reversal, follows the key light.
function SkyGrade({ bloom, cycle, flare, grade, volume }) {
  const { camera, gl, scene } = useThree();
  const reversal = useLoader(THREE.TextureLoader, REVERSAL);
  const u = useMemo(
    () => ({
      a: uniform(new THREE.Vector4()),
      b: uniform(new THREE.Vector4()),
      balance: uniform(new THREE.Vector3(1, 1, 1)),
      bloomOn: uniform(0),
      bloomStrength: uniform(0),
      bloomThreshold: uniform(1),
      flare: uniform(new THREE.Vector4()),
      flareBright: uniform(1),
      flareTint: uniform(new THREE.Color()),
      flareUV: uniform(new THREE.Vector2(-1, -1)),
      highTint: uniform(new THREE.Color()),
      shadowTint: uniform(new THREE.Color()),
      time: uniform(0),
    }),
    []
  );
  const pipeline = useRef(null);
  const volumePass = useRef(null);

  useEffect(() => {
    const scenePass = pass(scene, camera);
    let lit = scenePass;
    if (volume) {
      const { frame, smoke } = volume.node(scenePass);
      smoke.setResolutionScale(volume.resolution);
      volumePass.current = smoke;
      lit = frame;
    }
    const blurred = gaussianBlur(
      max(lit.sub(u.bloomThreshold), 0),
      bloom.radius,
      6,
      {
        resolutionScale: 0.5,
      }
    );
    const flared = flareFn({
      uv: screenUV,
      aspect: screenSize.x.div(screenSize.y),
      sunUV: u.flareUV,
      look: u.flare,
      tint: u.flareTint,
      bright: u.flareBright,
      maskT: texture(reversal),
      maskS: texture(reversal),
      sceneT: scenePass.getTextureNode(),
      sceneS: scenePass.getTextureNode(),
    });
    const frame = lit
      .add(blurred.mul(u.bloomStrength).mul(u.bloomOn).clamp(0, 1.5))
      .add(vec4(flared, 0));
    const post = new THREE.RenderPipeline(gl);
    post.outputColorTransform = false;
    post.outputNode = gradeFn({
      colIn: frame.rgb,
      fragUv: vec2(screenUV.x, screenUV.y.oneMinus()),
      fragCoord: screenCoordinate,
      res: screenSize,
      aspect: screenSize.x.div(screenSize.y),
      time: u.time,
      balance: u.balance,
      shadowTint: u.shadowTint,
      highTint: u.highTint,
      a: u.a,
      b: u.b,
    });
    pipeline.current = post;
    return () => {
      pipeline.current = null;
      volumePass.current = null;
      post.dispose();
    };
  }, [bloom.radius, camera, gl, reversal, scene, u, volume]);

  u.bloomOn.value = bloom.enabled ? 1 : 0;
  u.bloomStrength.value = bloom.strength;
  u.bloomThreshold.value = bloom.threshold;

  useFrame((state) => {
    u.time.value = state.clock.elapsedTime;
    const c = cycle.current;
    applyGrade(u, c.active ? c.grade : grade);
    // The key light's place on screen, and how strong its flare is: full
    // for the sun, `flare.moon` for the moon, none once it sets or is behind.
    camera.getWorldDirection(forward);
    lightPoint.copy(c.keyWorld).multiplyScalar(1000).add(camera.position);
    lightPoint.project(camera);
    u.flareUV.value.set((lightPoint.x + 1) / 2, (1 - lightPoint.y) / 2);
    const facing = forward.dot(c.keyWorld) > 0 ? 1 : 0;
    u.flare.value.set(
      flare.enabled ? flare.intensity : 0,
      flare.size,
      flare.chroma,
      THREE.MathUtils.lerp(flare.moon, 1, c.day) * c.keyI * facing
    );
    u.flareTint.value
      .copy(MOON_TINT)
      .lerp(SUN_TINT, c.day)
      .lerp(LOW_SUN_TINT, c.warm);
    u.flareBright.value = THREE.MathUtils.lerp(1.5, 30, c.day);
    if (volume && volumePass.current) {
      volumePass.current.setResolutionScale(volume.resolution);
    }
    pipeline.current?.render();
  }, 1);

  return null;
}

export default memo(SkyGrade);
