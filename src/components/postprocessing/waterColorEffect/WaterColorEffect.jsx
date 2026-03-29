import * as THREE from 'three';

import { useMemo, useRef } from 'react';

import { useFBO, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import FINAL_FRAGMENT from './shaders/finalFragment';
import KUWAHARA_FRAGMENT from './shaders/kuwaharaFragment';
import TENSOR_FRAGMENT from './shaders/tensorFragment';
import makePassScene from './utils/makePassScene';

// ── Component ───────────────────────────────────────────────────────────────
export default function WaterColorEffect({
  radius = 6,
  alpha = 25,
  quantizeLevels = 16,
  saturation = 1.5,
  paperStrength = 1.0,
}) {
  const { size } = useThree();
  const resolutionRef = useRef(new THREE.Vector4());

  const paperTexture = useTexture('/images/watercolor.png');
  paperTexture.minFilter = THREE.LinearMipmapLinearFilter;
  paperTexture.magFilter = THREE.LinearFilter;
  paperTexture.generateMipmaps = true;

  // Render targets
  const originalTarget = useFBO({ depthBuffer: true });
  const tensorTarget = useFBO({
    depthBuffer: false,
    type: THREE.HalfFloatType,
  });
  const kuwaharaTarget = useFBO({ depthBuffer: false });

  // Shared fullscreen geometry + camera (created once)
  const fsCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    []
  );
  const fsGeometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  // Pass scenes (created once, uniforms updated each frame)
  const tensorPass = useMemo(
    () =>
      makePassScene(fsGeometry, TENSOR_FRAGMENT, {
        inputBuffer: { value: null },
        resolution: { value: new THREE.Vector4() },
      }),
    [fsGeometry]
  );

  const kuwaharaPass = useMemo(
    () =>
      makePassScene(fsGeometry, KUWAHARA_FRAGMENT, {
        inputBuffer: { value: null },
        originalTexture: { value: null },
        resolution: { value: new THREE.Vector4() },
        radius: { value: radius },
        alpha: { value: alpha },
      }),
    [fsGeometry]
  );

  const finalPass = useMemo(
    () =>
      makePassScene(fsGeometry, FINAL_FRAGMENT, {
        inputBuffer: { value: null },
        watercolorTexture: { value: null },
        quantizeLevels: { value: quantizeLevels },
        saturation: { value: saturation },
        paperStrength: { value: paperStrength },
      }),
    [fsGeometry]
  );

  // Render pipeline — runs after the default R3F render at priority 1
  useFrame((state) => {
    const { gl, scene, camera } = state;
    const dpr = gl.getPixelRatio();
    const w = size.width * dpr;
    const h = size.height * dpr;
    resolutionRef.current.set(w, h, 1 / w, 1 / h);

    const prevAutoClear = gl.autoClear;
    gl.autoClear = false;

    // 1 — Capture original scene to FBO
    gl.setRenderTarget(originalTarget);
    gl.clear();
    gl.render(scene, camera);

    // 2 — Tensor pass: scene → structure tensor
    tensorPass.material.uniforms.inputBuffer.value = originalTarget.texture;
    tensorPass.material.uniforms.resolution.value = resolutionRef.current;
    gl.setRenderTarget(tensorTarget);
    gl.clear();
    gl.render(tensorPass.scene, fsCamera);

    // 3 — Anisotropic Kuwahara pass: tensor + original → filtered output
    kuwaharaPass.material.uniforms.inputBuffer.value = tensorTarget.texture;
    kuwaharaPass.material.uniforms.originalTexture.value =
      originalTarget.texture;
    kuwaharaPass.material.uniforms.resolution.value = resolutionRef.current;
    kuwaharaPass.material.uniforms.radius.value = radius;
    kuwaharaPass.material.uniforms.alpha.value = alpha;
    gl.setRenderTarget(kuwaharaTarget);
    gl.clear();
    gl.render(kuwaharaPass.scene, fsCamera);

    // 4 — Final pass: color correction + paper texture → screen
    finalPass.material.uniforms.inputBuffer.value = kuwaharaTarget.texture;
    finalPass.material.uniforms.watercolorTexture.value = paperTexture;
    finalPass.material.uniforms.quantizeLevels.value = quantizeLevels;
    finalPass.material.uniforms.saturation.value = saturation;
    finalPass.material.uniforms.paperStrength.value = paperStrength;
    gl.setRenderTarget(null);
    gl.clear();
    gl.render(finalPass.scene, fsCamera);

    gl.autoClear = prevAutoClear;
  }, 1);

  return null;
}
