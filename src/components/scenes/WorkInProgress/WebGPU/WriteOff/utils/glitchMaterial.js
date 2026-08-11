/* eslint-disable camelcase */
// TSL node material for the wrecked car: samples the CPU-baked glitch
// attributes (see glitchGeometry.js) to misdirect vertex positions and UVs,
// plus several live passes that need no CPU recompute at all — "find &
// replace" (magnitude jump / sign flip, matching Klink's two explicit
// digit-substitution examples), "scroll tear" (an old-computer scroll
// smear, on the car's own geometry/texture, not the screen), "resolution
// loss" (chunky UV quantization in random blocks) and "torn open" (a
// discard-based perforation — holes show through to whatever's behind).
//
// Resolution Loss and Torn Open both derive their masks procedurally from
// positionLocal/uv() via hash() rather than a baked per-vertex attribute —
// unlike the permutation-based techniques, there's no CPU precompute to
// bake, so each gets its own independent mask at zero additional vertex
// buffer cost (see glitchGeometry.js's packing note on the 8-buffer cap).
import {
  PI,
  abs,
  attribute,
  dot,
  float,
  floor,
  fract,
  hash,
  materialNormal,
  mix,
  mx_noise_float,
  normalFlat,
  oneMinus,
  positionLocal,
  replaceDefaultUV,
  rotate,
  round,
  select,
  sign,
  smoothstep,
  time,
  uint,
  uniform,
  uv,
  varying,
  vec2,
  vec3,
  vertexIndex,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export function createGlitchUniforms() {
  return {
    cutPasteDensity: uniform(0),
    hopscotchDensity: uniform(0),
    uvBlend: uniform(0),
    magnitude: uniform(2),
    signFlipChance: uniform(0.3),
    density: uniform(0),
    tearPosition: uniform(0.5),
    tearRange: uniform(0.2),
    tearStrength: uniform(0),
    rowJitterStrength: uniform(0),
    rowJitterBands: uniform(24),
    rowJitterAxis: uniform(1),
    degradeDensity: uniform(0),
    degradeBlockCount: uniform(24),
    tornDensity: uniform(0),
    tornCellFrequency: uniform(6),
    tornWireframeWidth: uniform(0.05),

    // Shared by Block Deconstruct / Slice Suite / Voxel Snap's axis-wipe
    // sweep (see buildAxisSweep) — the car's own local-space bounds, set
    // once from geometry.boundingBox in WreckedCar.
    boundsMin: uniform(new THREE.Vector3()),
    boundsMax: uniform(new THREE.Vector3(1, 1, 1)),

    blockDeconstructAmount: uniform(0),
    blockDeconstructTransition: uniform(0.5),
    blockDeconstructBandwidth: uniform(0.2),
    blockDeconstructAxis: uniform(1),
    blockDeconstructChaos: uniform(0.5),
    blockDeconstructSize: uniform(0.3),
    blockDeconstructCellAlpha: uniform(1),

    sliceSuiteAmount: uniform(0),
    sliceSuiteTransition: uniform(0.5),
    sliceSuiteBandwidth: uniform(0.2),
    sliceSuiteAxis: uniform(1),
    sliceSuiteCount: uniform(12),
    sliceSuitePushApart: uniform(0.2),
    sliceSuiteTwistMax: uniform(15),
    sliceSuiteTwistSnap: uniform(0),
    sliceSuiteJitterMax: uniform(0),
    sliceSuiteSliceAlpha: uniform(1),

    voxelSnapAmount: uniform(0),
    voxelSnapTransition: uniform(0.5),
    voxelSnapBandwidth: uniform(0.2),
    voxelSnapAxis: uniform(1),
    voxelSnapChaos: uniform(0),
    voxelSnapSize: uniform(0.3),

    innerStretchDensity: uniform(0),
    innerStretchStretch: uniform(1.2),
    innerStretchCellFrequency: uniform(8),

    warpFieldAmount: uniform(0),
    warpFieldFrequency: uniform(1.5),
    warpFieldSpeed: uniform(0.3),
  };
}

// One-hot vec3 for a runtime axis index (0=x, 1=y, 2=z) — lets a single
// uniform pick which local axis a technique sweeps/twists/pushes along,
// rather than baking three axis-specific shader variants.
function axisMask(axisUniform) {
  return vec3(
    select(axisUniform.lessThan(0.5), float(1), float(0)),
    select(axisUniform.equal(1), float(1), float(0)),
    select(axisUniform.greaterThan(1.5), float(1), float(0))
  );
}

function pickAxisComponent(vector, axisUniform) {
  return dot(vector, axisMask(axisUniform));
}

// Shared "wipe" reveal used by Block Deconstruct / Slice Suite / Voxel Snap:
// 0-1 progress along a runtime-selectable local axis, softened over
// `bandwidth` past `transition` — the same shape as Scroll Tear's own
// Position/Range, generalized from Scroll Tear's fixed Y to any axis.
function buildAxisSweep(
  basePosition,
  u,
  axisUniform,
  transitionUniform,
  bandwidthUniform
) {
  const axisPos = pickAxisComponent(basePosition, axisUniform);
  const axisMin = pickAxisComponent(u.boundsMin, axisUniform);
  const axisMax = pickAxisComponent(u.boundsMax, axisUniform);
  const extent = axisMax.sub(axisMin).max(0.0001);
  const normalized = axisPos.sub(axisMin).div(extent);

  return smoothstep(
    transitionUniform,
    transitionUniform.add(bandwidthUniform.max(0.0001)),
    normalized
  );
}

// "Block Deconstruct" — quantizes local position into `size`-sided cells
// (procedural, no CPU bake — the cell coordinate is a stable hash key on its
// own) and pushes/spins each cell as a rigid unit around its own center.
// `chaos` scales both how far a cell translates and how hard it spins.
function buildBlockDeconstructPositionNode(basePosition, u) {
  const cellSize = u.blockDeconstructSize.max(0.001);
  const cellCoord = floor(basePosition.div(cellSize));
  const cellCenter = cellCoord.add(0.5).mul(cellSize);
  const localOffset = basePosition.sub(cellCenter);

  // +1000 before hashing only — see buildTornMask for why a negative cell
  // coordinate can't be hashed directly in WGSL.
  const hashCell = cellCoord.add(1000);
  const seed = hashCell.x.add(hashCell.y.mul(9973)).add(hashCell.z.mul(131));
  const direction = vec3(
    hash(seed),
    hash(seed.add(17)),
    hash(seed.add(37))
  ).sub(0.5);
  const spin = vec3(hash(seed.add(53)), hash(seed.add(71)), hash(seed.add(97)))
    .sub(0.5)
    .mul(u.blockDeconstructChaos);

  const rotated = rotate(localOffset, spin);
  const target = cellCenter
    .add(rotated)
    .add(direction.mul(u.blockDeconstructChaos).mul(cellSize));

  const sweep = buildAxisSweep(
    basePosition,
    u,
    u.blockDeconstructAxis,
    u.blockDeconstructTransition,
    u.blockDeconstructBandwidth
  );
  const blend = u.blockDeconstructAmount.mul(sweep);
  return mix(basePosition, target, blend);
}

// Per-cell alpha fade — a density-style hash threshold (same "blend as a
// probability" shape Find & Replace uses) rather than fading every
// deconstructing cell uniformly, so only some cells go translucent as the
// wipe passes through.
function buildBlockDeconstructAlphaNode(u) {
  const cellSize = u.blockDeconstructSize.max(0.001);
  const cellCoord = floor(positionLocal.div(cellSize));
  const hashCell = cellCoord.add(1000);
  const seed = hashCell.x.add(hashCell.y.mul(9973)).add(hashCell.z.mul(131));
  const cellHash = hash(seed.add(191));

  const sweep = buildAxisSweep(
    positionLocal,
    u,
    u.blockDeconstructAxis,
    u.blockDeconstructTransition,
    u.blockDeconstructBandwidth
  );
  const blend = u.blockDeconstructAmount.mul(sweep);
  return select(
    cellHash.lessThan(blend),
    u.blockDeconstructCellAlpha,
    float(1)
  );
}

// Shared slice-index math for both Slice Suite's position offset and its
// per-slice alpha, so the two never disagree on which slab a vertex is in.
function computeSliceSuiteIndex(basePosition, u) {
  const axisPos = pickAxisComponent(basePosition, u.sliceSuiteAxis);
  const axisMin = pickAxisComponent(u.boundsMin, u.sliceSuiteAxis);
  const axisMax = pickAxisComponent(u.boundsMax, u.sliceSuiteAxis);
  const extent = axisMax.sub(axisMin).max(0.0001);
  const sliceCount = u.sliceSuiteCount.max(1);
  const sliceThickness = extent.div(sliceCount);
  const rawIndex = floor(axisPos.sub(axisMin).div(sliceThickness));
  return rawIndex.max(0).min(sliceCount.sub(1));
}

// "Slice Suite" — cross-sections the car into `slice count` slabs along
// `axis`, each slab pushed apart along that axis and spun around it. `twist
// snap` quantizes the spin to discrete degree-steps for an explicit
// "notched" look instead of a smooth stagger; 0 leaves it continuous.
function buildSliceSuitePositionNode(basePosition, u) {
  const sliceIndex = computeSliceSuiteIndex(basePosition, u);
  const centerIndex = u.sliceSuiteCount.max(1).sub(1).mul(0.5);
  const offsetIndex = sliceIndex.sub(centerIndex);

  const hashSeed = sliceIndex.add(1000).mul(53);
  const twistRaw = hash(hashSeed)
    .sub(0.5)
    .mul(2)
    .mul(u.sliceSuiteTwistMax.mul(PI).div(180));
  const twistSnapRad = u.sliceSuiteTwistSnap.mul(PI).div(180);
  const twistAngle = select(
    twistSnapRad.greaterThan(0.0001),
    round(twistRaw.div(twistSnapRad.max(0.0001))).mul(twistSnapRad),
    twistRaw
  );

  // Twisting around the model's own center (not each slab's own centroid)
  // reads as sections spinning around a shared spindle rather than each
  // slab pirouetting in place.
  const pivot = u.boundsMin.add(u.boundsMax).mul(0.5);
  const spin = axisMask(u.sliceSuiteAxis).mul(twistAngle);
  const twisted = pivot.add(rotate(basePosition.sub(pivot), spin));

  const pushOffset = axisMask(u.sliceSuiteAxis).mul(
    offsetIndex.mul(u.sliceSuitePushApart)
  );
  const jitter = vec3(
    hash(hashSeed.add(11)),
    hash(hashSeed.add(23)),
    hash(hashSeed.add(31))
  )
    .sub(0.5)
    .mul(u.sliceSuiteJitterMax);

  const target = twisted.add(pushOffset).add(jitter);

  const sweep = buildAxisSweep(
    basePosition,
    u,
    u.sliceSuiteAxis,
    u.sliceSuiteTransition,
    u.sliceSuiteBandwidth
  );
  const blend = u.sliceSuiteAmount.mul(sweep);
  return mix(basePosition, target, blend);
}

function buildSliceSuiteAlphaNode(u) {
  const sliceIndex = computeSliceSuiteIndex(positionLocal, u);
  const hashSeed = sliceIndex.add(1000).mul(53);
  const sliceHash = hash(hashSeed.add(191));

  const sweep = buildAxisSweep(
    positionLocal,
    u,
    u.sliceSuiteAxis,
    u.sliceSuiteTransition,
    u.sliceSuiteBandwidth
  );
  const blend = u.sliceSuiteAmount.mul(sweep);
  return select(sliceHash.lessThan(blend), u.sliceSuiteSliceAlpha, float(1));
}

// Push Apart only reads as disconnected slabs if every corner of a triangle
// agrees on which slice it's in — the slice grid is independent of the
// mesh's actual topology, so plenty of triangles straddle a slice boundary
// (two corners compute one sliceIndex, the third computes the next), and a
// straddling triangle can't separate: it just stretches to bridge the gap,
// which is what kept the whole car reading as one connected piece even
// after WreckedCar's non-indexed conversion gave every triangle its own
// unique corners. There's no spare vertex buffer for a real per-triangle
// group id to fix this at the source (WebGPU's 8-buffer cap is already
// spent), so this detects a straddling triangle from its own
// interpolation instead: each corner's sliceIndex is an exact integer on
// its own, but interpolating three *different* integers across a
// straddling triangle's face produces non-integer values in its interior —
// a clean triangle, where all three corners agree, interpolates to that
// same constant integer everywhere. Fragments where the interpolated value
// drifts off a whole number belong to a bridging triangle and get
// discarded, so the slices actually come apart.
function buildSliceSuiteStraddleAlphaNode(u) {
  const sliceIndexVarying = varying(computeSliceSuiteIndex(positionLocal, u));
  const drift = abs(fract(sliceIndexVarying.add(0.5)).sub(0.5));
  const straddling = drift.greaterThan(0.02);

  const sweep = buildAxisSweep(
    positionLocal,
    u,
    u.sliceSuiteAxis,
    u.sliceSuiteTransition,
    u.sliceSuiteBandwidth
  );
  const blend = u.sliceSuiteAmount.mul(sweep);
  return select(straddling, oneMinus(blend), float(1));
}

// "Voxel Snap" — quantizes local position onto a `size` grid (procedural,
// no bake), with `chaos` jittering the snapped point back off-grid so it
// doesn't read as a perfectly clean lattice.
function buildVoxelSnapPositionNode(basePosition, u) {
  const cellSize = u.voxelSnapSize.max(0.001);
  const cellCoord = floor(basePosition.div(cellSize));
  const snapped = cellCoord.add(0.5).mul(cellSize);

  const hashCell = cellCoord.add(1000);
  const seed = hashCell.x.add(hashCell.y.mul(9973)).add(hashCell.z.mul(131));
  const jitter = vec3(
    hash(seed.add(211)),
    hash(seed.add(223)),
    hash(seed.add(227))
  )
    .sub(0.5)
    .mul(u.voxelSnapChaos)
    .mul(cellSize);

  const target = snapped.add(jitter);

  const sweep = buildAxisSweep(
    basePosition,
    u,
    u.voxelSnapAxis,
    u.voxelSnapTransition,
    u.voxelSnapBandwidth
  );
  const blend = u.voxelSnapAmount.mul(sweep);
  return mix(basePosition, target, blend);
}

// "Inner Stretch" — a hashed subset of local-space cells (same procedural,
// no-bake shape as Torn Open/Voxel Snap) gets pushed out along a per-cell
// random direction (same hashed-direction shape as Block Deconstruct's own
// `direction`, not the true vertex normal — this only needs to look like
// interior geometry spiking through the shell, not track the surface),
// reading as panels stretching/spiking through the shell rather than the
// whole surface shifting together. Negative Stretch caves the same cells in
// instead of spiking them out.
function buildInnerStretchPositionNode(basePosition, u) {
  const cellFreq = u.innerStretchCellFrequency.max(0.001);
  const cell = floor(basePosition.mul(cellFreq).add(1000));
  const seed = cell.x.add(cell.y.mul(9973)).add(cell.z.mul(131));
  const mask = hash(seed.add(283)).lessThan(u.innerStretchDensity);

  const direction = vec3(
    hash(seed.add(311)),
    hash(seed.add(337)),
    hash(seed.add(359))
  ).sub(0.5);
  const target = basePosition.add(direction.mul(u.innerStretchStretch));
  return select(mask, target, basePosition);
}

// "Warp Field" — a smooth Perlin warp (mx_noise_float, continuous rather
// than the hashed-cell masks every other technique uses) displaces every
// vertex along a noise field, each axis sampled with its own offset so the
// warp doesn't read as axis-aligned. Optionally animated via the TSL clock
// for a soft, liquid counterpoint to every other technique's hard edges.
function buildWarpFieldPositionNode(basePosition, u) {
  const t = time.mul(u.warpFieldSpeed);
  const p = basePosition.mul(u.warpFieldFrequency);
  const warp = vec3(
    mx_noise_float(p.add(vec3(0, 0, t))),
    mx_noise_float(p.add(vec3(37.2, 11.4, t))),
    mx_noise_float(p.add(vec3(-19.1, 4.7, t)))
  ).mul(u.warpFieldAmount);
  return basePosition.add(warp);
}

// Cut & Paste and Hopscotch each pick, per vertex, between the original
// position and their own permuted target — driven by that vertex's own mask
// hash against a density threshold, so density is a real "how many vertices"
// dial rather than an all-or-nothing switch. Find & Replace then applies on
// top of whatever position that leaves.
function buildGlitchedPositionNode(u) {
  const cutPasteTarget = attribute('glitchCutPasteTargetPosition', 'vec3');
  const hopscotchTarget = attribute('glitchHopscotchTargetPosition', 'vec3');
  // Packed vec4 (x=find&replace random, y=cut&paste mask, z=hopscotch
  // mask, w=reserved) — see glitchGeometry.js for why these share one
  // attribute instead of three (WebGPU's 8-vertex-buffer-per-pipeline cap).
  const masks = attribute('glitchMasks', 'vec4');
  const glitchRandom = masks.x;
  const cutPasteMask = masks.y;
  const hopscotchMask = masks.z;

  const afterCutPaste = select(
    cutPasteMask.lessThan(u.cutPasteDensity),
    cutPasteTarget,
    positionLocal
  );
  const afterHopscotch = select(
    hopscotchMask.lessThan(u.hopscotchDensity),
    hopscotchTarget,
    afterCutPaste
  );

  const withinDensity = glitchRandom.lessThan(u.density);
  const subSelect = glitchRandom.div(u.density.max(0.0001));

  const signFlipped = afterHopscotch.negate();
  const magnitudeJumped = afterHopscotch.mul(u.magnitude);
  const chosen = select(
    subSelect.lessThan(u.signFlipChance),
    signFlipped,
    magnitudeJumped
  );

  return select(withinDensity, chosen, afterHopscotch);
}

// Chains every position-space technique into one node, coarse-to-fine:
// Klink's permutation techniques, then Block Deconstruct's whole-cell
// separation, then Slice Suite's cross-sections, then Voxel Snap's fine
// grid quantization, then Inner Stretch's per-cell spikes, then Warp
// Field's smooth overall wobble as a finishing touch.
function buildFinalPositionNode(u) {
  const glitched = buildGlitchedPositionNode(u);
  const deconstructed = buildBlockDeconstructPositionNode(glitched, u);
  const sliced = buildSliceSuitePositionNode(deconstructed, u);
  const voxeled = buildVoxelSnapPositionNode(sliced, u);
  const stretched = buildInnerStretchPositionNode(voxeled, u);
  return buildWarpFieldPositionNode(stretched, u);
}

// "Scroll Tear" — the old-browser "image still downloading while you
// scroll" smear: past Tear Position, the row AT that position gets frozen
// and repeated downward (every row's UV.y clamped toward tearPosition) as
// if no new data ever arrived, instead of a literal geometry deformation.
// Purely UV-space and purely manual (no auto-scroll) — Tear Position is a
// live-scrubbed dial, not a clock.
function buildScrollTearUvNode(baseUv, u) {
  const { y } = baseUv;
  const smearAmount = smoothstep(
    u.tearPosition,
    u.tearPosition.add(u.tearRange.max(0.0001)),
    y
  ).mul(u.tearStrength);
  const smearedY = mix(y, u.tearPosition, smearAmount);

  return vec2(baseUv.x, smearedY);
}

// "Row Jitter" — the deck-boards effect: bands the car's own local-space
// position along a runtime-selectable axis (same axis convention as Block
// Deconstruct/Slice Suite/Voxel Snap) into `bands` slabs, then shifts each
// band's TEXTURE, not its geometry, sideways by its own hashed random
// offset — like a run of boards, all originally flush at the ends, that
// have since slid randomly out of alignment. Split out from Scroll Tear,
// which used to bake this same shift into its own UV smear (banded by
// UV.y only); it's its own technique now, banded by 3D position so the
// axis choice actually means something on a non-flat model.
function buildRowJitterUvNode(baseUv, u) {
  const axisPos = pickAxisComponent(positionLocal, u.rowJitterAxis);
  const axisMin = pickAxisComponent(u.boundsMin, u.rowJitterAxis);
  const axisMax = pickAxisComponent(u.boundsMax, u.rowJitterAxis);
  const extent = axisMax.sub(axisMin).max(0.0001);
  const bandCount = u.rowJitterBands.max(1);
  const bandThickness = extent.div(bandCount);
  const bandIndex = floor(axisPos.sub(axisMin).div(bandThickness))
    .max(0)
    .min(bandCount.sub(1));

  const seed = bandIndex.add(1000).mul(53);
  const jitter = hash(seed.add(13)).sub(0.5).mul(u.rowJitterStrength);

  return vec2(baseUv.x.add(jitter), baseUv.y);
}

// "Resolution Loss" — quantizes UV into blocks and, in a random subset of
// them (hashed off the block's own coordinate), samples every texel in that
// block from its center, producing chunky, low-res patches. Fully
// procedural: no baked per-vertex data, so density is independent of every
// other technique's mask.
function buildTextureDegradeUvNode(baseUv, u) {
  const blockCoord = floor(baseUv.mul(u.degradeBlockCount));
  const pixelatedUv = blockCoord.add(0.5).div(u.degradeBlockCount);

  // +1000 before hashing only (not on pixelatedUv), matching every other
  // technique's cell hash in this file — cheap insurance against a
  // negative-to-uint cast, which is implementation-defined in WGSL (see
  // buildTornAlphaNode below for the full explanation of this failure mode).
  const hashCoord = blockCoord.add(1000);
  const blockSeed = hashCoord.x.add(hashCoord.y.mul(9973));
  const degraded = hash(blockSeed).lessThan(u.degradeDensity);

  return select(degraded, pixelatedUv, baseUv);
}

// A per-corner one-hot vector (1 at this triangle corner's own weight, 0 at
// the other two) — the classic "wireframe without a dedicated barycentric
// attribute" trick: read `vertexIndex % 3` instead of baking a new buffer
// (WebGPU's 8-vertex-buffer cap is already spent, see glitchGeometry.js),
// then explicitly `varying()` it so the *vector itself* — not the raw
// index — gets interpolated across each triangle in the fragment shader.
// vertexIndex % 3 only cycles 0, 1, 2 per triangle on a non-indexed draw
// (see WreckedCar's toNonIndexed() call) — an indexed draw would repeat a
// shared vertex's index across every triangle that references it instead.
function buildBarycentricNode() {
  const corner = vertexIndex.mod(uint(3));
  const raw = vec3(
    select(corner.equal(uint(0)), float(1), float(0)),
    select(corner.equal(uint(1)), float(1), float(0)),
    select(corner.equal(uint(2)), float(1), float(0))
  );
  return varying(raw);
}

// "Torn Open" — continuous Perlin-noise patches (not the old hashed-cell
// blockiness, for organic torn-paper edges) punch through the panel, but
// only between the wireframe's own edges: the mesh's structural lines stay
// opaque, so a torn patch reads as "the panel is gone except for its
// wireframe skeleton" rather than a clean hole. Density maps the same way
// WetGround's puddle mask does — threshold walks 1 (nothing torn) down to 0
// (everything torn) as density goes 0 to 1.
function buildTornAlphaNode(u) {
  const noise = mx_noise_float(positionLocal.mul(u.tornCellFrequency))
    .mul(0.5)
    .add(0.5);
  const threshold = oneMinus(u.tornDensity);
  const patch = smoothstep(threshold, threshold.add(0.12), noise);

  const barycentric = buildBarycentricNode();
  const edgeDistance = barycentric.x.min(barycentric.y).min(barycentric.z);
  const nearEdge = oneMinus(
    smoothstep(0, u.tornWireframeWidth.max(0.001), edgeDistance)
  );

  const holeAmount = patch.mul(oneMinus(nearEdge));
  return oneMinus(holeAmount);
}

// Moving vertices onto a grid can't put real 90° edges into the silhouette —
// the surface between two differently-snapped points is still whatever
// (curved, connected) triangle used to join them, just relocated. What
// *does* sell "voxel" convincingly on the cheap is the shading: snap the
// per-triangle flat normal (normalFlat — screen-space derivative of the
// *already-transformed* position) to its nearest cardinal axis, so each
// triangle lights as if it were an axis-aligned cube face. That's a real
// faceted, blocky-lit read even though the geometry underneath it is still
// smooth-topology — the standard cheap "voxel shading" trick.
function snapToNearestCardinalAxis(n) {
  const magnitude = abs(n);
  const dominant = magnitude.x.max(magnitude.y).max(magnitude.z);
  return vec3(
    select(magnitude.x.greaterThanEqual(dominant), sign(n.x), float(0)),
    select(magnitude.y.greaterThanEqual(dominant), sign(n.y), float(0)),
    select(magnitude.z.greaterThanEqual(dominant), sign(n.z), float(0))
  );
}

function buildNormalNode(u) {
  const voxelSweep = buildAxisSweep(
    positionLocal,
    u,
    u.voxelSnapAxis,
    u.voxelSnapTransition,
    u.voxelSnapBandwidth
  );
  const voxelBlend = u.voxelSnapAmount.mul(voxelSweep);
  const cubicNormal = snapToNearestCardinalAxis(normalFlat);
  return mix(materialNormal, cubicNormal, voxelBlend);
}

// Builds the UV pipeline shared by both the color/normal/roughness/AO
// sampling (via contextNode) and Resolution Loss — Texture Scramble, then
// Scroll Tear, then Resolution Loss, each independently toggleable.
function buildFinalUvNode(u) {
  const textureScrambled = mix(
    uv(),
    attribute('glitchTargetUv', 'vec2'),
    u.uvBlend
  );
  const torn = buildScrollTearUvNode(textureScrambled, u);
  const rowJittered = buildRowJitterUvNode(torn, u);
  return buildTextureDegradeUvNode(rowJittered, u);
}

export function createWreckedCarMaterial(sourceMaterial, uniforms) {
  const material = new THREE.MeshStandardNodeMaterial();

  material.map = sourceMaterial.map;
  material.normalMap = sourceMaterial.normalMap;
  material.roughnessMap = sourceMaterial.roughnessMap;
  material.metalnessMap = sourceMaterial.metalnessMap;
  material.aoMap = sourceMaterial.aoMap;
  material.roughness = sourceMaterial.roughness;
  material.metalness = sourceMaterial.metalness;
  material.side = sourceMaterial.side;

  material.positionNode = buildFinalPositionNode(uniforms);
  material.normalNode = buildNormalNode(uniforms);

  // Redirects the default UV used by every map (color/normal/roughness/AO)
  // at once, so scrambling it disrupts the whole textured look together —
  // the shader-space equivalent of Klink's "vt" line glitching.
  material.contextNode = replaceDefaultUV(buildFinalUvNode(uniforms));

  // True discard (not alpha blending) via alphaTestNode: torn cells punch
  // an actual hole (skipping depth write too), showing through to whatever
  // renders behind the car rather than fading to a transparent color. Block
  // Deconstruct and Slice Suite's per-cell/per-slice alpha multiply into the
  // same discard rather than blending, so they read as more punched-out
  // fragments instead of translucency.
  material.opacityNode = buildTornAlphaNode(uniforms)
    .mul(buildBlockDeconstructAlphaNode(uniforms))
    .mul(buildSliceSuiteAlphaNode(uniforms))
    .mul(buildSliceSuiteStraddleAlphaNode(uniforms));
  material.alphaTestNode = float(0.5);

  return material;
}
