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
  attribute,
  dot,
  float,
  floor,
  hash,
  materialNormal,
  mix,
  normalFlat,
  positionLocal,
  replaceDefaultUV,
  rotate,
  round,
  select,
  smoothstep,
  uint,
  uniform,
  uv,
  vec2,
  vec3,
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
    normalInvert: uniform(0),
    tearHeightMin: uniform(0),
    tearHeightMax: uniform(1),
    tearPosition: uniform(0.5),
    tearRange: uniform(0.2),
    tearStrength: uniform(0),
    tearRowJitterBands: uniform(80),
    tearRowJitterStrength: uniform(0),
    degradeDensity: uniform(0),
    degradeBlockCount: uniform(24),
    tornDensity: uniform(0),
    tornCellFrequency: uniform(6),

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

// Old-computer "scroll too fast" smear, translated to the car's own local
// geometry (normalized against its actual height, so Leva's 0-1 Tear
// Position always means "bottom of car" to "top of car" regardless of the
// model's real-world scale) rather than the screen — past the tear, a
// vertex's height blends toward the tear's own height, so that band of the
// body stretches/compresses toward it instead of the frame doing so.
function buildScrollTearPositionNode(basePosition, u) {
  const carHeight = u.tearHeightMax.sub(u.tearHeightMin).max(0.0001);
  const normalizedY = basePosition.y.sub(u.tearHeightMin).div(carHeight);
  const tearWorldY = u.tearHeightMin.add(u.tearPosition.mul(carHeight));

  const smearAmount = smoothstep(
    u.tearPosition,
    u.tearPosition.add(u.tearRange.max(0.0001)),
    normalizedY
  ).mul(u.tearStrength);

  const smearedY = mix(basePosition.y, tearWorldY, smearAmount);
  return vec3(basePosition.x, smearedY, basePosition.z);
}

// Chains every position-space technique into one node, coarse-to-fine:
// Klink's permutation techniques, then Scroll Tear's smear, then Block
// Deconstruct's whole-cell separation, then Slice Suite's cross-sections,
// then Voxel Snap's fine grid quantization.
function buildFinalPositionNode(u) {
  const glitched = buildGlitchedPositionNode(u);
  const smeared = buildScrollTearPositionNode(glitched, u);
  const deconstructed = buildBlockDeconstructPositionNode(smeared, u);
  const sliced = buildSliceSuitePositionNode(deconstructed, u);
  return buildVoxelSnapPositionNode(sliced, u);
}

// Same smear, applied to the car's own UV.y instead of local height, so the
// paint/decals appear dragged across the surface — the texture-space half
// of "scroll tear". A per-row hashed jitter (quantized UV.y band) layers a
// torn, glitchy texture on top of the smooth stretch.
function buildScrollTearUvNode(baseUv, u) {
  const { y } = baseUv;
  const smearAmount = smoothstep(
    u.tearPosition,
    u.tearPosition.add(u.tearRange.max(0.0001)),
    y
  ).mul(u.tearStrength);
  const smearedY = mix(y, u.tearPosition, smearAmount);

  const bandIndex = floor(y.mul(u.tearRowJitterBands)).toUint();
  const jitter = hash(bandIndex.add(uint(29)))
    .sub(0.5)
    .mul(u.tearRowJitterStrength);

  return vec2(baseUv.x.add(jitter), smearedY);
}

// "Resolution Loss" — quantizes UV into blocks and, in a random subset of
// them (hashed off the block's own coordinate), samples every texel in that
// block from its center, producing chunky, low-res patches. Fully
// procedural: no baked per-vertex data, so density is independent of every
// other technique's mask.
function buildTextureDegradeUvNode(baseUv, u) {
  const blockCoord = floor(baseUv.mul(u.degradeBlockCount));
  const pixelatedUv = blockCoord.add(0.5).div(u.degradeBlockCount);

  // +1000 before hashing only (not on pixelatedUv) — baseUv can dip
  // slightly negative once Scroll Tear's row jitter lands near a UV edge,
  // and a negative-to-uint cast is implementation-defined in WGSL (see
  // buildTornMask below for the full explanation of this failure mode).
  const hashCoord = blockCoord.add(1000);
  const blockSeed = hashCoord.x.add(hashCoord.y.mul(9973));
  const degraded = hash(blockSeed).lessThan(u.degradeDensity);

  return select(degraded, pixelatedUv, baseUv);
}

// "Torn Open" mask — a spatial hash over local-space cells (not UV, so the
// torn pattern doesn't shift when Texture Scramble/Resolution Loss are also
// active), true where that cell should be cut away. Density is another
// independent, procedural, zero-extra-attribute dial.
//
// positionLocal spans negative values (the car is centered near its local
// origin), and converting a negative float to uint is implementation-
// defined in WGSL — it doesn't reliably clamp or wrap, so hashing a
// negative cell coordinate could read as "torn" even at density 0. +1000
// keeps every cell coordinate comfortably positive before the cast.
function buildTornMask(u) {
  const cell = floor(positionLocal.mul(u.tornCellFrequency).add(1000));
  const cellSeed = cell.x.add(cell.y.mul(131)).add(cell.z.mul(7919));
  return hash(cellSeed).lessThan(u.tornDensity);
}

// "Push the node the wrong way" — blends the material's own computed normal
// (materialNormal, already sampling the normal map through whatever UV the
// contextNode above lands on) toward its negation, so lighting reads as
// inverted rather than swapping in a hand-built alternative.
//
// Voxel Snap then blends further toward normalFlat (screen-space derivative
// of the *already-transformed* position, so it reflects whatever the vertex
// shader actually did) — smooth per-vertex normals interpolated across a
// quantized surface hide the snap entirely; flat per-triangle normals are
// what actually sells the blocky read.
function buildNormalNode(u) {
  const inverted = mix(materialNormal, materialNormal.negate(), u.normalInvert);

  const voxelSweep = buildAxisSweep(
    positionLocal,
    u,
    u.voxelSnapAxis,
    u.voxelSnapTransition,
    u.voxelSnapBandwidth
  );
  const voxelBlend = u.voxelSnapAmount.mul(voxelSweep);
  return mix(inverted, normalFlat, voxelBlend);
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
  return buildTextureDegradeUvNode(torn, u);
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
  // Roughness/metalness/emissive corruption multiplies against these base
  // values live in WreckedCar's useFrame sync — stashed here so that sync
  // doesn't need its own copy of "what the car looked like before glitching".
  material.userData.baseRoughness = sourceMaterial.roughness;
  material.userData.baseMetalness = sourceMaterial.metalness;

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
  material.opacityNode = select(buildTornMask(uniforms), float(0), float(1))
    .mul(buildBlockDeconstructAlphaNode(uniforms))
    .mul(buildSliceSuiteAlphaNode(uniforms));
  material.alphaTestNode = float(0.5);

  return material;
}
