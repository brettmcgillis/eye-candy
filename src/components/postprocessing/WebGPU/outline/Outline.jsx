import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  Fn,
  If,
  Loop,
  float,
  floor,
  fwidth,
  int,
  ivec2,
  length,
  mix,
  mod,
  mx_cell_noise_float as mxCellNoise,
  mx_fractal_noise_float as mxFractalNoise,
  mx_worley_noise_float as mxWorleyNoise,
  pass,
  positionView,
  screenCoordinate,
  screenUV,
  sin,
  smoothstep,
  textureLoad,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const BLACK = new THREE.Color(0x000000);
const OUTLINE_LAYER = 1;
const HUGE_DISTANCE = 4096.0;

const PATTERN_BUILDERS = {
  Fractal: (uv, pScale, octaves, lacunarity) =>
    mxFractalNoise(uv.mul(pScale), octaves, lacunarity, 0.5)
      .mul(0.5)
      .add(0.5)
      .clamp(0.0, 1.0),
  Worley: (uv, pScale) => mxWorleyNoise(uv.mul(pScale), 1.0, 0).clamp(0.0, 1.0),
  Cell: (uv, pScale) => mxCellNoise(uv.mul(pScale)).clamp(0.0, 1.0),
};

const MODE_PATTERN_MAP = {
  fractal: 'Fractal',
  worley: 'Worley',
  cell: 'Cell',
};

export const OUTLINE_MODES = [
  'outline',
  'glow',
  'pulse',
  'halftone',
  'rings',
  'fractal',
  'worley',
  'cell',
];

function resolveTarget(targetRef) {
  return targetRef?.current?.mesh || targetRef?.current || null;
}

