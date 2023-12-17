import { folder, useControls } from "leva";
import { Cloud } from "@react-three/drei";

import { _45_deg } from "../../utils/constants";

import { HaloSet } from "../elements/Halo";
import { Femur } from "../elements/Femur";
import { Skull } from "../elements/skull/Skull";
import * as _ from "../elements/skull/SkullControls";

import { GridHelper, PolarGridHelper } from "../rigging/GridHelper";
import LightingRig from "../rigging/LightingRig";
import CameraRig from "../rigging/CameraRig";

function NewScene() {
  const controls = useControls(
    "Scene",
    {
      show_grid_helper: false,
      show_polar_grid_helper: false,
    },
    { collapsed: true }
  );

  const craiumControls = _.OverrideDefaults(_.Cranium, {
    showRightParietal: false,
    showRightTemporal: false,
    showTeeth: false,
    showLeftParietal: false,
    showLeftTemporal: false,
  });
  const mandibleControls = _.OverrideDefaults(_.Mandible, {
    showMandible: false,
  });

  const skullControls = useControls(
    "Skull",
    {
      Cranium: folder(craiumControls, { collapsed: true }),
      Mandible: folder(mandibleControls, { collapsed: true }),
    },
    { collapsed: true }
  );

  return (
    <>
      <LightingRig />
      <CameraRig screenShot />
      <GridHelper x y z visible={controls.show_grid_helper} />
      <PolarGridHelper x y z visible={controls.show_polar_grid_helper} />

      <HaloSet position={[0, 1.5, -1]} rotation={[_45_deg, 0, 0]} />
      <Skull {...skullControls} position={[0, 0, 0]} scale={0.1} />
      <Cloud
        position={[0, 0.75, 0]}
        bounds={[1, 1, 1]}
        scale={0.15}
        fade={0}
        seed={666}
      />
      <Femur position={[-3, -3, -0.5]} scale={0.75} rotation={[0, 0, -20]} />
    </>
  );
}

export default NewScene;
