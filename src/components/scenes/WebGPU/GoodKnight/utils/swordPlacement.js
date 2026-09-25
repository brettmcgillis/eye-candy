import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Vector3,
} from 'three';

import { mulberry32 } from '@utils/noise2d';

const TORSO_MATERIALS = [
  'TorsoMetal',
  'GorgetMetal',
  'BeltsBucklesTorso',
  'Ridges',
  'Belt',
  'ChainMail',
];
const DEG = Math.PI / 180;

// Skinned armor frozen at rest, as plain meshes a Raycaster can hit.
export function restTorsoTargets(meshes) {
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const v = new Vector3();
  return meshes
    .filter((mesh) => TORSO_MATERIALS.includes(mesh.material.name))
    .map((mesh) => {
      mesh.skeleton.update();
      const source = mesh.geometry.attributes.position;
      const positions = new Float32Array(source.count * 3);
      for (let i = 0; i < source.count; i += 1) {
        mesh.getVertexPosition(i, v).applyMatrix4(mesh.matrixWorld);
        v.toArray(positions, i * 3);
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(positions, 3));
      if (mesh.geometry.index) geometry.setIndex(mesh.geometry.index.clone());
      return new Mesh(geometry, material);
    });
}

export function swordFrame(tipward, roll, guard) {
  const y = tipward.clone().normalize();
  const helper =
    Math.abs(y.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
  const x = new Vector3().crossVectors(helper, y).normalize();
  x.applyAxisAngle(y, roll);
  const z = new Vector3().crossVectors(x, y);
  return new Matrix4().makeBasis(x, y, z).setPosition(guard);
}

export function placeSwords(
  targets,
  blades,
  { count, seed, spread, heightMin, heightMax, width, gapMin, gapMax, waist }
) {
  const rand = mulberry32(seed);
  const raycaster = new Raycaster();
  const placements = [];
  let attempts = 0;
  while (placements.length < count && attempts < count * 6) {
    attempts += 1;
    const yaw = (rand() * 2 - 1) * spread * DEG;
    const pitch = (rand() * 1.5 - 0.5) * spread * DEG;
    const dir = new Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      -Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch)
    );
    const aim = new Vector3(
      (rand() * 2 - 1) * width,
      heightMin + rand() * (heightMax - heightMin),
      0.03
    );
    raycaster.set(aim.clone().addScaledVector(dir, -1), dir);
    const [hit] = raycaster.intersectObjects(targets, false);
    const variant = Math.floor(rand() * blades.length);
    const gap = gapMin + rand() * (gapMax - gapMin);
    const roll = rand() * Math.PI * 2;
    if (hit) {
      placements.push({
        variant,
        host: hit.point.y < waist ? 'hips' : 'chest',
        world: swordFrame(
          dir,
          roll,
          hit.point.clone().addScaledVector(dir, -gap)
        ),
        gap,
      });
    }
  }
  return placements;
}