function Outline({
  targetRef,
  enabled = true,
  mode = 'outline',
  color = '#ffffff',
  hiddenColor = '#000000',
  hiddenStrength = 0,
  strength = 3,
  thickness = 2,
  glow = 0.35,
  inside = false,
  downSampleRatio = 1,
  patternScale = 1,
  patternOctaves = 3,
  patternLacunarity = 2,
  ringStride = 15,
  halftoneScale = 14,
}) {
  const { gl: renderer, scene, camera, size } = useThree();
  const postRef = useRef(null);
  const jfaRTsRef = useRef([null, null]);
  const jfaQuadRef = useRef(null);
  const maskRTRef = useRef(null);
  const whiteMatRef = useRef(null);

  const uniformsRef = useMemo(
    () => ({
      color: uniform(new THREE.Color(color)),
      hiddenColor: uniform(new THREE.Color(hiddenColor)),
      hiddenStrength: uniform(hiddenStrength),
      strength: uniform(strength),
      patternScale: uniform(patternScale),
      aspect: uniform(new THREE.Vector2(1, 1)),
      resolution: uniform(new THREE.Vector2(1, 1)),
      time: uniform(0),
      thickness: uniform(thickness),
      glow: uniform(glow),
      jfaStep: uniform(1),
      ringStride: uniform(ringStride),
      halftoneScale: uniform(halftoneScale),
      activeJfaIndex: uniform(0),
    }),
    []
  );

  useEffect(() => {
    if (!enabled || !renderer || !scene || !camera) return undefined;

    const drawSize = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rtWidth = Math.max(Math.floor(drawSize.x), 1);
    const rtHeight = Math.max(Math.floor(drawSize.y), 1);

    const baseMode = MODE_PATTERN_MAP[mode] ? 'glow' : mode;
    const resolvedPatternType = MODE_PATTERN_MAP[mode] || 'None';

    const maskRT = new THREE.RenderTarget(rtWidth, rtHeight, {
      depthBuffer: true,
      samples: 0,
      type: THREE.HalfFloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      colorSpace: THREE.NoColorSpace,
    });
    maskRTRef.current = maskRT;

    const jfaRTs = [
      new THREE.RenderTarget(rtWidth, rtHeight, {
        type: THREE.FloatType,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        depthBuffer: false,
        colorSpace: THREE.NoColorSpace,
      }),
      new THREE.RenderTarget(rtWidth, rtHeight, {
        type: THREE.FloatType,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        depthBuffer: false,
        colorSpace: THREE.NoColorSpace,
      }),
    ];
    jfaRTsRef.current = jfaRTs;

    const whiteMat = new THREE.MeshBasicNodeMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
    });
    // .r = silhouette coverage, .g = the target's distance from the camera.
    // The composite needs that depth to decide whether the scene occludes the
    // outline band. fragmentNode, not colorNode: colorNode runs the colour
    // pipeline, which clamps, and the distance is not a colour.
    whiteMat.fragmentNode = vec4(1.0, positionView.z.negate(), 0.0, 1.0);
    whiteMatRef.current = whiteMat;

    const scenePass = pass(scene, camera);
    const maxCoord = ivec2(Math.max(rtWidth - 1, 0), Math.max(rtHeight - 1, 0));
    const hugeDistanceNode = float(HUGE_DISTANCE);

    const quadGeo = new THREE.PlaneGeometry(2, 2);
    const quadScene = new THREE.Scene();
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
    quadCam.position.z = 1;
    const quadMesh = new THREE.Mesh(quadGeo);
    quadMesh.frustumCulled = false;
    quadScene.add(quadMesh);

    const seedMat = new THREE.MeshBasicNodeMaterial({
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    });
    seedMat.fragmentNode = Fn(() => {
      const coord = ivec2(screenCoordinate.xy);
      const left = ivec2(coord.x.sub(1).max(0), coord.y);
      const right = ivec2(coord.x.add(1).min(maxCoord.x), coord.y);
      const down = ivec2(coord.x, coord.y.sub(1).max(0));
      const up = ivec2(coord.x, coord.y.add(1).min(maxCoord.y));
      const selfTexel = textureLoad(maskRT.texture, coord);
      const leftTexel = textureLoad(maskRT.texture, left);
      const rightTexel = textureLoad(maskRT.texture, right);
      const downTexel = textureLoad(maskRT.texture, down);
      const upTexel = textureLoad(maskRT.texture, up);

      const isInside = selfTexel.r.greaterThan(0.5);
      const isBoundary = leftTexel.r
        .greaterThan(0.5)
        .notEqual(isInside)
        .or(rightTexel.r.greaterThan(0.5).notEqual(isInside))
        .or(downTexel.r.greaterThan(0.5).notEqual(isInside))
        .or(upTexel.r.greaterThan(0.5).notEqual(isInside));

      // Seeds land on both sides of the silhouette and outside texels cleared
      // to 0, so take the farthest distance in the neighbourhood — every seed
      // then carries the target's depth rather than the clear.
      const edgeDistance = selfTexel.g
        .max(leftTexel.g)
        .max(rightTexel.g)
        .max(downTexel.g)
        .max(upTexel.g);

      return vec4(
        float(coord.x),
        float(coord.y),
        isBoundary.select(0.0, hugeDistanceNode),
        edgeDistance
      );
    })();

    const createJfaStepMat = (sourceTexture) => {
      const mat = new THREE.MeshBasicNodeMaterial({
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      });

      mat.fragmentNode = Fn(() => {
        const coord = ivec2(screenCoordinate.xy);
        const coordVec = vec2(float(coord.x), float(coord.y));
        const result = textureLoad(sourceTexture, coord).toVar();
        const bestSeed = vec2(result.x, result.y).toVar();
        const bestDist = result.z.toVar();
        const bestViewZ = result.w.toVar();

        Loop(
          {
            start: int(-1),
            end: int(1),
            name: 'ox',
            type: 'int',
            condition: '<=',
          },
          ({ ox }) => {
            Loop(
              {
                start: int(-1),
                end: int(1),
                name: 'oy',
                type: 'int',
                condition: '<=',
              },
              ({ oy }) => {
                const sc = coord
                  .add(ivec2(ox, oy).mul(uniformsRef.jfaStep))
                  .max(ivec2(0, 0))
                  .min(maxCoord);
                const candidate = textureLoad(sourceTexture, sc).toVar();
                If(candidate.z.lessThan(hugeDistanceNode), () => {
                  const propagatedDistance = length(coordVec.sub(candidate.xy));
                  If(propagatedDistance.lessThan(bestDist), () => {
                    bestDist.assign(propagatedDistance);
                    bestSeed.assign(candidate.xy);
                    bestViewZ.assign(candidate.w);
                  });
                });
              }
            );
          }
        );

        return vec4(bestSeed, bestDist, bestViewZ);
      })();

      return mat;
    };

    const jfaStepMatA = createJfaStepMat(jfaRTs[0].texture);
    const jfaStepMatB = createJfaStepMat(jfaRTs[1].texture);
    jfaQuadRef.current = {
      scene: quadScene,
      cam: quadCam,
      mesh: quadMesh,
      seedMat,
      jfaStepMatA,
      jfaStepMatB,
      geo: quadGeo,
    };

    const sampleJfa = Fn(([inputCoord]) => {
      const coord = inputCoord.max(ivec2(0, 0)).min(maxCoord).toVar();
      const seedA = textureLoad(jfaRTs[0].texture, coord);
      const seedB = textureLoad(jfaRTs[1].texture, coord);

      return seedA
        .mul(float(1.0).sub(uniformsRef.activeJfaIndex))
        .add(seedB.mul(uniformsRef.activeJfaIndex));
    });

    const patternBuilder = PATTERN_BUILDERS[resolvedPatternType];
    const patternNode = patternBuilder
      ? patternBuilder(
          screenUV.mul(uniformsRef.aspect),
          uniformsRef.patternScale,
          patternOctaves,
          patternLacunarity
        )
      : float(1.0);

    const thicknessPx = uniformsRef.thickness.max(1.0);
    const currCoord = ivec2(screenCoordinate.xy);
    const insideSign = float(inside ? -1.0 : 1.0);
    const jfaTexel = sampleJfa(currCoord);
    const unsignedDist = jfaTexel.z;
    const maskTexel = textureLoad(maskRT.texture, currCoord);
    const maskValue = maskTexel.r;

    // The band is pure screen space, so without this it paints over anything
    // sitting in front of it — leaves crossing the silhouette, for instance.
    // Outside mode compares against the target's depth at the nearest
    // silhouette point the JFA propagated; inside mode against this pixel's.
    // Soft rather than binary: a hard compare leaves a pixel of fringe at the
    // occluder's own edge, where its depth and the band's land in one texel.
    const gateDistance = inside ? maskTexel.g : jfaTexel.w;
    const gateThreshold = gateDistance.mul(0.98).sub(0.02);
    const gateSoftness = gateDistance
      .mul(uniformsRef.glow)
      .mul(0.05)
      .add(0.005);
    const depthGateNode = smoothstep(
      gateThreshold.sub(gateSoftness),
      gateThreshold.add(gateSoftness),
      scenePass.getViewZNode().negate()
    );

    // "Visible" means the silhouette point this band pixel belongs to is not
    // occluded, which is what the depth gate already measures. three's
    // OutlineNode used to answer this, but it renders selected objects by
    // handing its mask material straight to renderer.renderObject, bypassing
    // the scene.overrideMaterial branch that forwards positionNode. A mesh
    // whose shape lives only in a positionNode — a GPU cloth, whose stored
    // position attribute is all zeros — collapsed to a point in that mask, so
    // it never registered as visible and its band was gated away.
    const hiddenNode = float(1.0).sub(depthGateNode);
    const visibilityMaskNode = depthGateNode
      .add(hiddenNode.mul(uniformsRef.hiddenStrength))
      .clamp(0.0, 1.0);
    const outsideVisibilityGateNode = visibilityMaskNode;

    const maskSign = maskValue.greaterThan(0.5).select(float(-1.0), float(1.0));
    const targetMaskGateNode = maskValue
      .greaterThan(0.5)
      .select(float(1.0), float(0.0));
    const dist = unsignedDist.mul(maskSign).mul(insideSign);
    const sdfValid = unsignedDist
      .lessThan(hugeDistanceNode)
      .select(float(1.0), float(0.0));
    const w = float(0.5);
    // Clips at dist < -0.5 (wrong side of boundary). Positive dist = active side.
    const sideClip = smoothstep(float(-1.0).sub(w), w.sub(1.0), dist);
    const bandAlpha = smoothstep(thicknessPx.add(w), thicknessPx.sub(w), dist)
      .mul(sideClip)
      .mul(sdfValid)
      .mul(uniformsRef.strength)
      .clamp(0.0, 1.0);
    const norm = dist.div(thicknessPx).clamp(0.0, 1.0);
    const fade = float(1.0).sub(norm.mul(norm));
    const pulse = sin(
      uniformsRef.time
        .mul(-0.01)
        .add(
          norm
            .add(0.2)
            .mul(norm.add(0.2))
            .mul(norm.add(0.2))
            .mul(norm.add(0.2))
            .mul(20.0)
        )
    );
    const pulseWidth = fwidth(dist).clamp(-1.0, 1.0).mul(0.5);
    const pulseClip = smoothstep(
      thicknessPx.add(pulseWidth),
      thicknessPx.sub(pulseWidth),
      dist
    ).mul(smoothstep(float(-1.0).sub(pulseWidth), pulseWidth.sub(1.0), dist));
    const hiddenMixNode = hiddenNode
      .mul(uniformsRef.hiddenStrength)
      .div(visibilityMaskNode.max(0.0001))
      .clamp(0.0, 1.0);
    const outlineModeColorNode = mix(
      uniformsRef.color,
      uniformsRef.hiddenColor,
      hiddenMixNode
    );
    const modeVisibilityGateNode = inside
      ? targetMaskGateNode.mul(depthGateNode)
      : outsideVisibilityGateNode;

    let effectColor = uniformsRef.color;
    let effectAlpha = bandAlpha;

    switch (baseMode) {
      case 'outline':
        effectColor = inside ? uniformsRef.color : outlineModeColorNode;
        effectAlpha = bandAlpha.mul(modeVisibilityGateNode).clamp(0.0, 1.0);
        break;

      case 'glow':
        effectAlpha = float(1.0)
          .sub(dist.div(thicknessPx))
          .mul(sideClip)
          .mul(sdfValid)
          .mul(patternNode)
          .clamp(0.0, 1.0);
        break;

      case 'pulse':
        effectColor = mix(
          uniformsRef.color,
          vec3(1.0, 1.0, 1.0),
          float(0.5).mul(float(1.0).sub(norm).pow(4.0))
        );
        effectAlpha = pulseClip
          .mul(fade)
          .mul(smoothstep(0.0, fwidth(pulse), pulse))
          .mul(sdfValid)
          .clamp(0.0, 1.0);
        break;

      case 'halftone': {
        const dotRadiusPx = float(13.0)
          .mul(thicknessPx.min(40.0))
          .mul(0.02)
          .mul(uniformsRef.halftoneScale.max(0.1));
        const dotWidth = dotRadiusPx.mul(2.0);
        const closestDot = floor(screenCoordinate.div(dotWidth))
          .mul(dotWidth)
          .add(dotRadiusPx);
        const dotDistance = length(screenCoordinate.sub(closestDot));
        const dotMask = smoothstep(
          dotRadiusPx,
          dotRadiusPx.sub(1.0),
          dotDistance
        );

        effectAlpha = bandAlpha.mul(dotMask).mul(sdfValid).clamp(0.0, 1.0);
        break;
      }

      case 'rings': {
        const safeStride = uniformsRef.ringStride.max(1.0);
        const effectiveStride = safeStride.min(thicknessPx.max(1.0));
        const value = float(1.0).sub(dist.div(thicknessPx)).clamp(0.0, 1.0);
        const ringLine = smoothstep(
          float(0.2).add(w.div(thicknessPx)),
          float(0.2).sub(w.div(thicknessPx)),
          mod(float(1.0).sub(value).mul(thicknessPx).div(effectiveStride), 1.0)
        );
        const extent = effectiveStride.mul(
          floor(thicknessPx.div(effectiveStride))
        );

        effectAlpha = ringLine
          .mul(sideClip)
          .mul(smoothstep(extent.add(w), extent.sub(w), dist.add(1.0)))
          .mul(sdfValid)
          .clamp(0.0, 1.0);
        break;
      }

      default:
        effectAlpha = float(1.0)
          .sub(dist.div(thicknessPx))
          .mul(sideClip)
          .mul(sdfValid)
          .mul(patternNode)
          .clamp(0.0, 1.0);
    }

    // Make all non-outline modes use the same visibility classification as
    // the built-in outline node (respecting hiddenStrength).
    if (baseMode !== 'outline') {
      effectAlpha = effectAlpha.mul(modeVisibilityGateNode).clamp(0.0, 1.0);
    }

    const postProcessing = new THREE.RenderPipeline(renderer);
    postProcessing.outputNode = mix(scenePass, effectColor, effectAlpha);
    postRef.current = postProcessing;

    return () => {
      whiteMat.dispose();
      maskRT.dispose();
      jfaRTs.forEach((rt) => rt.dispose());
      seedMat.dispose();
      jfaStepMatA.dispose();
      jfaStepMatB.dispose();
      quadGeo.dispose();
      whiteMatRef.current = null;
      maskRTRef.current = null;
      jfaRTsRef.current = [null, null];
      jfaQuadRef.current = null;
      postRef.current = null;
    };
  }, [
    camera,
    downSampleRatio,
    enabled,
    halftoneScale,
    inside,
    mode,
    patternLacunarity,
    patternOctaves,
    renderer,
    ringStride,
    scene,
    size.height,
    size.width,
    thickness,
    uniformsRef,
  ]);

  useEffect(() => {
    if (!enabled) return;

    const drawSize = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rtWidth = Math.max(Math.floor(drawSize.x), 1);
    const rtHeight = Math.max(Math.floor(drawSize.y), 1);

    if (maskRTRef.current) {
      maskRTRef.current.setSize(rtWidth, rtHeight);
    }

    if (jfaRTsRef.current[0] && jfaRTsRef.current[1]) {
      jfaRTsRef.current[0].setSize(rtWidth, rtHeight);
      jfaRTsRef.current[1].setSize(rtWidth, rtHeight);
    }
  }, [enabled, renderer, size.height, size.width]);

  useFrame(({ clock }) => {
    if (!enabled) {
      renderer.render(scene, camera);
      return;
    }

    const drawSize = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rtWidth = Math.max(Math.floor(drawSize.x), 1);
    const rtHeight = Math.max(Math.floor(drawSize.y), 1);

    const target = resolveTarget(targetRef);
    const post = postRef.current;
    const jfaRTs = jfaRTsRef.current;
    const jfaQuad = jfaQuadRef.current;
    const maskRT = maskRTRef.current;
    const whiteMat = whiteMatRef.current;
    if (!target || !post || !jfaRTs[0] || !jfaQuad || !maskRT || !whiteMat) {
      renderer.render(scene, camera);
      return;
    }

    target.traverse((child) => {
      child.layers.enable(OUTLINE_LAYER);
    });

    const savedLayerMask = camera.layers.mask;
    const savedBg = scene.background;
    const savedFog = scene.fog;
    const savedOverride = scene.overrideMaterial;

    // Target only — the silhouette is the whole target, unclipped. Occlusion is
    // resolved at composite time against the scene pass's own depth, which is
    // both cheaper than a second scene render and actually correct for the
    // alpha-cutout sprites a depth prepass cannot represent.
    renderer.setRenderTarget(maskRT);
    camera.layers.set(OUTLINE_LAYER);
    scene.background = BLACK;
    scene.fog = null;
    scene.overrideMaterial = whiteMat;

    renderer.clear(true, true, false);
    renderer.render(scene, camera);

    camera.layers.mask = savedLayerMask;
    scene.background = savedBg;
    scene.fog = savedFog;
    scene.overrideMaterial = savedOverride;
    renderer.setRenderTarget(null);

    target.traverse((child) => {
      child.layers.disable(OUTLINE_LAYER);
    });

    const {
      scene: jfaScene,
      cam: jfaCam,
      mesh: jfaMesh,
      seedMat,
      jfaStepMatA,
      jfaStepMatB,
    } = jfaQuad;

    jfaMesh.material = seedMat;
    renderer.setRenderTarget(jfaRTs[0]);
    renderer.clear();
    renderer.render(jfaScene, jfaCam);

    let step = Math.min(Math.max(rtWidth, rtHeight), Math.max(thickness, 1));
    let activeIndex = 0;
    for (;;) {
      uniformsRef.jfaStep.value = step;
      const dstIndex = activeIndex === 0 ? 1 : 0;
      jfaMesh.material = activeIndex === 0 ? jfaStepMatA : jfaStepMatB;
      renderer.setRenderTarget(jfaRTs[dstIndex]);
      renderer.clear();
      renderer.render(jfaScene, jfaCam);
      activeIndex = dstIndex;

      if (step <= 1) {
        break;
      }

      step = Math.ceil(step * 0.5);
    }
    renderer.setRenderTarget(null);

    uniformsRef.color.value.set(color);
    uniformsRef.hiddenColor.value.set(hiddenColor);
    uniformsRef.hiddenStrength.value = hiddenStrength;
    uniformsRef.strength.value = strength;
    uniformsRef.patternScale.value = patternScale;
    uniformsRef.aspect.value.set(rtWidth / Math.max(rtHeight, 1), 1);
    uniformsRef.resolution.value.set(rtWidth, rtHeight);
    uniformsRef.time.value = clock.elapsedTime * 1000;
    uniformsRef.thickness.value = thickness;
    uniformsRef.glow.value = glow;
    uniformsRef.ringStride.value = ringStride;
    uniformsRef.halftoneScale.value = halftoneScale;
    uniformsRef.activeJfaIndex.value = activeIndex;

    post.render();

    // if (renderer.backend?.trackTimestamp) {
    //   renderer.resolveTimestampsAsync(THREE.TimestampQuery.RENDER);
    // }
  }, 1);

  return null;
}

export default memo(Outline);
