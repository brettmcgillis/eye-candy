import * as THREE from 'three';

import { useEffect, useMemo, useRef } from 'react';

import { useFBO, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import { textureFile } from '../../../../utils/appUtils';
import BLOOM_BLUR_FRAGMENT from './shaders/bloomBlurFragment';
import BLOOM_COMPOSITE_FRAGMENT from './shaders/bloomCompositeFragment';
import FINAL_FRAGMENT from './shaders/finalFragment';
import KUWAHARA_FRAGMENT from './shaders/kuwaharaFragment';
import TENSOR_FRAGMENT from './shaders/tensorFragment';
import makePassScene from './utils/makePassScene';

useTexture.preload(textureFile('watercolor.png'));

// Must match the layer used in BoatLights bloom sprites
const BLOOM_LAYER = 1;

// ── Component ───────────────────────────────────────────────────────────────
export default function WaterColorEffect({
  radius = 6,
  alpha = 25,
  qualityScale = 0.5,
  quantizeLevels = 16,
  saturation = 1.5,
  paperStrength = 1.0,
  bloomEnabled = true,
  bloomIntensity = 1.2,
  outlineEnabled = true,
  outlineStrength = 0.75,
  outlineThreshold = 0.22,
  outlineSoftness = 0.14,
  hatchingEnabled = true,
  hatchScale = 6.0,
  hatchIntensity = 0.25,
  hatchThickness = 0.9,
  hatchRotation = 0.35,
}) {
  const { size } = useThree();
  const resolutionRef = useRef(new THREE.Vector4());
  // Separate ref for the half-resolution used by the tensor and kuwahara passes.
  const halfResRef = useRef(new THREE.Vector4());

  const paperTexture = useTexture(textureFile('watercolor.png'));
  paperTexture.minFilter = THREE.LinearMipmapLinearFilter;
  paperTexture.magFilter = THREE.LinearFilter;
  paperTexture.generateMipmaps = true;

  // Render targets
  const originalTarget = useFBO({ depthBuffer: true });
  // Tensor and Kuwahara targets are created at 1×1 and resized each frame to
  // qualityScale of the viewport — typically half-res.  Painting/smoothing passes
  // are low-frequency so the downscale is visually imperceptible.
  const tensorTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(1, 1, {
        depthBuffer: false,
        type: THREE.HalfFloatType,
      }),
    []
  );
  const kuwaharaTarget = useMemo(
    () => new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false }),
    []
  );

  useEffect(
    () => () => {
      tensorTarget.dispose();
      kuwaharaTarget.dispose();
    },
    [tensorTarget, kuwaharaTarget]
  );

  // Bloom render targets (no extract — layer render replaces it)
  const bloomLayerTarget = useFBO({ depthBuffer: true });
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
        sourceSize: { value: new THREE.Vector2() },
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
        tensorTexture: { value: null },
        quantizeLevels: { value: quantizeLevels },
        saturation: { value: saturation },
        paperStrength: { value: paperStrength },
        outlineEnabled: { value: outlineEnabled },
        outlineStrength: { value: outlineStrength },
        outlineThreshold: { value: outlineThreshold },
        outlineSoftness: { value: outlineSoftness },
        hatchingEnabled: { value: hatchingEnabled },
        hatchScale: { value: hatchScale },
        hatchIntensity: { value: hatchIntensity },
        hatchThickness: { value: hatchThickness },
        hatchRotation: { value: hatchRotation },
      }),
    [fsGeometry]
  );

  // Bloom pass scenes (no extract pass — layer isolation replaces it)
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

    // Resize the tensor + kuwahara targets to qualityScale of the viewport.
    // setSize is a no-op when dimensions haven't changed.
    const qw = Math.max(1, Math.round(w * qualityScale));
    const qh = Math.max(1, Math.round(h * qualityScale));
    if (tensorTarget.width !== qw || tensorTarget.height !== qh) {
      tensorTarget.setSize(qw, qh);
      kuwaharaTarget.setSize(qw, qh);
    }
    halfResRef.current.set(qw, qh, 1 / qw, 1 / qh);

    const prevAutoClear = gl.autoClear;
    gl.autoClear = false;

    // 1 — Capture original scene to FBO
    gl.setRenderTarget(originalTarget);
    gl.clear();
    gl.render(scene, camera);

    // 1b — Optional selective bloom: render bloom layer → blur → composite
    const sceneTexture = bloomEnabled
      ? (() => {
          const res = resolutionRef.current;

          // Render only bloom-layer objects onto a black background
          const prevBg = scene.background;
          scene.background = null;
          camera.layers.set(BLOOM_LAYER);
          gl.setRenderTarget(bloomLayerTarget);
          gl.setClearColor(0x000000, 1);
          gl.clear();
          gl.render(scene, camera);
          camera.layers.set(0);
          scene.background = prevBg;

          // Horizontal blur
          bloomBlurHPass.material.uniforms.inputBuffer.value =
            bloomLayerTarget.texture;
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
    tensorPass.material.uniforms.resolution.value = halfResRef.current;
    gl.setRenderTarget(tensorTarget);
    gl.clear();
    gl.render(tensorPass.scene, fsCamera);

    // 3 — Anisotropic Kuwahara pass: tensor + (bloomed) scene → filtered output
    kuwaharaPass.material.uniforms.inputBuffer.value = tensorTarget.texture;
    kuwaharaPass.material.uniforms.originalTexture.value = sceneTexture;
    kuwaharaPass.material.uniforms.sourceSize.value.set(w, h);
    kuwaharaPass.material.uniforms.radius.value = radius;
    kuwaharaPass.material.uniforms.alpha.value = alpha;
    gl.setRenderTarget(kuwaharaTarget);
    gl.clear();
    gl.render(kuwaharaPass.scene, fsCamera);

    // 4 — Final pass: color correction + paper texture → screen
    finalPass.material.uniforms.inputBuffer.value = kuwaharaTarget.texture;
    finalPass.material.uniforms.watercolorTexture.value = paperTexture;
    finalPass.material.uniforms.tensorTexture.value = tensorTarget.texture;
    finalPass.material.uniforms.quantizeLevels.value = quantizeLevels;
    finalPass.material.uniforms.saturation.value = saturation;
    finalPass.material.uniforms.paperStrength.value = paperStrength;
    finalPass.material.uniforms.outlineEnabled.value = outlineEnabled;
    finalPass.material.uniforms.outlineStrength.value = outlineStrength;
    finalPass.material.uniforms.outlineThreshold.value = outlineThreshold;
    finalPass.material.uniforms.outlineSoftness.value = outlineSoftness;
    finalPass.material.uniforms.hatchingEnabled.value = hatchingEnabled;
    finalPass.material.uniforms.hatchScale.value = hatchScale;
    finalPass.material.uniforms.hatchIntensity.value = hatchIntensity;
    finalPass.material.uniforms.hatchThickness.value = hatchThickness;
    finalPass.material.uniforms.hatchRotation.value = hatchRotation;
    gl.setRenderTarget(null);
    gl.clear();
    gl.render(finalPass.scene, fsCamera);

    gl.autoClear = prevAutoClear;
  }, 1);

  return null;
}
