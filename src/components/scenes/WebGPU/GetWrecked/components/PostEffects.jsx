// One RenderPipeline for the whole scene. The shared Godrays component builds
// its own pipeline and renders at the same useFrame priority, so it can't be
// dropped in alongside this — its node chain is inlined here instead, ahead of
// the glitch passes, so light shafts get corrupted along with everything else.
//
// Order is deliberate: godrays composite first (they're part of the picture,
// not an artifact of it), then the capture artifacts — pixel sort and
// chromatic aberration — masked off the empty background by depth, and last
// the two frame-level effects, datamosh and pixel bleed, which both model
// something chewing on the finished frame and so have to see it finished.
// Which of those two runs first is a control, since a bled frame fed to the
// codec and a codec's output printed onto emulsion are different looks.
import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { chromaticAberration } from 'three/addons/tsl/display/ChromaticAberrationNode.js';
import {
  Break,
  Fn,
  If,
  Loop,
  convertToTexture,
  int,
  mix,
  mrt,
  output,
  pass,
  screenUV,
  smoothstep,
  uniform,
  vec2,
  velocity,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  bilateralBlur,
  datamosh,
  depthAwareBlend,
  godrays,
} from '@modules/tsl';

import PixelBleedNode, {
  BLEED_QUALITY,
  buildPixelBleedNode,
  createPixelBleedUniforms,
} from '../utils/pixelBleed';

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

