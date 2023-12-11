import { useControls } from "leva";

function LightingRig() {
  const pointLight = useControls("Point Light", {
    x: { value: 3, min: -10, max: 10, step: 1 },
    y: { value: 3, min: -10, max: 10, step: 1 },
    z: { value: 5, min: -10, max: 10, step: 1 },
    decay: { value: 0, min: -10, max: 10, step: 1 },
    distance: { value: -1, min: -10, max: 10, step: 1 },
    castShadow: true,
  });

  const ambientLight = useControls("Ambient Light", {
    intensity: { value: 0.1, min: 0, max: 1, step: 0.1 },
  });

  return (
    <group>
      <ambientLight intensity={ambientLight.intensity} />
      <pointLight
        position={[pointLight.x, pointLight.y, pointLight.z]}
        decay={pointLight.decay}
        distance={pointLight.distance}
        intensity={pointLight.intensity}
        castShadow={pointLight.castShadow}
      />
    </group>
  );
}

export default LightingRig;
