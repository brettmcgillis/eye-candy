/* eslint-disable no-param-reassign */
import {
  abs,
  float,
  max,
  mix,
  normalize,
  output,
  positionLocal,
  positionWorld,
  smoothstep,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { directionOf } from '@modules/exhibitA';

import { toneOutput } from './look';

const color = (hex = '#000000') => uniform(new THREE.Color(hex));
const DEG = Math.PI / 180;

// The rim light sits behind and above the exhibit, opposite the key.
export const RIM_OFFSET = 165;
export const RIM_ELEVATION = 30;

export function createStageUniforms() {
  return {
    ambient: uniform(1),
    background: color('#5b5853'),
    exposure: uniform(1.2),
    lightColor: color('#fff1dc'),
    lightDir: uniform(new THREE.Vector3(0, 1, 0)),
    rimColor: color('#ffffff'),
    rimDir: uniform(new THREE.Vector3(0, 1, 0)),
    shadowHardness: uniform(8),
    skyHorizon: color('#efe7da'),
    skyZenith: color('#a9b1be'),
    softboxes: uniform(1.2),
  };
}

export function applyStage(s, config, lightAzimuth = config.lightAzimuth) {
  s.ambient.value = config.ambient;
  s.background.value.set(config.background);
  s.exposure.value = config.exposure;
  s.lightColor.value
    .set(config.lightColor)
    .multiplyScalar(config.lightIntensity);
  s.lightDir.value.set(...directionOf(lightAzimuth, config.lightElevation));
  s.rimColor.value.set(config.lightColor).multiplyScalar(config.rimIntensity);
  s.rimDir.value.set(...directionOf(lightAzimuth + RIM_OFFSET, RIM_ELEVATION));
  s.shadowHardness.value = 1 / config.shadowSoftness;
  s.skyHorizon.value.set(config.skyHorizon);
  s.skyZenith.value.set(config.skyZenith);
  s.softboxes.value = config.softboxes;
}

// Two tall strip boxes behind the exhibit from the default camera, at these
// azimuths, and a large box overhead.
const STRIPS = [-65, -175].map((a) => [Math.cos(a * DEG), Math.sin(a * DEG)]);

// The studio as the exhibit sees it: a sky gradient over the lit sweep of
// the backdrop, plus softboxes, so a polished exhibit has something bright
// to reflect wherever it faces. The raster materials see it baked into a
// PMREM; the field march reads it directly.
export const skyColor = (s, dir) => {
  const sky = mix(s.skyHorizon, s.skyZenith, smoothstep(0, 0.7, dir.y));
  const sweep = s.background.mul(0.85);
  const base = mix(sweep, sky, smoothstep(-0.12, 0.04, dir.y));
  const overhead = smoothstep(Math.cos(40 * DEG), Math.cos(26 * DEG), dir.y);
  const flat = normalize(vec2(dir.x, dir.z).add(vec2(1e-5, 0)));
  const tall = smoothstep(-0.2, -0.05, dir.y).mul(
    float(1).sub(smoothstep(0.55, 0.75, dir.y))
  );
  const strips = STRIPS.reduce(
    (sum, [x, z]) =>
      sum.add(
        smoothstep(
          Math.cos(9 * DEG),
          Math.cos(5 * DEG),
          flat.dot(vec2(x, z))
        ).mul(tall)
      ),
    float(0)
  );
  return base.add(
    vec3(1, 0.97, 0.92).mul(
      overhead.mul(2.2).add(strips.mul(3)).mul(s.softboxes)
    )
  );
};

// The light a matte surface facing `n` collects from the studio: the
// gradient, plus each softbox by its solid angle times its cosine — what the
// raster PMREM's irradiance integrates, for the field march.
export const studioIrradiance = (s, n) => {
  const strips = STRIPS.reduce(
    (sum, [x, z]) => sum.add(max(n.dot(vec3(x, 0.2, z)), 0)),
    float(0)
  );
  const boxes = max(n.y, 0).mul(1).add(strips.mul(0.27));
  const below = s.background.mul(0.85);
  const above = mix(s.skyHorizon, s.skyZenith, 0.5);
  return mix(below, above, n.y.mul(0.5).add(0.5)).add(
    vec3(1, 0.97, 0.92).mul(boxes).mul(s.softboxes)
  );
};

function createSkyPmrem(s) {
  let key = null;
  let target = null;
  let generator = null;
  return {
    get texture() {
      return target?.texture ?? null;
    },
    update(renderer, config) {
      const next = [
        config.skyZenith,
        config.skyHorizon,
        config.background,
        config.softboxes,
      ].join('|');
      if (next === key) return false;
      key = next;
      applyStage(s, config);
      generator ??= new THREE.PMREMGenerator(renderer);
      const scene = new THREE.Scene();
      const material = new THREE.MeshBasicNodeMaterial({
        side: THREE.BackSide,
      });
      material.colorNode = skyColor(s, normalize(positionWorld));
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(50, 64, 32),
        material
      );
      scene.add(dome);
      const previous = target;
      target = generator.fromScene(scene, 0, 0.1, 100);
      dome.geometry.dispose();
      material.dispose();
      previous?.dispose();
      return true;
    },
    dispose() {
      target?.dispose();
      generator?.dispose();
    },
  };
}

