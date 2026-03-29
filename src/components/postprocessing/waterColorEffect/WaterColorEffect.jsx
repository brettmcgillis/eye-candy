import * as THREE from 'three';

import { useMemo, useRef } from 'react';

import { useFBO, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import BLOOM_BLUR_FRAGMENT from './shaders/bloomBlurFragment';
import BLOOM_COMPOSITE_FRAGMENT from './shaders/bloomCompositeFragment';
import BLOOM_EXTRACT_FRAGMENT from './shaders/bloomExtractFragment';
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
  bloomEnabled = true,
  bloomIntensity = 1.2,
  bloomThreshold = 0.6,
  bloomSmoothing = 0.3,
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

  // Bloom render targets
  const bloomExtractTarget = useFBO({ depthBuffer: false });
  const bloomBlurHTarget = useFBO({ depthBuffer: false });
  const bloomBlurVTarget = useFBO({ depthBuffer: false });
  const bloomedSceneTarget = useFBO({ depthBuffer: false });

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

  // Bloom pass scenes
  const bloomExtractPass = useMemo(
    () =>
      makePassScene(fsGeometry, BLOOM_EXTRACT_FRAGMENT, {
        inputBuffer: { value: null },
        luminanceThreshold: { value: bloomThreshold },
        luminanceSmoothing: { value: bloomSmoothing },
      }),
    [fsGeometry]
  );

  const bloomBlurHPass = useMemo(
    () =>
      makePassScene(fsGeometry, BLOOM_BLUR_FRAGMENT, {
        inputBuffer: { value: null },
        direction: { value: new THREE.Vector2(1, 0) },
        resolution: { value: new THREE.Vector2() },
      }),
    [fsGeometry]
  );

  const bloomBlurVPass = useMemo(
    () =>
      makePassScene(fsGeometry, BLOOM_BLUR_FRAGMENT, {
        inputBuffer: { value: null },
        direction: { value: new THREE.Vector2(0, 1) },
        resolution: { value: new THREE.Vector2() },
      }),
    [fsGeometry]
  );

  const bloomCompositePass = useMemo(
    () =>
      makePassScene(fsGeometry, BLOOM_COMPOSITE_FRAGMENT, {
        inputBuffer: { value: null },
        bloomBuffer: { value: null },
        bloomIntensity: { value: bloomIntensity },
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

    // 1b — Optional bloom: extract → blur → composite back onto scene
    const sceneTexture = bloomEnabled
      ? (() => {
          const res = resolutionRef.current;
          // Extract bright pixels
          bloomExtractPass.material.uniforms.inputBuffer.value =
            originalTarget.texture;
          bloomExtractPass.material.uniforms.luminanceThreshold.value =
            bloomThreshold;
          bloomExtractPass.material.uniforms.luminanceSmoothing.value =
            bloomSmoothing;
          gl.setRenderTarget(bloomExtractTarget);
          gl.clear();
          gl.render(bloomExtractPass.scene, fsCamera);

          // Horizontal blur
          bloomBlurHPass.material.uniforms.inputBuffer.value =
            bloomExtractTarget.texture;
          bloomBlurHPass.material.uniforms.resolution.value.set(res.x, res.y);
          gl.setRenderTarget(bloomBlurHTarget);
          gl.clear();
          gl.render(bloomBlurHPass.scene, fsCamera);

          // Vertical blur
          bloomBlurVPass.material.uniforms.inputBuffer.value =
            bloomBlurHTarget.texture;
          bloomBlurVPass.material.uniforms.resolution.value.set(res.x, res.y);
          gl.setRenderTarget(bloomBlurVTarget);
          gl.clear();
          gl.render(bloomBlurVPass.scene, fsCamera);

          // Composite bloom onto original
          bloomCompositePass.material.uniforms.inputBuffer.value =
            originalTarget.texture;
          bloomCompositePass.material.uniforms.bloomBuffer.value =
            bloomBlurVTarget.texture;
          bloomCompositePass.material.uniforms.bloomIntensity.value =
            bloomIntensity;
          gl.setRenderTarget(bloomedSceneTarget);
          gl.clear();
          gl.render(bloomCompositePass.scene, fsCamera);

          return bloomedSceneTarget.texture;
        })()
      : originalTarget.texture;

    // 2 — Tensor pass: (bloomed) scene → structure tensor
    tensorPass.material.uniforms.inputBuffer.value = sceneTexture;
    tensorPass.material.uniforms.resolution.value = resolutionRef.current;
    gl.setRenderTarget(tensorTarget);
    gl.clear();
    gl.render(tensorPass.scene, fsCamera);

    // 3 — Anisotropic Kuwahara pass: tensor + (bloomed) scene → filtered output
    kuwaharaPass.material.uniforms.inputBuffer.value = tensorTarget.texture;
    kuwaharaPass.material.uniforms.originalTexture.value = sceneTexture;
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
