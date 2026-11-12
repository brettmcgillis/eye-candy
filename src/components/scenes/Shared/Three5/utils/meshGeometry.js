import {
  BoxGeometry,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  TorusKnotGeometry,
} from 'three';

export default function createMeshGeometry(shape) {
  if (shape === 'box') return new BoxGeometry(3.6, 3.6, 3.6, 16, 16, 16);
  if (shape === 'torus') return new TorusGeometry(1.65, 0.65, 32, 80);
  if (shape === 'knot') return new TorusKnotGeometry(1.5, 0.5, 128, 24);
  if (shape === 'plane') return new PlaneGeometry(5, 5);
  return new SphereGeometry(2.3, 64, 40);
}
