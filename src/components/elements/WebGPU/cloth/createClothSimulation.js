import {
  Fn,
  If,
  Loop,
  Return,
  attribute,
  cross,
  faceDirection,
  float,
  instanceIndex,
  instancedArray,
  min,
  mix,
  select,
  smoothstep,
  texture,
  time,
  transformNormalToView,
  triNoise3D,
  uint,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  NUM_ANCHORS,
  buildClothTopology,
  computeClothAlpha,
  fbm2D,
} from './clothTopology';

/**
 * Creates a GPU-accelerated cloth simulation using verlet integration
 * with spring-mass system and WebGPU compute shaders.
 *
 * @param {Object} config
 * @param {number}  config.width         - Cloth width
 * @param {number}  config.height        - Cloth height (or length for ribbons)
 * @param {number}  config.segmentsX     - Horizontal segments
 * @param {number}  config.segmentsY     - Vertical segments
 * @param {number[]} config.pins         - Vertex indices to fix (from pinHelpers)
 * @param {boolean} config.centered      - Center grid horizontally on origin
 * @param {'vertical'|'horizontal'} [config.orientation] - Grid plane: 'vertical' = XY (default), 'horizontal' = XZ
 * @param {number[]} config.origin       - [x, y, z] grid origin
 * @param {number}  config.gravity       - Gravity force per step
 * @param {number}  config.windFrequency - triNoise3D frequency
 * @param {number}  config.windAmplitude - Wind noise multiplier
 * @param {string}  [config.shape]       - Shape preset name ('rectangle'|'circle'|'ribbon-notched')
 * @param {Object}  [config.alpha]         - Alpha masking params for edges/holes
 * @param {number}  [config.alpha.seed]     - Noise seed (default: 42)
 * @param {number}  [config.alpha.scale]    - Noise frequency (default: 3)
 * @param {number}  [config.alpha.edgeFade] - Shape-edge alpha fade width 0–1 (default: 0)
 * @param {number}  [config.alpha.holeAmount] - Interior holes via noise 0–1 (default: 0)
 * @param {number}  [config.alpha.tatterEdge] - Tatter near free edges 0–1 (default: 0)
 * @param {boolean} [config.alpha.smoothEdges] - Soft-threshold holes/tatters for curved edges (default: false)
 * @param {Array}   [config.alpha.cutouts]  - Array of {u, v, radius} cutouts
 * @param {THREE.Material} config.material - Material to configure positionNode on
 */
