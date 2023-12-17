import { useControls } from "leva";

import { _45_deg } from "../../../utils/constants";
import getColorsInRange from "../../../utils/colors";
import LightingRig from "../../rigging/LightingRig";

import { getFrames, getFrameData } from "./FrameData";
import CameraRig from "../../rigging/CameraRig";

function Square({ index, layer, size, position, color, settings }) {
  const [x, y] = position;
  const mirror = settings.symmetric && (x !== 0 || y !== 0);
  return (
    <>
      <mesh castShadow receiveShadow position={[x, y, 0]}>
        <boxGeometry args={[size, size, settings.paperDepth]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {mirror && (
        <mesh castShadow receiveShadow position={[-x, -y, 0]}>
          <boxGeometry args={[size, size, settings.paperDepth]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
    </>
  );
}

function Layer({ layer, squares, depth, settings }) {
  return (
    <group position={[0, 0, depth]}>
      {squares.map((square, index) => {
        return Square({ index, layer, ...square, settings });
      })}
    </group>
  );
}

function FoldedFrame() {
  const frames = getFrames();
  const { frame, rotate, colorRange_start, colorRange_end } = useControls(
    "Scene",
    {
      frame: {
        label: "Select Frame",
        value: frames[0].name,
        options: frames.map((f) => f.name),
      },
      colorRange_start: { label: "Start", value: "#FFFFFF" },
      colorRange_end: { label: "End", value: "#797979" },
      rotate: { value: true, label: "Rotate 45*" },
    },
    { collapsed: false }
  );

  const frameData = getFrameData(!!frame ? frame : frames[0].name);
  let { settings, layers } = frameData;

  const colorGamut = getColorsInRange(
    colorRange_start,
    colorRange_end,
    layers.length
  );

  layers = layers.map((layer, index) => {
    return layer.map((square) => {
      square.color = colorGamut[index];
      return square;
    });
  });

  return (
    <>
      <LightingRig />
      <CameraRig />
      <group rotation={[0, 0, rotate ? -_45_deg : 0]}>
        {layers.map((layer, index) => {
          return Layer({
            layer: index,
            squares: layer,
            depth: -(index * settings.paperDepth),
            settings,
          });
        })}
      </group>
    </>
  );
}

export default FoldedFrame;