function PostEffects({ config, godrayLight }) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const nodesRef = useRef(null);

  const uniforms = useMemo(
    () => ({
      strength: uniform(1),
      scale: uniform(1.5),
      pixelSortThreshold: uniform(0.55),
      pixelSortSteps: uniform(20),
      pixelSortStepSize: uniform(0.004),
      pixelSortDirection: uniform(new THREE.Vector2(0, 1)),
      godrayBlendColor: uniform(new THREE.Color('#ffffff')),
      godrayEdgeRadius: uniform(int(2)),
      godrayEdgeStrength: uniform(2),
    }),
    []
  );

  const bleedUniforms = useMemo(() => createPixelBleedUniforms(), []);

  const {
    postChromaticAberrationEnabled: chromaticEnabled,
    postPixelSortEnabled: pixelSortEnabled,
    postGodraysEnabled: godraysEnabled,
    postGodraysBlur: godraysBlur,
    postDatamoshEnabled: datamoshEnabled,
    postPixelBleedEnabled: pixelBleedEnabled,
    postPixelBleedMotionSmear: bleedMotionSmear,
    postPixelBleedQuality: bleedQuality,
    postPixelBleedOrder: bleedOrder,
  } = config;

  const godraysActive = godraysEnabled && !!godrayLight;

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const scenePass = pass(scene, camera);

    // The velocity buffer is an extra full-screen attachment on every scene
    // draw, so it's only attached when datamosh will actually read it.
    if (datamoshEnabled) {
      scenePass.setMRT(mrt({ output, velocity }));
    }

    const sceneColor = scenePass.getTextureNode('output');
    const sceneDepth = scenePass.getTextureNode('depth');
    const backgroundMask = smoothstep(
      0.98,
      0.999,
      scenePass.getLinearDepthNode()
    );

    let godraysNode = null;
    let lit = sceneColor;

    if (godraysActive) {
      godraysNode = godrays(sceneDepth, camera, godrayLight);
      const raw = godraysNode.getTextureNode();
      const shafts = godraysBlur ? bilateralBlur(raw).getTextureNode() : raw;

      lit = depthAwareBlend(sceneColor, shafts, sceneDepth, camera, {
        blendColor: uniforms.godrayBlendColor,
        edgeRadius: uniforms.godrayEdgeRadius,
        edgeStrength: uniforms.godrayEdgeStrength,
      });
    }

    let glitched = lit;

    if (pixelSortEnabled) {
      glitched = buildPixelSortNode(convertToTexture(glitched), uniforms);
    }

    if (chromaticEnabled) {
      glitched = chromaticAberration(
        glitched,
        uniforms.strength,
        vec2(0.5, 0.5),
        uniforms.scale
      );
    }

    const masked =
      pixelSortEnabled || chromaticEnabled
        ? mix(glitched, lit, backgroundMask)
        : glitched;

    let datamoshNode = null;

    // Motion Smear is the only reason the bleed needs render targets — without
    // it the bleed is a pure spatial filter that runs inline, so the toggle is
    // what picks between the two paths rather than the smear slider.
    const applyBleed = (node) => {
      if (!pixelBleedEnabled) return node;

      const quality = BLEED_QUALITY[bleedQuality] ?? BLEED_QUALITY.fast;
      const source = convertToTexture(node);

      return bleedMotionSmear
        ? new PixelBleedNode(source, bleedUniforms, quality).getTextureNode()
        : buildPixelBleedNode(source, bleedUniforms, quality);
    };

    const applyDatamosh = (node) => {
      if (!datamoshEnabled) return node;

      datamoshNode = datamosh(node, scenePass.getTextureNode('velocity'));
      return datamoshNode.getTextureNode();
    };

    const outputNode =
      bleedOrder === 'before'
        ? applyDatamosh(applyBleed(masked))
        : applyBleed(applyDatamosh(masked));

    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = outputNode;
    postRef.current = postProcessing;
    nodesRef.current = { datamoshNode, godraysNode };

    return () => {
      postRef.current = null;
      nodesRef.current = null;
    };
  }, [
    renderer,
    scene,
    camera,
    chromaticEnabled,
    pixelSortEnabled,
    godraysActive,
    godraysBlur,
    godrayLight,
    datamoshEnabled,
    pixelBleedEnabled,
    bleedMotionSmear,
    bleedQuality,
    bleedOrder,
    bleedUniforms,
    uniforms,
  ]);

  useFrame(() => {
    uniforms.strength.value = config.postChromaticAberrationStrength;
    uniforms.scale.value = config.postChromaticAberrationScale;

    uniforms.pixelSortThreshold.value = config.postPixelSortThreshold;
    uniforms.pixelSortSteps.value = config.postPixelSortSteps;
    uniforms.pixelSortStepSize.value = config.postPixelSortStepSize;
    uniforms.pixelSortDirection.value.set(
      config.postPixelSortDirection === 'horizontal' ? 1 : 0,
      config.postPixelSortDirection === 'horizontal' ? 0 : 1
    );

    uniforms.godrayBlendColor.value.set(config.postGodraysBlendColor);
    uniforms.godrayEdgeRadius.value = config.postGodraysEdgeRadius;
    uniforms.godrayEdgeStrength.value = config.postGodraysEdgeStrength;

    const nodes = nodesRef.current;

    if (nodes?.godraysNode) {
      nodes.godraysNode.density.value = config.postGodraysDensity;
      nodes.godraysNode.maxDensity.value = config.postGodraysMaxDensity;
      nodes.godraysNode.distanceAttenuation.value =
        config.postGodraysDistanceAttenuation;
      nodes.godraysNode.raymarchSteps.value = config.postGodraysRaymarchSteps;
    }

    if (nodes?.datamoshNode) {
      nodes.datamoshNode.corruption.value = config.postDatamoshCorruption;
      nodes.datamoshNode.displace.value = config.postDatamoshDisplace;
      nodes.datamoshNode.blockSize.value = config.postDatamoshBlockSize;
    }

    bleedUniforms.reach.value = config.postPixelBleedReach;
    bleedUniforms.strength.value = config.postPixelBleedStrength;
    bleedUniforms.angle.value = config.postPixelBleedAngle;
    bleedUniforms.offsetR.value = config.postPixelBleedOffsetR;
    bleedUniforms.offsetG.value = config.postPixelBleedOffsetG;
    bleedUniforms.offsetB.value = config.postPixelBleedOffsetB;
    bleedUniforms.highlights.value = config.postPixelBleedHighlights;
    bleedUniforms.tintColor.value.set(config.postPixelBleedTint);
    bleedUniforms.tintAmount.value = config.postPixelBleedTintAmount;
    bleedUniforms.smear.value = bleedMotionSmear
      ? config.postPixelBleedSmear
      : 0;

    if (!postRef.current) return;
    postRef.current.render();
  }, 1);

  return null;
}

export default memo(PostEffects);