// Unit plinths, top at y = 0, bottom at y = -1, radius / half-width 1.
const COLUMN = [
  [0, -1],
  [1, -1],
  [1, -0.012],
  [0.988, 0],
  [0, 0],
];
const TURNED = [
  [0, -1],
  [1, -1],
  [1, -0.95],
  [0.93, -0.92],
  [0.93, -0.88],
  [0.82, -0.84],
  [0.74, -0.8],
  [0.72, -0.22],
  [0.78, -0.17],
  [0.9, -0.12],
  [0.93, -0.07],
  [1, -0.05],
  [1, 0],
  [0, 0],
];

function plinthGeometry(style) {
  if (style === 'block') {
    const box = new THREE.BoxGeometry(2, 1, 2);
    box.translate(0, -0.5, 0);
    return box;
  }
  const profile = (style === 'turned' ? TURNED : COLUMN).map(
    ([r, y]) => new THREE.Vector2(r, y)
  );
  return new THREE.LatheGeometry(profile, 96);
}

function createPlinthMaterial(s, plinthUniforms) {
  const material = new THREE.MeshPhysicalNodeMaterial();
  material.colorNode = plinthUniforms.color;
  material.roughnessNode = plinthUniforms.roughness;
  material.metalnessNode = float(0);
  material.outputNode = toneOutput(output, s.exposure);
  return material;
}

function createMountMaterial(s) {
  const material = new THREE.MeshPhysicalNodeMaterial({
    color: new THREE.Color('#b08d45'),
    metalness: 1,
    roughness: 0.32,
  });
  material.outputNode = toneOutput(output, s.exposure);
  return material;
}

// A soft darkening round the plinth's foot, standing in for the contact
// occlusion the field march gave Apollian's floor.
function createContactMaterial(contact) {
  const material = new THREE.MeshBasicNodeMaterial({
    depthWrite: false,
    transparent: true,
  });
  const p = vec2(positionLocal.x, positionLocal.y);
  const round = p.length().sub(contact.width);
  const square = max(abs(p.x), abs(p.y)).sub(contact.width);
  const outside = mix(round, square, contact.square).max(0);
  material.colorNode = contact.color;
  material.opacityNode = float(1)
    .sub(smoothstep(0, contact.width.mul(0.5), outside))
    .mul(contact.strength);
  return material;
}

