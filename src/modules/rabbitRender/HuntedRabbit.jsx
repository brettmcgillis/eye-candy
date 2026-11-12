import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import Fur from '@elements/Fur/Fur';
import { FUR_TECHNIQUES } from '@elements/Fur/furUtils';
import RabbitModel from '@elements/Rabbit/Rabbit';
import { createPaintState } from '@modules/paintedRender';

import ensureSkinMasks from './furMask';
import {
  createFurDensity,
  createFurMaterial,
  createOutlineMaterial,
  createSkinColor,
} from './materials';

const FUR_LAYERS = 18;
const FUR_SWAY = 0.0005;
const FUR_ROOT_TINT = [0.8, 0.8, 0.8, 1];
const FUR_TIP_TINT = [1, 1, 1, 0];

export default function Rabbit({
  paintConfig,
  furEnabled,
  furLength,
  onReady,
  outlineColor,
  outlineWidth,
  wounds,
  ...props
}) {
  const painting = useMemo(createPaintState, []);
  useEffect(() => {
    painting.apply(paintConfig);
  }, [painting, paintConfig]);
  useEffect(() => () => painting.dispose(), [painting]);
  const ink = useMemo(() => uniform(new THREE.Color()), []);
  const width = useMemo(() => uniform(0), []);
  const [mesh, setMesh] = useState(null);
  const [skinMap, setSkinMap] = useState(null);
  const meshScale = mesh?.matrixWorld.getMaxScaleOnAxis() ?? 1;

  const customizeMaterial = useCallback(
    (original, skinned) => {
      ensureSkinMasks(skinned.geometry, original.map);
      setSkinMap(original.map);
      return createFurMaterial(original, wounds, painting);
    },
    [wounds, painting]
  );
  const furColor = useMemo(
    () => skinMap && createSkinColor(skinMap, wounds, painting),
    [skinMap, wounds, painting]
  );
  const furDensity = useMemo(createFurDensity, []);
  const outlineMaterial = useMemo(
    () => createOutlineMaterial({ color: ink, width, painting }),
    [ink, width, painting]
  );
  useEffect(() => () => outlineMaterial.dispose(), [outlineMaterial]);

  useEffect(() => {
    ink.value.set(outlineColor);
    width.value = outlineWidth / meshScale;
  }, [ink, meshScale, outlineColor, outlineWidth, width]);

  const handleReady = useCallback(
    (model) => {
      let skinned = null;
      model.scene.traverse((object) => {
        if (!skinned && object.isSkinnedMesh) skinned = object;
      });
      skinned.updateWorldMatrix(true, false);
      setMesh(skinned);
      onReady(model);
    },
    [onReady]
  );

  return (
    <>
      <RabbitModel
        autoPlay
        castShadow
        customizeMaterial={customizeMaterial}
        onReady={handleReady}
        outlineMaterial={outlineMaterial}
        {...props}
      />
      {furEnabled && mesh && furColor && (
        <Suspense fallback={null}>
          <Fur
            colorNode={furColor}
            densityNode={furDensity}
            endColor={FUR_TIP_TINT}
            layers={FUR_LAYERS}
            lit
            sourceMesh={mesh}
            startColor={FUR_ROOT_TINT}
            technique={FUR_TECHNIQUES.shell}
            thickness={furLength / meshScale / FUR_LAYERS}
            waveScale={FUR_SWAY / meshScale}
          />
        </Suspense>
      )}
    </>
  );
}
