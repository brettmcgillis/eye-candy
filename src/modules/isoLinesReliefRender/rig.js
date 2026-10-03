import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  applyShading,
  createShading,
  uploadBuild,
} from '@modules/isoLinesRender';

import {
  createBoxTemplate,
  createPlane,
  createSkirts,
  createWallTemplate,
} from './geometry';
import createLayer from './layer';
import {
  createBoxMaterial,
  createGroundMaterial,
  createLayerMaterial,
  createSkirtMaterial,
  createSurfaceMaterial,
  createWallMaterial,
} from './materials';

const MAX_LAYERS = 72;
const SEGMENT_ATTRIBUTES = ['aSeg', 'aMiter', 'aInfo'];
const DEG = Math.PI / 180;
// Sharp terraces rise inside a single field cell; the surface samples the
// bilinear field between grid points to place the riser.
const SURFACE_SUBDIVISION = 3;

// The relief as one imperative object, drawn by the scene, the headless
// CLIs and Darkroom alike: `apply(config)` sets the look, `setBuild(build)`
// takes what @modules/isoLines' builder made (with segmentMode's geometry),
// `setMotion` / `setTime` drive the build, the rise and a trail's ageing.
// The piece lies on the ground: map up is world -z, height is world +y.
export default function createReliefRig() {
  const s = createShading();
  const roughness = uniform(0.85);
  const kMin = uniform(0);
  const form = { sharpness: uniform(0), smooth: uniform(0) };
  const groundColor = uniform(new THREE.Color('#101218'));

  const group = new THREE.Group();
  const map = new THREE.Group();
  map.rotation.x = -Math.PI / 2;
  group.add(map);

  let aspect = 1;

  const layers = new THREE.InstancedMesh(
    createPlane(1),
    createLayerMaterial(s, kMin, roughness),
    MAX_LAYERS
  );
  layers.frustumCulled = false;
  layers.castShadow = true;
  layers.receiveShadow = true;
  const skirts = new THREE.Mesh(
    createSkirts(1),
    createSkirtMaterial(s, form, roughness)
  );
  skirts.frustumCulled = false;
  skirts.castShadow = true;
  skirts.receiveShadow = true;
  const ground = new THREE.Mesh(
    createPlane(1),
    createGroundMaterial(groundColor, roughness)
  );
  ground.position.z = -0.004;
  ground.receiveShadow = true;
  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2, 1, 1),
    createSurfaceMaterial(s, form, roughness)
  );
  surface.frustumCulled = false;
  surface.castShadow = true;
  surface.receiveShadow = true;
  let surfaceGrid = '';
  map.add(layers, skirts, ground, surface);

  const walls = createLayer({
    attributes: SEGMENT_ATTRIBUTES,
    buildMaterial: () => createWallMaterial(s, roughness),
    geometry: createWallTemplate(),
    group: map,
  });
  const boxTemplate = createBoxTemplate();
  const boxes = createLayer({
    attributes: SEGMENT_ATTRIBUTES,
    buildMaterial: () => createBoxMaterial(s, roughness),
    geometry: boxTemplate,
    group: map,
  });
  const trailMaterial = createBoxMaterial(s, roughness, { trail: true });
  const head = createLayer({
    attributes: SEGMENT_ATTRIBUTES,
    geometry: boxTemplate,
    group: map,
    material: trailMaterial,
  });
  const slices = new Map();

  const key = new THREE.DirectionalLight('#fff4e6', 2.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.01;
  const sky = new THREE.HemisphereLight('#eef0ff', '#30282a', 0.7);
  group.add(key, key.target, sky);

  let current = null;

  function clearSlices() {
    slices.forEach((layer) => layer.dispose());
    slices.clear();
  }

  function setAspect(next) {
    if (next === aspect) return;
    aspect = next;
    s.u.aspect.value = aspect;
    [layers, ground].forEach((mesh) => {
      mesh.geometry.dispose();
      // eslint-disable-next-line no-param-reassign
      mesh.geometry = createPlane(aspect);
    });
    skirts.geometry.dispose();
    skirts.geometry = createSkirts(aspect);
  }

  function aimLight(config) {
    const az = config.lightAzimuth * DEG;
    const el = config.lightElevation * DEG;
    const reach = Math.hypot(aspect, 1) * 1.15;
    key.position.set(
      Math.cos(az) * Math.cos(el) * 8,
      Math.sin(el) * 8,
      Math.sin(az) * Math.cos(el) * 8
    );
    key.target.position.set(0, 0, 0);
    Object.assign(key.shadow.camera, {
      bottom: -reach,
      far: 20,
      left: -reach,
      near: 0.5,
      right: reach,
      top: reach,
    });
    key.shadow.camera.updateProjectionMatrix();
  }

  function layout(config) {
    const terraced = config.style === 'terraced';
    const smooth = config.style === 'smooth';
    const solid = terraced && config.wallMode === 'solid';
    form.smooth.value = smooth ? 1 : 0;
    form.sharpness.value = config.terraceSharpness;
    surface.visible = smooth;
    const trail = !terraced && config.lineExtrude === 'time';
    layers.visible = terraced;
    skirts.visible = solid || smooth;
    if (!solid) walls.clear();
    if (terraced || trail) boxes.clear();
    if (!trail) {
      head.clear();
      clearSlices();
    }
    const low = Math.floor(-config.levelOffset);
    const high = Math.floor(config.levels - config.levelOffset);
    kMin.value = low;
    layers.count = Math.min(MAX_LAYERS, high - low + 1);
  }

  return {
    group,

    apply(config) {
      current = config;
      applyShading(s, config);
      const { u } = s;
      u.relief.value = config.relief * 2;
      u.lineHeight.value = config.lineHeight * 2;
      u.lineThickness.value = config.lineThickness * 2;
      u.trailSpan.value = config.trailSeconds * (config.trailSlices - 1);
      u.trailFade.value = config.trailFade;
      roughness.value = config.roughness;
      groundColor.value.set(config.groundColor);
      key.intensity = config.lightIntensity;
      sky.intensity = config.ambient;
      aimLight(config);
      layout(config);
    },

    // What createIsoBuilder().build returned.
    setBuild(build) {
      setAspect(build.aspect);
      uploadBuild(s, build);
      const grid = `${build.aspect}|${build.nx}|${build.ny}`;
      if (grid !== surfaceGrid) {
        surfaceGrid = grid;
        surface.geometry.dispose();
        surface.geometry = new THREE.PlaneGeometry(
          2 * build.aspect,
          2,
          build.nx * SURFACE_SUBDIVISION,
          build.ny * SURFACE_SUBDIVISION
        );
      }
      if (current) aimLight(current);

      const { mode, segments } = build;
      if (mode === 'walls') walls.set(segments.data, segments.count);
      else walls.clear();
      if (mode === 'lines') boxes.set(segments.data, segments.count);
      else boxes.clear();
      if (mode === 'trail') {
        head.set(segments.data, segments.count);
        const { oldest, reset, slices: fresh } = build.trail;
        if (reset) clearSlices();
        fresh.forEach(({ segments: slice, tick }) => {
          if (slices.has(tick)) return;
          const layer = createLayer({
            attributes: SEGMENT_ATTRIBUTES,
            geometry: boxTemplate,
            group: map,
            material: trailMaterial,
          });
          layer.set(slice.data, slice.count);
          slices.set(tick, layer);
        });
        [...slices.keys()]
          .filter((tick) => tick < oldest)
          .forEach((tick) => {
            slices.get(tick).dispose();
            slices.delete(tick);
          });
      } else {
        head.clear();
        clearSlices();
      }
    },

    // build: heights capped at `cutoff` (0..1 of the field); rise: relief
    // and lighting scaled together.
    setMotion({ cutoff = 1, rise = 1 }) {
      s.u.cutoff.value = cutoff;
      s.u.rise.value = rise;
    },

    setTime(seconds) {
      s.u.time.value = seconds;
    },

    setPixelRatio(ratio) {
      s.u.pixelRatio.value = ratio;
    },

    dispose() {
      clearSlices();
      [walls, boxes, head].forEach((layer) => layer.dispose());
      boxTemplate.dispose();
      trailMaterial.dispose();
      [layers, skirts, ground, surface].forEach((mesh) => {
        mesh.geometry.dispose();
      });
      [layers, skirts, ground, surface].forEach((mesh) =>
        mesh.material.dispose()
      );
      s.dispose();
      key.dispose();
    },
  };
}
