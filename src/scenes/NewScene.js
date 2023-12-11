import { useControls } from "leva";

import { _45_deg } from "../utils/constants";

import { HaloSet } from "../components/Elements/Halo";
import { Femur } from "../components/Elements/Femur";
import { Skull } from "../components/Elements/Skull";

function NewScene() {
  const femur = useControls("Femur", {
    x: { value: 0, min: -360, max: 360, step: 1 },
    y: { value: 0, min: -360, max: 360, step: 1 },
    z: { value: -20, min: -360, max: 360, step: 1 },
  });

  return (
    <group>
      <HaloSet position={[0, 1.5, -1]} rotation={[_45_deg, 0, 0]} />
      <Skull position={[0, 0, 0]} scale={0.1} />
      <Femur
        position={[-3, -3, -0.5]}
        scale={0.75}
        rotation={[femur.x, femur.y, femur.z]}
      />
    </group>
  );
}

export default NewScene;
