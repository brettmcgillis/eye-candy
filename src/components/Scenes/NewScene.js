import { useControls } from "leva";

import { _45_deg } from "../../utils/constants";

import { HaloSet } from "../elements/Halo";
import { Femur } from "../elements/Femur";
import { Skull } from "../elements/skull/Skull";

import { GridHelper, PolarGridHelper } from "../rigging/GridHelper";

function NewScene() {
  const controls = useControls(
    "Scene",
    {
      show_grid_helper: false,
      show_polar_grid_helper: false,
    },
    { collapsed: true }
  );

  return (
    <group>
      <GridHelper visible={controls.show_grid_helper} />
      <PolarGridHelper visible={controls.show_polar_grid_helper} />

      <HaloSet position={[0, 1.5, -1]} rotation={[_45_deg, 0, 0]} />
      <Skull position={[0, 0, 0]} scale={0.1} />
      <Femur position={[-3, -3, -0.5]} scale={0.75} rotation={[0, 0, -20]} />
    </group>
  );
}

export default NewScene;
