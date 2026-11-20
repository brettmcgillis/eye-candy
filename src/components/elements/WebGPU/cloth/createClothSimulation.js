import {
  Fn,
  If,
  Loop,
  Return,
  abs,
  atan,
  attribute,
  cross,
  dot,
  exp,
  faceDirection,
  float,
  floor,
  instanceIndex,
  instancedArray,
  int,
  ivec2,
  length,
  max,
  min,
  mix,
  select,
  smoothstep,
  texture,
  textureLoad,
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
  BLOOD_REACH,
  DECAY_DEFAULTS,
  DRIP_MAX,
  DRIP_SNAP,
  NOISE_STEP,
  dripTable,
  holeEdge as holeEdgeOf,
} from './clothDecay';
import {
  NUM_ANCHORS,
  buildClothTopology,
  computeClothAlpha,
  fbm2D,
} from './clothTopology';

const CONTACT_SLOP = 1.0001;

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
  // Render the sheet as a smooth surface through the sim vertices, `detail`
  // samples per cell each way (1 = the original one vertex per cell).
  detail = 1,
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

  // Rot, blood, hem drips and the eye brow: clothDecay.js mirrors every
  // formula below for the plot.
  const decayU = Object.fromEntries(
    [
      'bloodAmount',
      'cutoutBrow',
      'cutoutBrowSlant',
      'dripAmount',
      'dripCount',
      'dripSpeed',
      'holeRimWidth',
    ].map((key) => [key, uniform(DECAY_DEFAULTS[key])])
  );
  const dripTimeU = uniform(0);
  const dripTexture = new THREE.DataTexture(
    new Float32Array(DRIP_MAX * 8),
    DRIP_MAX,
    2,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  let dripSeed = null;
  const applyDecay = (params, seed) => {
    Object.entries(decayU).forEach(([key, u]) => {
      // eslint-disable-next-line no-param-reassign
      u.value = params[key] ?? DECAY_DEFAULTS[key];
    });
    if (seed !== dripSeed) {
      dripTexture.image.data.set(dripTable(seed));
      dripTexture.needsUpdate = true;
      dripSeed = seed;
    }
  };

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
          const toRest = position.sub(colliderPosU[c]).toVar();
          const restDist = toRest.length().max(0.000001).toVar();
          const resting = restDist
            .lessThanEqual(effectiveRadius.mul(CONTACT_SLOP))
            .and(dist.lessThan(effectiveRadius.mul(dampeningU)));
          const normal = select(
            resting,
            toRest.div(restDist),
            toVertex.div(dist)
          ).toVar();
          const tn = toVertex.dot(normal).toVar();
          const push = tn
            .mul(tn)
            .sub(dist.mul(dist))
            .add(effectiveRadius.mul(effectiveRadius))
            .max(0)
            .sqrt()
            .sub(tn);
          newPos.assign(
            select(
              resting,
              newPos.add(normal.mul(push)),
              colliderPosU[c].add(normal.mul(effectiveRadius))
            )
          );
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

  // ── Thickness and self-collision ──
  // A thick cloth is drawn as `layers` copies of the sheet fanned along its
  // normal (outer side at +n), and kept honest by a vertex-sphere barrier:
  // two vertices more than a few cells apart on the grid may never come
  // closer than `thickness`, so the fanned layers of one fold cannot cross
  // the next. Both passes stay off until a caller sets a thickness.
  const SELF_MAX_PUSH = 0.5;
  const rowStride = segmentsY + 1;
  const cellSize = Math.min(width / segmentsX, height / segmentsY);
  const thicknessU = uniform(0);
  const layerCountU = uniform(1);
  const selfSkipU = uniform(1);
  const selfPushU = uniform(1);
  const shapeBuf = instancedArray(shapeDistArr, 'float');
  const corrBuf = instancedArray(vCount, 'vec3');

  const livePresence = (id) =>
    shapeBuf
      .element(id)
      .greaterThanEqual(0)
      .and(alphaBuf.element(id).greaterThan(0.01));

  // Pass 1 — for each free vertex, the average push out of every vertex that
  // is closer than `thickness` but not a grid neighbour. Reads positions
  // only, so the result does not depend on thread order.
  const computeSelfCollision = Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(vCount)), () => Return());
    const corr = vec3(0, 0, 0).toVar('selfCorr');
    const mine = paramsBuf.element(instanceIndex).x;
    If(mine.equal(uint(0)).and(livePresence(instanceIndex)), () => {
      const p = posBuf.element(instanceIndex).toVar('selfPos');
      const gx = float(instanceIndex.div(uint(rowStride))).toVar();
      const gy = float(instanceIndex.mod(uint(rowStride))).toVar();
      const minDist = thicknessU;
      const minDist2 = minDist.mul(minDist);
      const hits = float(0).toVar('selfHits');
      Loop(vCount, ({ i }) => {
        const other = uint(i);
        const d = p.sub(posBuf.element(other)).toVar();
        const d2 = dot(d, d).toVar();
        If(d2.lessThan(minDist2).and(d2.greaterThan(1e-10)), () => {
          const ox = float(other.div(uint(rowStride)));
          const oy = float(other.mod(uint(rowStride)));
          const near = abs(ox.sub(gx))
            .lessThanEqual(selfSkipU)
            .and(abs(oy.sub(gy)).lessThanEqual(selfSkipU));
          If(near.not().and(livePresence(other)), () => {
            const dist = d2.sqrt();
            const share = select(
              paramsBuf.element(other).x.equal(uint(0)),
              float(0.5),
              float(1)
            );
            corr.addAssign(d.div(dist).mul(minDist.sub(dist)).mul(share));
            hits.addAssign(1);
          });
        });
      });
      corr.divAssign(max(hits, 1));
      corr.mulAssign(selfPushU);
      const push = corr.length().toVar();
      If(push.greaterThan(minDist.mul(SELF_MAX_PUSH)), () => {
        corr.mulAssign(minDist.mul(SELF_MAX_PUSH).div(push));
      });
    });
    corrBuf.element(instanceIndex).assign(corr);
  })()
    .compute(vCount)
    .setName('Cloth Self Collision');

  // Pass 2 — apply the pushes and take out the velocity that was driving the
  // vertex into the contact, so it does not walk straight back in.
  const computeSelfApply = Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(vCount)), () => Return());
    const corr = corrBuf.element(instanceIndex).toVar('selfApplyCorr');
    const push = corr.length().toVar();
    If(push.greaterThan(0), () => {
      posBuf.element(instanceIndex).addAssign(corr);
      const normal = corr.div(push);
      const vel = forceBuf.element(instanceIndex);
      const into = vel.dot(normal);
      If(into.lessThan(0), () => {
        vel.subAssign(normal.mul(into));
      });
    });
  })()
    .compute(vCount)
    .setName('Cloth Self Apply');

  // Fan `layers` copies of the sheet across `thickness`; 0 is the plain sheet.
  const setThickness = (thickness, layers = 2) => {
    thicknessU.value = thickness;
    layerCountU.value = thickness > 0 ? layers : 1;
    selfSkipU.value = Math.max(1, Math.ceil(thickness / cellSize));
  };

  // Which copy this fragment belongs to: 0 is the inner layer, the last the
  // outer one. A plain sheet is the single layer 0.
  const layerNode = float(instanceIndex).toVarying('clothLayer');

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

    const fan = float(instanceIndex)
      .div(layerCountU.sub(1).max(1))
      .sub(0.5)
      .mul(thicknessU);
    return v0
      .add(v1)
      .add(v2)
      .add(v3)
      .mul(0.25)
      .add(normal.normalize().mul(fan));
  })();

  // ── Smooth render surface ──
  // A uniform cubic B-spline patch over the sim vertices, sampled `detail`
  // times per cell, so folds, hands and silhouettes are not faceted. Cells
  // with a corner outside the shape are not drawn; a circle is then cut
  // per pixel just inside the cells that survive, so the hem is round rather
  // than a staircase. Control points outside the shape fall back to the
  // cell's own corners.
  const refined = detail > 1;
  const rimCut =
    shape === 'circle' ? 0.5 - Math.hypot(1 / segmentsX, 1 / segmentsY) : null;
  let renderGeometry = geometry;
  let wallGeometry = null;
  // 1 on a wall ribbon's fragments, 0 on the sheet.
  const wallFlag = refined ? attribute('wallInfo', 'vec4').x : float(0);
  if (refined) {
    renderGeometry = new THREE.BufferGeometry();
    const nx = segmentsX * detail + 1;
    const ny = segmentsY * detail + 1;
    const simCoordArr = new Float32Array(nx * ny * 2);
    const refinedUv = new Float32Array(nx * ny * 2);
    for (let b = 0; b < ny; b += 1) {
      for (let a = 0; a < nx; a += 1) {
        const k = b * nx + a;
        simCoordArr[k * 2] = a / detail;
        simCoordArr[k * 2 + 1] = b / detail;
        refinedUv[k * 2] = a / detail / segmentsX;
        refinedUv[k * 2 + 1] = 1 - b / detail / segmentsY;
      }
    }
    const cellLive = (cx, cy) =>
      shapeDistArr[topology.idAt(cx, cy)] >= 0 &&
      shapeDistArr[topology.idAt(cx + 1, cy)] >= 0 &&
      shapeDistArr[topology.idAt(cx, cy + 1)] >= 0 &&
      shapeDistArr[topology.idAt(cx + 1, cy + 1)] >= 0;
    const refinedIndex = [];
    for (let b = 1; b < ny; b += 1) {
      for (let a = 1; a < nx; a += 1) {
        if (
          cellLive(
            Math.min(Math.floor((a - 1) / detail), segmentsX - 1),
            Math.min(Math.floor((b - 1) / detail), segmentsY - 1)
          )
        ) {
          const q00 = b * nx + a;
          const q10 = b * nx + a - 1;
          const q11 = (b - 1) * nx + a - 1;
          const q01 = (b - 1) * nx + a;
          refinedIndex.push(q00, q10, q11, q00, q11, q01);
        }
      }
    }
    renderGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(nx * ny * 3), 3)
    );
    const refinedNormals = new Float32Array(nx * ny * 3);
    for (let i = 2; i < refinedNormals.length; i += 3) refinedNormals[i] = 1;
    renderGeometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(refinedNormals, 3)
    );
    renderGeometry.setAttribute('uv', new THREE.BufferAttribute(refinedUv, 2));
    renderGeometry.setAttribute(
      'simCoord',
      new THREE.BufferAttribute(simCoordArr, 2)
    );
    // (wall flag, fixed fan, radial x, radial y) — all zero on the sheet.
    renderGeometry.setAttribute(
      'wallInfo',
      new THREE.BufferAttribute(new Float32Array(nx * ny * 4), 4)
    );

    // The cut edges that are plain circles in UV — the hem and each eye —
    // get a ribbon from the inner layer to the outer one, so a thick cloth is
    // a closed slab rather than stacked sheets. Skins whose cuts are not
    // circles (noise holes, drips, a brow) fall back to stacked layers.
    const rings = [];
    if (rimCut !== null) rings.push({ cu: 0.5, cv: 0.5, r: rimCut, out: 1 });
    (alpha.cutouts ?? []).forEach((c) => {
      const fade = c.fade ?? c.radius * 0.4;
      rings.push({ cu: c.u, cv: c.v, r: c.radius - fade * 0.99, out: -1 });
    });
    if (rings.length > 0) {
      const wallUv = [];
      const wallCoord = [];
      const wallInfoArr = [];
      const wallIndex = [];
      rings.forEach((ring) => {
        const samples = Math.max(
          24,
          Math.ceil(2 * Math.PI * ring.r * segmentsX * detail * 2)
        );
        const first = wallUv.length / 2;
        for (let k = 0; k < samples; k += 1) {
          const th = (k / samples) * 2 * Math.PI;
          const ux = Math.cos(th);
          const uy = Math.sin(th);
          const u = ring.cu + ring.r * ux;
          const v = ring.cv + ring.r * uy;
          [-0.5, 0.5].forEach((fan) => {
            wallUv.push(u, v);
            wallCoord.push(u * segmentsX, (1 - v) * segmentsY);
            // uv.y is the lattice's v flipped, so the radial y flips with it.
            wallInfoArr.push(1, fan, ring.out * ux, -ring.out * uy);
          });
        }
        for (let k = 0; k < samples; k += 1) {
          const k2 = (k + 1) % samples;
          const a = first + k * 2;
          const b = first + k2 * 2;
          wallIndex.push(a, a + 1, b, a + 1, b + 1, b);
        }
      });
      wallGeometry = new THREE.BufferGeometry();
      wallGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array((wallUv.length / 2) * 3), 3)
      );
      const wallNormals = new Float32Array((wallUv.length / 2) * 3);
      for (let i = 2; i < wallNormals.length; i += 3) wallNormals[i] = 1;
      wallGeometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(wallNormals, 3)
      );
      wallGeometry.setAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array(wallUv), 2)
      );
      wallGeometry.setAttribute(
        'simCoord',
        new THREE.BufferAttribute(new Float32Array(wallCoord), 2)
      );
      wallGeometry.setAttribute(
        'wallInfo',
        new THREE.BufferAttribute(new Float32Array(wallInfoArr), 4)
      );
      wallGeometry.setIndex(
        new THREE.BufferAttribute(new Uint32Array(wallIndex), 1)
      );
    }
    renderGeometry.setIndex(
      new THREE.BufferAttribute(new Uint32Array(refinedIndex), 1)
    );

    const rowStrideF = segmentsY + 1;
    const weights = (t) => {
      const t2 = t.mul(t);
      const t3 = t2.mul(t);
      const u = float(1).sub(t);
      return {
        d: [
          u.mul(u).mul(-0.5),
          t2.mul(1.5).sub(t.mul(2)),
          t2.mul(-1.5).add(t).add(0.5),
          t2.mul(0.5),
        ],
        w: [
          u.mul(u).mul(u).div(6),
          t3.mul(0.5).sub(t2).add(2 / 3),
          t3.mul(-0.5).add(t2.mul(0.5)).add(t.mul(0.5)).add(1 / 6),
          t3.div(6),
        ],
      };
    };
    const sum = (list, factors) =>
      list.reduce((acc, item, i) => acc.add(item.mul(factors[i])), vec3(0));

    // eslint-disable-next-line no-param-reassign
    material.positionNode = Fn(({ material: mat }) => {
      const sc = attribute('simCoord', 'vec2');
      const bx = floor(sc.x).clamp(0, segmentsX - 1);
      const by = floor(sc.y).clamp(0, segmentsY - 1);
      const wx = weights(sc.x.sub(bx));
      const wy = weights(sc.y.sub(by));

      const rows = [-1, 0, 1, 2].map((b) => {
        const points = [-1, 0, 1, 2].map((a) => {
          const cx = bx.add(a);
          const cy = by.add(b);
          const inRange = cx
            .greaterThanEqual(0)
            .and(cx.lessThanEqual(segmentsX))
            .and(cy.greaterThanEqual(0))
            .and(cy.lessThanEqual(segmentsY));
          const rawId = uint(cx.clamp(0, segmentsX))
            .mul(uint(rowStrideF))
            .add(uint(cy.clamp(0, segmentsY)));
          const cornerId = uint(bx.add(Math.min(Math.max(a, 0), 1)))
            .mul(uint(rowStrideF))
            .add(uint(by.add(Math.min(Math.max(b, 0), 1))));
          const ok = inRange.and(shapeBuf.element(rawId).greaterThanEqual(0));
          return posBuf.element(select(ok, rawId, cornerId));
        });
        return { d: sum(points, wx.d), p: sum(points, wx.w) };
      });
      const pos = sum(
        rows.map((r) => r.p),
        wy.w
      );
      const dx = sum(
        rows.map((r) => r.d),
        wy.w
      );
      const dy = sum(
        rows.map((r) => r.p),
        wy.d
      );
      const safe = (v) => v.div(v.length().max(1e-8));
      const normal = safe(cross(safe(dy), safe(dx)));

      // A wall ribbon faces along the sheet, away from the cut's centre (into
      // a hole): the radial direction with the sheet normal taken out.
      const info = attribute('wallInfo', 'vec4');
      const radial = dx.mul(info.z).add(dy.mul(info.w));
      const wallNormal = safe(radial.sub(normal.mul(radial.dot(normal))));

      // Same facing rule as the one-vertex-per-cell path above.
      const sheetView = transformNormalToView(normal)
        .toVarying()
        .mul(faceDirection.negate());
      const wallView = transformNormalToView(wallNormal).toVarying();
      // eslint-disable-next-line no-param-reassign
      mat.normalNode = select(
        info.x.greaterThan(0.5),
        wallView,
        normalDetail ? normalDetail(sheetView) : sheetView
      );

      const layerFan = float(instanceIndex)
        .div(layerCountU.sub(1).max(1))
        .sub(0.5);
      return pos.add(normal.mul(mix(layerFan, info.y, info.x).mul(thicknessU)));
    })();
  }

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

  // Geometry UV.y is inverted vs. grid v, so y flips when sampling the
  // (unflipped) noise texture.
  const noiseAt = (texUV, mirrored = false) =>
    texture(
      noiseTexture,
      vec2(mirrored ? float(1).sub(texUV.x) : texUV.x, float(1).sub(texUV.y))
    ).r;

  // 0 at a free edge, 1 beyond the tatter zone; tatterEdge=0 → always 1.
  const tatterDepthAt = (texUV) => {
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
    return minDist.div(tatterDepth.add(0.0001)).clamp(0, 1);
  };

  const eyeHoleDistance = (texUV, ci) => {
    const circle = texUV.sub(cutoutU[ci]).length().sub(cutoutRadiusU[ci]);
    const inward = select(cutoutU[ci].x.lessThan(0.5), float(1), float(-1));
    const brow = texUV.y
      .sub(cutoutU[ci].y)
      .sub(cutoutRadiusU[ci].mul(float(1).sub(decayU.cutoutBrow)))
      .add(decayU.cutoutBrowSlant.mul(inward).mul(texUV.x.sub(cutoutU[ci].x)))
      .div(decayU.cutoutBrowSlant.mul(decayU.cutoutBrowSlant).add(1).sqrt());
    return select(
      decayU.cutoutBrow.add(decayU.cutoutBrowSlant).greaterThan(0),
      max(circle, brow),
      circle
    );
  };

  // (rot, blood): bands round the hole and tatter cuts.
  const decayNode = Fn(() => {
    const texUV = uv();
    const n = noiseAt(texUV);
    const across = vec2(NOISE_STEP, 0);
    const along = vec2(0, NOISE_STEP);
    const slope = length(
      vec2(
        noiseAt(texUV.add(across)).sub(noiseAt(texUV.sub(across))),
        noiseAt(texUV.add(along)).sub(noiseAt(texUV.sub(along)))
      )
    )
      .div(2 * NOISE_STEP)
      .max(1e-4);
    const n2 = noiseAt(texUV, true);
    const tDepth = tatterDepthAt(texUV);
    const hole = select(holeAmountU.greaterThan(0), float(1), float(0));
    const tatter = float(1).sub(tDepth);
    const toHole = float(holeEdgeOf(0))
      .sub(holeAmountU.mul(0.4))
      .sub(n)
      .div(slope);
    const toTear = n.sub(float(0.7).sub(tDepth.mul(0.65))).div(slope);
    const near = (reach) =>
      max(
        float(1)
          .sub(smoothstep(0, reach, toHole))
          .mul(hole),
        float(1)
          .sub(smoothstep(0, reach, toTear))
          .mul(tatter)
      );
    const rot = select(
      decayU.holeRimWidth.greaterThan(0),
      near(decayU.holeRimWidth),
      float(0)
    );
    const stain = float(0.8).sub(decayU.bloodAmount.mul(0.3));
    const blood = select(
      decayU.bloodAmount.greaterThan(0),
      near(float(BLOOD_REACH)).mul(smoothstep(stain, stain.add(0.04), n2)),
      float(0)
    );
    return vec2(rot, blood);
  })();

  const TAU = Math.PI * 2;
  const DRIP_AA = 0.0015;
  // (alpha, goo): the hem cut into hanging drips, and the goo band.
  const dripNode = Fn(() => {
    const texUV = uv();
    const band = decayU.dripAmount;
    const d = texUV.sub(0.5);
    const radius = length(d);
    const depth = band.sub(float(0.5).sub(radius)).toVar();
    const on = band.greaterThan(0);
    const goo = select(on, smoothstep(-0.015, -0.003, depth), float(0));
    const kept = float(1).toVar();
    If(on.and(depth.greaterThan(0)), () => {
      kept.assign(0);
      const count = max(decayU.dripCount.round(), 1);
      const turn = atan(d.y, d.x).div(TAU).add(1).fract();
      const base = turn.mul(count).floor();
      [-1, 0, 1].forEach((k) => {
        const i = base.add(k).add(count).mod(count);
        const drip = textureLoad(dripTexture, ivec2(int(i), int(0)));
        const offset = turn.sub(i.add(0.5).add(drip.x).div(count)).toVar();
        offset.subAssign(offset.add(0.5).floor());
        const across = abs(offset).mul(TAU).mul(radius);
        const rate = textureLoad(dripTexture, ivec2(int(i), int(1))).x;
        const cycle = dripTimeU
          .mul(decayU.dripSpeed)
          .mul(rate)
          .add(drip.w)
          .fract();
        const growth = select(
          cycle.lessThan(DRIP_SNAP),
          smoothstep(0, DRIP_SNAP, cycle),
          float(1).sub(smoothstep(DRIP_SNAP, 1, cycle))
        )
          .mul(0.7)
          .add(0.3);
        const reach = band.mul(drip.y).mul(growth);
        const tip = reach.sub(drip.z);
        const half = drip.z.mul(
          exp(depth.negate().div(band.mul(0.15)))
            .mul(1.2)
            .add(1)
        );
        const column = select(
          depth.lessThanEqual(tip),
          smoothstep(-DRIP_AA, DRIP_AA, half.sub(across)),
          float(0)
        );
        const bulb = smoothstep(
          -DRIP_AA,
          DRIP_AA,
          drip.z.mul(1.25).sub(length(vec2(across, depth.sub(tip))))
        );
        kept.assign(max(kept, max(column, bulb)));
      });
    });
    return vec2(kept, goo);
  })();

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
          // Anchor at inner edge of cutout fade (visible hole boundary)
          const edgeDist = eyeHoleDistance(texUV, ci)
            .add(cutoutFadeU[ci])
            .sub(cutoutRimOffsetU);
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

  // 1 within WALL_REACH (UV) of a cutout's edge when the skin has an eyeliner
  // rim. A thick cloth's hole wall is the middle layers seen edge-on, and it
  // takes the rim colour so the wall reads as one band, not a stack of rings.
  const WALL_REACH = 0.06;
  const cutoutWallNode = Fn(() => {
    const factor = float(0).toVar();
    If(cutoutRimWidthU.greaterThan(0.0001), () => {
      const texUV = uv();
      for (let ci = 0; ci < MAX_CUTOUTS; ci += 1) {
        If(cutoutEnabledU[ci].greaterThan(0.5), () => {
          const edgeDist = eyeHoleDistance(texUV, ci).add(cutoutFadeU[ci]);
          factor.assign(factor.max(edgeDist.lessThan(WALL_REACH).select(1, 0)));
        });
      }
    });
    return factor;
  })();

  // Per-vertex alpha + per-pixel hole/tatter (smoothEdges) + cutouts.
  // eslint-disable-next-line no-param-reassign
  material.opacityNode = Fn(() => {
    let vtxAlpha;
    if (refined) {
      // Bilinear through the four sim vertices round this pixel.
      const sc = attribute('simCoord', 'vec2');
      const bx = floor(sc.x).clamp(0, segmentsX - 1);
      const by = floor(sc.y).clamp(0, segmentsY - 1);
      const fx = sc.x.sub(bx);
      const fy = sc.y.sub(by);
      const at = (ox, oy) =>
        renderAlphaBuf.element(
          uint(bx.add(ox))
            .mul(uint(segmentsY + 1))
            .add(uint(by.add(oy)))
        );
      vtxAlpha = mix(
        mix(at(0, 0), at(1, 0), fx),
        mix(at(0, 1), at(1, 1), fx),
        fy
      ).toVar();
      if (rimCut !== null) {
        const r = length(uv().sub(0.5));
        vtxAlpha.mulAssign(select(r.lessThan(rimCut), float(1), float(0)));
      }
    } else {
      const ids = attribute('vertexIds');
      const a0 = renderAlphaBuf.element(ids.x);
      const a1 = renderAlphaBuf.element(ids.y);
      const a2 = renderAlphaBuf.element(ids.z);
      const a3 = renderAlphaBuf.element(ids.w);
      vtxAlpha = a0.add(a1).add(a2).add(a3).mul(0.25).toVar();
    }

    const texUV = uv();

    // Per-pixel hole/tatter — sampled from the same noise field the CPU pass
    // uses for verlet kill, so the smooth shader boundary follows the same
    // contour as the physical rip.
    const n = noiseAt(texUV);
    const W = float(0.08);

    // Holes — alpha drops smoothly across threshold. holeAmount=0 → threshold
    // 1.0, smoothstep returns ~0 for typical fbm values, so output stays ~1.
    const holeThresh = float(1).sub(holeAmountU.mul(0.4));
    const holeAlpha = float(1).sub(
      smoothstep(holeThresh.sub(W), holeThresh.add(W), n)
    );

    // Tatter — threshold tightens near free edges. tatterEdge=0 → tDepth
    // clamps to 1 and the mix below collapses tatterAlpha to 1 (no effect).
    const tDepth = tatterDepthAt(texUV);
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
    vtxAlpha.mulAssign(dripNode.x);

    // Per-pixel cutouts (eye holes etc.), ramping over their fade width
    for (let ci = 0; ci < MAX_CUTOUTS; ci += 1) {
      If(cutoutEnabledU[ci].greaterThan(0.5), () => {
        const t = eyeHoleDistance(texUV, ci)
          .add(cutoutFadeU[ci])
          .div(cutoutFadeU[ci])
          .clamp(0, 1);
        vtxAlpha.mulAssign(t);
      });
    }

    // A wall ribbon sits exactly on the cut that ends the sheet.
    return refined ? max(vtxAlpha, wallFlag) : vtxAlpha;
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
    computeSelfCollision,
    computeSelfApply,
    setThickness,
    layerNode,
    selfPushU,
    rebuildAlpha,
    applyCutouts,
    reset,
    updatePins,
    geometry: renderGeometry,
    wallGeometry,
    wallFlag,
    outlineGeometry: geometry,
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
    cutoutWallNode,
    layerCountU,
    applyDecay,
    decayNode,
    dripNode,
    dripTimeU,
    shapeDistArr,
  };
}