export default function createStage(s) {
  const group = new THREE.Group();
  const sky = createSkyPmrem(s);

  const plinthUniforms = {
    color: color('#8f8a94'),
    roughness: uniform(0.6),
  };
  const plinthMaterial = createPlinthMaterial(s, plinthUniforms);
  const plinths = Object.fromEntries(
    ['column', 'block', 'turned'].map((style) => {
      const mesh = new THREE.Mesh(plinthGeometry(style), plinthMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.visible = false;
      group.add(mesh);
      return [style, mesh];
    })
  );

  const mount = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 1, 24),
    createMountMaterial(s)
  );
  mount.castShadow = true;
  group.add(mount);

  const floorMaterial = new THREE.ShadowNodeMaterial({ transparent: true });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const contact = {
    color: color('#0b0a0e'),
    square: uniform(0),
    strength: uniform(0.5),
    width: uniform(1),
  };
  const contactMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    createContactMaterial(contact)
  );
  contactMesh.rotation.x = -Math.PI / 2;
  contactMesh.renderOrder = 1;
  group.add(contactMesh);

  // The shadow map is redrawn only when something that casts changes
  // (`refreshShadow`): a turntable orbits the camera, not the light, and the
  // field proxy marches the whole fractal again for every shadow texel.
  const key = new THREE.DirectionalLight('#ffffff', 1);
  key.castShadow = true;
  key.shadow.autoUpdate = false;
  key.shadow.needsUpdate = true;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.004;
  key.shadow.radius = 3;
  group.add(key);
  group.add(key.target);

  const rim = new THREE.DirectionalLight('#ffffff', 1);
  group.add(rim);
  group.add(rim.target);

  return {
    group,
    key,

    refreshShadow() {
      key.shadow.needsUpdate = true;
    },

    get environment() {
      return sky.texture;
    },

    apply(config, layout, lightAzimuth = config.lightAzimuth) {
      plinthUniforms.color.value.set(config.plinthColor);
      plinthUniforms.roughness.value = config.plinthRoughness;
      Object.entries(plinths).forEach(([style, mesh]) => {
        mesh.visible = style === layout.plinth;
        mesh.scale.set(
          layout.plinthWidth,
          layout.plinthHeight,
          layout.plinthWidth
        );
        mesh.position.set(0, layout.plinthTop, 0);
      });

      const hasPlinth = layout.plinth !== 'none';
      mount.visible = Boolean(layout.mount);
      if (layout.mount) {
        const { from, to } = layout.mount;
        const length = Math.max(to[1] - from[1], 1e-4);
        const radius = 0.012 * layout.size;
        mount.scale.set(radius, length + radius, radius);
        mount.position.set(from[0], from[1] + length / 2, from[2]);
      }

      const reach = Math.max(layout.radius, layout.plinthWidth) * 60;
      floor.visible = config.floorEnabled;
      floor.scale.set(reach, reach, 1);
      floor.position.y = layout.floorY;
      floorMaterial.color.set(config.floorColor);
      floorMaterial.opacity = config.floorShadow;

      contactMesh.visible = config.floorEnabled && hasPlinth;
      contactMesh.position.y = layout.floorY + 0.0005 * layout.size;
      const footprint = layout.plinthWidth * 3;
      contactMesh.scale.set(footprint, footprint, 1);
      contact.width.value = layout.plinthWidth / footprint;
      contact.square.value = layout.plinth === 'block' ? 1 : 0;
      contact.color.value.set(config.floorColor);
      contact.strength.value = config.floorShadow * 0.55;

      const dir = directionOf(lightAzimuth, config.lightElevation);
      const centreY = (layout.bounds.max[1] + layout.bounds.min[1]) / 2;
      const extent =
        Math.hypot(
          Math.max(layout.radius, layout.plinthWidth * 1.5),
          (layout.bounds.max[1] - layout.bounds.min[1]) / 2
        ) * 1.15;
      const distance = extent * 3;
      key.color.set(config.lightColor);
      key.intensity = config.lightIntensity * Math.PI;
      key.position.set(
        dir[0] * distance,
        centreY + dir[1] * distance,
        dir[2] * distance
      );
      key.target.position.set(0, centreY, 0);
      const back = directionOf(lightAzimuth + RIM_OFFSET, RIM_ELEVATION);
      rim.color.set(config.lightColor);
      rim.intensity = config.rimIntensity * Math.PI;
      rim.position.set(
        back[0] * distance,
        centreY + back[1] * distance,
        back[2] * distance
      );
      rim.target.position.set(0, centreY, 0);
      const cam = key.shadow.camera;
      cam.left = -extent;
      cam.right = extent;
      cam.top = extent;
      cam.bottom = -extent;
      cam.near = distance - extent * 2;
      cam.far = distance + extent * 2;
      cam.updateProjectionMatrix();
      if (key.shadow.mapSize.x !== config.shadowMapSize) {
        key.shadow.mapSize.set(config.shadowMapSize, config.shadowMapSize);
        key.shadow.map?.dispose();
        key.shadow.map = null;
      }
    },

    updateEnvironment(renderer, config) {
      return sky.update(renderer, config);
    },

    dispose() {
      Object.values(plinths).forEach((mesh) => mesh.geometry.dispose());
      plinthMaterial.dispose();
      mount.geometry.dispose();
      mount.material.dispose();
      floor.geometry.dispose();
      floorMaterial.dispose();
      contactMesh.geometry.dispose();
      contactMesh.material.dispose();
      key.shadow.map?.dispose();
      sky.dispose();
    },
  };
}
