/* eslint-disable no-param-reassign */
import { Matrix4, Quaternion, Vector3 } from 'three';

import { bodyMatrix } from './boneDriver';
import { RAGDOLL_GROUPS } from './ragdoll';

export const CAPACITY = 40;
const THRUST_SECONDS = 0.14;

const inverse = new Matrix4();
const p = new Vector3();
const q = new Quaternion();
const scale = new Vector3();

// Every sword stuck in the knight, placed at load or stabbed in since. A
// record lives in its host body's frame, so it rides the ragdoll for free.
export default class Impalements {
  constructor(world, RAPIER, ragdoll, blades) {
    this.world = world;
    this.RAPIER = RAPIER;
    this.ragdoll = ragdoll;
    this.blades = blades;
    this.records = [];
    this.colliders = true;
  }

  hiltCollider(record) {
    const blade = this.blades[record.variant];
    const half = (record.gap + blade.gripLength) / 2;
    const centre = new Vector3(0, (record.gap - blade.gripLength) / 2, 0);
    record.local.decompose(p, q, scale);
    centre.applyMatrix4(record.local);
    const desc = this.RAPIER.ColliderDesc.cuboid(
      blade.guardHalfWidth * 0.6,
      half,
      0.02
    )
      .setTranslation(centre.x, centre.y, centre.z)
      .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
      .setDensity(400)
      .setCollisionGroups(RAGDOLL_GROUPS);
    return this.world.createCollider(desc, this.ragdoll.bodies[record.segment]);
  }

  add(record) {
    const full = this.records.filter((r) => r.variant === record.variant);
    if (full.length >= CAPACITY) {
      const stab = full.find((r) => r.stabbed);
      if (!stab) return;
      this.remove(stab);
    }
    if (this.colliders) record.collider = this.hiltCollider(record);
    this.records.push(record);
  }

  remove(record) {
    if (record.collider && this.world.getCollider(record.collider.handle))
      this.world.removeCollider(record.collider, true);
    this.records.splice(this.records.indexOf(record), 1);
  }

  place(placements, rig) {
    this.records.filter((r) => !r.stabbed).forEach((r) => this.remove(r));
    placements.forEach(({ variant, host, world, gap }) => {
      const { origin } = rig.byId[host];
      const local = world.clone();
      local.elements[12] -= origin.x;
      local.elements[13] -= origin.y;
      local.elements[14] -= origin.z;
      this.add({ gap, local, segment: host, variant });
    });
  }

  stab({ segment, variant, world, gap, now, distance }) {
    bodyMatrix(this.ragdoll.bodies[segment], inverse).invert();
    this.add({
      gap,
      local: world.clone().premultiply(inverse),
      segment,
      stabbed: true,
      thrust: { distance, start: now },
      variant,
    });
  }

  clearStabs() {
    this.records.filter((r) => r.stabbed).forEach((r) => this.remove(r));
  }

  setColliders(enabled) {
    if (enabled === this.colliders) return;
    this.colliders = enabled;
    this.records.forEach((r) => {
      if (enabled) r.collider = this.hiltCollider(r);
      else if (r.collider) {
        this.world.removeCollider(r.collider, true);
        r.collider = null;
      }
    });
  }

  dispose() {
    [...this.records].forEach((r) => this.remove(r));
  }

  static thrustOffset(record, now) {
    if (!record.thrust) return 0;
    const t = Math.min(1, (now - record.thrust.start) / THRUST_SECONDS);
    if (t >= 1) {
      record.thrust = null;
      return 0;
    }
    return record.thrust.distance * (1 - t) ** 3;
  }
}
