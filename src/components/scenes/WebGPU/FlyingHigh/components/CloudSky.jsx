import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import { useFrame, useLoader, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { textureFile } from '@utils/appUtils';

import { bodies } from '../utils/dayCycle';
import createSkyPasses from '../utils/sky/createSkyPasses';
import { flightYaw } from '../utils/sky/flight';

const MOON_MAP = textureFile('nightscape/moon-lroc-512.jpg');
const MOONLIGHT = new THREE.Color('#9fb6dc');
const SUNLIGHT = new THREE.Color('#fff1dc');
const DUSKLIGHT = new THREE.Color('#ffa868');

const fieldOf = (config) => ({
  coverage: config.skyCoverage,
  deckLift: config.skyDeckLift,
  heaps: config.skyHeaps,
  seed: config.skySeed,
  stormHeight: config.skyStormHeight,
  storms: config.skyStorms,
});

// One sky per renderer, baked in full before it is handed out: the scene
// suspends (and the loader stays up) until the clouds and ground are ready,
// so everything appears at once.
const prepared = new WeakMap();
function usePreparedSky(gl, moonMap, config) {
  let entry = prepared.get(gl);
  if (!entry || entry.moonMap !== moonMap) {
    moonMap.wrapS = THREE.RepeatWrapping; // eslint-disable-line no-param-reassign
    const sky = createSkyPasses({ moonMap });
    sky.setField(fieldOf(config));
    const day = config.cycleEnabled
      ? Number(config.skyDay >= 0.5)
      : config.skyDay;
    entry = { moonMap, ready: false, sky };
    entry.promise = sky.prebake(gl, bodies(day, config)).then(
      () => {
        entry.ready = true;
      },
      (error) => {
        entry.error = error;
      }
    );
    prepared.set(gl, entry);
  }
  if (entry.error) throw entry.error;
  if (!entry.ready) throw entry.promise;
  return entry.sky;
}

// Nightscape's moonlit (or sunlit) sea of clouds as the scene background,
// with a directional light from whichever of the moon or sun is up on the
// plane, warming through dusk and fading as it sets. `cycle` carries the
// live day/night blend (see useDayCycle).
function CloudSky({ config, cycle }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const moonMap = useLoader(THREE.TextureLoader, MOON_MAP);
  const sky = usePreparedSky(gl, moonMap, config);
  useEffect(
    () => () => {
      sky.dispose();
      prepared.delete(gl);
    },
    [gl, sky]
  );

  useLayoutEffect(() => {
    scene.backgroundNode = sky.skyNode;
    return () => {
      scene.backgroundNode = null;
    };
  }, [scene, sky]);

  const yaw = useMemo(
    () =>
      flightYaw(config.planeRotXDeg, config.planeRotYDeg, config.planeRotZDeg),
    [config.planeRotXDeg, config.planeRotYDeg, config.planeRotZDeg]
  );

  const u = sky.uniforms;
  u.twinkle.value = config.skyTwinkle;
  u.starLow.value = config.skyStarLow;
  u.lamps.value = config.skyTownLights;

  const groundSeed = useRef(config.skySeed);
  const field = [
    config.skySeed,
    config.skyCoverage,
    config.skyDeckLift,
    config.skyHeaps,
    config.skyStorms,
    config.skyStormHeight,
  ].join();
  const bakedField = useRef(field);
  useEffect(() => {
    if (bakedField.current === field) return;
    bakedField.current = field;
    sky.setField(fieldOf(config));
    sky.rebake({ ground: groundSeed.current !== config.skySeed });
    groundSeed.current = config.skySeed;
  }, [field, sky]);

  const options = useRef({});
  Object.assign(options.current, {
    altitude: config.skyAltitude,
    autoScale: config.skyAutoResolution,
    resolution: config.skyResolution,
    speed: config.skySpeed,
  });
  const directional = useRef(null);
  useFrame((state, delta) => {
    const c = cycle.current;
    const { active, day, grade, keyI, warm } = c;
    u.day.value = day;
    sky.setLights(c);
    u.rays.value = active ? grade.rays : config.gradeRays;
    const lamp = directional.current;
    if (lamp) {
      lamp.color
        .copy(MOONLIGHT)
        .lerp(SUNLIGHT, day)
        .lerp(DUSKLIGHT, 0.8 * warm);
      lamp.intensity =
        THREE.MathUtils.lerp(config.skyMoonLight, config.skySunLight, day) *
        keyI;
      lamp.position.copy(c.keyWorld).multiplyScalar(60);
    }
    state.camera.updateMatrixWorld();
    sky.render(gl, state.camera, yaw, { ...options.current, delta });
  }, 0);

  return <directionalLight ref={directional} />;
}

export default memo(CloudSky);