export default function createClothSimulation({
  width = 1.0,
  height = 0.7,
  segmentsX = 30,
  segmentsY = 21,
  pins = [],
  centered = false,
  orientation = 'vertical',
  origin = [0, 0, 0],
  gravity = 0.00005,
  windFrequency = 1,
  windAmplitude = 0.0001,
  shape = 'rectangle',
  anchors = [],
  alpha = {},
  material,
  // Optional (viewNormal) => viewNormal hook, for surface detail the cloth
  // itself knows nothing about. It has to live here because the geometric
  // normal is only assembled inside positionNode, at shader build time.
  normalDetail = null,
}) {
  const topology = buildClothTopology({
    width,
    height,
    segmentsX,
    segmentsY,
    pins,
    centered,
    orientation,
    origin,
    shape,
    anchors,
  });
  const {
    anchorOffsetArr,
    edgePinned,
    meshVCount,
    paramsArr,
    posArr,
    sCount,
    shapeDistArr,
    springList,
    springRestLen,
    springVtxIds,
    vCount,
  } = topology;

  const posBuf = instancedArray(posArr, 'vec3').setPBO(true);
  const forceBuf = instancedArray(vCount, 'vec3');

  // ── Dynamic anchors ──
  // Anchors pin clusters of vertices that translate rigidly with an
  // external position each frame. Up to NUM_ANCHORS slots.
  // paramsBuf.x encoding: 0 = free, 1 = static pin, 2+ = anchor slot.
  const anchorPosU = [];
  for (let a = 0; a < NUM_ANCHORS; a += 1) {
    anchorPosU.push(uniform(new THREE.Vector3(0, 0, 0)));
  }

  const anchorOffsetBuf = instancedArray(anchorOffsetArr, 'vec3');

  const paramsBuf = instancedArray(paramsArr, 'uvec3');
  const springListBuf = instancedArray(springList, 'uint').setPBO(true);

  // ── Spring storage buffers ──
  const springVtxIdBuf = instancedArray(springVtxIds, 'uvec2').setPBO(true);
  const springRestLenBuf = instancedArray(springRestLen, 'float');
  const springForceBuf = instancedArray(sCount * 3, 'vec3').setPBO(true);

  // ── Uniforms ──
  const dampeningU = uniform(0.99);
  const windU = uniform(1.0);
  const windDirU = uniform(new THREE.Vector3(1, 0, 0));
  const stiffnessU = uniform(0.2);
  const maxVelocityU = uniform(0.01);
  const gravityU = uniform(gravity);
  const gravityDirU = uniform(new THREE.Vector3(0, -1, 0));

  // 12-slot sphere collider system — fixed-size arrays for GPU unrolling.
  // Slot 0 = cursor (managed by ClothMesh pointer logic).
  // Slots 1-11 = scene-controlled via `colliders` prop.
  const NUM_COLLIDERS = 12;
  const colliderPosU = [];
  const colliderEnabledU = [];
  const colliderRadiusU = [];
  for (let c = 0; c < NUM_COLLIDERS; c += 1) {
    colliderPosU.push(uniform(new THREE.Vector3(10, 10, 10)));
    colliderEnabledU.push(uniform(0.0));
    colliderRadiusU.push(uniform(0.12));
  }

  // Collision margin — enlarges the detection volume beyond the visual radius
  // so vertices near (but not inside) small spheres still get caught.
  const collisionMarginU = uniform(0.02);

  // Per-vertex alpha buffer — drives collision masking (verlet death).
  // 0 = fully transparent (colliders pass through), 1 = fully opaque.
  const alphaArr = new Float32Array(vCount).fill(1);
  const alphaBuf = instancedArray(alphaArr, 'float');

  // Render-only alpha. Mirrors alphaBuf in non-smooth mode; in smoothEdges
  // mode it omits the binary kill so per-pixel shader noise alone defines
  // the visible boundary, producing curves at sub-vertex resolution.
  const renderAlphaArr = new Float32Array(vCount).fill(1);
  const renderAlphaBuf = instancedArray(renderAlphaArr, 'float');

  // Noise texture for per-pixel hole/tatter alpha. Same fbm field as the CPU
  // pass so the shader's smooth boundary aligns with the verlet kill region.
  const NOISE_TEX_SIZE = 256;
  const noiseTexData = new Float32Array(NOISE_TEX_SIZE * NOISE_TEX_SIZE);
  const noiseTexture = new THREE.DataTexture(
    noiseTexData,
    NOISE_TEX_SIZE,
    NOISE_TEX_SIZE,
    THREE.RedFormat,
    THREE.FloatType
  );
  noiseTexture.minFilter = THREE.LinearFilter;
  noiseTexture.magFilter = THREE.LinearFilter;
  noiseTexture.wrapS = THREE.ClampToEdgeWrapping;
  noiseTexture.wrapT = THREE.ClampToEdgeWrapping;

  const smoothEdgesU = uniform(0);
  const holeAmountU = uniform(0);
  const tatterEdgeU = uniform(0);
  // (left, right, top, bottom) — 1 if that edge is fully pinned
  const edgePinnedU = uniform(new THREE.Vector4(0, 0, 0, 0));

  edgePinnedU.value.set(
    edgePinned.left ? 1 : 0,
    edgePinned.right ? 1 : 0,
    edgePinned.top ? 1 : 0,
    edgePinned.bottom ? 1 : 0
  );

  // ── Compute shader 1 — spring forces ──
  const computeSprings = Fn(() => {
    // Guard against out-of-bounds workgroup threads
    If(instanceIndex.greaterThanEqual(uint(sCount)), () => Return());

    const vtxIds = springVtxIdBuf.element(instanceIndex);
    const restLen = springRestLenBuf.element(instanceIndex);
    const p0 = posBuf.element(vtxIds.x);
    const p1 = posBuf.element(vtxIds.y);
    const delta = p1.sub(p0).toVar();
    const dist = delta.length().max(0.000001).toVar();
    const force = dist
      .sub(restLen)
      .mul(stiffnessU)
      .mul(delta)
      .mul(0.5)
      .div(dist);
    springForceBuf.element(instanceIndex).assign(force);
  })()
    .compute(sCount)
    .setName('Cloth Spring Forces');

  // ── Compute shader 2 — accumulate vertex forces ──
  const computeVertices = Fn(() => {
    // Guard against out-of-bounds workgroup threads
    If(instanceIndex.greaterThanEqual(uint(vCount)), () => Return());

    const p = paramsBuf.element(instanceIndex).toVar();
    const isFixed = p.x;
    const sNum = p.y;
    const sPtr = p.z;

    // Static pin — vertex stays at its rest position forever.
    If(isFixed.equal(uint(1)), () => Return());

    // Dynamic anchor — vertex translates rigidly with its anchor position.
    If(isFixed.greaterThanEqual(uint(2)), () => {
      const slot = isFixed.sub(uint(2));
      const offset = anchorOffsetBuf.element(instanceIndex);
      const target = select(
        slot.equal(uint(0)),
        anchorPosU[0],
        select(
          slot.equal(uint(1)),
          anchorPosU[1],
          select(
            slot.equal(uint(2)),
            anchorPosU[2],
            select(
              slot.equal(uint(3)),
              anchorPosU[3],
              select(
                slot.equal(uint(4)),
                anchorPosU[4],
                select(
                  slot.equal(uint(5)),
                  anchorPosU[5],
                  select(
                    slot.equal(uint(6)),
                    anchorPosU[6],
                    select(
                      slot.equal(uint(7)),
                      anchorPosU[7],
                      select(
                        slot.equal(uint(8)),
                        anchorPosU[8],
                        select(
                          slot.equal(uint(9)),
                          anchorPosU[9],
                          anchorPosU[10]
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      );
      posBuf.element(instanceIndex).assign(target.add(offset));
      forceBuf.element(instanceIndex).assign(vec3(0, 0, 0));
      Return();
    });

    const position = posBuf.element(instanceIndex).toVar('vertexPosition');
    const force = forceBuf.element(instanceIndex).toVar('vertexForce');

    force.mulAssign(dampeningU);

    const start = sPtr.toVar('ptrStart');
    const end = start.add(sNum).toVar('ptrEnd');

    Loop({ start, end, type: 'uint', condition: '<' }, ({ i }) => {
      const sid = springListBuf.element(i).toVar('sid');
      const sf = springForceBuf.element(sid);
      const svIds = springVtxIdBuf.element(sid);
      const factor = select(svIds.x.equal(instanceIndex), 1.0, -1.0);
      force.addAssign(sf.mul(factor));
    });

    // gravity (direction-aware so rotation of the parent group is respected)
    force.addAssign(gravityDirU.mul(gravityU));

    // wind
    const noise = triNoise3D(position, windFrequency, time)
      .sub(0.2)
      .mul(windAmplitude);
    const windForce = noise.mul(windU);
    force.addAssign(windDirU.mul(windForce));

    // Clamp velocity to prevent simulation explosion
    const speed = force.length().toVar();
    If(speed.greaterThan(maxVelocityU), () => {
      force.mulAssign(maxVelocityU.div(speed));
    });

    // Store velocity, then compute candidate position
    forceBuf.element(instanceIndex).assign(force);
    const newPos = position.add(force).toVar('newPos');

    // Hard sphere collision — project vertex onto sphere surface if inside
    // the enlarged detection volume (radius + margin). Detection uses the
    // padded radius so small spheres still catch nearby vertices that would
    // otherwise slip through the grid. Projection pushes to the padded
    // surface so the cloth visually wraps the collision volume.
    const alphaVal = alphaBuf.element(instanceIndex);
    for (let c = 0; c < NUM_COLLIDERS; c += 1) {
      const toVertex = newPos.sub(colliderPosU[c]).toVar();
      const dist = toVertex.length().max(0.000001).toVar();
      const effectiveRadius = colliderRadiusU[c].add(collisionMarginU);
      const penetration = effectiveRadius.sub(dist);
      If(
        penetration
          .greaterThan(0)
          .and(colliderEnabledU[c].greaterThan(0.5))
          .and(alphaVal.greaterThan(0.01)),
        () => {
          const normal = toVertex.div(dist);
          const surface = colliderPosU[c].add(normal.mul(effectiveRadius));
          newPos.assign(surface);
          // Zero out inward velocity component
          const vDotN = force.dot(normal);
          If(vDotN.lessThan(0), () => {
            forceBuf.element(instanceIndex).subAssign(normal.mul(vDotN));
          });
        }
      );
    }

    posBuf.element(instanceIndex).assign(newPos);
  })()
    .compute(vCount)
    .setName('Cloth Vertex Forces');

  // ── Renderable cloth geometry ──
  const geometry = new THREE.BufferGeometry();
  const { uvArr, vtxIdArr } = topology;

  // Pre-allocate index buffer at max capacity (all quads present)
  const maxFaces = (segmentsX - 1) * (segmentsY - 1);
  const indexArray = new Uint32Array(maxFaces * 6);
  const indexAttr = new THREE.BufferAttribute(indexArray, 1);

  // Dead quads (any sim corner outside the shape) are excluded so the
  // positionNode never averages fixed outside vertices with free ones.
  const buildIndexBuffer = () => {
    const { count } = topology.buildIndices(indexArray);
    geometry.setDrawRange(0, count);
    indexAttr.needsUpdate = true;
  };

  // Rebuild per-vertex alpha from shape edge fade, noise holes, tatter edges,
  // and positioned cutouts. Called whenever alpha-related params change.
  // Maintains two parallel buffers:
  //   alphaBuf       — physics/collision (binary kill always applied)
  //   renderAlphaBuf — rendering. In smoothEdges mode, kill is omitted so the
  //                    per-pixel shader noise alone defines the visible edge.
  let lastNoiseScale = -1;
  let lastNoiseSeed = -1;
  const rebuildAlpha = ({
    seed: aSeed = 42,
    scale: aScale = 3,
    edgeFade: aEdgeFade = 0,
    holeAmount: aHoles = 0,
    tatterEdge: aTatterEdge = 0,
    smoothEdges: aSmoothEdges = false,
  } = {}) => {
    // Re-bake noise texture only when seed/scale change (sampled per-fragment
    // by the shader). Stored row-major with v unflipped — shader compensates
    // for the geometry's inverted UV.
    if (aScale !== lastNoiseScale || aSeed !== lastNoiseSeed) {
      for (let ty = 0; ty < NOISE_TEX_SIZE; ty += 1) {
        const v = ty / (NOISE_TEX_SIZE - 1);
        for (let tx = 0; tx < NOISE_TEX_SIZE; tx += 1) {
          const u = tx / (NOISE_TEX_SIZE - 1);
          noiseTexData[ty * NOISE_TEX_SIZE + tx] = fbm2D(
            u * aScale,
            v * aScale,
            aSeed
          );
        }
      }
      noiseTexture.needsUpdate = true;
      lastNoiseScale = aScale;
      lastNoiseSeed = aSeed;
    }

    smoothEdgesU.value = aSmoothEdges ? 1 : 0;
    holeAmountU.value = aHoles;
    tatterEdgeU.value = aTatterEdge;

    const { alpha: nextAlpha, render: nextRender } = computeClothAlpha(
      topology,
      {
        seed: aSeed,
        scale: aScale,
        edgeFade: aEdgeFade,
        holeAmount: aHoles,
        tatterEdge: aTatterEdge,
        smoothEdges: aSmoothEdges,
      }
    );
    alphaArr.set(nextAlpha);
    renderAlphaArr.set(nextRender);
    alphaBuf.value.needsUpdate = true;
    renderAlphaBuf.value.needsUpdate = true;
  };

  rebuildAlpha(alpha);
  buildIndexBuffer();

  // Physical node materials may still validate the geometry's normal
  // attribute even when shading uses the computed normalNode below.
  const normalArr = new Float32Array(meshVCount * 3);
  for (let i = 2; i < normalArr.length; i += 3) {
    normalArr[i] = 1;
  }

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(meshVCount * 3), 3)
  );
  geometry.setAttribute('normal', new THREE.BufferAttribute(normalArr, 3));
  geometry.setAttribute(
    'vertexIds',
    new THREE.BufferAttribute(vtxIdArr, 4, false)
  );
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
  geometry.setIndex(indexAttr);

  // ── Set positionNode + normalNode on caller-provided material ──
  // eslint-disable-next-line no-param-reassign
  material.positionNode = Fn(({ material: mat }) => {
    const ids = attribute('vertexIds');
    const v0 = posBuf.element(ids.x).toVar();
    const v1 = posBuf.element(ids.y).toVar();
    const v2 = posBuf.element(ids.z).toVar();
    const v3 = posBuf.element(ids.w).toVar();

    const top = v0.add(v1);
    const right = v1.add(v3);
    const bottom = v2.add(v3);
    const left = v0.add(v2);

    const tangent = right.sub(left).normalize();
    const bitangent = bottom.sub(top).normalize();
    const normal = cross(bitangent, tangent);

    // The index buffer winds triangles CW from the expected viewing
    // direction, so the GPU marks the visible side as back-facing.
    // Negate faceDirection to compensate: visible side keeps its geometric
    // normal, inner side (seen through cutout holes) gets flipped so
    // lights on that side can illuminate it.
    // Applied AFTER toVarying() so gl_FrontFacing evaluates in fragment stage.
    const viewNormal = transformNormalToView(normal)
      .toVarying()
      .mul(faceDirection.negate());
    // eslint-disable-next-line no-param-reassign
    mat.normalNode = normalDetail ? normalDetail(viewNormal) : viewNormal;

    return v0.add(v1).add(v2).add(v3).mul(0.25);
  })();

  // ── Per-pixel cutout uniforms (up to 4 circular cutouts) ──
  const MAX_CUTOUTS = 4;
  const cutoutU = [];
  const cutoutRadiusU = [];
  const cutoutFadeU = [];
  const cutoutEnabledU = [];
  for (let ci = 0; ci < MAX_CUTOUTS; ci += 1) {
    cutoutU.push(uniform(new THREE.Vector2(0, 0)));
    cutoutRadiusU.push(uniform(0));
    cutoutFadeU.push(uniform(0));
    cutoutEnabledU.push(uniform(0));
  }

  // Push cutout data from JS array into GPU uniforms
  const applyCutouts = (cutoutsArr = []) => {
    for (let ci = 0; ci < MAX_CUTOUTS; ci += 1) {
      const ct = cutoutsArr[ci];
      if (ct) {
        cutoutU[ci].value.set(ct.u, ct.v);
        cutoutRadiusU[ci].value = ct.radius;
        cutoutFadeU[ci].value = ct.fade ?? ct.radius * 0.4;
        cutoutEnabledU[ci].value = 1;
      } else {
        cutoutEnabledU[ci].value = 0;
      }
    }
  };
  applyCutouts(alpha.cutouts);

  // ── Cutout rim (eyeliner) uniforms ──
  const cutoutRimColorU = uniform(new THREE.Color(0, 0, 0));
  const cutoutRimWidthU = uniform(0);
  const cutoutRimOffsetU = uniform(0);

  // Per-pixel rim factor: hard-edged band around the visible cutout edge.
  // Default (offset 0) = rim sits at the inner edge of the cutout fade,
  // matching the visible hole boundary. Positive offset = larger ring,
  // negative = smaller ring (moves inward into the hole).
  const cutoutRimNode = Fn(() => {
    const factor = float(0).toVar();
    If(cutoutRimWidthU.greaterThan(0.0001), () => {
      const texUV = uv();
      for (let ci = 0; ci < MAX_CUTOUTS; ci += 1) {
        If(cutoutEnabledU[ci].greaterThan(0.5), () => {
          const diff = texUV.sub(cutoutU[ci]);
          const dist = diff.length();
          // Anchor at inner edge of cutout fade (visible hole boundary)
          const innerEdge = cutoutRadiusU[ci].sub(cutoutFadeU[ci]);
          const rimCenter = innerEdge.add(cutoutRimOffsetU);
          const edgeDist = dist.sub(rimCenter);
          // Sharp step: 0 inside rim, 1 at rim start
          const aboveEdge = edgeDist.mul(10000).clamp(0, 1);
          // Sharp step: 1 inside rim band, 0 beyond
          const belowRim = float(1).sub(
            edgeDist.sub(cutoutRimWidthU).mul(10000).clamp(0, 1)
          );
          const t = aboveEdge.mul(belowRim);
          factor.assign(factor.max(t));
        });
      }
    });
    return factor;
  })();

  // Per-vertex alpha + per-pixel hole/tatter (smoothEdges) + cutouts.
  // eslint-disable-next-line no-param-reassign
  material.opacityNode = Fn(() => {
    const ids = attribute('vertexIds');
    const a0 = renderAlphaBuf.element(ids.x);
    const a1 = renderAlphaBuf.element(ids.y);
    const a2 = renderAlphaBuf.element(ids.z);
    const a3 = renderAlphaBuf.element(ids.w);
    const vtxAlpha = a0.add(a1).add(a2).add(a3).mul(0.25).toVar();

    const texUV = uv();

    // Per-pixel hole/tatter — sampled from the same noise field the CPU pass
    // uses for verlet kill, so the smooth shader boundary follows the same
    // contour as the physical rip. Geometry UV.y is inverted vs. grid v, so
    // flip y when sampling the (unflipped) noise texture.
    const noiseUV = vec2(texUV.x, float(1).sub(texUV.y));
    const n = texture(noiseTexture, noiseUV).r;
    const W = float(0.08);

    // Holes — alpha drops smoothly across threshold. holeAmount=0 → threshold
    // 1.0, smoothstep returns ~0 for typical fbm values, so output stays ~1.
    const holeThresh = float(1).sub(holeAmountU.mul(0.4));
    const holeAlpha = float(1).sub(
      smoothstep(holeThresh.sub(W), holeThresh.add(W), n)
    );

    // Tatter — threshold tightens near free edges. tatterEdge=0 → tDepth
    // clamps to 1 and the mix below collapses tatterAlpha to 1 (no effect).
    const tatterDepth = tatterEdgeU.mul(0.5);
    const dLeft = mix(float(1), texUV.x, float(1).sub(edgePinnedU.x));
    const dRight = mix(
      float(1),
      float(1).sub(texUV.x),
      float(1).sub(edgePinnedU.y)
    );
    const dTop = mix(
      float(1),
      float(1).sub(texUV.y),
      float(1).sub(edgePinnedU.z)
    );
    const dBottom = mix(float(1), texUV.y, float(1).sub(edgePinnedU.w));
    const minDist = min(min(dLeft, dRight), min(dTop, dBottom));
    const tDepth = minDist.div(tatterDepth.add(0.0001)).clamp(0, 1);
    const tatterThresh = float(0.7).sub(tDepth.mul(0.65));
    const tatterAlphaRaw = smoothstep(
      tatterThresh.sub(W),
      tatterThresh.add(W),
      n
    );
    // Outside the tatter zone (tDepth=1) blend to 1 so the body stays opaque.
    const tatterAlpha = mix(tatterAlphaRaw, float(1), tDepth);

    const perPixelAlpha = holeAlpha.mul(tatterAlpha);
    // Gate by smoothEdgesU (0/1): off → keep per-vertex behavior unchanged.
    vtxAlpha.mulAssign(mix(float(1), perPixelAlpha, smoothEdgesU));

    // Per-pixel circular cutouts (eye holes etc.)
    for (let ci = 0; ci < MAX_CUTOUTS; ci += 1) {
      If(cutoutEnabledU[ci].greaterThan(0.5), () => {
        const diff = texUV.sub(cutoutU[ci]);
        const dist = diff.length();
        const inner = cutoutRadiusU[ci].sub(cutoutFadeU[ci]);
        // smoothstep from 0 (inside inner) to 1 (at radius edge)
        const t = dist.sub(inner).div(cutoutFadeU[ci]).clamp(0, 1);
        vtxAlpha.mulAssign(t);
      });
    }

    return vtxAlpha;
  })();
  // eslint-disable-next-line no-param-reassign
  material.transparent = true;
  // eslint-disable-next-line no-param-reassign
  material.alphaTest = 0.01;

  // Reset simulation to initial rest positions and zero velocities.
  const reset = () => {
    posBuf.value.array.set(posArr);
    posBuf.value.needsUpdate = true;
    forceBuf.value.array.fill(0);
    forceBuf.value.needsUpdate = true;
  };

  // Update which vertices are pinned (fixed) without rebuilding the sim.
  // newPins is an array of vertex indices that should be fixed.
  // Vertices outside the shape boundary are always kept fixed.
  // Preserves anchor tags (values >= 2) set at creation time.
  const updatePins = (newPins) => {
    const newPinSet = new Set(newPins);
    const arr = paramsBuf.value.array;
    for (let i = 0; i < vCount; i += 1) {
      const current = arr[i * 3];
      // Don't overwrite anchor vertices
      if (current < 2) {
        arr[i * 3] = topology.outsideSet.has(i) || newPinSet.has(i) ? 1 : 0;
      }
    }
    paramsBuf.value.needsUpdate = true;
  };

  return {
    computeSprings,
    computeVertices,
    rebuildAlpha,
    applyCutouts,
    reset,
    updatePins,
    geometry,
    material,
    posBuf,
    windU,
    windDirU,
    stiffnessU,
    dampeningU,
    maxVelocityU,
    gravityU,
    gravityDirU,
    colliderPosU,
    colliderEnabledU,
    colliderRadiusU,
    collisionMarginU,
    NUM_COLLIDERS,
    anchorPosU,
    NUM_ANCHORS,
    cutoutRimColorU,
    cutoutRimWidthU,
    cutoutRimOffsetU,
    cutoutRimNode,
    shapeDistArr,
  };
}
