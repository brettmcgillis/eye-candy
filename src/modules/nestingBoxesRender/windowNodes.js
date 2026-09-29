import {
  abs,
  clamp,
  cos,
  float,
  floor,
  fract,
  fwidth,
  hash,
  int,
  max,
  min,
  mix,
  normalGeometry,
  positionWorld,
  select,
  smoothstep,
  time,
  uint,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export function createWindowUniforms() {
  return {
    blinkRate: uniform(0.02),
    coolChance: uniform(0.5),
    edge: uniform(0.004),
    enabled: uniform(0),
    floorHeight: uniform(0.045),
    frame: uniform(0.002),
    frameColor: uniform(new THREE.Color('#050505')),
    glassColor: uniform(new THREE.Color('#0b0f16')),
    glassRoughness: uniform(0.15),
    glow: uniform(4),
    green: uniform(0.35),
    lit: uniform(0.45),
    margin: uniform(0.012),
    paletteMatch: uniform(0.6),
    paneHeight: uniform(0.6),
    paneWidth: uniform(0.65),
    slab: uniform(0.0015),
    width: uniform(0.04),
  };
}

const TAU = Math.PI * 2;
const CELL_OFFSET = 4096;
const SWITCH_FADE = 0.03;

// Inside-positive coverage of a signed distance, antialiased over one pixel.
const inside = (d) => smoothstep(0, 1, d.negate().div(fwidth(d).max(1e-5)));

// The grid is indexed in the anchor box's frame — a fixed shallow ancestor of
// the drawn box — so a block keeps the same floors, columns and window colours
// as growth replaces it with its children. Cells are clipped to the drawn box's
// own face, so subdividing only ever reveals or hides whole windows.
export function createWindowNodes({ box, uniforms: u }) {
  const { anchorCenter, anchorId, anchorRadiusYZ, center, radius } = box;
  const n = normalGeometry;
  const onX = abs(n.x).greaterThan(0.5);
  const onY = abs(n.y).greaterThan(0.5);
  const local = positionWorld.sub(center);

  const a = select(onX, local.z, local.x);
  const b = select(onY, local.z, local.y);
  const halfA = select(onX, radius.z, radius.x);
  const halfB = select(onY, radius.z, radius.y);

  const edgeDistance = min(halfA.sub(abs(a)), halfB.sub(abs(b)));
  const edgeMask = inside(edgeDistance.sub(u.edge)).mul(u.enabled);

  const offset = center.sub(anchorCenter);
  const offsetA = select(onX, offset.z, offset.x);
  const offsetB = select(onY, offset.z, offset.y);
  const anchorHalfB = select(onY, anchorRadiusYZ.z, anchorRadiusYZ.y);

  // Both measured from the anchor: `a` along the face, `rise` up from its floor.
  const gridA = a.add(offsetA);
  const rise = b.add(offsetB).add(anchorHalfB);
  const floorIndex = floor(rise.div(u.floorHeight));
  const columnIndex = floor(gridA.div(u.width));
  const cellU = fract(gridA.div(u.width)).sub(0.5).mul(u.width);
  const cellV = fract(rise.div(u.floorHeight)).sub(0.5).mul(u.floorHeight);

  // Cell bounds against the drawn box's face, both in the anchor's frame.
  const faceMinA = offsetA.sub(halfA).add(u.margin);
  const faceMaxA = offsetA.add(halfA).sub(u.margin);
  const faceMinB = offsetB.add(anchorHalfB).sub(halfB).add(u.margin);
  const faceMaxB = offsetB.add(anchorHalfB).add(halfB).sub(u.margin);
  const columnSlack = min(
    faceMaxA.sub(columnIndex.add(1).mul(u.width)),
    columnIndex.mul(u.width).sub(faceMinA)
  );
  const rowSlack = min(
    faceMaxB.sub(floorIndex.add(1).mul(u.floorHeight)),
    floorIndex.mul(u.floorHeight).sub(faceMinB)
  );
  const fits = smoothstep(u.floorHeight.negate().mul(0.5), 0, rowSlack)
    .mul(smoothstep(u.width.negate().mul(0.5), 0, columnSlack))
    .mul(select(onY, float(0), float(1)))
    .mul(u.enabled)
    .toVar();

  const paneDistance = max(
    abs(cellU).sub(u.width.mul(u.paneWidth).mul(0.5)),
    abs(cellV).sub(u.floorHeight.mul(u.paneHeight).mul(0.5))
  );
  const pane = inside(paneDistance).mul(fits).toVar();
  const frame = inside(abs(paneDistance).sub(u.frame)).mul(fits);
  const slabDistance = u.floorHeight.mul(0.5).sub(abs(cellV)).sub(u.slab);
  const slab = inside(slabDistance).mul(fits);

  const faceId = select(onX, int(1), select(onY, int(2), int(3))).add(
    select(n.x.add(n.y).add(n.z).greaterThan(0), int(0), int(3))
  );
  const anchorBits = hash(anchorId).mul(1048576).toUint();
  const windowBits = anchorBits
    .mul(uint(73856093))
    .bitXor(uint(int(columnIndex).add(CELL_OFFSET)).mul(uint(19349663)))
    .bitXor(uint(int(floorIndex).add(CELL_OFFSET)).mul(uint(83492791)))
    .bitXor(uint(faceId).mul(uint(2654435761)));
  const hueHash = hash(windowBits);
  const phaseHash = hash(windowBits.add(uint(1)));
  const greenHash = hash(windowBits.add(uint(2)));
  const levelHash = hash(windowBits.add(uint(3)));

  // Shane's window palette: warm per window, flipped cool on some boxes,
  // with a stepped nudge toward green.
  const warm = cos(vec3(0, 1.4, 2).add(hueHash.mul(TAU / 5)))
    .mul(0.45)
    .add(0.5);
  const hue = select(
    hash(anchorBits.add(uint(7))).lessThan(u.coolChance),
    warm.zyx,
    warm
  );
  const greenStep = floor(greenHash.mul(4.999)).div(4).mul(u.green);
  const varied = mix(hue, hue.xzy, greenStep);

  // Lit windows pull toward the building's own colour at full brightness, so
  // the glow stays in the structure's palette instead of reading as confetti.
  const tint = (buildingColor) => {
    const lifted = buildingColor.div(
      buildingColor.r.max(buildingColor.g).max(buildingColor.b).max(0.001)
    );
    return mix(varied, lifted, u.paletteMatch);
  };

  // A uniform triangle wave per window: `lit` is exactly the fraction on at
  // any moment, and each window toggles twice per 1 / blinkRate seconds.
  const wave = abs(
    fract(phaseHash.add(time.mul(u.blinkRate)))
      .mul(2)
      .sub(1)
  );
  const threshold = mix(-SWITCH_FADE, 1 + SWITCH_FADE, u.lit);
  const on = smoothstep(
    threshold.sub(SWITCH_FADE),
    threshold.add(SWITCH_FADE),
    wave
  ).oneMinus();

  const dark = clamp(frame.add(slab).add(edgeMask), 0, 1);
  const glow = pane
    .mul(on)
    .mul(levelHash.mul(0.5).add(0.5))
    .mul(dark.oneMinus())
    .mul(u.glow);

  return {
    applyColor: (color) =>
      mix(mix(color, vec3(u.glassColor), pane), vec3(u.frameColor), dark),
    applyRoughness: (roughness) => mix(roughness, u.glassRoughness, pane),
    emissive: (buildingColor) => tint(buildingColor).mul(glow),
  };
}
