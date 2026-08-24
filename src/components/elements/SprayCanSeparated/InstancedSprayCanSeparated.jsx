import React from 'react';

import { Merged, useGLTF } from '@react-three/drei';

import * as THREE from 'three';

import { modelFile } from '@utils/appUtils';

import { CAN_BASE_RECENTER_Y } from './SprayCanSeparated';
import { computeSliderAxis } from './sliderGeometry';

const context = React.createContext();
const PART_ROTATION = [-Math.PI / 2, 0, 0];
const PART_ROTATION_EULER = new THREE.Euler(...PART_ROTATION);

// The body + color ring get their own material clone (vertexColors enabled)
// so each instance can be tinted independently via the `color` prop below —
// vertexColors defaults every instance to white, which multiplies the
// existing texture unchanged, so untinted callers see no difference.
export function Instances({ children, ...props }) {
  const { nodes, materials } = useGLTF(modelFile('sprayCanSeparated.glb'));
  const tintableMaterial = React.useMemo(() => {
    const material = materials['default.001'].clone();
    material.vertexColors = true;
    return material;
  }, [materials]);

  const capMaterial = React.useMemo(() => {
    const material = materials['default.001'].clone();
    material.color.set('#e8e8e8');
    return material;
  }, [materials]);

  const instances = React.useMemo(
    () => ({
      Bluepanel: nodes.blue_panel,
      Blueslider: nodes.blue_slider,
      Canlabel: nodes.can_label,
      Colorring: {
        isMesh: true,
        geometry: nodes.color_ring.geometry,
        material: tintableMaterial,
      },
      Greenpanel: nodes.green_panel,
      Greenslider: nodes.green_slider,
      Redpanel: nodes.red_panel,
      Redslider: nodes.red_slider,
      Spraycan: {
        isMesh: true,
        geometry: nodes.spray_can.geometry,
        material: tintableMaterial,
      },
      Spraycap: {
        isMesh: true,
        geometry: nodes.spray_cap.geometry,
        material: capMaterial,
      },
    }),
    [nodes, tintableMaterial, capMaterial]
  );
  return (
    <Merged meshes={instances} {...props}>
      {(i) => <context.Provider value={i}>{children}</context.Provider>}
    </Merged>
  );
}

function useSliderOffsets() {
  const { nodes } = useGLTF(modelFile('sprayCanSeparated.glb'));
  return React.useMemo(
    () => ({
      r: computeSliderAxis({
        panelGeometry: nodes.red_panel.geometry,
        sliderGeometry: nodes.red_slider.geometry,
      }),
      g: computeSliderAxis({
        panelGeometry: nodes.green_panel.geometry,
        sliderGeometry: nodes.green_slider.geometry,
      }),
      b: computeSliderAxis({
        panelGeometry: nodes.blue_panel.geometry,
        sliderGeometry: nodes.blue_slider.geometry,
      }),
    }),
    [nodes]
  );
}

function sliderOffsetPosition(axisInfo, value) {
  return axisInfo.axisVector
    .clone()
    .applyEuler(PART_ROTATION_EULER)
    .multiplyScalar(axisInfo.restOffset + value * axisInfo.localLength);
}

// `color` tints the body + ring (e.g. a discarded can showing whatever spray
// color it last held). `sliderValues` ({r,g,b} in 0..1), when given, poses
// each slider knob to match — reusing the same computeSliderAxis derivation
// the interactive can's draggable sliders use (CanSlider.jsx), so a
// discarded can showing full red also visibly has its red slider at max
// (todo item 35).
export default function InstancedSprayCanSeparated({
  color,
  sliderValues,
  ...props
}) {
  const instances = React.useContext(context);
  const offsets = useSliderOffsets();

  return (
    <group {...props} dispose={null}>
      {/* Matches SprayCanSeparated's own recentering so `position` means
          "where the base sits" for this element too. */}
      <group position={[0, CAN_BASE_RECENTER_Y, 0]}>
        <instances.Bluepanel rotation={PART_ROTATION} />
        <instances.Blueslider
          rotation={PART_ROTATION}
          position={
            sliderValues && sliderOffsetPosition(offsets.b, sliderValues.b)
          }
        />
        <instances.Canlabel rotation={PART_ROTATION} />
        <instances.Colorring rotation={PART_ROTATION} color={color} />
        <instances.Greenpanel rotation={PART_ROTATION} />
        <instances.Greenslider
          rotation={PART_ROTATION}
          position={
            sliderValues && sliderOffsetPosition(offsets.g, sliderValues.g)
          }
        />
        <instances.Redpanel rotation={PART_ROTATION} />
        <instances.Redslider
          rotation={PART_ROTATION}
          position={
            sliderValues && sliderOffsetPosition(offsets.r, sliderValues.r)
          }
        />
        <instances.Spraycan rotation={PART_ROTATION} color={color} />
        <instances.Spraycap rotation={PART_ROTATION} />
      </group>
    </group>
  );
}
