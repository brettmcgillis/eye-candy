// WebGPU-native TSL post pass — follows the same pattern as
// Aisle9/TouchGrass/LoGlow's PostEffects: a pass(scene, camera) node chain
// rendered via THREE.RenderPipeline instead of the default renderer.render().
//
// Chromatic Aberration and Pixel Sort both live here — real lens/capture
// artifacts, legitimately screen-space (contrast Scroll Tear, which turned
// out to belong on the car's own geometry/UV instead — see
// utils/glitchMaterial.js — since dragging whole screen rows around
// regardless of what's under them broke the car's silhouette).
//
// The depth-based mask below guards both effects' edges: background pixels
// (nothing rendered there) sit at the far clip plane, the car sits much
// closer, so `getLinearDepthNode()` cleanly separates them — no second
// "car-only" render pass needed.
import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { chromaticAberration } from 'three/addons/tsl/display/ChromaticAberrationNode.js';
import {
  Break,
  Fn,
  If,
  Loop,
  int,
  mix,
  pass,
  screenUV,
  smoothstep,
  uniform,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const MAX_PIXEL_SORT_STEPS = 64;

function computeLuminance(c) {
  return c.r.mul(0.2126).add(c.g.mul(0.7152)).add(c.b.mul(0.0722));
}

// "Pixel sorting" glitch look, approximated for real-time GPU use — there's
// no clean single-pass GPU equivalent to a true per-row/column sort, so
// this instead walks from each bright-enough pixel along a direction until
// it finds the edge of that bright "run" (or hits the step cap), and paints
// the whole span with whatever color it lands on. Same streaking, dripping
// character as a real sort, without actually sorting anything.
function buildPixelSortNode(sceneColor, u) {
  return Fn(() => {
    const baseColor = sceneColor.sample(screenUV).toVar('psBase');
    const result = baseColor.toVar('psResult');

    If(computeLuminance(baseColor).greaterThan(u.pixelSortThreshold), () => {
      const stepVec = u.pixelSortDirection.mul(u.pixelSortStepSize);
      const sampleUv = screenUV.toVar('psUv');

      Loop(
        { start: int(0), end: int(MAX_PIXEL_SORT_STEPS), type: 'int' },
        ({ i }) => {
          If(i.greaterThanEqual(u.pixelSortSteps), () => {
            Break();
          });

          sampleUv.assign(sampleUv.add(stepVec));
          const sampled = sceneColor.sample(sampleUv);

          If(computeLuminance(sampled).lessThan(u.pixelSortThreshold), () => {
            result.assign(sampled);
            Break();
          });

          result.assign(sampled);
        }
      );
    });

    return result;
  })();
}

function PostEffects({
  chromaticAberrationEnabled,
  chromaticAberrationScale,
  chromaticAberrationStrength,
  pixelSortDirection,
  pixelSortEnabled,
  pixelSortStepSize,
  pixelSortSteps,
  pixelSortThreshold,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);

  const uniforms = useMemo(
    () => ({
      strength: uniform(chromaticAberrationStrength),
      scale: uniform(chromaticAberrationScale),
      pixelSortThreshold: uniform(pixelSortThreshold),
      pixelSortSteps: uniform(pixelSortSteps),
      pixelSortStepSize: uniform(pixelSortStepSize),
      pixelSortDirection: uniform(new THREE.Vector2(0, 1)),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode();
    const backgroundMask = smoothstep(
      0.98,
      0.999,
      scenePass.getLinearDepthNode()
    );

    let effectNode = sceneColor;

    if (pixelSortEnabled) {
      effectNode = buildPixelSortNode(sceneColor, uniforms);
    }

    if (chromaticAberrationEnabled) {
      effectNode = chromaticAberration(
        effectNode,
        uniforms.strength,
        vec2(0.5, 0.5),
        uniforms.scale
      );
    }

    const outputNode =
      pixelSortEnabled || chromaticAberrationEnabled
        ? mix(effectNode, sceneColor, backgroundMask)
        : sceneColor;

    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = outputNode;
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
    };
  }, [
    renderer,
    scene,
    camera,
    chromaticAberrationEnabled,
    pixelSortEnabled,
    uniforms,
  ]);

  useFrame(() => {
    uniforms.strength.value = chromaticAberrationStrength;
    uniforms.scale.value = chromaticAberrationScale;

    uniforms.pixelSortThreshold.value = pixelSortThreshold;
    uniforms.pixelSortSteps.value = pixelSortSteps;
    uniforms.pixelSortStepSize.value = pixelSortStepSize;
    uniforms.pixelSortDirection.value.set(
      pixelSortDirection === 'horizontal' ? 1 : 0,
      pixelSortDirection === 'horizontal' ? 0 : 1
    );

    if (!postRef.current) return;
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(PostEffects);
