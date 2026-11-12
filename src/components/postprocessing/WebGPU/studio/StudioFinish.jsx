import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import {
  hash,
  mix,
  mrt,
  normalView,
  output,
  pass,
  renderOutput,
  screenCoordinate,
  screenUV,
  time,
  uniform,
  vec4,
} from 'three/tsl';
import { RenderPipeline } from 'three/webgpu';

function StudioFinish({
  occlusion = 0.8,
  bloomStrength = 0.015,
  grain = 0.025,
  vignette = 0.2,
  lite = false,
}) {
  const { gl, scene, camera } = useThree();
  const pipeline = useRef();
  const u = useMemo(
    () => ({
      occlusion: uniform(occlusion),
      bloom: uniform(bloomStrength),
      grain: uniform(grain),
      vignette: uniform(vignette),
    }),
    []
  );
  useEffect(() => {
    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({ output, normal: normalView }));
    const color = scenePass.getTextureNode('output');
    const ambient = ao(
      scenePass.getTextureNode('depth'),
      scenePass.getTextureNode('normal'),
      camera
    );
    ambient.resolutionScale = 0.5;
    ambient.samples.value = lite ? 8 : 16;
    ambient.radius.value = 0.3;
    const softened = gaussianBlur(ambient.getTextureNode(), 1, 2);
    const lit = color.mul(
      vec4(
        mix(1, softened.r, u.occlusion),
        mix(1, softened.r, u.occlusion),
        mix(1, softened.r, u.occlusion),
        1
      )
    );
    const glow = bloom(lit, 1, 0.3, 1);
    const edge = screenUV.sub(0.5).length().pow(2).mul(u.vignette);
    const noise = hash(
      screenCoordinate.x
        .add(screenCoordinate.y.mul(65536))
        .add(time.mul(60).floor())
    )
      .sub(0.5)
      .mul(u.grain);
    const post = new RenderPipeline(gl);
    post.outputColorTransform = false;
    post.outputNode = renderOutput(lit.add(glow.mul(u.bloom)))
      .mul(edge.oneMinus())
      .add(noise);
    pipeline.current = post;
    return () => {
      pipeline.current = null;
      post.dispose();
      scenePass.dispose();
      ambient.dispose();
      softened.dispose();
      glow.dispose();
    };
  }, [camera, gl, scene, u, lite]);
  u.occlusion.value = occlusion;
  u.bloom.value = bloomStrength;
  u.grain.value = grain;
  u.vignette.value = vignette;
  useFrame(() => pipeline.current?.render(), 1);
  return null;
}
export default memo(StudioFinish);
