import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as THREE from 'three/webgpu';

import {
  BULLET_PROFILE,
  CAP_TOP,
  DISH_INNER,
  faceHeight,
  faceRim,
} from '@modules/controlPanel';

// The rounded box template's radius; materials.js re-rounds each instance.
export const RBOX_TEMPLATE = 0.35;

const KNURL_RIDGES = 28;
const KNURL_DEPTH = 0.045;
const TORUS_TUBE = 0.25;

const alongZ = (geometry) => geometry.rotateX(Math.PI / 2);

function knurl() {
  const geometry = alongZ(
    new THREE.CylinderGeometry(1, 1, 2, KNURL_RIDGES * 4, 1)
  );
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const r = Math.hypot(x, y);
    if (r > 0.999) {
      const a = Math.atan2(y, x);
      const k = 1 - KNURL_DEPTH * (0.5 + 0.5 * Math.cos(a * KNURL_RIDGES));
      position.setXY(i, x * k, y * k);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

// A torus whose radius and tube are set per instance: `aRing` holds each
// vertex's (cos θ, sin θ) round the ring and (cos φ, sin φ) round the tube.
function ring() {
  const geometry = new THREE.TorusGeometry(1, TORUS_TUBE, 10, 48);
  const position = geometry.getAttribute('position');
  const angles = new Float32Array(position.count * 4);
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const a = Math.atan2(y, x);
    const out = Math.hypot(x, y) - 1;
    angles.set(
      [Math.cos(a), Math.sin(a), out / TORUS_TUBE, z / TORUS_TUBE],
      i * 4
    );
  }
  geometry.setAttribute('aRing', new THREE.BufferAttribute(angles, 4));
  return geometry;
}

// An open cone bowed like a speaker's: radius DISH_INNER at z = -1 flaring
// to 1 at the rim, z = 1.
function dish() {
  const points = Array.from({ length: 12 }, (_, i) => {
    const u = i / 11;
    return new THREE.Vector2(
      DISH_INNER + (1 - DISH_INNER) * u,
      -1 + 2 * u ** 1.6
    );
  });
  return alongZ(new THREE.LatheGeometry(points, 48));
}

// The tube-face cushion: rings of the squircle rim shrinking to the centre,
// z from -1 at the rim to 1 at the top.
function face() {
  const rings = 14;
  const around = 72;
  const position = [];
  const index = [];
  for (let r = 0; r <= rings; r += 1) {
    const rho = 1 - r / rings;
    for (let a = 0; a < around; a += 1) {
      const [x, y] = faceRim((a / around) * Math.PI * 2);
      position.push(x * rho, y * rho, -1 + 2 * faceHeight(rho));
    }
  }
  for (let r = 0; r < rings; r += 1) {
    for (let a = 0; a < around; a += 1) {
      const i = r * around + a;
      const j = r * around + ((a + 1) % around);
      index.push(i, j, i + around, j, j + around, i + around);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(position, 3)
  );
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

// Unit primitives spanning [-1, 1] on every axis, cylinders along z: an
// instance's half extents scale them straight to size.
export default function createGeometry(id) {
  switch (id) {
    case 'rbox':
      return new RoundedBoxGeometry(2, 2, 2, 3, RBOX_TEMPLATE);
    case 'cyl':
      return alongZ(new THREE.CylinderGeometry(1, 1, 2, 40, 1));
    case 'knurl':
      return knurl();
    case 'cap':
      return alongZ(new THREE.CylinderGeometry(CAP_TOP, 1, 2, 40, 1));
    case 'sphere':
      return new THREE.SphereGeometry(1, 24, 16);
    case 'torus':
      return ring();
    case 'bullet':
      return alongZ(
        new THREE.LatheGeometry(
          BULLET_PROFILE.map(([r, z]) => new THREE.Vector2(r, z)),
          40
        )
      );
    case 'dish':
      return dish();
    case 'face':
      return face();
    case 'lens':
      return alongZ(
        new THREE.LatheGeometry(
          Array.from({ length: 9 }, (_, i) => {
            const a = (i / 8) * (Math.PI / 2);
            return new THREE.Vector2(Math.cos(a), -1 + 2 * Math.sin(a));
          }),
          48
        )
      );
    case 'glow':
      return new THREE.CircleGeometry(1, 32);
    default:
      return new THREE.BoxGeometry(2, 2, 2);
  }
}
