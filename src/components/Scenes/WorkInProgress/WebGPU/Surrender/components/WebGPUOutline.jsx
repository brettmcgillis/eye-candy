import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import {
  mix,
  mx_cell_noise_float as mxCellNoise,
  mx_fractal_noise_float as mxFractalNoise,
  mx_worley_noise_float as mxWorleyNoise,
  pass,
  screenUV,
  texture,
  uniform,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

const BLACK = new THREE.Color(0x000000);

/** Pattern generators keyed by UI label → TSL node builder */
const PATTERN_BUILDERS = {
  Fractal: (uv, pScale, octaves, lacunarity) =>
    mxFractalNoise(uv.mul(pScale), octaves, lacunarity, 0.5),
  Worley: (uv, pScale) => mxWorleyNoise(uv.mul(pScale), 1.0, 0).clamp(0.0, 1.0),
  Cell: (uv, pScale) => mxCellNoise(uv.mul(pScale)).clamp(0.0, 1.0),
};

export const PATTERN_TYPES = ['None', ...Object.keys(PATTERN_BUILDERS)];

/**
 * WebGPU-native outline post-processing for cloth / complex geometry.
 *
 * Uses a mask → gaussian-blur → subtract pipeline so that only the exterior
 * silhouette produces an outline (no internal fold / depth edges).
 *
 * Procedural TSL noise patterns can modulate the outline band for watercolor /
 * hatching / organic effects — no external images required.
 */
export default function WebGPUOutline({
  meshRef,
  edgeStrength = 3,
  edgeThickness = 1,
  visibleEdgeColor = '#7ab0d4',
  downSampleRatio = 2,
  patternType = 'None',
  patternScale = 1,
  patternOctaves = 3,
  patternLacunarity = 2,
}) {
  const { gl: renderer, scene, camera, size } = useThree();
  const postRef = useRef(null);
  const maskRTRef = useRef(null);
  const whiteMatRef = useRef(null);

  const u = useMemo(
    () => ({
      strength: uniform(edgeStrength),
      color: uniform(new THREE.Color(visibleEdgeColor)),
      pScale: uniform(patternScale),
    }),
    // eslint-disable-next-line
    []
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    // --- Mask render target (white silhouettes on black) ---
    // Use full resolution + MSAA so the blur input has smooth edges
    const maskRT = new THREE.RenderTarget(size.width, size.height, {
      depthBuffer: true,
      samples: 4,
    });
    maskRTRef.current = maskRT;

    // Flat white unlit material — DoubleSide so back-facing cloth folds register
    const whiteMat = new THREE.MeshBasicNodeMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
    });
    whiteMatRef.current = whiteMat;

    // --- TSL pipeline ---
    const scenePass = pass(scene, camera);
    const maskTex = texture(maskRT.texture);

    // Blur the mask — sigma controls outline spread, downsample for perf
    const blurred = gaussianBlur(maskTex, edgeThickness, 6, {
      resolutionScale: 1 / downSampleRatio,
    });

    // Subtract original mask → only the halo band remains
    let band = blurred.sub(maskTex).max(0.0);

    // Procedural pattern: modulate outline band with TSL noise
    const builder = PATTERN_BUILDERS[patternType];
    if (builder) {
      const aspect = vec2(size.width / size.height, 1.0);
      const lum = builder(
        screenUV.mul(aspect),
        u.pScale,
        patternOctaves,
        patternLacunarity
      );
      band = band.mul(lum);
    }

    // Alpha-blend outline over the scene so both light and dark colors work
    const alpha = band.mul(u.strength).clamp(0.0, 1.0);

    const postProcessing = new THREE.PostProcessing(renderer);
    postProcessing.outputNode = mix(scenePass, u.color, alpha);
    postRef.current = postProcessing;

    return () => {
      maskRT.dispose();
      whiteMat.dispose();
      postRef.current = null;
      maskRTRef.current = null;
    };
  }, [
    renderer,
    scene,
    camera,
    size,
    downSampleRatio,
    edgeThickness,
    patternType,
    patternOctaves,
    patternLacunarity,
    u,
  ]);

  useFrame(() => {
    const group = meshRef?.current;
    if (!group || !postRef.current) return;

    // --- 1. Render mask: outlined objects as white on black ---
    // Use camera layers to isolate the outline group
    group.traverse((child) => {
      child.layers.enable(1);
    });

    const savedLayerMask = camera.layers.mask;
    const savedBg = scene.background;
    const savedFog = scene.fog;
    const savedOverride = scene.overrideMaterial;

    camera.layers.set(1); // only layer-1 objects visible
    scene.background = BLACK;
    scene.fog = null;
    scene.overrideMaterial = whiteMatRef.current;

    renderer.setRenderTarget(maskRTRef.current);
    renderer.clear();
    renderer.render(scene, camera);

    // Restore state
    camera.layers.mask = savedLayerMask;
    scene.background = savedBg;
    scene.fog = savedFog;
    scene.overrideMaterial = savedOverride;
    renderer.setRenderTarget(null);

    // Remove layer-1 so it doesn't leak to other passes
    group.traverse((child) => {
      child.layers.disable(1);
    });

    // --- 2. Push control values into GPU uniforms ---
    u.strength.value = edgeStrength;
    u.color.value.set(visibleEdgeColor);
    u.pScale.value = patternScale;

    // --- 3. PostProcessing renders beauty + composite ---
    postRef.current.render();
  }, 1);

  return null;
}
