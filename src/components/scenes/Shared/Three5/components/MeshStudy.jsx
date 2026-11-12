/* eslint-disable no-param-reassign */
import React, { memo, useEffect, useMemo, useRef } from 'react';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { DoubleSide, RepeatWrapping, Vector2 } from 'three';

import useStrokePreview from '../hooks/useStrokePreview';
import createMeshGeometry from '../utils/meshGeometry';
import { strokePoints } from '../utils/paintStrokes';

const ignoreRaycast = () => {};

function MeshStudy({ assets, config, onStroke, runtimeRef, strokes }) {
  const mesh = useRef();
  const geometry = useMemo(
    () => createMeshGeometry(config.shape),
    [config.shape]
  );
  const clean = config.surfaceLook === 'clean' && !onStroke;
  useEffect(() => () => geometry.dispose(), [geometry]);
  const points = useRef(null);
  const lastUv = useRef(null);
  const paintUv = useRef(new Vector2());
  const preview = useStrokePreview(assets, config, runtimeRef, strokes, points);
  const maps = useMemo(
    () => [assets.mainTexture.clone(), assets.heightTexture.clone()],
    [assets]
  );
  useEffect(() => {
    [...maps, preview.texture].forEach((map) => {
      map.wrapS = RepeatWrapping;
      map.wrapT = RepeatWrapping;
      map.repeat.set(config.textureRepeat, config.textureRepeat);
      map.center.set(0.5, 0.5);
      map.rotation = (config.textureRotation * Math.PI) / 180;
      map.updateMatrix();
      map.needsUpdate = true;
    });
  }, [maps, preview.texture, config.textureRepeat, config.textureRotation]);
  useEffect(() => () => maps.forEach((map) => map.dispose()), [maps]);
  useFrame((_state, delta) => {
    if (config.objectRotate && !config.paintEnabled)
      mesh.current.rotation.y += delta * config.rotationSpeed;
  });
  function append(event) {
    if (!points.current || !event.uv) return;
    const uv = paintUv.current.copy(event.uv);
    maps[0].transformUv(uv);
    if (lastUv.current && Math.abs(uv.x - lastUv.current.x) > 0.5) {
      points.current.push([]);
    }
    const path = points.current[points.current.length - 1];
    const x = uv.x * 768;
    const y = uv.y * 768;
    const previous = path[path.length - 1];
    if (!previous || Math.hypot(previous[0] - x, previous[1] - y) > 3) {
      path.push([
        x,
        y,
        event.pointerType === 'pen' ? Math.max(0.1, event.pressure || 1) : 1,
      ]);
      preview.touch();
    }
    lastUv.current = { x: uv.x, y: uv.y };
  }
  function finish(event) {
    if (!points.current) return;
    event.stopPropagation();
    const marks = points.current
      .filter((path) => path.length > 0)
      .map(strokePoints);
    onStroke?.(marks);
    points.current = null;
    preview.touch();
    event.target.releasePointerCapture(event.pointerId);
  }
  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      onPointerDown={(event) => {
        if (!config.paintEnabled || !onStroke) return;
        event.stopPropagation();
        event.target.setPointerCapture(event.pointerId);
        points.current = [[]];
        lastUv.current = null;
        append(event);
      }}
      onPointerMove={append}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      {onStroke && (
        <mesh geometry={geometry} raycast={ignoreRaycast} renderOrder={1}>
          <meshBasicMaterial
            map={preview.texture}
            transparent
            depthWrite={false}
            side={DoubleSide}
            toneMapped={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}
      {onStroke && (
        <Html
          center
          position={[0, -2.8, 0]}
          style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
        >
          <span
            className="three5-paint-feedback"
            ref={preview.feedback}
            aria-label="Live brush feedback"
          >
            Brush ready · drag to paint
          </span>
        </Html>
      )}
      {preview.error && (
        <Html>
          <p role="alert">Live brush: {preview.error}</p>
        </Html>
      )}
      {config.surfaceLook === 'unlit' ? (
        <meshBasicMaterial map={maps[0]} side={DoubleSide} toneMapped={false} />
      ) : (
        <meshStandardMaterial
          color={clean ? config.pigment : '#ffffff'}
          map={clean ? null : maps[0]}
          bumpMap={clean ? null : maps[1]}
          bumpScale={config.bump}
          roughness={config.roughness}
          roughnessMap={config.roughnessMap ? maps[1] : null}
          side={DoubleSide}
        />
      )}
    </mesh>
  );
}

export default memo(MeshStudy);
