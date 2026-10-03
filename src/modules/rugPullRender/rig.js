import * as THREE from 'three/webgpu';

import createRugMaterial from './material';
import createRoom from './room';

export const FLOOR_GAP = 0.006;
export const WALL_GAP = 0.035;

function knotTexture(build) {
  const tex = new THREE.DataTexture(build.rgba, build.cols, build.rows);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

function gridGeometry(nx, ny) {
  const geometry = new THREE.BufferGeometry();
  const uvs = new Float32Array(nx * ny * 2);
  for (let j = 0; j < ny; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      uvs[(j * nx + i) * 2] = i / (nx - 1);
      uvs[(j * nx + i) * 2 + 1] = j / (ny - 1);
    }
  }
  const index = [];
  for (let j = 0; j < ny - 1; j += 1) {
    for (let i = 0; i < nx - 1; i += 1) {
      const a = j * nx + i;
      index.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1);
    }
  }
  const position = new THREE.BufferAttribute(new Float32Array(nx * ny * 3), 3);
  position.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', position);
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(index);
  return geometry;
}

// The rug in its room, as one imperative object drawn by the scene and the
// headless CLI alike. `setBuild` takes @modules/rugPull's woven build,
// `setLayout` a cloth layout and mode, `updateCloth` the solver's positions.
export default function createRugRig() {
  const group = new THREE.Group();
  const rug = createRugMaterial();
  const room = createRoom();
  let mesh = null;
  let mode = 'floor';
  let size = { length: 2, width: 1.7 };

  const hemi = new THREE.HemisphereLight('#fff6ea', '#4a3a2e', 0.7);
  const key = new THREE.DirectionalLight('#ffe9cf', 2.6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.01;
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.35);
  group.add(room.group, hemi, key, key.target, fill, fill.target);

  function aimLights(rodHeight) {
    const reach = Math.max(size.length, size.width) * 0.75 + 0.6;
    if (mode === 'wall') {
      const midY = rodHeight - size.length / 2;
      key.position.set(-1.6, rodHeight + 1.9, 2.6);
      key.target.position.set(0, midY, 0);
      fill.position.set(2.5, midY, 3);
      fill.target.position.set(0, midY, 0);
    } else {
      key.position.set(2.2, 4.6, 1.6);
      key.target.position.set(0, 0, 0);
      fill.position.set(-3, 2, 3);
      fill.target.position.set(0, 0, 0);
    }
    Object.assign(key.shadow.camera, {
      bottom: -reach,
      far: 14,
      left: -reach,
      near: 0.5,
      right: reach,
      top: reach,
    });
    key.shadow.camera.updateProjectionMatrix();
  }

  return {
    group,

    get mesh() {
      return mesh;
    },

    apply(config) {
      rug.u.pileHeight.value = config.pileHeight;
      rug.u.sheen.value = config.sheen;
      room.u.floor.value.set(config.floorColor);
      room.u.wall.value.set(config.wallColor);
    },

    setBuild(build) {
      rug.u.cols.value = build.cols;
      rug.u.rows.value = build.rows;
      rug.u.kilimV.value = build.kilimRows / build.rows;
      rug.u.warp.value.set(build.colors[build.colors.length - 1]);
      rug.setKnots(knotTexture(build));
    },

    setLayout(
      layout,
      { clipCount = 5, hangStyle = 'rod', mode: next, rodHeight }
    ) {
      mode = next;
      size = { length: layout.length, width: layout.width };
      rug.u.fringeV.value = layout.fringeV;
      rug.u.hideHead.value = mode === 'wall' ? 1 : 0;
      if (!mesh || mesh.geometry.userData.key !== `${layout.nx}x${layout.ny}`) {
        if (mesh) {
          mesh.geometry.dispose();
          group.remove(mesh);
        }
        mesh = new THREE.Mesh(gridGeometry(layout.nx, layout.ny), rug.material);
        mesh.geometry.userData.key = `${layout.nx}x${layout.ny}`;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        group.add(mesh);
      }
      room.place({
        clipCount,
        hangStyle,
        length: layout.totalLength,
        mode,
        rodHeight,
        wallGap: WALL_GAP,
        width: layout.width,
      });
      aimLights(rodHeight);
    },

    updateCloth(positions) {
      if (!mesh) return;
      const attribute = mesh.geometry.attributes.position;
      attribute.array.set(positions);
      attribute.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    },

    dispose() {
      mesh?.geometry.dispose();
      rug.dispose();
      room.dispose();
      key.dispose();
    },
  };
}
