import { _45_deg } from "../utils/constants";

import { HaloSet } from "../components/Elements/Halo";
import { Femur } from "../components/Elements/Femur";
import { Skull } from "../components/Elements/Skull/Skull";

function NewScene() {
  return (
    <group>
      <HaloSet position={[0, 1.5, -1]} rotation={[_45_deg, 0, 0]} />
      <Skull position={[0, 0, 0]} scale={0.1} />
      <Femur position={[-3, -3, -0.5]} scale={0.75} rotation={[0, 0, -20]} />
    </group>
  );
}

export default NewScene;
