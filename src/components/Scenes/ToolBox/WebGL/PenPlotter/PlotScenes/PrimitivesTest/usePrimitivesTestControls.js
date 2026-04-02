import { folder, useControls } from 'leva';

export default function usePrimitivesTestControls() {
  const config = useControls(
    'Primitives Test Scene',
    {
      Lighting: folder(
        {
          lightIntensity: {
            label: 'Point Light Intensity',
            value: 1,
            min: 0,
            max: 8,
            step: 0.1,
          },
          lightX: { label: 'Light X', value: 5, min: -20, max: 20, step: 0.1 },
          lightY: { label: 'Light Y', value: 5, min: -20, max: 20, step: 0.1 },
          lightZ: { label: 'Light Z', value: 5, min: -20, max: 20, step: 0.1 },
        },
        { collapsed: true }
      ),
      Visibility: folder(
        {
          showCube: { label: 'Cube', value: true },
          showCone: { label: 'Cone', value: true },
          showCylinder: { label: 'Cylinder', value: true },
          showSphere: { label: 'Sphere', value: true },
          showIcosahedron: { label: 'Icosahedron', value: true },
          showOctahedron: { label: 'Octahedron', value: true },
          showTetrahedron: { label: 'Tetrahedron', value: true },
          showTorusKnot: { label: 'Torus Knot', value: true },
          showPlanePrimitive: { label: 'Plane Primitive', value: true },
          showCircle: { label: 'Circle', value: true },
          showRing: { label: 'Ring', value: true },
          showLathe: { label: 'Lathe', value: true },
          showTorus: { label: 'Torus', value: true },
          showCapsule: { label: 'Capsule', value: true },
          showParametricPlane: { label: 'Parametric Plane', value: true },
          showKlein: { label: 'Klein', value: true },
          showMobius: { label: 'Mobius', value: true },
          showMobius3d: { label: 'Mobius 3D', value: true },
          showMiniNeuralNet: { label: 'Mini Neural Net', value: true },
          showMiniParticleCloud: { label: 'Mini Particle Cloud', value: true },
          showGroundPlane: { label: 'Ground Plane', value: true },
          showGrid: { label: 'Grid', value: true },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
  return config;
}
