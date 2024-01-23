import { extend } from "@react-three/fiber";
import { BakeShadows, Effects } from "@react-three/drei";
import { UnrealBloomPass } from "three-stdlib";
import { useControls } from "leva";

import { _90_deg } from "../../utils/math";

import Logo from "../elements/Logo";
import CameraRig from "../rigging/CameraRig";
import LightingRig from "../rigging/LightingRig";

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
    innerColorVal,
    innerColorEmissive,
    innerColorEmissiveIntensity,
    outerColorVal,
    outerColorEmissive,
    outerColorEmissiveIntensity,
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
      innerColorVal: {
        label: "Inner Color",
        value: "#FF0000",
      },
      innerColorEmissive: {
        label: "Inner Color Emissive",
        value: true,
      },
      innerColorEmissiveIntensity: {
        label: "Inner Color Emissive Intensity",
        value: 5,
        min: 0,
        max: 10,
      },
      outerColorVal: {
        label: "Outer Color",
        value: "#000000",
      },
      outerColorEmissive: {
        label: "Outer Color Emissive",
        value: false,
      },
      outerColorEmissiveIntensity: {
        label: "Outer Color Emissive Intensity",
        value: 0,
        min: 0,
        max: 10,
      },
    },
    { collapsed: true }
  );

  return (
    <>
      <LightingRig />
      <CameraRig screenShot />

      <color attach="background" args={[backgroundColor]} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      <Logo
        innerColorVal={innerColorVal}
        innerColorEmissive={innerColorEmissive}
        innerColorEmissiveIntensity={innerColorEmissiveIntensity}
        outerColorVal={outerColorVal}
        outerColorEmissive={outerColorEmissive}
        outerColorEmissiveIntensity={outerColorEmissiveIntensity}
        scale={2}
        rotation={[_90_deg, 0, 0]}
      />
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
