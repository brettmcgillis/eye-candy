import React, { memo, useCallback, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import * as THREE from 'three';

import { modelFile } from '@utils/appUtils';

import extractWindowRects from '../utils/windowExtraction';
import WindowUnit from './WindowUnit';

const basisMatrix = new THREE.Matrix4();
const basisQuat = new THREE.Quaternion();
const offset = new THREE.Vector3();

function ProceduralWindows({ windows, runtime, paneMeshesRef }) {
  const { nodes } = useGLTF(modelFile('factory.glb'));

  const rects = useMemo(() => extractWindowRects(nodes), [nodes]);

  const units = useMemo(() => {
    const list = [];
    rects.forEach((rect, rectIndex) => {
      const cols = Math.max(1, Math.round(rect.width / windows.targetWidth));
      const rows = Math.max(1, Math.round(rect.height / windows.targetHeight));
      const cellW = (rect.width / cols) * windows.fill;
      const cellH = (rect.height / rows) * windows.fill;

      basisMatrix.makeBasis(rect.tAxis, rect.bAxis, rect.normal);
      basisQuat.setFromRotationMatrix(basisMatrix);
      const quaternion = [basisQuat.x, basisQuat.y, basisQuat.z, basisQuat.w];

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const u = (col + 0.5) / cols - 0.5;
          const v = (row + 0.5) / rows - 0.5;
          offset
            .copy(rect.center)
            .addScaledVector(rect.tAxis, u * rect.width)
            .addScaledVector(rect.bAxis, v * rect.height)
            .addScaledVector(rect.normal, windows.inset);
          list.push({
            id: `win-${rectIndex}-${row}-${col}`,
            position: offset.toArray(),
            quaternion,
            width: cellW,
            height: cellH,
          });
        }
      }
    });
    return list;
  }, [
    rects,
    windows.targetWidth,
    windows.targetHeight,
    windows.fill,
    windows.inset,
  ]);

  const glass = useMemo(
    () => ({ color: windows.glassColor, opacity: windows.glassOpacity }),
    [windows.glassColor, windows.glassOpacity]
  );
  const frame = useMemo(
    () => ({
      color: windows.frameColor,
      thickness: windows.frameThickness,
      depth: windows.frameDepth,
    }),
    [windows.frameColor, windows.frameThickness, windows.frameDepth]
  );

  const registerPane = useCallback(
    (paneKey, mesh) => {
      const store = paneMeshesRef.current;
      if (mesh) {
        store[paneKey] = mesh;
      } else {
        delete store[paneKey];
      }
    },
    [paneMeshesRef]
  );

  if (!windows.enabled) {
    return null;
  }

  return (
    <>
      {units.map((unit) => (
        <WindowUnit
          key={unit.id}
          slot={unit}
          width={unit.width}
          height={unit.height}
          glass={glass}
          frame={frame}
          runtime={runtime}
          registerPane={registerPane}
        />
      ))}
    </>
  );
}

export default memo(ProceduralWindows);
