import { extend } from "@react-three/fiber";
import { BakeShadows, Effects } from "@react-three/drei";
import { UnrealBloomPass } from "three-stdlib";

import { _90_deg } from "../../utils/math";
import Logo from "../elements/Logo";
import CameraRig from "../rigging/CameraRig";
import LightingRig from "../rigging/LightingRig";
import { useControls } from "leva";

extend({ UnrealBloomPass });

export default function LoGlow() {
  const {
    backgroundColor,
    fogColor,
    fogNear,
    fogFar,
    bloomThreshold,
    bloomStrength,
    bloomRadius,
  } = useControls(
    "LoGlow",
    {
      backgroundColor: { label: "Background Color", value: "#202030" },
      fogColor: { label: "Fog Color", value: "#202030" },
      fogNear: { label: "Fog Near", value: 10 },
      fogFar: { label: "Fog Far", value: 25 },
      bloomThreshold: { label: "Bloom Threshold", value: 0.1, min: 0, max: 10 },
      bloomStrength: { label: "Bloom Strength", value: 0.2, min: 0, max: 10 },
      bloomRadius: { label: "Bloom Radius", value: 0.2, min: 0, max: 10 },
    },
    { collapsed: true }
  );
  return (
    <>
      <LightingRig />
      <CameraRig screenShot />

      <color attach="background" args={[backgroundColor]} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      <Logo scale={2} rotation={[_90_deg, 0, 0]} />
      <BakeShadows />
      <Effects disableGamma>
        <unrealBloomPass
          threshold={bloomThreshold}
          strength={bloomStrength}
          radius={bloomRadius}
        />
      </Effects>
    </>
  );
}
