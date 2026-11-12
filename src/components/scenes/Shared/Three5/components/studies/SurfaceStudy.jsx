import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { BufferAttribute, DoubleSide, Vector3 } from 'three';

import createDepthSampler from '../../utils/meshDepth';
import { streamGeometry } from '../../utils/streamRibbons';
import { meshEdges, meshFaces, studyGeometry } from '../../utils/studyGeometry';
import {
  drawContours,
  drawHatching,
  hatchSamples,
  lightValue,
} from '../../utils/surfaceMarks';
import Comparison from './Comparison';

function SurfaceSample({ config, assets, mode, time }) {
  const root = useRef();
  const previous = useRef(-Infinity);
  const data = useMemo(() => {
    const geometry = studyGeometry(config.studyShape);
    geometry.setAttribute(
      'color',
      new BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 3),
        3
      )
    );
    const faces = meshFaces(geometry);
    const edges = meshEdges(faces);
    return {
      geometry,
      faces,
      edges,
      depth: createDepthSampler(faces),
      marks: streamGeometry(Math.max(edges.length * 8, config.markDensity * 2)),
      samples: hatchSamples(faces, config.markDensity, config.seed),
      camera: new Vector3(),
      light: new Vector3(),
    };
  }, [config.studyShape, config.markDensity, config.seed]);
  useEffect(
    () => () => {
      data.geometry.dispose();
      data.marks.dispose();
    },
    [data]
  );
  useEffect(() => {
    previous.current = -Infinity;
  }, [config]);
  useFrame(({ camera, clock }) => {
    root.current.rotation.y = time.current;
    root.current.updateWorldMatrix(true, false);
    if (clock.elapsedTime - previous.current < 1 / 15) return;
    previous.current = clock.elapsedTime;
    data.camera.copy(camera.position);
    root.current.worldToLocal(data.camera);
    const azimuth =
      (config.markLightAngle * Math.PI) / 180 + time.current * 0.4;
    const elevation = (config.markLightHeight * Math.PI) / 180;
    data.light
      .set(
        Math.cos(azimuth) * Math.cos(elevation),
        Math.sin(elevation),
        Math.sin(azimuth) * Math.cos(elevation)
      )
      .normalize();
    const colors = data.geometry.attributes.color;
    data.faces.forEach((face, i) => {
      const value = lightValue(
        face.center,
        face.normal,
        data.light,
        config.experiment !== 'contours' && config.markShadow
      );
      const band =
        config.experiment === 'lightWash' && mode !== 'original'
          ? Math.round(value * (config.washBands - 1)) / (config.washBands - 1)
          : value;
      let shade = 0.22 + band * 0.78;
      if (config.experiment === 'contours') shade = 0.65 + value * 0.35;
      if (config.experiment === 'lightHatch' && mode !== 'original')
        shade = 0.78 + value * 0.22;
      for (let j = 0; j < 3; j += 1)
        colors.setXYZ(i * 3 + j, shade, shade, shade);
    });
    colors.needsUpdate = true;
    if (mode === 'original') return;
    if (config.experiment === 'contours') {
      data.depth.rebuild(camera, root.current.matrixWorld);
      drawContours(data.marks, data.edges, data.camera, data.depth, config);
    } else if (config.experiment === 'lightHatch')
      drawHatching(data.marks, data.samples, data.camera, data.light, config);
  });
  const wash = mode !== 'original' && config.experiment === 'lightWash';
  return (
    <group ref={root}>
      <mesh geometry={data.geometry}>
        <meshBasicMaterial
          vertexColors
          map={wash ? assets.mainTexture : null}
          color={wash ? '#ffffff' : '#e7e1d5'}
          colorWrite={mode !== 'treatment'}
        />
      </mesh>
      {mode !== 'original' && config.experiment !== 'lightWash' && (
        <mesh geometry={data.marks} frustumCulled={false}>
          <meshBasicMaterial
            map={assets.strokeTexture}
            transparent
            alphaTest={0.008}
            side={DoubleSide}
            depthTest={!config.contourHidden}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
      {mode === 'treatment' && wash && (
        <mesh geometry={data.geometry}>
          <meshBasicMaterial map={assets.mainTexture} vertexColors />
        </mesh>
      )}
      {config.markShadow && config.experiment !== 'contours' && (
        <mesh position={[0.8, 1.4, 1.2]}>
          <sphereGeometry args={[0.65, 24, 16]} />
          <meshStandardMaterial color="#b8aca3" roughness={0.8} />
        </mesh>
      )}
    </group>
  );
}
const Sample = memo(SurfaceSample);
function SurfaceStudy({ config, ...props }) {
  return (
    <Comparison config={config}>
      {(mode, time) => (
        <Sample config={config} {...props} mode={mode} time={time} />
      )}
    </Comparison>
  );
}
export default memo(SurfaceStudy);
