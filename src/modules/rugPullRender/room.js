import {
  float,
  floor,
  fract,
  hash,
  mix,
  mx_noise_float, // eslint-disable-line camelcase
  positionWorld,
  sin,
  smoothstep,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

function planksMaterial(tint) {
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.62 });
  const p = positionWorld;
  const width = float(0.17);
  const row = floor(p.z.div(width));
  const across = fract(p.z.div(width));
  const shift = hash(row.add(17)).mul(3.1);
  const along = p.x.add(shift).div(1.9);
  const board = floor(along);
  const tone = mix(0.72, 1.12, hash(row.mul(31).add(board).add(400)));
  const grain = mx_noise_float(vec3(p.x.mul(1.5), p.z.mul(42), board))
    .mul(0.5)
    .add(0.5);
  const streak = sin(p.x.mul(18).add(grain.mul(6)))
    .mul(0.06)
    .add(1);
  const seam = smoothstep(0, 0.03, across)
    .mul(smoothstep(1, 0.97, across))
    .mul(smoothstep(0, 0.004, fract(along)));
  material.colorNode = tint
    .mul(tone)
    .mul(streak)
    .mul(mix(0.35, 1, seam));
  material.roughnessNode = mix(0.5, 0.78, grain);
  return material;
}

function plasterMaterial(tint) {
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.95 });
  const n = mx_noise_float(positionWorld.mul(3.2)).mul(0.04);
  const fine = mx_noise_float(positionWorld.mul(28)).mul(0.02);
  material.colorNode = tint.mul(float(1).add(n).add(fine));
  return material;
}

const ROD = new THREE.MeshStandardMaterial({
  color: '#3a2a1e',
  metalness: 0.2,
  roughness: 0.45,
});
const BRASS = new THREE.MeshStandardMaterial({
  color: '#9c7a3c',
  metalness: 0.85,
  roughness: 0.35,
});

// Floor, wall, baseboard and the hanging hardware; `place` moves the wall
// for the mode and fits the rod to the rug.
export default function createRoom() {
  const u = {
    floor: uniform(new THREE.Color('#5a4434')),
    wall: uniform(new THREE.Color('#d8cbb6')),
  };
  const group = new THREE.Group();
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    planksMaterial(u.floor)
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  const wallMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 8),
    plasterMaterial(u.wall)
  );
  wallMesh.receiveShadow = true;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.12, 0.02),
    new THREE.MeshStandardMaterial({ color: '#efe8dc', roughness: 0.6 })
  );
  base.receiveShadow = true;
  base.castShadow = true;
  const hardware = new THREE.Group();
  group.add(floorMesh, wallMesh, base, hardware);

  function clearHardware() {
    hardware.children.forEach((child) => child.geometry.dispose());
    hardware.clear();
  }

  function add(geometry, material, position, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    hardware.add(mesh);
  }

  return {
    group,
    u,

    place({ clipCount, hangStyle, length, mode, rodHeight, wallGap, width }) {
      clearHardware();
      const wallZ = mode === 'wall' ? 0 : -(length / 2 + 1.7);
      wallMesh.position.set(0, 4, wallZ);
      base.position.set(0, 0.06, wallZ + 0.01);
      if (mode !== 'wall') return;
      const y = rodHeight + 0.01;
      const z = wallGap;
      if (hangStyle === 'corners') {
        [-1, 1].forEach((side) => {
          add(
            new THREE.CylinderGeometry(0.006, 0.006, 0.05, 8),
            BRASS,
            [(side * width) / 2, y, z * 0.6],
            [Math.PI / 2, 0, 0]
          );
        });
        return;
      }
      const span = width + 0.24;
      add(
        new THREE.CylinderGeometry(0.016, 0.016, span, 16),
        ROD,
        [0, y + 0.02, z],
        [0, 0, Math.PI / 2]
      );
      [-1, 1].forEach((side) => {
        add(new THREE.SphereGeometry(0.03, 16, 12), ROD, [
          (side * span) / 2,
          y + 0.02,
          z,
        ]);
        add(new THREE.BoxGeometry(0.02, 0.06, z + 0.01), BRASS, [
          side * (span / 2 - 0.06),
          y + 0.02,
          z / 2,
        ]);
      });
      if (hangStyle === 'clips') {
        const n = Math.max(2, Math.round(clipCount));
        for (let c = 0; c < n; c += 1) {
          const x = (c / (n - 1) - 0.5) * width;
          add(new THREE.TorusGeometry(0.03, 0.005, 8, 20), BRASS, [x, y, z]);
        }
      }
    },

    dispose() {
      clearHardware();
      [floorMesh, wallMesh, base].forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
    },
  };
}
