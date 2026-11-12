import React, { memo, useEffect, useMemo, useRef } from 'react';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { BufferAttribute, MultiplyBlending, Vector3 } from 'three';

import paperGrain from '../../utils/paperGrain';
import { studyGeometry } from '../../utils/studyGeometry';
import Comparison from './Comparison';

function PaperSample({ assets, config, mode, time }) {
  const root = useRef();
  const data = useMemo(() => {
    const geometry = studyGeometry(config.studyShape);
    geometry.setAttribute(
      'uv1',
      new BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 2),
        2
      )
    );
    return {
      geometry,
      grain: paperGrain(config.seed, config.paperStrength),
      point: new Vector3(),
    };
  }, [config.studyShape, config.seed, config.paperStrength]);
  useEffect(
    () => () => {
      data.geometry.dispose();
      data.grain.texture.dispose();
    },
    [data]
  );
  useFrame(() => {
    root.current.rotation.y = time.current;
    root.current.updateWorldMatrix(true, false);
    const p = data.geometry.attributes.position;
    const uv = data.geometry.attributes.uv1;
    for (let i = 0; i < p.count; i += 1) {
      data.point.fromBufferAttribute(p, i);
      if (config.paperAnchor === 'world')
        data.point.applyMatrix4(root.current.matrixWorld);
      uv.setXY(
        i,
        data.point.x * config.paperScale,
        data.point.y * config.paperScale
      );
    }
    uv.needsUpdate = true;
  });
  const surface = mode !== 'original' && config.paperAnchor !== 'screen';
  return (
    <group ref={root}>
      <mesh geometry={data.geometry}>
        <meshStandardMaterial
          key={surface ? 'surface-grain' : 'color'}
          map={assets.mainTexture}
          bumpMap={surface ? data.grain.texture : null}
          bumpScale={config.paperRelief}
          roughness={0.9}
          colorWrite={mode !== 'treatment'}
        />
      </mesh>
      {surface && (
        <mesh geometry={data.geometry}>
          <meshBasicMaterial
            map={data.grain.texture}
            blending={MultiplyBlending}
            premultipliedAlpha
            transparent
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}
const Sample = memo(PaperSample);
function PaperStudy(props) {
  const { config } = props;
  const grain = useMemo(
    () => paperGrain(config.seed, config.paperStrength),
    [config.seed, config.paperStrength]
  );
  useEffect(() => () => grain.texture.dispose(), [grain]);
  return (
    <>
      <Comparison
        config={config}
        treatmentLabel={`${config.paperAnchor} paper`}
      >
        {(mode, time) => <Sample {...props} mode={mode} time={time} />}
      </Comparison>
      {config.paperAnchor === 'screen' && config.studyView !== 'original' && (
        <Html
          fullscreen
          wrapperClass="three5-paper-overlay"
          style={{ pointerEvents: 'none' }}
          zIndexRange={[1, 0]}
        >
          <div
            className="three5-screen-grain"
            style={{
              left: config.studyView === 'compare' ? '50%' : 0,
              backgroundImage: `url(${grain.canvas.toDataURL()})`,
              backgroundSize: `${256 / config.paperScale}px`,
            }}
          />
        </Html>
      )}
    </>
  );
}
export default memo(PaperStudy);
