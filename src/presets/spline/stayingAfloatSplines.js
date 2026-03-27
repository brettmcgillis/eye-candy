import * as THREE from 'three';

const ORBIT_Z_SCALE = 0.72;

const createOrbitPoints = ({
  radius,
  depth,
  pointCount = 12,
  phase = 0,
  rotationY = 0,
}) =>
  Array.from({ length: pointCount }, (_el, index) => {
    const t = phase + (index / pointCount) * Math.PI * 2;
    return {
      position: new THREE.Vector3(
        Math.cos(t) * radius,
        depth,
        Math.sin(t) * radius * ORBIT_Z_SCALE
      ),
      rotation: new THREE.Euler(0, rotationY, 0),
    };
  });

const STAYING_AFLOAT_SPLINES = {
  'Staying Afloat - Hammerhead Path': {
    tension: 0.5,
    closed: true,
    showPoints: true,
    showUniform: true,
    showCentripetal: false,
    showChordal: false,
    points: createOrbitPoints({
      radius: 1.05,
      depth: 0.35,
      phase: Math.PI * 0.15,
      rotationY: Math.PI,
    }),
  },
  'Staying Afloat - Tiger Shark Path': {
    tension: 0.5,
    closed: true,
    showPoints: true,
    showUniform: true,
    showCentripetal: false,
    showChordal: false,
    points: createOrbitPoints({
      radius: 1.42,
      depth: -1.05,
      phase: Math.PI * 1.1,
      rotationY: Math.PI * 0.9,
    }),
  },
};

export default STAYING_AFLOAT_SPLINES;
