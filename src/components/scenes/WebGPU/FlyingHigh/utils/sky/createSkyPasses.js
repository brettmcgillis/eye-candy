import {
  Fn,
  instanceIndex,
  screenCoordinate,
  screenUV,
  texture,
  texture3D,
  textureStore,
  uniform,
  uvec3,
  vec2,
  wgslFn,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { sharedNoise } from '@utils/tileableNoise3d';

import { BAKE_N, BAKE_NY, BAKE_WGSL, CLOUD_WGSL } from './cloudWgsl';
import createTerrain from './createTerrain';
import inBatches from './inBatches';
import { RAYS_WGSL, SKY_WGSL, TAA_WGSL } from './postWgsl';
import { GROUND_WGSL } from './terrainWgsl';

const bakeFn = wgslFn(BAKE_WGSL);
const cloudFn = wgslFn(CLOUD_WGSL);
const taaFn = wgslFn(TAA_WGSL);
const raysFn = wgslFn(RAYS_WGSL);
const skyFn = wgslFn(SKY_WGSL);
const groundFn = wgslFn(GROUND_WGSL);

// Two levels of the bake per frame, as Nightscape's 48 chunks.
const LEVELS_PER_CHUNK = 2;
const SCALE_MIN = 0.26;
const SCALE_MAX = 0.8;
export const MOON_R = 0.044;

const pathX = (z) =>
  4.5 * Math.sin(z * 0.019634954) + 1.6 * Math.sin(z * 0.039269908 + 1.3);

// transparent + NoBlending: an opaque NodeMaterial forces alpha to 1, and
// the cloud pass packs depth and transmittance into alpha.
function passMaterial(colorNode) {
  const material = new THREE.NodeMaterial();
  material.colorNode = colorNode;
  material.blending = THREE.NoBlending;
  material.depthTest = false;
  material.depthWrite = false;
  material.transparent = true;
  material.toneMapped = false;
  return material;
}

function target(type, filter) {
  return new THREE.RenderTarget(1, 1, {
    depthBuffer: false,
    magFilter: filter,
    minFilter: filter,
    type,
  });
}

// Nightscape's render passes for a sky seen through the scene's camera: the
// bake (compute, chunked across frames), the cloud march at reduced
// resolution, temporal accumulation and light shafts each frame, and the
// sky composite as a node for scene.backgroundNode. `yaw` turns world
// directions into sky space, where the flight runs along -z.
export default function createSkyPasses({ moonMap }) {
  const noise = sharedNoise();
  const bakes = [0, 1].map(() => {
    const bake = new THREE.Storage3DTexture(BAKE_N, BAKE_N, BAKE_NY);
    bake.format = THREE.RGBAFormat;
    bake.type = THREE.HalfFloatType;
    bake.minFilter = THREE.LinearFilter;
    bake.magFilter = THREE.LinearFilter;
    bake.wrapS = THREE.RepeatWrapping;
    bake.wrapT = THREE.RepeatWrapping;
    bake.wrapR = THREE.ClampToEdgeWrapping;
    return bake;
  });

  const u = {
    aspect: uniform(1),
    camF: uniform(new THREE.Vector3(0, 0, -1)),
    camPos: uniform(new THREE.Vector3()),
    camR: uniform(new THREE.Vector3(1, 0, 0)),
    camU: uniform(new THREE.Vector3(0, 1, 0)),
    day: uniform(0),
    fade: uniform(0),
    frame: uniform(0),
    levelBase: uniform(0),
    lumW: uniform(0.5),
    bakeDirs: [0, 1].map(() => uniform(new THREE.Vector3(0, 1, 0))),
    bakeMix: uniform(0),
    keyDir: uniform(new THREE.Vector3(0, 0.2, -1).normalize()),
    keyI: uniform(1),
    moonDir: uniform(new THREE.Vector3(0, 0.2, -1).normalize()),
    sunDir: uniform(new THREE.Vector3(0, 0.6, -1).normalize()),
    moonR: uniform(MOON_R),
    moonRuv: uniform(0.05),
    moonUV: uniform(new THREE.Vector2()),
    pixAng: uniform(0.001),
    prevAspect: uniform(1),
    prevF: uniform(new THREE.Vector3(0, 0, -1)),
    prevPos: uniform(new THREE.Vector3()),
    prevR: uniform(new THREE.Vector3(1, 0, 0)),
    prevTanHalf: uniform(0.5),
    prevU: uniform(new THREE.Vector3(0, 1, 0)),
    rays: uniform(1),
    reset: uniform(1),
    seed: uniform(0),
    shape: uniform(new THREE.Vector4(0, 0, 0.38, 0.55)),
    size: uniform(new THREE.Vector2(1, 1)),
    starLow: uniform(0.035),
    stormH: uniform(30),
    tanHalf: uniform(0.5),
    time: uniform(0),
    twinkle: uniform(1.4),
    lamps: uniform(1.95),
    pixAngC: uniform(0.001),
  };

  const bakeKernels = bakes.map((bake, slot) =>
    Fn(() => {
      textureStore(
        bake,
        uvec3(
          instanceIndex.mod(BAKE_N),
          instanceIndex.div(BAKE_N).mod(BAKE_N),
          instanceIndex.div(BAKE_N * BAKE_N).add(u.levelBase.toUint())
        ),
        bakeFn({
          id: instanceIndex,
          levelBase: u.levelBase,
          lightDir: u.bakeDirs[slot],
          seed: u.seed,
          shape: u.shape,
          stormH: u.stormH,
          nT: texture3D(noise),
          nS: texture3D(noise),
        })
      ).toWriteOnly();
    })()
      .compute(BAKE_N * BAKE_N * LEVELS_PER_CHUNK)
      .setName(`nightscapeBake${slot}`)
  );

  const glUv = vec2(screenUV.x, screenUV.y.oneMinus());
  const cloudRT = target(THREE.FloatType, THREE.NearestFilter);
  const groundRT = target(THREE.FloatType, THREE.NearestFilter);
  const terrain = createTerrain({ seed: u.seed });
  const ter = terrain.textures;
  const groundMaterial = passMaterial(
    groundFn({
      fragUv: glUv,
      fragCoord: screenCoordinate,
      camPos: u.camPos,
      camR: u.camR,
      camU: u.camU,
      camF: u.camF,
      keyDir: u.keyDir,
      moonDir: u.moonDir,
      sunDir: u.sunDir,
      keyI: u.keyI,
      terMix: terrain.uniforms.mix,
      tanHalf: u.tanHalf,
      aspect: u.aspect,
      time: u.time,
      day: u.day,
      seed: u.seed,
      shape: u.shape,
      lamps: u.lamps,
      terTop: terrain.uniforms.top,
      pixAngC: u.pixAngC,
      mast0: terrain.uniforms.mast0,
      mast1: terrain.uniforms.mast1,
      mastN: terrain.uniforms.mastN,
      tCloud: texture(cloudRT.texture),
      nT: texture3D(noise),
      nS: texture3D(noise),
      terH: texture(ter.terH),
      terA0: texture(ter.terA[0]),
      terA1: texture(ter.terA[1]),
      terB: texture(ter.terB),
      terC: texture(ter.terC),
      terL: texture(ter.terL),
      terS: texture(ter.terH),
    })
  );
  const history = [
    target(THREE.HalfFloatType, THREE.LinearFilter),
    target(THREE.HalfFloatType, THREE.LinearFilter),
  ];
  const raysRT = target(THREE.HalfFloatType, THREE.LinearFilter);

  const cloudMaterial = passMaterial(
    cloudFn({
      fragUv: glUv,
      fragCoord: screenCoordinate,
      camPos: u.camPos,
      camR: u.camR,
      camU: u.camU,
      camF: u.camF,
      keyDir: u.keyDir,
      moonDir: u.moonDir,
      sunDir: u.sunDir,
      keyI: u.keyI,
      bakeMix: u.bakeMix,
      tanHalf: u.tanHalf,
      aspect: u.aspect,
      frame: u.frame,
      day: u.day,
      seed: u.seed,
      nT: texture3D(noise),
      nS: texture3D(noise),
      bA: texture3D(bakes[0]),
      bB: texture3D(bakes[1]),
      bS: texture3D(bakes[0]),
    })
  );

  // One node per binding, repointed on swap, so no graph reads the target
  // it is writing.
  const histNode = texture(history[0].texture);
  const histSamplerNode = texture(history[0].texture);
  const taaMaterial = passMaterial(
    taaFn({
      fragCoord: screenCoordinate,
      size: u.size,
      camPos: u.camPos,
      camR: u.camR,
      camU: u.camU,
      camF: u.camF,
      prevPos: u.prevPos,
      prevR: u.prevR,
      prevU: u.prevU,
      prevF: u.prevF,
      tanHalf: u.tanHalf,
      aspect: u.aspect,
      prevTanHalf: u.prevTanHalf,
      prevAspect: u.prevAspect,
      reset: u.reset,
      tCur: texture(groundRT.texture),
      tHist: histNode,
      sHist: histSamplerNode,
    })
  );

  const raysCloudNode = texture(history[1].texture);
  const raysSamplerNode = texture(history[1].texture);
  const raysMaterial = passMaterial(
    raysFn({
      fragUv: glUv,
      fragCoord: screenCoordinate,
      moonUV: u.moonUV,
      aspect: u.aspect,
      moonRuv: u.moonRuv,
      fade: u.fade,
      lumW: u.lumW,
      tCloud: raysCloudNode,
      sCloud: raysSamplerNode,
    })
  );

  const skyCloudNode = texture(history[1].texture, screenUV);
  const skyNode = skyFn({
    fragUv: glUv,
    cloud: skyCloudNode,
    rays: texture(raysRT.texture, screenUV).r,
    camR: u.camR,
    camU: u.camU,
    camF: u.camF,
    moonDir: u.moonDir,
    sunDir: u.sunDir,
    tanHalf: u.tanHalf,
    aspect: u.aspect,
    time: u.time,
    pixAng: u.pixAng,
    moonR: u.moonR,
    twk: u.twinkle,
    starLow: u.starLow,
    raysAmt: u.rays,
    day: u.day,
    moonT: texture(moonMap),
    moonS: texture(moonMap),
  });

  const quad = new THREE.QuadMesh(cloudMaterial);
  const viewSize = new THREE.Vector2();
  const drawSize = new THREE.Vector2();
  const basis = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  let read = 0;
  // Bake scheduler: `shown` is the buffer the weight fades toward, `slot`
  // the one baking (-1 idle). A bake starts when the light has moved or the
  // field changed; when it finishes the shader cross-fades onto it.
  const bake = { dirty: true, fade: 1, level: BAKE_NY, shown: 0, slot: -1 };
  const BAKE_FADE = 0.5;
  // While the key light moves (the day cycle), each bake aims where the
  // light will be once it has baked and faded in, so the shadows keep up
  // with it instead of trailing a second behind. A jump (the moon handing
  // over to the sun) restarts the estimate.
  const aim = {
    dt: 1 / 60,
    last: new THREE.Vector3(),
    step: new THREE.Vector3(),
    target: new THREE.Vector3(),
    vel: new THREE.Vector3(),
  };
  function aimBake(delta) {
    const key = u.keyDir.value;
    const dt = Math.min(delta, 0.1);
    if (dt > 0) {
      aim.dt += (dt - aim.dt) * 0.1;
      aim.step.subVectors(key, aim.last);
      if (aim.step.length() < 0.05) {
        aim.vel.lerp(aim.step.divideScalar(dt), 0.1);
      } else aim.vel.set(0, 0, 0);
      aim.last.copy(key);
    }
    const lead = (BAKE_NY / LEVELS_PER_CHUNK) * aim.dt + BAKE_FADE;
    aim.target.copy(aim.vel).multiplyScalar(lead).add(key).normalize();
  }
  let scale = 0.5;
  const perf = { acc: 0, n: 0, lastDrop: -Infinity, lastChange: -Infinity };
  let flight = 0;
  let clock = 0;

  function resize(width, height) {
    const cw = Math.max(64, Math.round(width * scale));
    const ch = Math.max(64, Math.round(height * scale));
    if (cloudRT.width === cw && cloudRT.height === ch) return;
    cloudRT.setSize(cw, ch);
    groundRT.setSize(cw, ch);
    history.forEach((rt) => rt.setSize(cw, ch));
    raysRT.setSize(
      Math.max(32, Math.round(cw * 0.5)),
      Math.max(32, Math.round(ch * 0.5))
    );
    u.size.value.set(cw, ch);
    u.reset.value = 1;
  }

  function stepBake(renderer, delta) {
    aimBake(delta);
    if (bake.slot >= 0) {
      u.levelBase.value = bake.level;
      renderer.compute(bakeKernels[bake.slot]);
      bake.level += LEVELS_PER_CHUNK;
      if (bake.level >= BAKE_NY) {
        bake.shown = bake.slot;
        bake.slot = -1;
        bake.fade = 0;
      }
    } else if (bake.fade >= 1) {
      const moved = aim.target.angleTo(u.bakeDirs[bake.shown].value) > 0.008;
      if (bake.dirty || moved) {
        bake.slot = 1 - bake.shown;
        bake.level = 0;
        bake.dirty = false;
        u.bakeDirs[bake.slot].value.copy(aim.target);
      }
    }
    bake.fade = Math.min(1, bake.fade + delta / BAKE_FADE);
    const toward = bake.shown;
    u.bakeMix.value = toward === 1 ? bake.fade : 1 - bake.fade;
    terrain.follow(u.keyDir.value, delta);
  }

  function runPass(renderer, material, rt) {
    quad.material = material;
    renderer.setRenderTarget(rt);
    quad.render(renderer);
  }

  // Nightscape's adapt(): resolution follows measured frame time, with wide
  // hysteresis so changes are rare.
  function adapt(rawDt) {
    if (rawDt > 0.25) return;
    perf.acc += rawDt;
    perf.n += 1;
    if (perf.n < 90) return;
    const avg = (perf.acc / perf.n) * 1000;
    perf.acc = 0;
    perf.n = 0;
    if (avg > 24 && scale > SCALE_MIN) {
      scale = Math.max(SCALE_MIN, scale - (avg > 40 ? 0.12 : 0.06));
      perf.lastDrop = clock;
      perf.lastChange = clock;
    } else if (
      avg < 17.2 &&
      scale < SCALE_MAX &&
      clock - perf.lastDrop > 30 &&
      clock - perf.lastChange > 8
    ) {
      scale = Math.min(SCALE_MAX, scale + 0.05);
      perf.lastChange = clock;
    }
  }

  return {
    skyNode,
    uniforms: u,

    // The cloud field changed (and with `ground`, the terrain too).
    rebake({ ground = true } = {}) {
      bake.dirty = true;
      if (ground) terrain.rebuild();
    },

    // The moon and sun this frame, which one lights the scene, and how
    // strongly (0 when it is below the horizon). Bakes follow the key.
    // The cloud bake and the terrain in full before the first frame, toward
    // `lights.key`, so the sky shows complete with the rest of the scene.
    async prebake(renderer, lights) {
      const settle = async () => {
        await renderer.backend.device?.queue.onSubmittedWorkDone();
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      };
      this.setLights(lights);
      const slot = 1 - bake.shown;
      u.bakeDirs[slot].value.copy(lights.key);
      const levels = Array.from(
        { length: BAKE_NY / LEVELS_PER_CHUNK },
        (_, i) => i * LEVELS_PER_CHUNK
      );
      await inBatches(levels, 6, settle, (level) => {
        u.levelBase.value = level;
        renderer.compute(bakeKernels[slot]);
      });
      Object.assign(bake, { dirty: false, fade: 1, shown: slot, slot: -1 });
      u.bakeMix.value = slot === 1 ? 1 : 0;
      await terrain.prebake(renderer, lights.key, settle);
      renderer.setRenderTarget(null);
      await settle();
    },

    setField({ coverage, deckLift, heaps, seed, stormHeight, storms }) {
      u.seed.value = seed;
      u.shape.value.set(coverage, deckLift, 1 - heaps, 1 - storms);
      u.stormH.value = stormHeight;
    },

    setLights({ key, keyI, moon, sun }) {
      u.keyDir.value.copy(key);
      u.keyI.value = keyI;
      u.moonDir.value.copy(moon);
      u.sunDir.value.copy(sun);
    },

    // One frame: a bake chunk while the bake runs, then the cloud march,
    // accumulation and shafts for the camera, turned into sky space by
    // `yaw`, flying `speed` units per second along the path.
    render(
      renderer,
      camera,
      yaw,
      { altitude, autoScale, delta, resolution, speed }
    ) {
      stepBake(renderer, delta);
      clock += delta;
      flight += Math.min(delta, 0.1) * speed;
      if (autoScale) adapt(delta);
      else scale = resolution;

      renderer.getSize(viewSize);
      renderer.getDrawingBufferSize(drawSize);
      resize(viewSize.x, viewSize.y);

      camera.matrixWorld.extractBasis(basis[0], basis[1], basis[2]);
      u.camR.value.copy(basis[0]).applyQuaternion(yaw).normalize();
      u.camU.value.copy(basis[1]).applyQuaternion(yaw).normalize();
      u.camF.value.copy(basis[2]).negate().applyQuaternion(yaw).normalize();
      const z = -flight;
      u.camPos.value.set(
        pathX(z),
        3.6 +
          altitude +
          0.3 * Math.sin(flight * 0.057) +
          0.09 * Math.sin(flight * 0.152 + 1),
        z
      );
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      u.tanHalf.value = tanHalf;
      u.aspect.value = camera.aspect;
      u.time.value = clock;
      u.frame.value += 1;
      u.pixAng.value = (2 * tanHalf) / drawSize.y;
      u.pixAngC.value = (2 * tanHalf) / cloudRT.height;

      const f = u.camF.value;
      const r = u.camR.value;
      const up = u.camU.value;
      const md = u.keyDir.value;
      const mf = md.dot(f);
      let fade = 0;
      if (mf > 0.05) {
        const mx = md.dot(r) / mf / (tanHalf * camera.aspect);
        const my = md.dot(up) / mf / tanHalf;
        u.moonUV.value.set(0.5 + 0.5 * mx, 0.5 + 0.5 * my);
        fade = THREE.MathUtils.clamp(
          (1.6 - Math.max(Math.abs(mx), Math.abs(my))) / 0.6,
          0,
          1
        );
      }
      u.fade.value = fade * u.keyI.value;
      u.moonRuv.value = MOON_R / (2 * tanHalf);

      const previous = renderer.getRenderTarget();
      terrain.step(renderer);
      runPass(renderer, cloudMaterial, cloudRT);
      runPass(renderer, groundMaterial, groundRT);
      const write = 1 - read;
      histNode.value = history[read].texture;
      histSamplerNode.value = history[read].texture;
      runPass(renderer, taaMaterial, history[write]);
      read = write;
      raysCloudNode.value = history[read].texture;
      raysSamplerNode.value = history[read].texture;
      skyCloudNode.value = history[read].texture;
      runPass(renderer, raysMaterial, raysRT);
      renderer.setRenderTarget(previous);

      u.prevPos.value.copy(u.camPos.value);
      u.prevR.value.copy(u.camR.value);
      u.prevU.value.copy(u.camU.value);
      u.prevF.value.copy(u.camF.value);
      u.prevTanHalf.value = u.tanHalf.value;
      u.prevAspect.value = u.aspect.value;
      u.reset.value = 0;
    },

    dispose() {
      [cloudMaterial, groundMaterial, taaMaterial, raysMaterial].forEach((m) =>
        m.dispose()
      );
      [cloudRT, groundRT, raysRT, ...history].forEach((rt) => rt.dispose());
      terrain.dispose();
      bakes.forEach((b) => b.dispose());
    },
  };
}
